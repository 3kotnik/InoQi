/**
 * jcSlide.js - Fixed version that ensures content appears
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const ANIMATION_DURATION = 500; // ms
    const HEADER_BUFFER = 10;       // px

    // State
    let activeCard = null;
    let isAnimating = false;

    /**
     * Get current header height (accounting for scrolled state)
     */
    function getHeaderHeight() {
        return document.getElementById('header').offsetHeight;
    }

    /**
     * Load card content via AJAX
     */
    async function loadCardContent(card) {
        // Skip if already loaded
        if (card.dataset.contentLoaded === 'true') return true;

        try {
            const contentId = card.getAttribute('data-content-id');
            if (!contentId) return false;

            // Use absolute path to ensure it works in all contexts
            const contentUrl = `assets/content/${contentId}.json`;
            console.log(`Loading content from: ${contentUrl}`); // Debug logging

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
        console.log('Populating card with data:', data); // Debug logging

        // Update card image if provided
        if (data.imageUrl) {
            const cardImage = card.querySelector('.card-header img');
            if (cardImage) cardImage.src = data.imageUrl;
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

            // Add main description paragraph
            if (data.description) {
                const descParagraph = document.createElement('p');
                descParagraph.textContent = data.description;
                descParagraph.classList.add('main-description');
                descriptionElement.appendChild(descParagraph);
            }

            // Add detailed content (paragraphs and lists)
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
            descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoèe naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }

    /**
     * Scroll card to top of viewport, accounting for header height
     */
    function scrollCardIntoView(card) {
        return new Promise(resolve => {
            // Disable built-in smooth scrolling temporarily
            document.documentElement.style.scrollBehavior = 'auto';

            // Calculate target position
            const headerHeight = getHeaderHeight();
            const cardTop = card.getBoundingClientRect().top + window.scrollY;
            const targetY = cardTop - headerHeight - HEADER_BUFFER;

            // Animate scroll
            const startY = window.scrollY;
            const distance = targetY - startY;
            const startTime = performance.now();

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
                const easeValue = 1 - Math.pow(1 - progress, 3); // cubic ease-out

                window.scrollTo(0, startY + distance * easeValue);

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    // Re-enable smooth scrolling
                    document.documentElement.style.scrollBehavior = '';
                    resolve();
                }
            }

            requestAnimationFrame(step);
        });
    }

    /**
     * Simple toggle of card content with animation
     * SIMPLIFIED FOR RELIABILITY
     */
    function toggleCardContent(card) {
        // Get references
        const content = card.querySelector('.card-content');
        const oldContent = activeCard?.querySelector('.card-content');

        // If this is already the active card, close it
        if (card === activeCard) {
            content.style.display = 'none';
            card.classList.remove('active');
            activeCard = null;
            return;
        }

        // First close any open card
        if (activeCard) {
            oldContent.style.display = 'none';
            activeCard.classList.remove('active');
        }

        // Then open this card
        content.style.display = 'block';
        card.classList.add('active');
        activeCard = card;
    }

    /**
     * Card click handler - manages the full sequence
     */
    async function handleCardClick(card) {
        if (isAnimating) return;
        isAnimating = true;

        try {
            // First load the content
            await loadCardContent(card);

            // Then scroll card into view
            await scrollCardIntoView(card);

            // Finally toggle the content
            toggleCardContent(card);

        } catch (error) {
            console.error('Error handling card click:', error);
        } finally {
            isAnimating = false;
        }
    }

    // Initialize all cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.addEventListener('click', () => {
                handleCardClick(card);
            });
        }

        // Preload content
        loadCardContent(card);
    });
});