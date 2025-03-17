/**
 * cardReveal.js - Position Tracking (Debounced Clicks, Smooth Scroll, % Padding) - v3 - Refined for Smoothness
 * Addresses rapid clicks, jagged animation, and adds %-based header padding
 */
document.addEventListener('DOMContentLoaded', () => {
    // ==============================================
    // CONFIGURABLE ANIMATION SETTINGS
    // ==============================================
    const SETTINGS = {
        HEADER_PADDING_PERCENT: 15,    // Percentage of viewport height for header padding
        HEADER_BUFFER: 15,               // Minimum space below header (px) - fallback
        DEBOUNCE_DELAY: 200,            // Delay for debouncing card clicks (ms)
        SCROLL_TOLERANCE: 2,             // Tolerance for scroll position check (pixels) - for smoother animation
    };
    // ==============================================

    // State tracking
    let activeCardId = null;
    let cardClickDebounce = false; // Debounce flag

    // Find all cards
    const cards = document.querySelectorAll('.card');

    /**
     * Load card content from JSON (No changes needed)
     */
    async function loadCardContent(card) {
        // ... (same loadCardContent function as before) ...
         try {
            // Skip if already loaded
            if (card.dataset.loaded === 'true') return;

            const contentId = card.getAttribute('data-content-id');
            if (!contentId) return;

            const response = await fetch(`assets/content/${contentId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load content: ${response.status}`);
            }

            const data = await response.json();

            // Update image if provided in JSON
            if (data.imageUrl) {
                const cardImage = card.querySelector('.card-header img');
                if (cardImage) {
                    cardImage.src = data.imageUrl;
                }
            }

            // Update image alt text if provided
            if (data.imageAlt) {
                const cardImage = card.querySelector('.card-header img');
                if (cardImage) cardImage.alt = data.imageAlt;
            }

            // Update title
            if (data.title) {
                const cardTitle = card.querySelector('.card-title h3');
                if (cardTitle) cardTitle.textContent = data.title;
            }

            // Update short description
            if (data.shortDescription) {
                const cardShortDesc = card.querySelector('.card-title p');
                if (cardShortDesc) cardShortDesc.textContent = data.shortDescription;
            }

            // Populate card content
            const content = card.querySelector('.card-content');
            const description = content.querySelector('.card-description');

            // Clear existing content
            description.innerHTML = '';

            // Add main description
            if (data.description) {
                const mainDesc = document.createElement('p');
                mainDesc.textContent = data.description;
                mainDesc.classList.add('main-description');
                description.appendChild(mainDesc);
            }

            // Add detailed content
            if (data.details && Array.isArray(data.details)) {
                data.details.forEach(detail => {
                    if (detail.type === 'paragraph') {
                        const para = document.createElement('p');
                        para.textContent = detail.content;
                        description.appendChild(para);
                    } else if (detail.type === 'list' && detail.items) {
                        const list = document.createElement('ul');
                        detail.items.forEach(item => {
                            const li = document.createElement('li');
                            li.textContent = item;
                            list.appendChild(li);
                        });
                        description.appendChild(list);
                    }
                });
            }

            // Update button if provided
            if (data.buttonText) {
                const button = content.querySelector('.card-button');
                if (button) button.textContent = data.buttonText;
            }

            // Mark as loaded
            card.dataset.loaded = 'true';

        } catch (error) {
            console.error('Failed to load card content:', error);
            card.querySelector('.card-description').innerHTML =
                '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }

    /**
     * Get header height including padding (%) and buffer
     */
    function getHeaderOffset() {
        const headerHeight = document.getElementById('header').offsetHeight;
        const paddingHeight = (window.innerHeight * SETTINGS.HEADER_PADDING_PERCENT) / 100;
        return headerHeight + Math.max(paddingHeight, SETTINGS.HEADER_BUFFER); // Use percentage padding, or buffer if % is smaller
    }

    /**
     * Position active card at the header (Viewport Handling, rAF, Smooth Scroll) - v3 - Debounced, Smoother
     */
    function positionActiveCard() {
        if (!activeCardId) return;

        const card = document.querySelector(`.card[data-content-id="${activeCardId}"]`);
        if (!card) return;

        requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const headerOffset = getHeaderOffset();
            const cardContentHeight = card.offsetHeight;
            const viewportHeight = window.innerHeight;

            let scrollTarget = 0;

            if (cardContentHeight > viewportHeight) {
                scrollTarget = window.scrollY + rect.top - headerOffset;
                if (scrollTarget < 0) scrollTarget = 0;
            } else {
                scrollTarget = window.scrollY + rect.top - headerOffset;
            }

            // Refined scroll condition with tolerance for smoother animation
            if (Math.abs(rect.top - headerOffset) > SETTINGS.SCROLL_TOLERANCE || cardContentHeight > viewportHeight) {
                window.scrollTo({
                    top: scrollTarget,
                    behavior: 'smooth'
                });
            }
        });
    }


    /**
     * Handle card click (Debounced) - v3 - Debounced Card Clicks
     */
    function handleCardClick(card) {
        if (cardClickDebounce) {
            return; // Ignore clicks during debounce
        }
        cardClickDebounce = true;

        const cardId = card.getAttribute('data-content-id');

        // If clicking active card, close it
        if (cardId === activeCardId) {
            card.classList.remove('active');
            activeCardId = null;
            cardClickDebounce = false; // Reset debounce immediately on close
            return;
        }

        // Close currently open card if any
        if (activeCardId) {
            document.querySelector(`.card[data-content-id="${activeCardId}"]`)?.classList.remove('active');
        }

        // Open this card
        card.classList.add('active');
        activeCardId = cardId;

        // Initial positioning (using requestAnimationFrame)
        requestAnimationFrame(() => {
            positionActiveCard();
            setTimeout(() => { cardClickDebounce = false; }, SETTINGS.DEBOUNCE_DELAY); // Reset debounce after delay
        });
    }

    // Initialize cards (No changes needed)
    cards.forEach(card => {
        // Add ID anchor if not present
        const contentId = card.getAttribute('data-content-id');
        if (contentId && !card.id) {
            card.id = `card-${contentId}`;
        }

        // Load content immediately
        loadCardContent(card);

        // Add click handler to header
        const cardHeader = card.querySelector('.card-header');
        cardHeader.addEventListener('click', () => {
            handleCardClick(card);
        });
    });

    // Handle fragment navigation on page load (No changes needed)
    if (window.location.hash) {
        const cardId = window.location.hash.substring(1);
        const targetCard = document.getElementById(cardId);

        if (targetCard && targetCard.classList.contains('card')) {
            requestAnimationFrame(() => handleCardClick(targetCard));
        }
    }

});