/**
 * InoQI Website - Card Animation System
 * Uses precise JavaScript animations for reliable sliding
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
     * Animate element height with precision
     * @param {HTMLElement} element - Element to animate
     * @param {number} startHeight - Starting height in pixels
     * @param {number} endHeight - Ending height in pixels
     * @param {number} duration - Animation duration in milliseconds
     * @param {Function} callback - Optional callback when animation completes
     */
    function animateHeight(element, startHeight, endHeight, duration, callback) {
        const startTime = performance.now();

        // Set initial height
        element.style.height = `${startHeight}px`;
        element.style.display = 'block';

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease in-out cubic function for smooth animation
            const easeValue = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // Calculate current height
            const currentHeight = startHeight + (endHeight - startHeight) * easeValue;

            // Apply height
            element.style.height = `${currentHeight}px`;

            // Continue animation until complete
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Cleanup and callback
                if (endHeight === 0) {
                    element.style.display = 'none';
                } else {
                    element.style.height = ''; // Remove inline height to allow natural sizing
                }
                if (callback) callback();
            }
        }

        requestAnimationFrame(step);
    }

    /**
     * Toggle card open/closed
     * @param {HTMLElement} card - Card to toggle
     */
    function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;

        const content = card.querySelector('.card-content');
        const isActive = card.classList.contains('active');

        if (isActive) {
            // Close this card
            closeCardContent(card, content, () => {
                card.classList.remove('active');
                activeCard = null;
                isAnimating = false;
            });
        } else if (activeCard) {
            // Close active card first, then open this one
            const activeContent = activeCard.querySelector('.card-content');

            closeCardContent(activeCard, activeContent, () => {
                activeCard.classList.remove('active');
                activeCard = null;

                // Now open the new card
                openCardContent(card, content, () => {
                    card.classList.add('active');
                    activeCard = card;
                    isAnimating = false;
                });
            });
        } else {
            // Just open this card
            openCardContent(card, content, () => {
                card.classList.add('active');
                activeCard = card;
                isAnimating = false;
            });
        }
    }

    /**
     * Open card content with controlled animation
     * @param {HTMLElement} card - Card element
     * @param {HTMLElement} content - Card content element
     * @param {Function} callback - Callback after animation completes
     */
    function openCardContent(card, content, callback) {
        // Highlight card being opened
        card.classList.add('opening');

        // Hide overflow during height measurement
        content.style.overflow = 'hidden';

        // Temporarily make it visible but with no height to measure content
        content.style.height = 'auto';
        content.style.opacity = '0';
        content.style.display = 'block';
        content.style.padding = '1.5rem';

        // Measure natural height
        const targetHeight = content.offsetHeight;

        // Reset to start animation
        content.style.height = '0';
        content.style.padding = '0 1.5rem';

        // Force reflow
        void content.offsetWidth;

        // Fade in while expanding
        content.style.transition = `opacity ${ANIMATION_DURATION}ms ease`;
        content.style.opacity = '1';

        // Animate height
        animateHeight(content, 0, targetHeight, ANIMATION_DURATION, () => {
            content.style.height = ''; // Remove inline height
            content.style.overflow = '';
            content.style.transition = '';
            card.classList.remove('opening');

            // Execute callback
            if (callback) callback();
        });
    }

    /**
     * Close card content with controlled animation
     * @param {HTMLElement} card - Card element
     * @param {HTMLElement} content - Card content element
     * @param {Function} callback - Callback after animation completes
     */
    function closeCardContent(card, content, callback) {
        // Prevent nested issues
        if (!content) {
            if (callback) callback();
            return;
        }

        // Hide overflow during animation
        content.style.overflow = 'hidden';

        // Get current height
        const startHeight = content.offsetHeight;

        // Add transition for opacity
        content.style.transition = `opacity ${ANIMATION_DURATION}ms ease`;
        content.style.opacity = '0';

        // Animate height to zero
        animateHeight(content, startHeight, 0, ANIMATION_DURATION, () => {
            content.style.padding = '0 1.5rem';
            content.style.overflow = '';
            content.style.transition = '';

            // Execute callback
            if (callback) callback();
        });
    }

    /**
     * Load card content via AJAX
     * @param {HTMLElement} card - Card to load content for
     * @returns {Promise} - Resolves when content is loaded
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
            const descriptionElement = card.querySelector('.card-description');

            if (descriptionElement) {
                // Clear any existing content
                descriptionElement.innerHTML = '';

                // Add description paragraph
                if (data.description) {
                    const descParagraph = document.createElement('p');
                    descParagraph.textContent = data.description;
                    descriptionElement.appendChild(descParagraph);
                }

                // Add detailed content
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

            // Update button text if provided
            const button = card.querySelector('.card-button');
            if (button && data.buttonText) {
                button.textContent = data.buttonText;
            }

            // Mark as loaded
            card.dataset.contentLoaded = 'true';

        } catch (error) {
            console.error('Error loading card content:', error);
            showErrorInCard(card);
        }
    }

    /**
     * Display error message in card
     * @param {HTMLElement} card - Card with error
     */
    function showErrorInCard(card) {
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }

    /**
     * Preload card contents
     */
    function preloadCardContents() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const card = entry.target;
                        if (!card.dataset.contentLoaded) {
                            loadCardContent(card);
                        }
                        observer.unobserve(card);
                    }
                });
            }, {
                rootMargin: '200px'
            });

            cards.forEach(card => observer.observe(card));
        } else {
            // Fallback for browsers without IntersectionObserver
            cards.forEach(card => {
                if (!card.dataset.contentLoaded) {
                    loadCardContent(card);
                }
            });
        }
    }

    // Set up event listeners for cards
    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');

        if (cardHeader) {
            cardHeader.addEventListener('click', () => {
                if (!card.dataset.contentLoaded) {
                    loadCardContent(card).then(() => {
                        toggleCard(card);
                    });
                } else {
                    toggleCard(card);
                }
            });
        }
    });

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
            if (content && content.style.height !== '') {
                // Reset height to auto to accommodate content changes
                content.style.height = '';
            }
        }
    });

    // Preload card contents
    preloadCardContents();
});