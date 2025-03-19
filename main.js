/**
 * InoQI Website - Main JavaScript File
 * Handles general site functionality (navigation, scroll effects, form handling)
 */

// DOM Elements - Header & Navigation
const header = document.getElementById('header');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.getElementById('nav-menu');
const mainLogo = document.getElementById('main-logo');
const navLinks = document.querySelectorAll('.nav-links a');

// DOM Elements - Video
const heroVideo = document.getElementById('hero-video');

// DOM Elements - Forms
const forms = document.querySelectorAll('form');

// Animation Variables
const NOTIFICATION_DURATION = 3000; // 3 seconds
const NOTIFICATION_ANIMATION_DURATION = 300; // 0.3 seconds
const SCROLL_DEBOUNCE_DELAY = 100; // 100ms for better performance
const RESIZE_DEBOUNCE_DELAY = 250; // 250ms

// Breakpoints
const MOBILE_BREAKPOINT = 768;

// State Variables
let isMenuOpen = false;
let hasScrolled = false;

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
 * Handles header appearance and logo size based on scroll position
 */
function handleScroll() {
    const introSection = document.getElementById('intro');
    if (!introSection) return;

    const scrollPosition = window.scrollY;
    const introTop = introSection.getBoundingClientRect().top;
    const heroHeight = document.querySelector('.hero').offsetHeight;
    
    // Check if we've scrolled down enough to change header
    if (scrollPosition > 50) {
        header.classList.add('scrolled');
        if (!hasScrolled) {
            hasScrolled = true;
        }
    } else {
        header.classList.remove('scrolled');
        hasScrolled = false;
    }
    
    // Animate logo size based on scroll position
    if (mainLogo) {
        const scrollRatio = Math.min(1, Math.max(0, introTop / (window.innerHeight / 3)));
        const scaleValue = 1 + (scrollRatio * 0.4); // Scale from 1.0 to 1.4
        mainLogo.style.transform = `scale(${scaleValue})`;
    }
}

/**
 * Toggles mobile menu visibility
 */
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    hamburger.classList.toggle('active', isMenuOpen);
    navMenu.classList.toggle('active', isMenuOpen);
    
    // Update accessibility attributes
    hamburger.setAttribute('aria-expanded', isMenuOpen);
    navMenu.setAttribute('aria-hidden', !isMenuOpen);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
}

/**
 * Updates video source based on screen width
 */
function handleVideoSources() {
    if (!heroVideo) return;

    const sources = heroVideo.getElementsByTagName('source');
    const width = window.innerWidth;
    let selectedSource = null;

    // Find the appropriate source based on media queries
    for (const source of sources) {
        const media = source.getAttribute('media');
        
        if (media) {
            if ((media.includes('min-width: 992px') && width >= 992) ||
                (media.includes('min-width: 768px') && media.includes('max-width: 991px') && width >= 768 && width <= 991) ||
                (media.includes('max-width: 767px') && width <= 767)) {
                selectedSource = source.src;
                break;
            }
        }
    }

    // Only reload if we're changing sources
    if (selectedSource && heroVideo.src !== selectedSource) {
        heroVideo.src = selectedSource;
        heroVideo.load();
    }
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
        // Calculate header offset for accurate scrolling
        const headerOffset = header.offsetHeight;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        // Close menu if open
        if (isMenuOpen) {
            toggleMenu();
        }
    }
}

/**
 * Handles form submissions with validation
 * @param {Event} e - Submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    let isValid = true;

    // Basic validation for required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });

    if (!isValid) {
        showNotification('Prosimo, izpolnite vsa obvezna polja.', 'error');
        return;
    }

    // Email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && !isValidEmail(emailField.value)) {
        emailField.classList.add('error');
        showNotification('Vnesite veljaven e-poštni naslov.', 'error');
        return;
    }

    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Pošiljam...';

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        form.reset();
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        showNotification('Sporočilo uspešno poslano!', 'success');
    }, 1500);
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Shows notification messages
 * @param {string} message - Message to display
 * @param {string} type - Notification type ('success' or 'error')
 */
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Automatically remove after duration
    setTimeout(() => {
        notification.style.animation = `slide-out ${NOTIFICATION_ANIMATION_DURATION / 1000}s forwards`;
        setTimeout(() => {
            notification.remove();
        }, NOTIFICATION_ANIMATION_DURATION);
    }, NOTIFICATION_DURATION);
}

/**
 * Handles click outside the navigation menu to close it
 * @param {Event} e - Click event
 */
function handleOutsideClick(e) {
    if (isMenuOpen && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        toggleMenu();
    }
}

/**
 * Handles escape key to close navigation menu
 * @param {Event} e - Keydown event
 */
function handleEscKey(e) {
    if (e.key === 'Escape' && isMenuOpen) {
        toggleMenu();
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
    
    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', smoothScroll);
    });
    
    // Window resize handler
    window.addEventListener('resize', debounce(() => {
        handleVideoSources();
    }, RESIZE_DEBOUNCE_DELAY));
    
    // Form submissions
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Close menu when clicking outside or pressing escape
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscKey);
}

/**
 * Initialize page on load
 */
function initializePage() {
    // Set initial header state
    handleScroll();
    
    // Set appropriate video source
    handleVideoSources();
    
    // Setup all event listeners
    initializeEventListeners();
}

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializePage);