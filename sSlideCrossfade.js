/**
 * InoQI Website - Enhanced Card Sliding with Crossfade Transitions
 * 
 * This version does not change any external content loading or JSON functionality.
 * Instead, it adjusts the animation:
 *  1. Before animating, the card’s header is scrolled into view.
 *  2. The card header remains in view because its CSS is now sticky (see sSlide.css update).
 *  3. The new card’s content expands (height and opacity) and its padding is animated
 *     from 0 to the desired value (avoiding an abrupt “jump” at the end).
 *  4. If another card is open, its content collapses and fades out concurrently.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements: all cards in the list
    const cards = document.querySelectorAll('.card');
    const ANIM_DURATION = 1500; // Duration for height/opacity/padding animations (ms)
    const SCROLL_DURATION = 300; // Duration for scroll animation (ms)
    const TOP_PADDING = 100; // Additional spacing from the top (below the header)
    let activeCard = null;
    let isAnimating = false;

    /**
     * Measure the full height of content without altering layout.
     */
    function measureContentHeight(content) {
        const originalStyles = {
            display: content.style.display,
            height: content.style.height,
            position: content.style.position,
            visibility: content.style.visibility,
            padding: content.style.padding
        };
        // Temporary styles for accurate measurement
        content.style.display = 'block';
        content.style.height = 'auto';
        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.padding = '1.5rem';
        const height = content.scrollHeight;
        Object.keys(originalStyles).forEach(key => {
            content.style[key] = originalStyles[key];
        });
        return height;
    }

    /**
     * Animate element's height from startHeight to endHeight.
     */
    function animateHeight(element, startHeight, endHeight, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();
            element.style.height = `${startHeight}px`;
            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
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
     * Animate element's opacity from startOpacity to endOpacity.
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
     * Animate padding-top and padding-bottom from start to end (in pixels).
     */
    function animatePadding(element, startPadding, endPadding, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();
            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeValue = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                const currentPadding = startPadding + (endPadding - startPadding) * easeValue;
                element.style.paddingTop = currentPadding + "px";
                element.style.paddingBottom = currentPadding + "px";
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
     * Smoothly scroll the card header into view so that it never moves off-screen.
     */
    function scrollCardIntoView(card) {
        return new Promise(resolve => {
            const headerHeight = document.querySelector('header').offsetHeight;
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
     * - The new card's content expands and fades in.
     * - If an active card exists, its content collapses and fades out simultaneously.
     * Additionally, animate padding from 0 to a final value (24px ~ 1.5rem).
     */
    function crossfadeContent(newCard) {
        return new Promise(async resolve => {
            const newContent = newCard.querySelector('.card-content');
            const targetHeight = measureContentHeight(newContent);
            // Initial settings for new content.
            newContent.style.display = 'block';
            newContent.style.overflow = 'hidden';
            newContent.style.height = '0';
            newContent.style.opacity = '0';
            // Start with zero padding.
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
                animateOpacity(newContent, 0, 1, ANIM_DURATION),
                animatePadding(newContent, 0, 24, ANIM_DURATION)
            ]);
            await Promise.all([fadeOutPromise, fadeInPromise]);
            newContent.style.overflow = 'visible';
            resolve();
        });
    }

    /**
     * Open a card (for the case when no card is currently open).
     */
    async function openCard(card) {
        const content = card.querySelector('.card-content');
        const targetHeight = measureContentHeight(content);
        content.style.display = 'block';
        content.style.overflow = 'hidden';
        content.style.height = '0';
        content.style.opacity = '0';
        // Start with zero padding.
        content.style.paddingTop = '0';
        content.style.paddingBottom = '0';
        await Promise.all([
            animateHeight(content, 0, targetHeight, ANIM_DURATION),
            animateOpacity(content, 0, 1, ANIM_DURATION),
            animatePadding(content, 0, 24, ANIM_DURATION)
        ]);
        content.style.overflow = 'visible';
    }

    /**
     * Toggle a card's state.
     * If already active: collapse its content.
     * Else: scroll it into view then crossfade its content (collapsing any active card).
     */
    async function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;
        try {
            if (card.classList.contains('active')) {
                // Collapse content.
                await animateOpacity(card.querySelector('.card-content'), 1, 0, ANIM_DURATION);
                await animateHeight(card.querySelector('.card-content'), card.querySelector('.card-content').offsetHeight, 0, ANIM_DURATION);
                card.querySelector('.card-content').style.display = 'none';
                card.classList.remove('active');
                activeCard = null;
            } else if (activeCard) {
                await scrollCardIntoView(card);
                await crossfadeContent(card);
                activeCard.classList.remove('active');
                card.classList.add('active');
                activeCard = card;
            } else {
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
     * Load external JSON content and populate the card (unchanged).
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
     * Populate card elements from JSON data (unchanged).
     */
    function populateCardFromJson(card, data) {
        if (data.imageUrl) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) {
                cardImage.src = data.imageUrl;
            }
        }
        if (data.imageAlt) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) {
                cardImage.alt = data.imageAlt;
            }
        }
        if (data.title) {
            const cardTitle = card.querySelector('.card-title h3');
            if (cardTitle) {
                cardTitle.textContent = data.title;
            }
        }
        if (data.shortDescription) {
            const cardShortDesc = card.querySelector('.card-title p');
            if (cardShortDesc) {
                cardShortDesc.textContent = data.shortDescription;
            }
        }
        if (data.buttonText) {
            const button = card.querySelector('.card-button');
            if (button) {
                button.textContent = data.buttonText;
            }
        }
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
     * Display an error message in the card (unchanged).
     */
    function showErrorInCard(card) {
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }

    // Attach event listeners for each card header and preload content.
    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.addEventListener('click', () => {
                toggleCard(card);
            });
        }
        loadCardContent(card);
    });
});