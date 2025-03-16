/**
 * InoQI Website - Enhanced Card Sliding JavaScript
 * Provides smoother, staggered animations for workshop and event cards
 */

// DOM Elements
const cards = document.querySelectorAll('.card');

// Animation Variables
const SCROLL_DURATION = 500; // ms for smooth scroll positioning
const SLIDE_ANIMATION_DURATION = 500; // ms for content expansion/collapse
const POSITION_BUFFER = 20; // px of space between header and card

// State Variables
let activeCard = null;
let animationInProgress = false;

/**
 * Load JSON content for card
 * @param {HTMLElement} card - The card element
 * @returns {Promise} Promise resolving when content is loaded
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
 * @param {HTMLElement} card - The card element
 * @param {Object} data - The JSON data to render
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
 * @param {HTMLElement} card - The card with error
 */
function showErrorInCard(card) {
    const descriptionElement = card.querySelector('.card-description');
    if (descriptionElement) {
        descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
    }
}

/**
 * Main function to toggle card open/closed state with staggered animation
 * @param {HTMLElement} card - The card to toggle
 */
function toggleCard(card) {
    if (animationInProgress) return;
    animationInProgress = true;
    
    const contentElement = card.querySelector('.card-content');
    const isActive = card.classList.contains('active');
    
    // If card is already active, just close it
    if (isActive) {
        closeCard(card);
        return;
    }
    
    // Close any open card first
    if (activeCard && activeCard !== card) {
        closeCard(activeCard);
        setTimeout(() => {
            // After closing animation completes, position and open the new card
            moveCardIntoView(card).then(() => {
                openCard(card);
            });
        }, SLIDE_ANIMATION_DURATION);
    } else {
        // No card is open, directly position and open this card
        moveCardIntoView(card).then(() => {
            openCard(card);
        });
    }
}

/**
 * Move card into optimal viewing position before opening it
 * @param {HTMLElement} card - The card to position
 * @returns {Promise} Resolves when card positioning is complete
 */
function moveCardIntoView(card) {
    return new Promise(resolve => {
        const headerHeight = document.querySelector('header').offsetHeight || 0;
        const cardTop = card.getBoundingClientRect().top;
        const targetScrollY = window.pageYOffset + cardTop - headerHeight - POSITION_BUFFER;
        
        // If card is already well positioned, don't scroll
        const currentDiff = Math.abs(window.scrollY - targetScrollY);
        if (currentDiff < 50) {
            resolve();
            return;
        }
        
        // Add visual highlight to indicate which card is being positioned
        card.classList.add('positioning');
        
        // Smooth scroll to position
        window.scrollTo({
            top: targetScrollY,
            behavior: 'smooth'
        });
        
        // Wait for scroll to complete before expanding
        setTimeout(() => {
            card.classList.remove('positioning');
            resolve();
        }, SCROLL_DURATION);
    });
}

/**
 * Open a card with smooth animation
 * @param {HTMLElement} card - The card to open
 */
function openCard(card) {
    card.classList.add('active');
    activeCard = card;
    
    // Give time for animation to complete before allowing new actions
    setTimeout(() => {
        animationInProgress = false;
    }, SLIDE_ANIMATION_DURATION);
}

/**
 * Close an open card with smooth animation
 * @param {HTMLElement} card - The card to close
 */
function closeCard(card) {
    card.classList.remove('active');
    
    // Wait for animation to complete
    setTimeout(() => {
        if (activeCard === card) {
            activeCard = null;
        }
        animationInProgress = false;
    }, SLIDE_ANIMATION_DURATION);
}

/**
 * Handle click on card header to toggle content
 * @param {Event} e - Click event
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
            rootMargin: '200px' // Start loading when card approaches viewport
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
 * Handle clicks outside cards to close open card
 * @param {Event} e - Click event
 */
function handleOutsideClick(e) {
    if (activeCard && !e.target.closest('.card') && !animationInProgress) {
        closeCard(activeCard);
    }
}

/**
 * Handle window resize to maintain content layout
 */
function handleResize() {
    if (activeCard && !animationInProgress) {
        // This ensures active card still fits properly after window resize
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
            closeCard(activeCard);
        }
    });
    
    // Handle window resize for responsive adjustments
    window.addEventListener('resize', handleResize);
});