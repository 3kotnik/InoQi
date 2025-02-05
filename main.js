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

// Breakpoints
const MOBILE_BREAKPOINT = 768;

// State Variables
let isMenuOpen = false;

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

    // Basic validation
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    if (name === '' || email === '') {
        showNotification('Vsa polja morajo biti zapolnjena!', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Pošlji prijavo...';

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
 * Fetches and inserts content into modals
 * @param {string} modalSelector - The selector for the modal
 */
function fetchModalContent(modalSelector) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;

    // Fetch and insert content
    const contentUrl = modal.getAttribute('data-content-url');
    if (contentUrl) {
        fetch(contentUrl)
            .then(response => response.text())
            .then(data => {
                modal.querySelector('.modal-text').textContent = data;
            })
            .catch(error => console.error('Error loading content:', error));
    }
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Scroll handling
    window.addEventListener('scroll', debounce(handleScroll, SCROLL_DEBOUNCE_DELAY));

    // Menu handling
    hamburger.addEventListener('click', toggleMenu);

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', smoothScroll));

    // Window resize
    window.addEventListener('resize', debounce(handleVideoSources, RESIZE_DEBOUNCE_DELAY));

    // Outside click handling
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            toggleMenu();
        }
    });

    // Form submissions
    forms.forEach(form => form.addEventListener('submit', handleFormSubmit));
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

/**
 * Toggle between light and dark mode
 */
function toggleMode() {
    const body = document.body;
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupNotificationAnimations();
    initializeEventListeners();
    handleVideoSources();
    handleScroll();

    // Update text color for header content and qualities
    const heroContent = document.querySelector('.hero-content h1, .hero-content h2');
    const qualities = document.querySelectorAll('.qualities p');

    updateTextColor(heroContent);
    qualities.forEach(quality => updateTextColor(quality));

    // Update text color for sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionContent = section.querySelector('h1, h2, p, a');
        if (sectionContent) updateTextColor(sectionContent);
    });
});
