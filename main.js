/**
 * InoQI Website - Main JavaScript File
 * Handles general site functionality
 */

// DOM Elements
const header = document.getElementById('header');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.getElementById('nav-menu');
const mainLogo = document.getElementById('main-logo');
const navLinks = document.querySelectorAll('.nav-links a');
const heroVideo = document.getElementById('hero-video');
const forms = document.querySelectorAll('form');

// Constants
const NOTIFICATION_DURATION = 3000;
const NOTIFICATION_ANIMATION_DURATION = 300;
const RESIZE_DEBOUNCE_DELAY = 250;
const MOBILE_BREAKPOINT = 768;

// State Variables
let isMenuOpen = false;
let hasScrolled = false;
let lastScrollPosition = 0;
let ticking = false;
let currentSection = null;

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Get current section based on scroll position
 */
function getCurrentSection() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    return current;
}

/**
 * Update active navigation link
 */
function updateActiveNavLink() {
    const currentSectionId = getCurrentSection();
    
    if (currentSectionId !== currentSection) {
        currentSection = currentSectionId;
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }
}

/**
 * Smooth, performant scroll handling
 */
function handleScroll() {
    lastScrollPosition = window.scrollY;
    
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateScrollEffects(lastScrollPosition);
            ticking = false;
        });
        
        ticking = true;
    }
}

/**
 * Update scroll-based visual effects
 */
function updateScrollEffects(scrollPosition) {
    const introSection = document.getElementById('intro');
    if (!introSection) return;
    
    // Header appearance
    if (scrollPosition > 50) {
        header.classList.add('scrolled');
        hasScrolled = true;
    } else {
        header.classList.remove('scrolled');
        hasScrolled = false;
    }
    
    // Real-time logo scaling
    if (mainLogo) {
        const introTop = introSection.getBoundingClientRect().top;
        const scrollRatio = Math.min(1, Math.max(0, introTop / (window.innerHeight / 3)));
        const scaleValue = 1 + (scrollRatio * 0.4);
        mainLogo.style.transform = `scale(${scaleValue})`;
    }
    
    // Update active navigation link
    updateActiveNavLink();
}

/**
 * Toggle mobile menu
 */
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    hamburger.classList.toggle('active', isMenuOpen);
    navMenu.classList.toggle('active', isMenuOpen);
    hamburger.setAttribute('aria-expanded', isMenuOpen);
    navMenu.setAttribute('aria-hidden', !isMenuOpen);
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
}

/**
 * Load appropriate video source
 */
function handleVideoSources() {
    if (!heroVideo) return;
    
    const width = window.innerWidth;
    
    // Only load video when visible
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadAppropriateVideo(width);
                    observer.disconnect();
                }
            });
        });
        observer.observe(heroVideo);
    } else {
        // Fallback for browsers without IntersectionObserver
        loadAppropriateVideo(width);
    }
}

/**
 * Load the appropriate video source based on screen width
 */
function loadAppropriateVideo(width) {
    if (!heroVideo) return;
    
    const sources = heroVideo.getElementsByTagName('source');
    let selectedSource = null;
    
    // Find appropriate source
    for (const source of sources) {
        const media = source.getAttribute('media');
        if (!media) continue;
        
        if ((media.includes('min-width: 992px') && width >= 992) ||
            (media.includes('min-width: 768px') && media.includes('max-width: 991px') && width >= 768 && width <= 991) ||
            (media.includes('max-width: 767px') && width <= 767)) {
            selectedSource = source.src;
            break;
        }
    }
    
    // Only reload if source changed
    if (selectedSource && heroVideo.src !== selectedSource) {
        heroVideo.src = selectedSource;
        heroVideo.load();
        heroVideo.play().catch(() => {
            console.log('Auto-play prevented. User interaction required.');
        });
    }
}

/**
 * Smooth scroll to target section
 */
function smoothScroll(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
        const headerOffset = header.offsetHeight;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        if (isMenuOpen) {
            toggleMenu();
        }
    }
}

/**
 * Form validation and submission
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    let isValid = true;
    
    // Validate required fields
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
    
    // Submit form
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
 * Email validation
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after timeout
    setTimeout(() => {
        notification.style.animation = `slide-out ${NOTIFICATION_ANIMATION_DURATION / 1000}s forwards`;
        setTimeout(() => notification.remove(), NOTIFICATION_ANIMATION_DURATION);
    }, NOTIFICATION_DURATION);
}

/**
 * Handle clicks outside the menu
 */
function handleOutsideClick(e) {
    if (isMenuOpen && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        toggleMenu();
    }
}

/**
 * Handle escape key press
 */
function handleEscKey(e) {
    if (e.key === 'Escape' && isMenuOpen) {
        toggleMenu();
    }
}

/**
 * Initialize page
 */
function initializePage() {
    // Set initial states
    updateScrollEffects(window.scrollY);
    handleVideoSources();
    
    // Event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', debounce(handleVideoSources, RESIZE_DEBOUNCE_DELAY));
    hamburger.addEventListener('click', toggleMenu);
    
    navLinks.forEach(link => {
        link.addEventListener('click', smoothScroll);
    });
    
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscKey);
    
    // Set logo initial size
    if (mainLogo && window.innerWidth > MOBILE_BREAKPOINT) {
        mainLogo.style.transform = 'scale(1.4)';
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initializePage);