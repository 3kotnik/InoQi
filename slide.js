/**
 * InoQI Website - Card Sliding JavaScript
 * Handles the sliding functionality for workshop and event cards
 */

// DOM Elements
const cards = document.querySelectorAll('.card');

// Animation Variables
const SLIDE_ANIMATION_DURATION = 400;

// State Variables
let activeCard = null;
let animationInProgress = false;

/**
 * Load JSON content for card
 * @param {HTMLElement} card - The card element
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
 * Toggle card content visibility
 */
function toggleCard(card) {
    // Prevent multiple animations
    if (animationInProgress) return;
    
    const contentElement = card.querySelector('.card-content');
    const isActive = card.classList.contains('active');
    
    animationInProgress = true;
    
    // Close card if already active
    if (isActive) {
        closeCard(card);
        return;
    }
    
    // Close any currently open card
    if (activeCard && activeCard !== card) {
        closeCard(activeCard);
        
        // Wait for closing animation to complete before opening new card
        setTimeout(() => {
            openCard(card, contentElement);
        }, SLIDE_ANIMATION_DURATION);
    } else {
        openCard(card, contentElement);
    }
}

/**
 * Open a card
 */
function openCard(card, contentElement) {
    // Calculate content height before opening
    contentElement.style.height = 'auto';
    const targetHeight = contentElement.scrollHeight;
    contentElement.style.height = '0';
    
    // Force browser to recognize changes before animation
    card.classList.add('active');
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            contentElement.style.height = `${targetHeight}px`;
            contentElement.style.opacity = '1';
            
            // Set as active card
            activeCard = card;
            
            // Position card in viewport
            setTimeout(() => {
                scrollToCard(card);
                
                // Allow height to be auto after animation completes
                setTimeout(() => {
                    if (card.classList.contains('active')) {
                        contentElement.style.height = 'auto';
                    }
                    animationInProgress = false;
                }, SLIDE_ANIMATION_DURATION);
            }, 50);
        });
    });
}

/**
 * Close an open card
 */
function closeCard(card) {
    const contentElement = card.querySelector('.card-content');
    
    // Set explicit height before animating closed
    contentElement.style.height = `${contentElement.scrollHeight}px`;
    
    // Force browser to recognize the explicit height
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Start animation
            contentElement.style.height = '0';
            contentElement.style.opacity = '0';
            
            // Remove active class when animation completes
            setTimeout(() => {
                card.classList.remove('active');
                
                // Reset active card reference if this was the active one
                if (activeCard === card) {
                    activeCard = null;
                }
                
                animationInProgress = false;
            }, SLIDE_ANIMATION_DURATION);
        });
    });
}

/**
 * Scroll to position card optimally in viewport
 */
function scrollToCard(card) {
    if (!card) return;
    
    const cardTop = card.getBoundingClientRect().top;
    const headerHeight = document.querySelector('header').offsetHeight || 0;
    const buffer = 20; // Extra space between header and card
    const targetPosition = window.pageYOffset + cardTop - headerHeight - buffer;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Handle click on card header to toggle content
 */
function handleCardClick(e) {
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
 * Preload card content for better UX
 */
function preloadCardContent() {
    // Use Intersection Observer to preload content when card comes into view
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
            rootMargin: '200px' // Start loading when within 200px of viewport
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
 * Initialize all cards
 */
function initializeCards() {
    cards.forEach(card => {
        const cardHeader = card.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.addEventListener('click', handleCardClick);
        }
        
        // Prepare content container for animation
        const cardContent = card.querySelector('.card-content');
        if (cardContent) {
            cardContent.style.height = '0';
            cardContent.style.opacity = '0';
            // Use will-change for better animation performance
            cardContent.style.willChange = 'height, opacity';
        }
    });
    
    // Preload card content for better UX
    preloadCardContent();
}

/**
 * Handle clicks outside cards to close open card
 */
function handleOutsideClick(e) {
    if (activeCard && !e.target.closest('.card') && !animationInProgress) {
        closeCard(activeCard);
    }
}

/**
 * Handle window resize to adjust card content height
 */
function handleResize() {
    if (activeCard && !animationInProgress) {
        const contentElement = activeCard.querySelector('.card-content');
        if (contentElement) {
            // Allow height to adjust automatically
            contentElement.style.height = 'auto';
        }
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