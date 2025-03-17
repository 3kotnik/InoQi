/**
 * InoQI Website - Enhanced Card Sliding with Smooth Crossfade & No Jumps
 * 1. Prevents headers from moving off screen
 * 2. Eliminates the padding jump at the end of animation
 * 3. Preserves all external content loading functionality
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const ANIM_DURATION = 400; // Animation duration in ms
    const SCROLL_DURATION = 300; // Scroll animation duration in ms
    const TOP_PADDING = 90; // Distance from top of viewport to card (matches header height)
    const CONTENT_PADDING = 24; // Final padding in pixels (equals 1.5rem)

    // State
    const cards = document.querySelectorAll('.card');
    let activeCard = null;
    let isAnimating = false;

    /**
     * Create a temporary placeholder to prevent layout collapse.
     * This prevents the page from jumping around during animations.
     */
    function createPlaceholder(element, height) {
        const placeholder = document.createElement('div');
        placeholder.style.height = `${height}px`;
        placeholder.style.width = '100%';
        placeholder.style.margin = '0';
        placeholder.style.transition = 'height 0.4s ease';
        placeholder.className = 'card-placeholder';
        return placeholder;
    }

    /**
     * Measure content height without affecting layout
     */
    function measureContentHeight(content) {
        // Store current styles
        const originalStyles = {
            display: content.style.display,
            height: content.style.height,
            position: content.style.position,
            visibility: content.style.visibility,
            padding: content.style.padding,
            paddingTop: content.style.paddingTop,
            paddingBottom: content.style.paddingBottom
        };

        // Set measurement styles
        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.display = 'block';
        content.style.height = 'auto';
        content.style.paddingTop = `${CONTENT_PADDING}px`;
        content.style.paddingBottom = `${CONTENT_PADDING}px`;
        content.style.paddingLeft = '1.5rem';
        content.style.paddingRight = '1.5rem';

        // Measure
        const height = content.scrollHeight;

        // Restore original styles
        Object.keys(originalStyles).forEach(key => {
            content.style[key] = originalStyles[key];
        });

        return height;
    }

    /**
     * Unified animation function that handles all properties simultaneously
     * This eliminates the "jumping" effect by ensuring all properties animate together
     */
    function animateCardContent(element, start, end, duration) {
        return new Promise(resolve => {
            // Initial setup
            element.style.display = 'block';
            element.style.overflow = 'hidden';
            element.style.height = `${start.height}px`;
            element.style.opacity = start.opacity;
            element.style.paddingTop = `${start.padding}px`;
            element.style.paddingBottom = `${start.padding}px`;

            // Force reflow
            void element.offsetHeight;

            const startTime = performance.now();

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Cubic ease-out for smooth deceleration
                const easeValue = 1 - Math.pow(1 - progress, 3);

                // Calculate current values
                const currentHeight = start.height + (end.height - start.height) * easeValue;
                const currentOpacity = start.opacity + (end.opacity - start.opacity) * easeValue;
                const currentPadding = start.padding + (end.padding - start.padding) * easeValue;

                // Apply all values simultaneously - no property changes after animation
                element.style.height = `${currentHeight}px`;
                element.style.opacity = currentOpacity;
                element.style.paddingTop = `${currentPadding}px`;
                element.style.paddingBottom = `${currentPadding}px`;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    // Only set final styles when animation completes
                    element.style.overflow = end.height > 0 ? 'visible' : 'hidden';
                    if (end.height === 0) {
                        element.style.display = 'none';
                    }
                    resolve();
                }
            }

            requestAnimationFrame(step);
        });
    }

    /**
     * Smooth scroll to position with proper easing
     */
    function smoothScrollTo(targetY) {
        return new Promise(resolve => {
            const startY = window.scrollY;
            const distance = targetY - startY;

            // Skip small distances
            if (Math.abs(distance) < 10) {
                resolve();
                return;
            }

            const startTime = performance.now();

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / SCROLL_DURATION, 1);
                const easeValue = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

                window.scrollTo({
                    top: startY + distance * easeValue,
                    behavior: 'auto' // Use our animation, not browser's smooth scroll
                });

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
     * Get optimal scroll position for card, respecting header height
     */
    function getOptimalScrollPosition(card) {
        const headerHeight = document.querySelector('header').offsetHeight || TOP_PADDING;
        const cardRect = card.getBoundingClientRect();
        const targetY = window.scrollY + cardRect.top - headerHeight - 20; // 20px extra buffer

        return targetY;
    }

    /**
     * Toggle a card's open/closed state
     */
    async function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;

        try {
            if (card.classList.contains('active')) {
                // Close this card
                const content = card.querySelector('.card-content');

                // Create a placeholder to prevent scroll jumps
                const placeholder = createPlaceholder(content, content.offsetHeight);
                card.insertBefore(placeholder, content.nextSibling);

                // Animate closing
                await animateCardContent(content, {
                    height: content.offsetHeight,
                    opacity: 1,
                    padding: CONTENT_PADDING
                }, {
                    height: 0,
                    opacity: 0,
                    padding: 0
                }, ANIM_DURATION);

                // Clean up
                card.classList.remove('active');
                setTimeout(() => card.removeChild(placeholder), 50);
                activeCard = null;

            } else if (activeCard) {
                // First ensure the target card is visible
                const scrollTarget = getOptimalScrollPosition(card);
                await smoothScrollTo(scrollTarget);

                // Get content elements
                const oldContent = activeCard.querySelector('.card-content');
                const newContent = card.querySelector('.card-content');

                // Measure the full height for animation
                const targetHeight = measureContentHeight(newContent);

                // Create placeholders
                const closingPlaceholder = createPlaceholder(oldContent, oldContent.offsetHeight);
                activeCard.insertBefore(closingPlaceholder, oldContent.nextSibling);

                // Animate simultaneously
                await Promise.all([
                    // Close old card
                    animateCardContent(oldContent, {
                        height: oldContent.offsetHeight,
                        opacity: 1,
                        padding: CONTENT_PADDING
                    }, {
                        height: 0,
                        opacity: 0,
                        padding: 0
                    }, ANIM_DURATION),

                    // Open new card
                    animateCardContent(newContent, {
                        height: 0,
                        opacity: 0,
                        padding: 0
                    }, {
                        height: targetHeight,
                        opacity: 1,
                        padding: CONTENT_PADDING
                    }, ANIM_DURATION)
                ]);

                // Update state
                activeCard.classList.remove('active');
                card.classList.add('active');
                activeCard = card;

                // Remove placeholder
                setTimeout(() => {
                    if (closingPlaceholder.parentNode) {
                        activeCard.removeChild(closingPlaceholder);
                    }
                }, 50);

            } else {
                // No card is open, just open this one
                const scrollTarget = getOptimalScrollPosition(card);
                await smoothScrollTo(scrollTarget);

                const content = card.querySelector('.card-content');
                const targetHeight = measureContentHeight(content);

                // Animate opening
                await animateCardContent(content, {
                    height: 0,
                    opacity: 0,
                    padding: 0
                }, {
                    height: targetHeight,
                    opacity: 1,
                    padding: CONTENT_PADDING
                }, ANIM_DURATION);

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

    // Set up event listeners and preload content
    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            // Add special class for sticky positioning
            cardHeader.classList.add('card-header-sticky');

            cardHeader.addEventListener('click', async () => {
                // Check if content needs to be loaded first
                if (!card.dataset.contentLoaded) {
                    await loadCardContent(card);
                }
                toggleCard(card);
            });
        }

        // Preload all card content
        loadCardContent(card);
    });
});