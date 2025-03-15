/**
 * InoQI Website - Card Sliding JavaScript
 * Handles the sliding functionality for workshop and event cards
 */

// DOM Elements
const cards = document.querySelectorAll('.card');

// Animation Variables
const SLIDE_ANIMATION_DURATION = 400; // ms

// State Variables
let activeCard = null;

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
        }
        
        // Update button text if provided
        const button = card.querySelector('.card-button');
        if (button && data.buttonText) {
            button.textContent = data.buttonText;
        }
    } catch (error) {
        console.error('Error loading card content:', error);
        
        // Display error message in the card
        const descriptionElement = card.querySelector('.card-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = '<p>Vsebine trenutno ni mogoče naložiti. Prosimo, poskusite znova kasneje.</p>';
        }
    }
}

/**
 * Toggle card content visibility
 * @param {HTMLElement} card - The card to toggle
 */
function toggleCard(card) {
    const contentElement = card.querySelector('.card-content');
    const isActive = card.classList.contains('active');
    
    // If this card is already active, close it
    if (isActive) {
        closeCard(card);
        return;
    }
    
    // Close any currently open card
    if (activeCard && activeCard !== card) {
        closeCard(activeCard);
    }
    
    // Open this card
    card.classList.add('active');
    
    // Animate height from 0 to scrollHeight
    const contentHeight = contentElement.scrollHeight;
    contentElement.style.height = '0';
    contentElement.style.opacity = '0';
    
    // Force browser to recognize the starting height before animating
    window.getComputedStyle(contentElement).getPropertyValue('height');
    
    // Start animation
    contentElement.style.height = contentHeight + 'px';
    contentElement.style.opacity = '1';
    
    // Set as active card
    activeCard = card;
    
    // Smooth scroll to position card optimally in viewport
    setTimeout(() => {
        const cardTop = card.getBoundingClientRect().top;
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = window.pageYOffset + cardTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }, 100);
}

/**
 * Close an open card
 * @param {HTMLElement} card - The card to close
 */
function closeCard(card) {
    const contentElement = card.querySelector('.card-content');
    
    // Get current height before collapsing
    contentElement.style.height = contentElement.scrollHeight + 'px';
    
    // Force browser to recognize the explicit height before animating
    window.getComputedStyle(contentElement).getPropertyValue('height');
    
    // Animate closing
    contentElement.style.height = '0';
    contentElement.style.opacity = '0';
    
    // Remove active class when animation completes
    setTimeout(() => {
        card.classList.remove('active');
        
        // Reset active card reference if this was the active one
        if (activeCard === card) {
            activeCard = null;
        }
    }, SLIDE_ANIMATION_DURATION);
}

/**
 * Handle click on card header to toggle content
 * @param {Event} e - Click event
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
            cardContent.style.transition = `height ${SLIDE_ANIMATION_DURATION/1000}s ease-in-out, opacity ${SLIDE_ANIMATION_DURATION/1000}s ease-in-out`;
        }
    });
}

/**
 * Handle clicks outside cards to close open card
 * @param {Event} e - Click event
 */
function handleOutsideClick(e) {
    if (activeCard && !e.target.closest('.card')) {
        closeCard(activeCard);
    }
}

// Initialize cards when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCards();
    
    // Set up outside click handler
    document.addEventListener('click', handleOutsideClick);
    
    // Handle escape key to close active card
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeCard) {
            closeCard(activeCard);
        }
    });
});