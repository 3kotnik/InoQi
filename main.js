// DOM Elements - Header & Navigation
const header = document.getElementById('header');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const logo = document.querySelector('.logo img');

// DOM Elements - Video
const heroVideo = document.getElementById('hero-video');

// DOM Elements - Forms
const forms = document.querySelectorAll('form');

// Animation Variables
const NOTIFICATION_DURATION = 3000; // 3 seconds
const NOTIFICATION_ANIMATION_DURATION = 300; // 0.3 seconds
const SCROLL_DEBOUNCE_DELAY = 100; // Increased to 100ms for better performance
const RESIZE_DEBOUNCE_DELAY = 250; // 250ms
const MODAL_TRANSITION_DURATION = 0.4; // 0.4 seconds

// Breakpoints
const MOBILE_BREAKPOINT = 768;

// State Variables
let isMenuOpen = false;
let currentlyOpenEvent = null;

/**
 * Debounce function to limit the rate at which a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Handles header appearance based on scroll position
 */
function handleScroll() {
    const introSection = document.getElementById('intro');
    const introTop = introSection.getBoundingClientRect().top;
    const heroHeight = document.getElementById('hero').offsetHeight;
    const triggerPoint = heroHeight / 2;

    if (introTop <= window.innerHeight - triggerPoint) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

/**
 * Toggles mobile menu visibility
 */
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    navLinks.classList.toggle('active', isMenuOpen);
}

/**
 * Updates video source based on screen width
 */
function handleVideoSources() {
    if (!heroVideo) return;

    const sources = heroVideo.getElementsByTagName('source');
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    for (const source of sources) {
        const mediaQuery = isMobile ? '(max-width: 767px)' : '(min-width: 768px)';
        if (source.media === mediaQuery) {
            heroVideo.src = source.src;
        }
    }
    heroVideo.load();
}

/**
 * Implements smooth scrolling to target sections
 * @param {Event} e - Click event
 */
function smoothScroll(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        if (isMenuOpen) {
            toggleMenu();
        }
    }
}

/**
 * Handles form submissions
 * @param {Event} e - Submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = 'Pošiljam...';

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        form.reset();
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        showNotification('Sporoèilo uspešno poslano!');
    }, 1000);
}

/**
 * Shows notification messages
 * @param {string} message - Message to display
 * @param {string} type - Notification type ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '1rem 2rem',
        backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
        color: 'white',
        borderRadius: '5px',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), NOTIFICATION_ANIMATION_DURATION);
    }, NOTIFICATION_DURATION);
}

/**
 * Initializes all event listeners
 */
function initializeEventListeners() {
    // Scroll handling
    window.addEventListener('scroll', debounce(handleScroll, SCROLL_DEBOUNCE_DELAY));

    // Menu handling
    hamburger.addEventListener('click', toggleMenu);

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', smoothScroll);
    });

    // Window resize
    window.addEventListener('resize', debounce(handleVideoSources, RESIZE_DEBOUNCE_DELAY));

    // Outside click handling
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            toggleMenu();
        }
    });

    // Form submissions
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}

/**
 * Sets up notification animations
 */
function setupNotificationAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ================ MODALS FOR WORKSHOPS ================
// 1. Query all elements that can open a modal
const modalTriggers = document.querySelectorAll('[data-modal-target]');
// 2. Query all close buttons inside a modal
const modalCloseButtons = document.querySelectorAll('[data-modal-close]');

/**
 * Open modal by adding 'show' to .modal and toggling display
 */
function openModal(modalSelector) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;

    modal.style.display = 'flex';    // Make the modal visible
    // Force reflow before adding 'show' for transition
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

/**
 * Close modal by removing 'show' and setting display to 'none' after transition
 */
function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove('show');
    modal.addEventListener('transitionend', () => {
        modal.style.display = 'none';
    }, { once: true });
}

// Listen for clicks to open modals
modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const targetModal = trigger.getAttribute('data-modal-target');
        openModal(targetModal);
    });
});

// Listen for clicks to close modals
modalCloseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        closeModal(modal);
    });
});

// Close modal on background click
document.addEventListener('click', (e) => {
    const isOutside = e.target.classList.contains('modal');
    if (isOutside) {
        closeModal(e.target);
    }
});

// ================ SLIDE-DOWN FOR EVENTS ================
const eventItems = document.querySelectorAll('[data-event-panel]');

/**
 * Toggle an event's slide-down content
 */
function toggleEventDetails(item) {
    const details = item.querySelector('.event-details');

    // Close previously open event if different from the clicked one
    if (currentlyOpenEvent && currentlyOpenEvent !== item) {
        closeEventDetails(currentlyOpenEvent);
    }

    // If the clicked one is already open, close it
    if (currentlyOpenEvent === item) {
        closeEventDetails(item);
        currentlyOpenEvent = null;
        return;
    }

    // Otherwise, open this one
    details.style.display = 'block';
    const contentHeight = details.scrollHeight;
    details.style.maxHeight = '0';
    details.style.opacity = '0';

    requestAnimationFrame(() => {
        details.style.transition = `max-height ${MODAL_TRANSITION_DURATION}s ease, opacity ${MODAL_TRANSITION_DURATION}s ease`;
        details.style.maxHeight = contentHeight + 'px';
        details.style.opacity = '1';
    });

    currentlyOpenEvent = item;

    // Smoothly scroll so the opened event is centered in view
    requestAnimationFrame(() => {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

/**
 * Close an event's details
 */
function closeEventDetails(item) {
    const details = item.querySelector('.event-details');
    if (!details) return;

    details.style.maxHeight = details.scrollHeight + 'px';
    requestAnimationFrame(() => {
        details.style.maxHeight = '0';
        details.style.opacity = '0';
    });

    // Hide at end of transition
    details.addEventListener('transitionend', () => {
        details.style.display = 'none';
    }, { once: true });
}

// Attach click listeners to each event item
eventItems.forEach(item => {
    item.addEventListener('click', () => toggleEventDetails(item));
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupNotificationAnimations();
    initializeEventListeners();
    handleVideoSources();
    handleScroll();
});