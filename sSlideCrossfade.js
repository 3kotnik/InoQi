/**
 * InoQI Website - Enhanced Card Sliding with Crossfade Transitions
 * This version simultaneously fades out the active card while fading in the new card.
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements: all cards in the list
  const cards = document.querySelectorAll('.card');
  const ANIM_DURATION = 400; // Duration of opacity transition
  let activeCard = null;
  let isAnimating = false;

  /**
   * Animate the opacity of an element from a start value to an end value.
   * Returns a promise that resolves when the animation is complete.
   */
  function animateOpacity(element, startOpacity, endOpacity, duration) {
    return new Promise(resolve => {
      const startTime = performance.now();
      function step(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        // Simple linear interpolation (you could swap in another easing function if desired)
        const currentOpacity = startOpacity + (endOpacity - startOpacity) * progress;
        element.style.opacity = currentOpacity;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  /**
   * Fades out the card's content.
   */
  async function fadeOut(card) {
    const content = card.querySelector('.card-content');
    // Ensure content is visible before starting the fade-out animation.
    content.style.display = 'block';
    content.style.opacity = 1;
    await animateOpacity(content, 1, 0, ANIM_DURATION);
    content.style.display = 'none';
  }

  /**
   * Fades in the card's content.
   */
  async function fadeIn(card) {
    const content = card.querySelector('.card-content');
    // Set initial state for fadeIn
    content.style.display = 'block';
    content.style.opacity = 0;
    await animateOpacity(content, 0, 1, ANIM_DURATION);
  }

  /**
   * Toggle a card's open/closed state with crossfade animation.
   * If another card is active, it fades out while the new card fades in.
   */
  async function toggleCard(card) {
    if (isAnimating) return;
    isAnimating = true;
    try {
      const isActive = card.classList.contains('active');
      if (isActive) {
        // If the card is already open, just fade it out.
        await fadeOut(card);
        card.classList.remove('active');
        activeCard = null;
      } else if (activeCard) {
        // Simultaneously fade out the active card and fade in the new card.
        await Promise.all([fadeOut(activeCard), fadeIn(card)]);
        activeCard.classList.remove('active');
        card.classList.add('active');
        activeCard = card;
      } else {
        // No card is currently open – simply fade in this one.
        await fadeIn(card);
        card.classList.add('active');
        activeCard = card;
      }
    } catch (error) {
      console.error('Animation error:', error);
    } finally {
      isAnimating = false;
    }
  }

  // Set up event listeners for each card header.
  cards.forEach(card => {
    const cardHeader = card.querySelector('.card-header');
    if (cardHeader) {
      cardHeader.addEventListener('click', () => {
        // (Optional: handle loading content from JSON if not already loaded)
        toggleCard(card);
      });
    }
  });
});