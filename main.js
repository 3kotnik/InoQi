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
const SCROLL_DEBOUNCE_DELAY = 10; // 10ms
const RESIZE_DEBOUNCE_DELAY = 250; // 250ms

// Breakpoints
const MOBILE_BREAKPOINT = 768;

// State Variables
let isMenuOpen = false;
let lastScrollPosition = 0;

/**
 * Debounce function to limit the rate at which a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handles header appearance based on scroll position
 */
function handleScroll() {
    const workshopsSection = document.getElementById('workshops');
    const sectionTop = workshopsSection.getBoundingClientRect().top;
    const shouldScrollHeader = sectionTop <= window.innerHeight / 2;

    header.classList.toggle('scrolled', shouldScrollHeader);
    logo.style.transform = shouldScrollHeader ? 'scale(1)' : 'scale(1.5)';
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
            /**
             * Handles header appearance based on scroll position
             */
            function handleScroll() {
                const heroSection = document.getElementById('hero');
                const sectionTop = heroSection.getBoundingClientRect().top;
                const shouldScrollHeader = sectionTop <= window.innerHeight / 2;

                header.classList.toggle('scrolled', shouldScrollHeader);
                logo.style.transform = shouldScrollHeader ? 'scale(1)' : 'scale(1.5)';
            }
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupNotificationAnimations();
    initializeEventListeners();
    handleVideoSources();
    handleScroll();
});