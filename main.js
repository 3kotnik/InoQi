// DOM Elements
const header = document.getElementById('header');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const logo = document.querySelector('.logo img');

// Utility Functions
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

// Handle Header Scroll Effect
function handleScroll() {
    const workshopsSection = document.getElementById('workshops');
    const sectionTop = workshopsSection.getBoundingClientRect().top;

    if (sectionTop <= window.innerHeight / 2) {
        header.classList.add('scrolled');
        logo.style.transform = 'scale(1)';
    } else {
        header.classList.remove('scrolled');
        logo.style.transform = 'scale(1.5)';
    }
}

// Mobile Menu Toggle
function toggleMenu() {
    navLinks.classList.toggle('active');
}

// Handle Video Sources
function handleVideoSources() {
    const video = document.getElementById('hero-video');
    if (!video) return;

    const sources = video.getElementsByTagName('source');
    for (const source of sources) {
        if (window.innerWidth <= 768) {
            if (source.media === '(max-width: 767px)') {
                video.src = source.src;
            }
        } else {
            if (source.media === '(min-width: 768px)') {
                video.src = source.src;
            }
        }
    }
    video.load();
}

// Smooth Scroll
function smoothScroll(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth'
        });

        // Close mobile menu after click
        navLinks.classList.remove('active');
    }
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Scroll event
    window.addEventListener('scroll', debounce(handleScroll, 10));

    // Menu toggle
    hamburger.addEventListener('click', toggleMenu);

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', smoothScroll);
    });

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        handleVideoSources();
    }, 250));

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-links') &&
            !e.target.closest('.hamburger') &&
            navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });

    // Form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}

// Form submission handler
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Pošiljam...';

    // Simulate form submission (replace with actual form handling)
    setTimeout(() => {
        // Reset form and button
        form.reset();
        submitButton.disabled = false;
        submitButton.textContent = originalText;

        // Show success message
        showNotification('Sporoèilo uspešno poslano!');
    }, 1000);
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add notification styles if not already in CSS
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 2rem';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideIn 0.3s ease';

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    handleVideoSources();
    handleScroll(); // Check initial scroll position
});

// Add necessary animations to your CSS
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