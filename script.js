document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 1. LÓGICA DEL MENÚ MÓVIL (HAMBURGUESA)
    // ==========================================================================
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('open')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            });
        });
    }

    // ==========================================================================
    // 2. EFECTO MUELLE (PEEK ANIMATION) EN EL INDEX
    // ==========================================================================
    const slider = document.getElementById('services-slider');

    if (slider) {
        let hasPeeked = false;

        const smoothScroll = (element, target, duration, callback) => {
            const start = element.scrollLeft;
            const change = target - start;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const ease = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                element.scrollLeft = start + change * ease;

                if (elapsed < duration) {
                    requestAnimationFrame(animate);
                } else if (callback) {
                    callback();
                }
            };
            requestAnimationFrame(animate);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && window.innerWidth <= 1024) {
                    if (!hasPeeked) {
                        hasPeeked = true;
                        
                        setTimeout(() => {
                            // 1. Desactivamos el imán CSS temporalmente
                            slider.classList.add('no-snap');
                            
                            // 2. Asomamos un 40% del ancho de la tarjeta
                            const distance = slider.clientWidth * 0.40;
                            
                            smoothScroll(slider, distance, 600, () => {
                                smoothScroll(slider, 0, 500, () => {
                                    // 3. Reactivamos el imán para que el usuario deslice
                                    slider.classList.remove('no-snap');
                                });
                            });
                        }, 1000); 
                    }
                } else if (!entry.isIntersecting) {
                    hasPeeked = false; 
                }
            });
        }, { threshold: 0.5 }); 

        observer.observe(slider);
    }
});