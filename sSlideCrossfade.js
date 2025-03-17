/**
 * InoQI Website - Enhanced Card System with Crossfade Animation
 * Provides fluid, simultaneous transitions between cards
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cards = document.querySelectorAll('.card');

    // Animation Variables
    const ANIMATION_DURATION = 400; // ms
    const SCROLL_OFFSET = 20; // Buffer space between header and card

    // State variables
    let activeCard = null;
    let isAnimating = false;

    /**
     * Measure content height accurately
     */
    function measureContentHeight(content) {
        // Store original styles
        const originalStyles = {
            display: content.style.display,
            height: content.style.height,
            position: content.style.position,
            visibility: content.style.visibility,
            padding: content.style.padding,
            opacity: content.style.opacity
        };

        // Set styles for measurement without affecting layout
        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.display = 'block';
        content.style.height = 'auto';
        content.style.padding = '1.5rem';
        content.style.opacity = '0';

        // Get the real height
        const height = content.scrollHeight;

        // Restore original styles
        content.style.position = originalStyles.position;
        content.style.visibility = originalStyles.visibility;
        content.style.display = originalStyles.display;
        content.style.height = originalStyles.height;
        content.style.padding = originalStyles.padding;
        content.style.opacity = originalStyles.opacity;

        return height;
    }

    /**
     * Calculate the optimal scroll position for a card
     */
    function getOptimalScrollPosition(card) {
        const headerHeight = document.querySelector('header').offsetHeight || 0;

        // Get card position relative to viewport
        const cardRect = card.getBoundingClientRect();

        // Calculate desired scroll position with buffer
        const scrollTarget = window.scrollY + cardRect.top - headerHeight - SCROLL_OFFSET;

        // If card is already fully visible, don't scroll
        if (cardRect.top >= headerHeight + SCROLL_OFFSET &&
            cardRect.bottom <= window.innerHeight) {
            return window.scrollY;
        }

        return scrollTarget;
    }

    /**
     * Smooth scroll to target position
     */
    function smoothScrollTo(targetY) {
        return new Promise(resolve => {
            const startY = window.scrollY;
            const distance = targetY - startY;

            // Skip tiny distances
            if (Math.abs(distance) < 10) {
                resolve();
                return;
            }

            const startTime = performance.now();

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

                // Ease out cubic
                const easeValue = 1 - Math.pow(1 - progress, 3);

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
     * Animate opacity and height simultaneously
     */
    function animateCardContent(element, startHeight, endHeight, startOpacity, endOpacity, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();

            // Ensure element is visible
            element.style.display = 'block';
            element.style.height = `${startHeight}px`;
            element.style.opacity = startOpacity;
            element.style.overflow = 'hidden';

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease in-out cubic
                const easeValue = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                // Update height and opacity
                const currentHeight = startHeight + (endHeight - startHeight) * easeValue;
                const currentOpacity = startOpacity + (endOpacity - startOpacity) * easeValue;

                element.style.height = `${currentHeight}px`;
                element.style.opacity = currentOpacity;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    // Final state
                    element.style.height = endHeight === 0 ? '0' : `${endHeight}px`;
                    element.style.opacity = endOpacity;

                    // Clean up if fully closed
                    if (endHeight === 0 && endOpacity === 0) {
                        element.style.display = 'none';
                    }

                    // Final padding adjustments
                    if (endHeight > 0) {
                        element.style.paddingTop = '1.5rem';
                        element.style.paddingBottom = '1.5rem';
                        element.style.overflow = 'visible';
                    }

                    resolve();
                }
            }

            requestAnimationFrame(step);
        });
    }

    /**
     * Crossfade between cards - core of the improved animation
     */
    async function crossfadeCards(closingCard, openingCard) {
        try {
            // Get the content elements
            const closingContent = closingCard.querySelector('.card-content');
            const openingContent = openingCard.querySelector('.card-content');

            // Set initial states and measure heights
            const closingHeight = closingContent.offsetHeight;
            const openingHeight = measureContentHeight(openingContent);

            // Prepare opening content
            openingContent.style.overflow = 'hidden';
            openingContent.style.height = '0';
            openingContent.style.opacity = '0';
            openingContent.style.display = 'block';
            openingContent.style.paddingTop = '0';
            openingContent.style.paddingBottom = '0';
            openingContent.style.paddingLeft = '1.5rem';
            openingContent.style.paddingRight = '1.5rem';

            // Prepare closing content
            closingContent.style.overflow = 'hidden';

            // First, calculate optimal scroll position for opening card
            const scrollTarget = getOptimalScrollPosition(openingCard);

            // Update class states
            closingCard.classList.remove('active');
            openingCard.classList.add('active');

            // Start the scroll animation
            const scrollPromise = smoothScrollTo(scrollTarget);

            // Start crossfading animations simultaneously
            const closingPromise = animateCardContent(
                closingContent,
                closingHeight,
                0,
                1,
                0,
                ANIMATION_DURATION
            );

            const openingPromise = animateCardContent(
                openingContent,
                0,
                openingHeight,
                0,
                1,
                ANIMATION_DURATION
            );

            // Wait for all animations to complete
            await Promise.all([scrollPromise, closingPromise, openingPromise]);

            // Final cleanup
            closingContent.style.overflow = '';
        } catch (error) {
            console.error('Animation error:', error);
        }
    }

    /**
     * Toggle card open/closed state with crossfade
     */
    async function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;

        try {
            const content = card.querySelector('.card-content');
            const isActive = card.classList.contains('active');

            if (isActive) {
                // Just close this card
                content.style.overflow = 'hidden';

                const height = content.offsetHeight;
                await animateCardContent(content, height, 0, 1, 0, ANIMATION_DURATION);

                card.classList.remove('active');
                content.style.overflow = '';
                activeCard = null;
            } else if (activeCard) {
                // Crossfade between closing active card and opening this one
                await crossfadeCards(activeCard, card);
                activeCard = card;
            } else {
                // No active card, just open this one
                content.style.overflow = 'hidden';
                content.style.height = '0';
                content.style.opacity = '0';
                content.style.display = 'block';
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
                content.style.paddingLeft = '1.5rem';
                content.style.paddingRight = '1.5rem';

                // Scroll to position
                const scrollTarget = getOptimalScrollPosition(card);
                await smoothScrollTo(scrollTarget);

                // Get final height
                const height = measureContentHeight(content);

                // Add active class
                card.classList.add('active');

                // Animate opening
                await animateCardContent(content, 0, height, 0, 1, ANIMATION_DURATION);

                content.style.paddingTop = '1.5rem';
                content.style.paddingBottom = '1.5rem';
                content.style.overflow = 'visible';
                activeCard = card;
            }
        } catch (error) {
            console.error('Animation error:', error);
        } finally {
            isAnimating = false;
        }
    }

    /**
     * Load card content via AJAX and populate all card elements
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
     * Populate all card elements from JSON data
     */
    function populateCardFromJson(card, data) {
        // Update card image if provided
        if (data.imageUrl) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) {
                cardImage.src = data.imageUrl;
            }
        }

        // Update image alt text
        if (data.imageAlt) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) {
                cardImage.alt = data.imageAlt;
            }
        }

        // Update card title
        if (data.title) {
            const cardTitle = card.querySelector('.card-title h3');
            if (cardTitle) {
                cardTitle.textContent = data.title;
            }
        }

        // Update short description
        if (data.shortDescription) {
            const cardShortDesc = card.querySelector('.card-title p');
            if (cardShortDesc) {
                cardShortDesc.textContent = data.shortDescription;
            }
        }

        // Update button text
        if (data.buttonText) {
            const button = card.querySelector('.card-button');
            if (button) {
                button.textContent = data.buttonText;
            }
        }

        // Update detailed content
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            // Clear any existing content
            descriptionElement.innerHTML = '';

            // Add main description
            if (data.description) {
                const descParagraph = document.createElement('p');
                descParagraph.textContent = data.description;
                descParagraph.classList.add('main-description');
                descriptionElement.appendChild(descParagraph);
            }

            // Add details content
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
     * Display error message in card
     */
    function showErrorInCard(card) {
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }

    /**
     * Initialize all cards
     */
    function initializeCards() {
        // Set up event listeners for cards
        cards.forEach(card => {
            const cardHeader = card.querySelector('.card-header');

            if (cardHeader) {
                cardHeader.addEventListener('click', async () => {
                    if (!card.dataset.contentLoaded) {
                        await loadCardContent(card);
                    }
                    toggleCard(card);
                });
            }

            // Preload card data right away
            loadCardContent(card);
        });

        // Set up global event listeners
        setupGlobalEventListeners();
    }

    /**
     * Set up global event listeners
     */
    function setupGlobalEventListeners() {
        // Close active card when clicking outside
        document.addEventListener('click', (e) => {
            if (activeCard && !isAnimating && !e.target.closest('.card')) {
                toggleCard(activeCard);
            }
        });

        // Close active card when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeCard && !isAnimating) {
                toggleCard(activeCard);
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (activeCard && !isAnimating) {
                const content = activeCard.querySelector('.card-content');
                if (content && content.style.display !== 'none') {
                    const newHeight = measureContentHeight(content);
                    content.style.height = `${newHeight}px`;
                }
            }
        });
    }

    // Initialize cards when document is ready
    initializeCards();
});