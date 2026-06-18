document.addEventListener('DOMContentLoaded', () => {
    // 1. LÓGICA DEL MENÚ MÓVIL
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            // Abrimos/Cerramos el menú
            mainNav.classList.toggle('open');
            
            // Cambiamos el icono (de barras a cruz)
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('open')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        // Opcional: Cerrar menú al hacer clic en un enlace (muy útil en móvil)
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('open');
                menuToggle.querySelector('i').className = 'fas fa-bars';
            });
        });
    }

    // 2. LÓGICA DE LA ANIMACIÓN PEEK (MOVIMIENTO SUAVE)
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
                            slider.classList.add('no-snap');
                            const distance = slider.clientWidth * 0.3;
                            smoothScroll(slider, distance, 550, () => {
                                smoothScroll(slider, 0, 550, () => {
                                    slider.classList.remove('no-snap');
                                });
                            });
                        }, 800);
                    }
                } else {
                    hasPeeked = false;
                }
            });
        }, { threshold: 0.6 });

        observer.observe(slider);
    }
});