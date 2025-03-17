/**
 * cardReveal.js - Position Tracking System (Corrected Scroll Amount)
 * Ensures active card header is visible at top, without over-scrolling
 */
document.addEventListener('DOMContentLoaded', () => {
    // ==============================================
    // CONFIGURABLE ANIMATION SETTINGS
    // ==============================================
    const SETTINGS = {
        // Animation speeds (no changes needed here for scroll behavior)
        INITIAL_POSITION_DELAY: 150,      // Increased delay (ms) - Important!
        HEADER_BUFFER: 15,               // Space between header and card (px)
    };
    // ==============================================

    // State tracking
    let activeCardId = null;

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
     * Get header height including buffer (No changes needed)
     */
    function getHeaderOffset() {
        const headerHeight = document.getElementById('header').offsetHeight;
        return headerHeight + SETTINGS.HEADER_BUFFER;
    }

    /**
     * Position active card at the header with smooth animation (Corrected Scroll)
     */
    function positionActiveCard() {
        if (!activeCardId) return;

        const card = document.querySelector(`.card[data-content-id="${activeCardId}"]`);
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const headerOffset = getHeaderOffset();
        const cardHeaderHeight = card.querySelector('.card-header').offsetHeight; // Get card header height

        // Calculate the exact scroll position to align card header just below page header
        const scrollTarget = window.scrollY + rect.top - headerOffset;

        // Scroll only if card header is below the intended position
        if (rect.top > headerOffset) {
            window.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
            });
        }
        // else if (rect.top < headerOffset - cardHeaderHeight ) { // Alternative: if card header is above, also scroll. (Optional, if needed in some layouts)
        //    window.scrollTo({
        //        top: scrollTarget,
        //        behavior: 'smooth'
        //    });
        //}
    }


    /**
     * Handle card click (No changes needed)
     */
    function handleCardClick(card) {
        const cardId = card.getAttribute('data-content-id');

        // If clicking active card, close it
        if (cardId === activeCardId) {
            card.classList.remove('active');
            activeCardId = null;
            return; // Important: Stop here, no positioning needed on close
        }

        // Close currently open card if any
        if (activeCardId) {
            document.querySelector(`.card[data-content-id="${activeCardId}"]`)?.classList.remove('active');
        }

        // Open this card
        card.classList.add('active');
        activeCardId = cardId;

        // Initial positioning (with a slight delay to let the DOM update)
        setTimeout(() => {
            positionActiveCard(); // Call positionActiveCard once on open
        }, SETTINGS.INITIAL_POSITION_DELAY);
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
        const cardId = window.location.hash.substring(1); // Remove the # character
        const targetCard = document.getElementById(cardId);

        if (targetCard && targetCard.classList.contains('card')) {
            setTimeout(() => handleCardClick(targetCard), 500);
        }
    }

    // No more scroll event listener needed for forced scroll prevention!
    // The user now has full scroll control after the card opens.

});