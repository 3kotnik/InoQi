/**
 * InoQI Website - Enhanced Card System
 * With constrained scrolling to keep cards visible
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cards = document.querySelectorAll('.card');

    // Animation Variables
    const ANIMATION_DURATION = 400; // ms

    // State variables
    let activeCard = null;
    let isAnimating = false;

    /**
     * Measure card content exact height with proper bottom margin
     */
    function measureContentHeight(content) {
        // Store original styles
        const originalStyles = {
            display: content.style.display,
            height: content.style.height,
            position: content.style.position,
            visibility: content.style.visibility,
            padding: content.style.padding
        };

        // Set styles for measurement without affecting layout
        content.style.display = 'block';
        content.style.height = 'auto';
        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.padding = '1.5rem';

        // Measure the full height
        const height = content.scrollHeight;

        // Restore original styles
        content.style.display = originalStyles.display;
        content.style.height = originalStyles.height;
        content.style.position = originalStyles.position;
        content.style.visibility = originalStyles.visibility;
        content.style.padding = originalStyles.padding;

        return height;
    }

    /**
     * Animate element height
     */
    function animateHeight(element, startHeight, endHeight, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();

            // Set initial height
            element.style.height = `${startHeight}px`;
            element.style.display = 'block';

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease in-out cubic function
                const easeValue = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                // Calculate and apply current height
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
     * Smooth scroll to target with constraints
     */
    function smoothScrollTo(targetY) {
        return new Promise(resolve => {
            const startY = window.scrollY;
            const distance = targetY - startY;

            // Skip tiny distances or if already at target
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

                window.scrollTo({
                    top: startY + distance * easeValue,
                    behavior: 'auto' // Use our custom animation instead of 'smooth'
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
     * Calculate the optimal scroll position for a card
     * Ensures the card remains visible within viewport constraints
     */
    function getOptimalScrollPosition(card) {
        const headerHeight = document.querySelector('header').offsetHeight || 0;
        const buffer = 20; // Space between header and card

        // Get card position relative to viewport
        const cardRect = card.getBoundingClientRect();

        // Calculate the minimum scroll position (keeping card at top of viewport)
        const minScrollY = window.scrollY + cardRect.top - headerHeight - buffer;

        // Calculate the maximum scroll position (keeping card bottom visible)
        const viewport = window.innerHeight;
        const cardVisible = Math.min(viewport - headerHeight - buffer, cardRect.height * 0.5);
        const maxScrollY = window.scrollY + cardRect.bottom - cardVisible;

        // Get current scroll position
        const currentY = window.scrollY;

        // If card is already fully visible, don't scroll
        if (cardRect.top >= headerHeight + buffer && cardRect.bottom <= viewport) {
            return currentY;
        }

        // If card is above viewport, scroll up to minScrollY
        if (cardRect.top < headerHeight + buffer) {
            return minScrollY;
        }

        // If card is below viewport, scroll down but not more than maxScrollY
        if (cardRect.top > viewport) {
            return Math.min(minScrollY, maxScrollY);
        }

        // Default: keep card at top of viewport
        return minScrollY;
    }

    /**
     * Toggle card open/closed state
     */
    async function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;

        try {
            const content = card.querySelector('.card-content');
            const isActive = card.classList.contains('active');

            if (isActive) {
                // Close this card
                await closeCardContent(content);
                card.classList.remove('active');
                activeCard = null;
            } else if (activeCard) {
                // Close active card, then open this one
                const activeContent = activeCard.querySelector('.card-content');
                await closeCardContent(activeContent);
                activeCard.classList.remove('active');

                // Calculate optimal scroll position before opening
                const scrollTarget = getOptimalScrollPosition(card);
                await smoothScrollTo(scrollTarget);

                // Open new card
                card.classList.add('active');
                await openCardContent(content);
                activeCard = card;
            } else {
                // Just open this card with optional scrolling
                const scrollTarget = getOptimalScrollPosition(card);
                await smoothScrollTo(scrollTarget);

                card.classList.add('active');
                await openCardContent(content);
                activeCard = card;
            }
        } catch (error) {
            console.error('Animation error:', error);
        } finally {
            isAnimating = false;
        }
    }

    /**
     * Open card content with animation
     */
    async function openCardContent(content) {
        if (!content) return;

        // Prepare content for animation
        content.style.overflow = 'hidden';
        content.style.display = 'block';
        content.style.height = '0';
        content.style.opacity = '0';
        content.style.paddingTop = '0';
        content.style.paddingBottom = '0';
        content.style.paddingLeft = '1.5rem';
        content.style.paddingRight = '1.5rem';

        // Force reflow
        void content.offsetWidth;

        // Fade in
        content.style.transition = `opacity ${ANIMATION_DURATION}ms ease`;
        content.style.opacity = '1';

        // Measure final height
        const targetHeight = measureContentHeight(content);

        // Animate height
        await animateHeight(content, 0, targetHeight, ANIMATION_DURATION);

        // Set final state
        content.style.paddingTop = '1.5rem';
        content.style.paddingBottom = '1.5rem';
        content.style.overflow = 'visible';
        content.style.transition = '';
    }

    /**
     * Close card content with animation
     */
    async function closeCardContent(content) {
        if (!content) return;

        // Prepare for animation
        content.style.overflow = 'hidden';
        content.style.transition = `opacity ${ANIMATION_DURATION}ms ease`;

        // Start fade out
        content.style.opacity = '0';

        // Get current height
        const startHeight = content.offsetHeight;

        // Remove padding (keep horizontal padding)
        content.style.paddingTop = '0';
        content.style.paddingBottom = '0';

        // Animate height to zero
        await animateHeight(content, startHeight, 0, ANIMATION_DURATION);

        // Set final state
        content.style.display = 'none';
        content.style.overflow = '';
        content.style.transition = '';
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
    }

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

    // Initialize
    initializeCards();
});