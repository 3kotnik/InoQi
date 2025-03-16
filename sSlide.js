/**
 * InoQI Website - Card Animation System
 * Fixed broken toggling functionality
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

                // Open new card
                card.classList.add('active');
                await openCardContent(content);
                activeCard = card;
            } else {
                // Just open this card
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
     * Load card content via AJAX
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
            renderCardContent(card, data);
            card.dataset.contentLoaded = 'true';
        } catch (error) {
            console.error('Error loading card content:', error);
            showErrorInCard(card);
        }
    }

    /**
     * Render JSON content in card
     */
    function renderCardContent(card, data) {
        const descriptionElement = card.querySelector('.card-description');
        if (!descriptionElement) return;

        // Clear existing content
        descriptionElement.innerHTML = '';

        // Add description paragraph
        if (data.description) {
            const descParagraph = document.createElement('p');
            descParagraph.textContent = data.description;
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

        // Update button text if provided
        const button = card.querySelector('.card-button');
        if (button && data.buttonText) {
            button.textContent = data.buttonText;
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
        });

        // Preload card contents
        preloadCardContents();
    }

    /**
     * Preload card contents near viewport
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
            setTimeout(() => {
                cards.forEach(card => {
                    if (!card.dataset.contentLoaded) {
                        loadCardContent(card);
                    }
                });
            }, 1000);
        }
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