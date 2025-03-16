/**
 * InoQI Website - Enhanced Card Sliding JavaScript
 * Provides fluid, coordinated animations for workshop and event cards
 */

// DOM Elements
const cards = document.querySelectorAll('.card');

// Animation Variables
const ANIMATION_DURATION = 900; // ms for all animations (consistent timing)
const POSITION_BUFFER = 80; // px of space between header and card

// State Variables
let activeCard = null;
let animationInProgress = false;
let nextCardToOpen = null;

/**
 * Load JSON content for card
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
 * Show error message in card
 */
function showErrorInCard(card) {
    const descriptionElement = card.querySelector('.card-description');
    if (descriptionElement) {
        descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
    }
}

/**
 * Set animation durations for CSS elements
 */
function setAnimationDurations() {
    const durationInSeconds = ANIMATION_DURATION / 500 + 's';
    const style = document.createElement('style');

    style.textContent = `
        .card {
            transition: 
                transform ${durationInSeconds} cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.3s ease;
        }
        
        .card-content {
            transition: 
                max-height ${durationInSeconds} cubic-bezier(0.16, 1, 0.3, 1),
                opacity ${durationInSeconds} cubic-bezier(0.16, 1, 0.3, 1),
                padding ${durationInSeconds} cubic-bezier(0.16, 1, 0.3, 1),
                visibility 0s linear ${durationInSeconds};
        }
        
        .card.active .card-content {
            transition: 
                max-height ${durationInSeconds} cubic-bezier(0.16, 1, 0.3, 1),
                opacity ${durationInSeconds} cubic-bezier(0.16, 1, 0.3, 1),
                padding ${durationInSeconds} cubic-bezier(0.16, 1, 0.3, 1),
                visibility 0s linear;
        }
    `;

    document.head.appendChild(style);
}

/**
 * Animate scroll with the same timing as card animations
 */
function smoothScrollTo(targetY) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;

    // Skip tiny distances
    if (Math.abs(distance) < 10) return Promise.resolve();

    return new Promise(resolve => {
        let startTime = null;

        // Use same easing curve as card animations for consistency
        function easeOutExpo(t) {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

            window.scrollTo(0, startY + distance * easeOutExpo(progress));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                resolve();
            }
        }

        window.requestAnimationFrame(step);
    });
}

/**
 * Get ideal scroll position for a card
 */
function getCardScrollPosition(card) {
    const headerHeight = document.querySelector('header').offsetHeight || 0;
    const cardTop = card.getBoundingClientRect().top;
    return window.pageYOffset + cardTop - headerHeight - POSITION_BUFFER;
}

/**
 * Main function to toggle card open/closed state
 */
function toggleCard(card) {
    if (animationInProgress) return;
    animationInProgress = true;

    const isActive = card.classList.contains('active');

    if (isActive) {
        // Card is open, close it with fluid animation
        unifiedCardAnimation(card, false);
    } else if (activeCard) {
        // Another card is open, close it and then open this one
        nextCardToOpen = card;
        unifiedCardAnimation(activeCard, false);
    } else {
        // No card is open, open this one with fluid animation
        unifiedCardAnimation(card, true);
    }
}

/**
 * Unified animation for both opening and closing cards
 * @param {HTMLElement} card - The card to animate
 * @param {boolean} isOpening - Whether we're opening or closing the card
 */
function unifiedCardAnimation(card, isOpening) {
    // Calculate target scroll position
    const targetScrollY = getCardScrollPosition(card);

    if (isOpening) {
        // OPENING ANIMATION

        // Add visual highlight during animation
        card.classList.add('animating');

        // Start scroll animation and content expansion simultaneously
        smoothScrollTo(targetScrollY);

        // Start content expansion very slightly after scroll begins (feels more natural)
        requestAnimationFrame(() => {
            card.classList.add('active');
            activeCard = card;
        });

        // Clean up after animation completes
        setTimeout(() => {
            card.classList.remove('animating');
            animationInProgress = false;
        }, ANIMATION_DURATION);

    } else {
        // CLOSING ANIMATION

        // Add visual indication
        card.classList.add('animating');

        // Remove active class to start collapse
        card.classList.remove('active');

        // If we're switching to another card, scroll to it while current one collapses
        if (nextCardToOpen) {
            const nextCardY = getCardScrollPosition(nextCardToOpen);
            smoothScrollTo(nextCardY);

            // When animation completes, open next card
            setTimeout(() => {
                if (activeCard === card) activeCard = null;
                card.classList.remove('animating');

                // Now open the next card (without additional scrolling)
                unifiedCardAnimation(nextCardToOpen, true);
                nextCardToOpen = null;
            }, ANIMATION_DURATION);

        } else {
            // Just closing with no next card
            setTimeout(() => {
                if (activeCard === card) activeCard = null;
                card.classList.remove('animating');
                animationInProgress = false;
            }, ANIMATION_DURATION);
        }
    }
}

/**
 * Handle click on card header
 */
function handleCardClick(e) {
    if (animationInProgress) return;

    const card = e.currentTarget.closest('.card');
    if (!card) return;

    // Load content if not already loaded
    if (!card.dataset.contentLoaded) {
        loadCardContent(card).then(() => {
            card.dataset.contentLoaded = 'true';
            toggleCard(card);
        });
    } else {
        toggleCard(card);
    }
}

/**
 * Initialize all cards
 */
function initializeCards() {
    // Set animation durations first
    setAnimationDurations();

    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.addEventListener('click', handleCardClick);
        }
    });

    // Preload card content for better user experience
    preloadCardContents();
}

/**
 * Preload card contents when they come close to viewport
 */
function preloadCardContents() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    if (!card.dataset.contentLoaded) {
                        loadCardContent(card).then(() => {
                            card.dataset.contentLoaded = 'true';
                        });
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
                    loadCardContent(card).then(() => {
                        card.dataset.contentLoaded = 'true';
                    });
                }
            });
        }, 1000);
    }
}

/**
 * Handle clicks outside cards to close active card
 */
function handleOutsideClick(e) {
    if (activeCard && !e.target.closest('.card') && !animationInProgress) {
        unifiedCardAnimation(activeCard, false);
    }
}

/**
 * Handle window resize to maintain content layout
 */
function handleResize() {
    if (activeCard && !animationInProgress) {
        // Ensure active card still displays properly after resize
        requestAnimationFrame(() => {
            activeCard.classList.add('resizing');
            requestAnimationFrame(() => {
                activeCard.classList.remove('resizing');
            });
        });
    }
}

// Initialize cards when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCards();

    // Set up outside click handler
    document.addEventListener('click', handleOutsideClick);

    // Handle escape key to close active card
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeCard && !animationInProgress) {
            unifiedCardAnimation(activeCard, false);
        }
    });

    // Handle window resize for responsive adjustments
    window.addEventListener('resize', handleResize);
});