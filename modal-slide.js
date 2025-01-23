// Animation Variables
const MODAL_TRANSITION_DURATION = 0.4; // 0.4 seconds

// State Variables
let currentlyOpenEvent = null;

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

    // Fetch and insert content
    fetchModalContent(modalSelector);

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

// Initialize modals and slide-downs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals and slide-downs
});
