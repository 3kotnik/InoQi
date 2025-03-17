/**
 * InoQI Website - Card Animation System with Viewport Priority
 * Ensures smooth crossfade while keeping cards within viewport constraints
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cards = document.querySelectorAll('.card');

    // Configuration
    const ANIMATION_DURATION = 800; // ms
    const TOP_PADDING = 100; // Padding from top of viewport after header

    // State variables
    let activeCard = null;
    let isAnimating = false;

    /**
     * Measure content height accurately without affecting layout
     */
    function measureContentHeight(content) {
        const originalStyles = {
            display: content.style.display,
            height: content.style.height,
            position: content.style.position,
            visibility: content.style.visibility,
            padding: content.style.padding
        };

        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.display = 'block';
        content.style.height = 'auto';
        content.style.padding = '1.5rem';

        const height = content.scrollHeight;

        // Restore original styles
        Object.keys(originalStyles).forEach(key => {
            content.style[key] = originalStyles[key];
        });

        return height;
    }

    /**
     * Viewport-priority animation - the key improvement
     */
    function viewportPriorityAnimation({
        closingCard = null,
        openingCard,
        onComplete = () => { }
    }) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const openingContent = openingCard.querySelector('.card-content');
        const targetOpeningHeight = measureContentHeight(openingContent);

        // CRITICAL: Set up temporary fixed positioning for the opening card
        // This ensures it stays in viewport regardless of document shifts
        const openingRect = openingCard.getBoundingClientRect();
        const cardWidth = openingRect.width;

        // Store original styles before modifying
        const originalStyles = {
            position: openingCard.style.position,
            top: openingCard.style.top,
            left: openingCard.style.left,
            width: openingCard.style.width,
            zIndex: openingCard.style.zIndex
        };

        // Create a placeholder to prevent layout collapse
        const placeholder = document.createElement('div');
        placeholder.style.height = openingRect.height + 'px';
        placeholder.style.margin = '0';
        placeholder.style.padding = '0';
        placeholder.style.display = 'block';
        placeholder.style.visibility = 'hidden';
        openingCard.parentNode.insertBefore(placeholder, openingCard);

        // Fix the card in viewport position
        openingCard.style.position = 'fixed';
        openingCard.style.top = `${openingRect.top}px`;
        openingCard.style.left = `${openingRect.left}px`;
        openingCard.style.width = `${cardWidth}px`;
        openingCard.style.zIndex = '100';

        // Target position (fixed coordinates) - never above header
        const targetTop = Math.max(headerHeight + TOP_PADDING, openingRect.top);

        // Set up closing card if we have one
        let closingContent = null;
        let startClosingHeight = 0;

        if (closingCard) {
            closingContent = closingCard.querySelector('.card-content');
            startClosingHeight = closingContent.offsetHeight;
            closingContent.style.overflow = 'hidden';
            closingCard.classList.remove('active');
        }

        // Prepare opening content
        openingContent.style.overflow = 'hidden';
        openingContent.style.display = 'block';
        openingContent.style.height = '0';
        openingContent.style.opacity = '0';
        openingContent.style.paddingTop = '0';
        openingContent.style.paddingBottom = '0';
        openingContent.style.paddingLeft = '1.5rem';
        openingContent.style.paddingRight = '1.5rem';

        // Add active class to opening card
        openingCard.classList.add('active');

        // Calculate scroll target for after animation
        const finalScrollPosition = window.scrollY + openingRect.top - targetTop;

        // Start animation
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / ANIMATION_DURATION, 1);

            // Use cubic ease-out for natural motion
            const easeValue = 1 - Math.pow(1 - progress, 3);

            // Update card position (smoothly move to top if needed)
            const currentTop = openingRect.top + (targetTop - openingRect.top) * easeValue;
            openingCard.style.top = `${currentTop}px`;

            // Update closing content if present
            if (closingContent) {
                const currentClosingHeight = startClosingHeight * (1 - easeValue);
                closingContent.style.height = `${currentClosingHeight}px`;
                closingContent.style.opacity = 1 - easeValue;
            }

            // Update opening content
            const currentOpeningHeight = targetOpeningHeight * easeValue;
            openingContent.style.height = `${currentOpeningHeight}px`;
            openingContent.style.opacity = easeValue;

            // Continue animation or complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - restore card to document flow
                openingCard.style.position = originalStyles.position;
                openingCard.style.top = originalStyles.top;
                openingCard.style.left = originalStyles.left;
                openingCard.style.width = originalStyles.width;
                openingCard.style.zIndex = originalStyles.zIndex;

                // Remove placeholder
                placeholder.parentNode.removeChild(placeholder);

                // Final scroll adjustment to ensure card is properly positioned
                window.scrollTo(0, finalScrollPosition);

                // Final state adjustments
                if (closingContent) {
                    closingContent.style.display = 'none';
                    closingContent.style.height = '0';
                    closingContent.style.opacity = '0';
                    closingContent.style.overflow = '';
                }

                openingContent.style.height = `${targetOpeningHeight}px`;
                openingContent.style.opacity = '1';
                openingContent.style.paddingTop = '1.5rem';
                openingContent.style.paddingBottom = '1.5rem';
                openingContent.style.overflow = 'visible';

                // Complete callback
                onComplete();
            }
        }

        // Start animation
        requestAnimationFrame(animate);
    }

    /**
     * Toggle card open/closed state
     */
    function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;

        const isActive = card.classList.contains('active');

        if (isActive) {
            // Close this card
            const content = card.querySelector('.card-content');
            const startHeight = content.offsetHeight;

            content.style.overflow = 'hidden';

            const startTime = performance.now();

            function closeAnimation(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
                const easeValue = 1 - Math.pow(1 - progress, 3);

                const currentHeight = startHeight * (1 - easeValue);
                content.style.height = `${currentHeight}px`;
                content.style.opacity = 1 - easeValue;

                if (progress < 1) {
                    requestAnimationFrame(closeAnimation);
                } else {
                    content.style.display = 'none';
                    content.style.height = '0';
                    content.style.overflow = '';
                    card.classList.remove('active');
                    activeCard = null;
                    isAnimating = false;
                }
            }

            requestAnimationFrame(closeAnimation);
        } else if (activeCard) {
            // Use viewport-priority animation between cards
            viewportPriorityAnimation({
                closingCard: activeCard,
                openingCard: card,
                onComplete: () => {
                    activeCard = card;
                    isAnimating = false;
                }
            });
        } else {
            // Just open this card using viewport-priority animation
            viewportPriorityAnimation({
                openingCard: card,
                onComplete: () => {
                    activeCard = card;
                    isAnimating = false;
                }
            });
        }
    }

    /**
     * Load card content via AJAX and populate card
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
     * Initialize the card system
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

            // Preload card data
            loadCardContent(card);
        });

        // Set up global event listeners
        document.addEventListener('click', (e) => {
            if (activeCard && !isAnimating && !e.target.closest('.card')) {
                toggleCard(activeCard);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeCard && !isAnimating) {
                toggleCard(activeCard);
            }
        });

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

    // Initialize
    initializeCards();
});