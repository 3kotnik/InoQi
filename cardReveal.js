/**
 * cardReveal.js - Position Tracking System
 * Ensures active card always stays visible at header
 */
document.addEventListener('DOMContentLoaded', () => {
    // State tracking
    let activeCardId = null;
    let positionMonitorTimer = null;

    // Find all cards
    const cards = document.querySelectorAll('.card');

    /**
     * Load card content from JSON
     */
    async function loadCardContent(card) {
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
     * Get header height including buffer
     */
    function getHeaderOffset() {
        const headerHeight = document.getElementById('header').offsetHeight;
        const buffer = 15; // Additional space below header
        return headerHeight + buffer;
    }

    /**
     * Position active card at the header with smooth animation
     */
    function positionActiveCard() {
        if (!activeCardId) return;

        const card = document.querySelector(`.card[data-content-id="${activeCardId}"]`);
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const headerOffset = getHeaderOffset();

        // If card is not at the right position (accounting for small tolerance)
        if (Math.abs(rect.top - headerOffset) > 5) {
            window.scrollTo({
                top: window.scrollY + rect.top - headerOffset,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Start monitoring position of active card
     * This ensures card stays at header even when other elements change size
     */
    function startPositionMonitoring() {
        // Clear any existing timer
        stopPositionMonitoring();

        // Set up a timer to check and adjust position
        positionMonitorTimer = setInterval(() => {
            positionActiveCard();
        }, 300); // Check every 300ms during transitions

        // Also listen for transition end events
        document.addEventListener('transitionend', handleTransitionEnd);
    }

    /**
     * Stop monitoring position
     */
    function stopPositionMonitoring() {
        if (positionMonitorTimer) {
            clearInterval(positionMonitorTimer);
            positionMonitorTimer = null;
        }
        document.removeEventListener('transitionend', handleTransitionEnd);
    }

    /**
     * Handle transition end events
     */
    function handleTransitionEnd(e) {
        // When a size-changing transition completes, check position
        if (e.propertyName === 'max-height') {
            positionActiveCard();
        }
    }

    /**
     * Handle card click
     */
    function handleCardClick(card) {
        const cardId = card.getAttribute('data-content-id');

        // If clicking active card, close it and stop monitoring
        if (cardId === activeCardId) {
            card.classList.remove('active');
            activeCardId = null;
            stopPositionMonitoring();
            return;
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
            positionActiveCard();
            // Start monitoring position to keep it in view
            startPositionMonitoring();
        }, 50);
    }

    // Initialize cards
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

    // Handle fragment navigation on page load
    if (window.location.hash) {
        const cardId = window.location.hash.substring(1); // Remove the # character
        const targetCard = document.getElementById(cardId);

        if (targetCard && targetCard.classList.contains('card')) {
            setTimeout(() => handleCardClick(targetCard), 500);
        }
    }

    // Stop monitoring when user scrolls manually
    let userScrollTimer;
    window.addEventListener('scroll', () => {
        // Temporarily pause position monitoring during user scroll
        stopPositionMonitoring();

        // Resume after user stops scrolling
        clearTimeout(userScrollTimer);
        userScrollTimer = setTimeout(() => {
            if (activeCardId) {
                startPositionMonitoring();
            }
        }, 500);
    }, { passive: true });
});