/**
 * InoQI Website - Enhanced Card Sliding with Crossfade Transitions
 * In this version, when a card is activated, we first scroll its header into view
 * (ensuring it never moves off-screen) and then crossfade the content:
 * the active card’s content collapses while simultaneously the new card’s content expands.
 * All external JSON loading and other functionalities remain unchanged.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements: all cards in the list
    const cards = document.querySelectorAll('.card');
    const ANIM_DURATION = 1500; // Animation duration for height/opacity animations in ms
    const SCROLL_DURATION = 300; // Duration for the scroll animation in ms
    const TOP_PADDING = 100; // Additional spacing from the top (below the header)
    let activeCard = null;
    let isAnimating = false;

    /**
     * Measure card content exact height with proper margins.
     */
    function measureContentHeight(content) {
        const originalStyles = {
            display: content.style.display,
            height: content.style.height,
            position: content.style.position,
            visibility: content.style.visibility,
            padding: content.style.padding
        };
        // Set temporary styles for accurate measurement.
        content.style.display = 'block';
        content.style.height = 'auto';
        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.padding = '1.5rem';
        const height = content.scrollHeight;
        // Restore original styles.
        Object.keys(originalStyles).forEach(key => {
            content.style[key] = originalStyles[key];
        });
        return height;
    }

    /**
     * Animate the height of an element from startHeight to endHeight.
     */
    function animateHeight(element, startHeight, endHeight, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();
            element.style.height = `${startHeight}px`;
            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-in-out cubic:
                const easeValue = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                const currentHeight = startHeight + (endHeight - startHeight) * easeValue;
                element.style.height = `${currentHeight}px`;
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    element.style.height = endHeight === 0 ? '0' : `${endHeight}px`;
                    resolve();
                }
            }
            requestAnimationFrame(step);
        });
    }

    /**
     * Animate the opacity of an element from startOpacity to endOpacity.
     */
    function animateOpacity(element, startOpacity, endOpacity, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();
            function step(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const currentOpacity = startOpacity + (endOpacity - startOpacity) * progress;
                element.style.opacity = currentOpacity;
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(step);
        });
    }

    /**
     * Smoothly scroll the card header into view so that it does not cross above the top edge.
     */
    function scrollCardIntoView(card) {
        return new Promise(resolve => {
            const headerHeight = document.querySelector('header').offsetHeight;
            // Calculate target scroll position: card header's top relative to document
            // minus header height and the additional TOP_PADDING.
            const targetY = card.getBoundingClientRect().top + window.scrollY - headerHeight - TOP_PADDING;
            const startY = window.scrollY;
            const distance = targetY - startY;
            const startTime = performance.now();
            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / SCROLL_DURATION, 1);
                const easeValue = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
                window.scrollTo(0, startY + distance * easeValue);
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(step);
        });
    }

    /**
     * Crossfade the content animation:
     * - New card's content expands from 0 height/opacity to full height/opacity.
     * - If an active card exists, its content collapses and fades out simultaneously.
     */
    function crossfadeContent(newCard) {
        return new Promise(async resolve => {
            const newContent = newCard.querySelector('.card-content');
            const targetHeight = measureContentHeight(newContent);
            // Prepare new content before animation.
            newContent.style.display = 'block';
            newContent.style.overflow = 'hidden';
            newContent.style.height = '0';
            newContent.style.opacity = '0';
            newContent.style.paddingTop = '0';
            newContent.style.paddingBottom = '0';
            let fadeOutPromise = Promise.resolve();
            if (activeCard && activeCard !== newCard) {
                const oldContent = activeCard.querySelector('.card-content');
                fadeOutPromise = animateHeight(oldContent, oldContent.offsetHeight, 0, ANIM_DURATION)
                    .then(() => {
                        oldContent.style.display = 'none';
                        return animateOpacity(oldContent, 1, 0, ANIM_DURATION);
                    });
            }
            const fadeInPromise = Promise.all([
                animateHeight(newContent, 0, targetHeight, ANIM_DURATION),
                animateOpacity(newContent, 0, 1, ANIM_DURATION)
            ]);
            await Promise.all([fadeOutPromise, fadeInPromise]);
            // Restore padding for expanded content.
            newContent.style.paddingTop = '1.5rem';
            newContent.style.paddingBottom = '1.5rem';
            newContent.style.overflow = 'visible';
            resolve();
        });
    }

    /**
     * Toggle a card's open/closed state.
     * - If the card is already active, we collapse its content.
     * - Otherwise, we scroll the card into view first, then crossfade in its content,
     *   while collapsing any currently open card.
     */
    async function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;
        try {
            if (card.classList.contains('active')) {
                // If the card is already open, just collapse its content.
                await animateOpacity(card.querySelector('.card-content'), 1, 0, ANIM_DURATION);
                await animateHeight(card.querySelector('.card-content'), card.querySelector('.card-content').offsetHeight, 0, ANIM_DURATION);
                card.querySelector('.card-content').style.display = 'none';
                card.classList.remove('active');
                activeCard = null;
            } else if (activeCard) {
                // First scroll the new card into view, then crossfade content.
                await scrollCardIntoView(card);
                await crossfadeContent(card);
                activeCard.classList.remove('active');
                card.classList.add('active');
                activeCard = card;
            } else {
                // No card is currently open - scroll new card into view and simply expand its content.
                await scrollCardIntoView(card);
                await openCard(card);
                card.classList.add('active');
                activeCard = card;
            }
        } catch (error) {
            console.error('Animation error:', error);
        } finally {
            isAnimating = false;
        }
    }

    /**
     * Open a card's content (used when no card is already open).
     */
    async function openCard(card) {
        const content = card.querySelector('.card-content');
        const targetHeight = measureContentHeight(content);
        content.style.display = 'block';
        content.style.overflow = 'hidden';
        content.style.height = '0';
        content.style.opacity = '0';
        content.style.paddingTop = '0';
        content.style.paddingBottom = '0';
        await Promise.all([
            animateHeight(content, 0, targetHeight, ANIM_DURATION),
            animateOpacity(content, 0, 1, ANIM_DURATION)
        ]);
        content.style.paddingTop = '1.5rem';
        content.style.paddingBottom = '1.5rem';
        content.style.overflow = 'visible';
    }

    /**
     * Load card content via AJAX and populate the card.
     * This function remains unchanged from the original.
     */
    async function loadCardContent(card) {
        try {
            const contentId = card.getAttribute('data-content-id');
            if (!contentId) return;
            const contentUrl = `assets/content/${contentId}.json`;
            const response = await fetch(contentUrl);
            if (!response.ok) {
                throw new Error(`Failed to load content from ${contentUrl}`);
            }
            const data = await response.json();
            populateCardFromJson(card, data);
            card.dataset.contentLoaded = 'true';
        } catch (error) {
            console.error('Error loading card content:', error);
            showErrorInCard(card);
        }
    }

    /**
     * Populate card elements from JSON data.
     * This function remains unchanged from the original.
     */
    function populateCardFromJson(card, data) {
        // Update card image if provided.
        if (data.imageUrl) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) {
                cardImage.src = data.imageUrl;
            }
        }
        // Update image alt text.
        if (data.imageAlt) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) {
                cardImage.alt = data.imageAlt;
            }
        }
        // Update card title.
        if (data.title) {
            const cardTitle = card.querySelector('.card-title h3');
            if (cardTitle) {
                cardTitle.textContent = data.title;
            }
        }
        // Update short description.
        if (data.shortDescription) {
            const cardShortDesc = card.querySelector('.card-title p');
            if (cardShortDesc) {
                cardShortDesc.textContent = data.shortDescription;
            }
        }
        // Update button text.
        if (data.buttonText) {
            const button = card.querySelector('.card-button');
            if (button) {
                button.textContent = data.buttonText;
            }
        }
        // Update detailed content.
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '';
            if (data.description) {
                const descParagraph = document.createElement('p');
                descParagraph.textContent = data.description;
                descParagraph.classList.add('main-description');
                descriptionElement.appendChild(descParagraph);
            }
            if (data.details && Array.isArray(data.details)) {
                data.details.forEach(detail => {
                    if (detail.type === 'paragraph') {
                        const paragraph = document.createElement('p');
                        paragraph.textContent = detail.content;
                        descriptionElement.appendChild(paragraph);
                    } else if (detail.type === 'list' && detail.items) {
                        const list = document.createElement('ul');
                        detail.items.forEach(item => {
                            const listItem = document.createElement('li');
                            listItem.textContent = item;
                            list.appendChild(listItem);
                        });
                        descriptionElement.appendChild(list);
                    }
                });
            }
        }
    }

    /**
     * Display an error message in the card.
     */
    function showErrorInCard(card) {
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }

    // Set up event listeners for each card header.
    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.addEventListener('click', () => {
                // (Optional: load external content from JSON first if not loaded)
                toggleCard(card);
            });
        }
        // Preload external card content.
        loadCardContent(card);
    });
});