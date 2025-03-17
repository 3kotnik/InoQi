/**
 * jcSlide.js - Clean Card Animation System
 * A simple, reliable approach to card animations with JSON content loading
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const ANIMATION_DURATION = 400; // ms
    const SCROLL_OFFSET = 100; // px space between header and card

    // State
    let activeCard = null;
    let isAnimating = false;

    // DOM Elements
    const cards = document.querySelectorAll('.card');
    const siteHeader = document.querySelector('header');

    /**
     * Load card content via AJAX
     */
    async function loadCardContent(card) {
        try {
            // Skip if already loaded
            if (card.dataset.contentLoaded === 'true') return true;

            const contentId = card.getAttribute('data-content-id');
            if (!contentId) return false;

            const contentUrl = `assets/content/${contentId}.json`;
            const response = await fetch(contentUrl);

            if (!response.ok) {
                throw new Error(`Failed to load content from ${contentUrl}`);
            }

            const data = await response.json();
            populateCardFromJson(card, data);
            card.dataset.contentLoaded = 'true';
            return true;
        } catch (error) {
            console.error('Error loading card content:', error);
            showErrorInCard(card);
            return false;
        }
    }

    /**
     * Populate card with JSON data
     */
    function populateCardFromJson(card, data) {
        // Update image if provided
        if (data.imageUrl) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) cardImage.src = data.imageUrl;
        }

        // Update image alt text
        if (data.imageAlt) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) cardImage.alt = data.imageAlt;
        }

        // Update card title
        if (data.title) {
            const cardTitle = card.querySelector('.card-title h3');
            if (cardTitle) cardTitle.textContent = data.title;
        }

        // Update short description
        if (data.shortDescription) {
            const cardShortDesc = card.querySelector('.card-title p');
            if (cardShortDesc) cardShortDesc.textContent = data.shortDescription;
        }

        // Update button text
        if (data.buttonText) {
            const button = card.querySelector('.card-button');
            if (button) button.textContent = data.buttonText;
        }

        // Update detailed content
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '';

            // Add main description
            if (data.description) {
                const descParagraph = document.createElement('p');
                descParagraph.textContent = data.description;
                descParagraph.classList.add('main-description');
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
    }

    /**
     * Show error in card when content fails to load
     */
    function showErrorInCard(card) {
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoèe naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }

    /**
     * Scroll to position card optimally in viewport
     */
    function scrollToCard(card) {
        return new Promise(resolve => {
            const headerHeight = siteHeader.offsetHeight;
            const cardTop = card.getBoundingClientRect().top + window.scrollY;
            const targetScrollY = cardTop - headerHeight - SCROLL_OFFSET;

            // Setup smooth scrolling
            const startY = window.scrollY;
            const distance = targetScrollY - startY;

            // If very small distance, don't animate
            if (Math.abs(distance) < 10) {
                resolve();
                return;
            }

            const startTime = performance.now();

            function step(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / ANIMATION_DURATION, 1);
                const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

                window.scrollTo(0, startY + (distance * ease));

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
     * Get natural height of content for animation
     */
    function getContentHeight(content) {
        // Save original values
        const originalStyles = {
            height: content.style.height,
            position: content.style.position,
            visibility: content.style.visibility,
            display: content.style.display,
            padding: content.style.padding
        };

        // Measure in hidden state
        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.display = 'block';
        content.style.height = 'auto';
        content.style.padding = '1.5rem';

        // Get the height
        const height = content.scrollHeight;

        // Restore original styles
        content.style.position = originalStyles.position;
        content.style.visibility = originalStyles.visibility;
        content.style.display = originalStyles.display;
        content.style.height = originalStyles.height;
        content.style.padding = originalStyles.padding;

        return height;
    }

    /**
     * Animate card content opening
     */
    function animateContentOpen(content) {
        return new Promise(resolve => {
            content.classList.add('animating');

            // Get target height
            const targetHeight = getContentHeight(content);

            // Set initial state
            content.style.height = '0';
            content.style.opacity = '0';
            content.style.padding = '0 1.5rem';
            content.style.display = 'block';

            // Force browser to acknowledge the above styles before changing
            void content.offsetHeight;

            // Set target state
            content.style.height = `${targetHeight}px`;
            content.style.opacity = '1';
            content.style.padding = '1.5rem';

            // Clean up after animation
            content.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === 'height') {
                    content.classList.remove('animating');
                    content.style.height = 'auto';
                    content.removeEventListener('transitionend', handler);
                    resolve();
                }
            });
        });
    }

    /**
     * Animate card content closing
     */
    function animateContentClose(content) {
        return new Promise(resolve => {
            content.classList.add('animating');

            // Set initial height explicitly
            content.style.height = `${content.scrollHeight}px`;

            // Force browser to acknowledge the above style before changing
            void content.offsetHeight;

            // Animate to closed state
            content.style.height = '0';
            content.style.opacity = '0';
            content.style.padding = '0 1.5rem';

            content.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === 'height') {
                    content.classList.remove('animating');
                    content.style.display = 'none';
                    content.removeEventListener('transitionend', handler);
                    resolve();
                }
            });
        });
    }

    /**
     * Toggle card state
     */
    async function toggleCard(card) {
        if (isAnimating) return;
        isAnimating = true;

        try {
            if (card === activeCard) {
                // Close active card
                const content = card.querySelector('.card-content');
                await animateContentClose(content);
                card.classList.remove('active');
                activeCard = null;
            } else {
                // First scroll card into view
                await scrollToCard(card);

                // Handle closing active card if one exists
                if (activeCard) {
                    const oldContent = activeCard.querySelector('.card-content');
                    activeCard.classList.remove('active');
                    await animateContentClose(oldContent);
                }

                // Open new card
                const newContent = card.querySelector('.card-content');
                card.classList.add('active');
                await animateContentOpen(newContent);
                activeCard = card;
            }
        } finally {
            isAnimating = false;
        }
    }

    // Initialize all cards
    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.addEventListener('click', async () => {
                // Load content if not already loaded
                await loadCardContent(card);
                toggleCard(card);
            });
        }

        // Preload content
        loadCardContent(card);
    });

    // Add document-level click handler to close active card when clicking outside
    document.addEventListener('click', (e) => {
        if (activeCard && !isAnimating && !e.target.closest('.card')) {
            toggleCard(activeCard);
        }
    });

    // Listen for escape key to close active card
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeCard && !isAnimating) {
            toggleCard(activeCard);
        }
    });
});