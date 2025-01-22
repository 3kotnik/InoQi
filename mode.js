
// Ensure text color remains dark in both bright and dark modes
function applyModeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        body {
            color: var(--text-color); /* Ensure text color is always dark */
        }

        @media (prefers-color-scheme: dark) {
            body {
                color: var(--text-color); /* Ensure text color is always dark */
            }

            /* Hero and Intro sections should always have white text */
            .hero-content,
            .intro {
                color: var(--white);
            }
        }
    `;
    document.head.appendChild(style);
}

// Apply mode styles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    applyModeStyles();
});

