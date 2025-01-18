document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM loaded");

     // Smooth scrolling for navigation
   document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    function createColoredText(heading) {
        const text = heading.textContent;
        heading.innerHTML = ''; // clear the original text

        // Create spans for the initial text and the colored text
        const originalText = document.createElement('span');
        originalText.textContent = text;

        const coloredText = document.createElement('span');
        coloredText.classList.add('text-color');
        coloredText.textContent = text;

        heading.appendChild(originalText);
        heading.appendChild(coloredText);
   }

     // Function to handle section reveal on scroll
    function handleSectionReveal() {
       const hero = document.querySelector('.hero');
        const sections = document.querySelectorAll('section');
        const windowHeight = window.innerHeight;

        // Check and add active class to the hero
         const heroTop = hero.getBoundingClientRect().top;
         if (heroTop < windowHeight * 0.8) {
              hero.classList.add('active');
          } else {
              hero.classList.remove('active');
          }


        sections.forEach((section, index) => {
          const sectionTop = section.getBoundingClientRect().top;

           // 0.2 to make the section appear slightly before being fully visible
             if (sectionTop < windowHeight * 0.8) {
              section.classList.add('active');
            } else {
              section.classList.remove('active');
             }
           // Adding classes for even and odd sections
            if (index % 2 === 0) {
               section.classList.add('even');
               section.classList.remove('odd');
            } else {
              section.classList.add('odd');
              section.classList.remove('even');
            }

          const heading = section.querySelector('h2');
          if (heading) {
              createColoredText(heading);
          }

            const background = section.querySelector('.section-background');
            if (background) {
                background.classList.add('parallax-slow')
                if (index % 2 === 0) {
                    background.classList.add('parallax-fast')
                }

            }

        });
    }

     // Run the function on page load and scroll
    handleSectionReveal();
    window.addEventListener('scroll', handleSectionReveal);
});