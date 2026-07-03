document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. LÓGICA DEL MENÚ MÓVIL (HAMBURGUESA) - MANTENIDO INTACTO
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
    // 2. EFECTO MUELLE (PEEK ANIMATION) EN LOS SERVICIOS - MANTENIDO INTACTO
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
                            slider.classList.add('no-snap');
                            const distance = slider.clientWidth * 0.40;
                            
                            smoothScroll(slider, distance, 600, () => {
                                smoothScroll(slider, 0, 500, () => {
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

    // ==========================================================================
    // 3. CONEXIÓN Y PROCESAMIENTO DE TU ENLACE DE GOOGLE SHEETS
    // ==========================================================================
    
    // PASA AQUÍ TU ENLACE DE GOOGLE SHEETS EXPORTADO COMO .CSV:
    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTzpckW2B0wqDKdcIJJy57dsPRS9oEbLSlHfD7SFh0w-3EnUhYrZ8eRZdRW3KUAkHzlpha0s1PeTZcc/pub?output=csv';

    fetch(GOOGLE_SHEET_CSV_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo conectar con la base de datos de Google Sheets");
            }
            return response.text(); // Recibimos la respuesta como texto bruto CSV
        })
        .then(csvText => {
            // Conversión y Limpieza del CSV a formato legible JSON
            const data = parseCSVToJSON(csvText);

            // Inyección preventiva de categorías por defecto si están vacías
            data.forEach(article => {
                if (!article.categoria || article.categoria.trim() === '') {
                    article.categoria = 'consejos';
                } else {
                    article.categoria = article.categoria.trim().toLowerCase();
                }
            });

            // ----------------------------------------------------------------------
            // A. RENDERIZADO EN LA PORTADA (INDEX.HTML) - CON AUTO-PLAY Y SEPARACIÓN NATIVA
            // ----------------------------------------------------------------------
            const newsSlider = document.getElementById('news-slider');
            if (newsSlider && data.length > 0) {
                newsSlider.innerHTML = ''; 
                
                const style = document.createElement('style');
                style.innerHTML = `
                    #news-slider {
                        overflow-x: auto !important;
                        scroll-snap-type: none !important;
                        -webkit-overflow-scrolling: touch !important;
                        -ms-overflow-style: none !important;
                        scrollbar-width: none !important;
                    }
                    #news-slider::-webkit-scrollbar {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);

                newsSlider.style.setProperty('display', 'flex', 'important');
                newsSlider.style.setProperty('flex-wrap', 'nowrap', 'important');
                newsSlider.style.gap = '25px';
                newsSlider.style.cursor = 'grab';
                newsSlider.style.userSelect = 'none';
                newsSlider.style.boxSizing = 'border-box';
                
                data.forEach(article => {
                    const isExternal = article.url_externa && article.url_externa.trim() !== '';
                    const linkHref = isExternal ? article.url_externa.trim() : 'noticias.html';
                    const linkTarget = isExternal ? 'target="_blank"' : '';
                    const linkText = isExternal ? 'Ver artículo completo &rarr;' : 'Leer más &rarr;';

                    newsSlider.innerHTML += `
                        <div class="service-card" style="background: #ffffff; padding: 25px; border-radius: 15px; box-shadow: 0 8px 20px rgba(33, 58, 75, 0.05); color: #3a3a3a; text-align: left; align-items: flex-start; border: 1px solid rgba(86, 142, 158, 0.15); display: flex; flex-direction: column; transition: transform 0.2s; box-sizing: border-box; margin: 0; min-width: 0; scroll-snap-align: none !important;">
                            <img src="${article.imagen}" alt="${article.titulo}" class="service-img" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" draggable="false">
                            <span style="font-size: 0.8rem; color: #568e9e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${article.fecha}</span>
                            <h3 style="color: #213a4b; font-size: 1.15rem; min-height: auto; margin: 8px 0 12px 0; text-align: left; justify-content: flex-start; display: block; font-weight: 700; line-height: 1.4;">${article.titulo}</h3>
                            <p style="font-size: 0.88rem; color: #555555; text-align: left; margin-bottom: 15px; line-height: 1.6; font-weight: 500;">${article.resumen}</p>
                            <a href="${linkHref}" ${linkTarget} style="color: #568e9e; font-weight: 700; text-decoration: none; font-size: 0.9rem; margin-top: auto; transition: color 0.2s;" draggable="false">${linkText}</a>
                        </div>
                    `;
                });

                const wrapper = newsSlider.parentElement;
                const controls = document.createElement('div');
                controls.className = 'news-carousel-controls';
                controls.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 24px; margin-top: 35px;';
                controls.innerHTML = `
                    <button class="news-arrow-prev" style="background: #ffffff; border: 1px solid #568e9e; color: #568e9e; width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(33, 58, 75, 0.06);"><i class="fas fa-chevron-left"></i></button>
                    <div class="news-carousel-dots" style="display: flex; gap: 10px; align-items: center;"></div>
                    <button class="news-arrow-next" style="background: #ffffff; border: 1px solid #568e9e; color: #568e9e; width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(33, 58, 75, 0.06);"><i class="fas fa-chevron-right"></i></button>
                `;
                wrapper.appendChild(controls);

                const btnPrev = controls.querySelector('.news-arrow-prev');
                const btnNext = controls.querySelector('.news-arrow-next');
                const dotsContainer = controls.querySelector('.news-carousel-dots');

                [btnPrev, btnNext].forEach(btn => {
                    btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = '#568e9e'; btn.style.color = '#ffffff'; });
                    btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = '#ffffff'; btn.style.color = '#568e9e'; });
                });

                let currentIndex = 0;
                let itemsPerView = 3;
                const gap = 25;
                let autoPlayInterval = null;
                let newsAnimationId = null;
                let scrollTimeout = null;

                let isNewsVisibleInViewport = false;
                const newsVisibilityObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => { isNewsVisibleInViewport = entry.isIntersecting; });
                }, { threshold: 0.15 });
                newsVisibilityObserver.observe(wrapper);

                function smoothScrollNewsTo(target) {
                    if (newsAnimationId) cancelAnimationFrame(newsAnimationId);
                    const start = newsSlider.scrollLeft;
                    const change = target - start;
                    const startTime = performance.now();
                    const duration = 500;

                    const animate = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 3);
                        newsSlider.scrollLeft = start + change * ease;
                        if (elapsed < duration) {
                            newsAnimationId = requestAnimationFrame(animate);
                        } else {
                            newsSlider.scrollLeft = target;
                            newsAnimationId = null;
                        }
                    };
                    newsAnimationId = requestAnimationFrame(animate);
                }

                function startAutoPlay() {
                    stopAutoPlay();
                    autoPlayInterval = setInterval(() => {
                        if (window.innerWidth <= 1024 && isNewsVisibleInViewport) return;
                        const maxIndex = data.length - itemsPerView;
                        if (currentIndex < maxIndex) { currentIndex++; } else { currentIndex = 0; }
                        performCarouselScroll();
                    }, 5000);
                }

                function stopAutoPlay() { if (autoPlayInterval) clearInterval(autoPlayInterval); }

                wrapper.addEventListener('mouseenter', stopAutoPlay);
                wrapper.addEventListener('mouseleave', startAutoPlay);

                function updateCarouselLayout() {
                    const width = window.innerWidth;
                    if (width > 1024) itemsPerView = 3; 
                    else if (width >= 650) itemsPerView = 2; 
                    else itemsPerView = 1; 

                    const cards = newsSlider.querySelectorAll('.service-card');
                    const containerWidth = newsSlider.getBoundingClientRect().width;
                    const cardWidth = (containerWidth - (gap * (itemsPerView - 1))) / itemsPerView;

                    cards.forEach(card => { card.style.flex = `0 0 ${cardWidth}px`; });

                    dotsContainer.innerHTML = '';
                    const maxIndex = data.length - itemsPerView;
                    const totalDots = maxIndex >= 0 ? maxIndex + 1 : 1;

                    for (let i = 0; i < totalDots; i++) {
                        const dot = document.createElement('span');
                        dot.style.cssText = 'width: 10px; height: 10px; border-radius: 50%; background-color: rgba(86, 142, 158, 0.25); cursor: pointer; transition: all 0.3s ease;';
                        if (i === currentIndex) {
                            dot.style.backgroundColor = '#568e9e';
                            dot.style.transform = 'scale(1.25)';
                        }
                        dot.addEventListener('click', () => { currentIndex = i; performCarouselScroll(); });
                        dotsContainer.appendChild(dot);
                    }

                    if (currentIndex > maxIndex) currentIndex = Math.max(0, maxIndex);
                    performCarouselScroll();
                }

                function performCarouselScroll() {
                    const cards = newsSlider.querySelectorAll('.service-card');
                    if (cards.length === 0) return;
                    const cardWidth = cards[0].getBoundingClientRect().width;
                    const targetScrollLeft = currentIndex * (cardWidth + gap);
                    
                    smoothScrollNewsTo(targetScrollLeft);

                    const dots = dotsContainer.querySelectorAll('span');
                    dots.forEach((dot, idx) => {
                        if (idx === currentIndex) {
                            dot.style.backgroundColor = '#568e9e';
                            dot.style.transform = 'scale(1.25)';
                        } else {
                            dot.style.backgroundColor = 'rgba(86, 142, 158, 0.25)';
                            dot.style.transform = 'scale(1)';
                        }
                    });
                }

                btnPrev.addEventListener('click', () => {
                    if (currentIndex > 0) { currentIndex--; } else { currentIndex = data.length - itemsPerView; }
                    performCarouselScroll();
                });

                btnNext.addEventListener('click', () => {
                    const maxIndex = data.length - itemsPerView;
                    if (currentIndex < maxIndex) { currentIndex++; } else { currentIndex = 0; }
                    performCarouselScroll();
                });

                let isDragging = false;
                let startX;
                let initialScrollLeft;

                newsSlider.addEventListener('scroll', () => {
                    if (isDragging || newsAnimationId) return;
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => { snapToClosestCard(); }, 180);
                });

                newsSlider.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    stopAutoPlay();
                    if (newsAnimationId) cancelAnimationFrame(newsAnimationId);
                    newsSlider.style.cursor = 'grabbing';
                    startX = e.pageX;
                    initialScrollLeft = newsSlider.scrollLeft;
                });

                const stopDrag = () => {
                    if (!isDragging) return;
                    isDragging = false;
                    newsSlider.style.cursor = 'grab';
                    snapToClosestCard();
                    startAutoPlay();
                };

                newsSlider.addEventListener('mouseleave', stopDrag);
                newsSlider.addEventListener('mouseup', stopDrag);

                newsSlider.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    e.preventDefault();
                    const distanceMoved = (e.pageX - startX) * 1.5;
                    newsSlider.scrollLeft = initialScrollLeft - distanceMoved;
                });

                newsSlider.addEventListener('touchstart', () => {
                    stopAutoPlay();
                    if (newsAnimationId) cancelAnimationFrame(newsAnimationId);
                }, { passive: true });

                newsSlider.addEventListener('touchend', () => { startAutoPlay(); });

                function snapToClosestCard() {
                    const cards = newsSlider.querySelectorAll('.service-card');
                    if (cards.length === 0) return;
                    const cardWidth = cards[0].getBoundingClientRect().width;
                    const stepSize = cardWidth + gap;
                    currentIndex = Math.round(newsSlider.scrollLeft / stepSize);
                    const maxIndex = data.length - itemsPerView;
                    if (currentIndex > maxIndex) currentIndex = maxIndex;
                    if (currentIndex < 0) currentIndex = 0;
                    performCarouselScroll();
                }

                window.addEventListener('resize', updateCarouselLayout);
                setTimeout(() => { updateCarouselLayout(); startAutoPlay(); }, 150);
            }

            // ----------------------------------------------------------------------
            // B. RENDERIZADO EN BLOG (NOTICIAS.HTML) - GESTIÓN DE NOTICIA LOCAL VS REDIRECCIÓN EXTERNA
            // ----------------------------------------------------------------------
            const blogGrid = document.getElementById('blog-articles-grid');
            
            function renderEditorialBlog(articlesToShow) {
                if (!blogGrid) return;
                
                if (articlesToShow.length === 0) {
                    blogGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #213a4b; font-family: 'Montserrat', sans-serif;">
                            <i class="fas fa-folder-open" style="font-size: 2.5rem; color: #568e9e; margin-bottom: 15px; opacity: 0.7;"></i>
                            <p style="font-weight: 600; font-size: 1.1rem;">Próximamente publicaremos artículos en esta sección.</p>
                        </div>
                    `;
                    return;
                }
                
                blogGrid.innerHTML = ''; 
                
                articlesToShow.forEach(article => {
                    const isExternal = article.url_externa && article.url_externa.trim() !== '';
                    
                    // Si es externa, inyectamos un botón tipo <a> que redirige fuera, si no, se queda el botón plegable habitual
                    const actionButtonHTML = isExternal 
                        ? `<a href="${article.url_externa.trim()}" target="_blank" class="read-more-btn" style="margin-top: auto; background: none; border: 1px solid #568e9e; color: #568e9e; padding: 10px 22px; border-radius: 25px; font-weight: 600; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; align-self: flex-start; text-decoration: none; text-align: center;">Ver artículo completo <i class="fas fa-external-link-alt" style="font-size: 0.75rem; margin-left: 4px;"></i></a>`
                        : `<button class="read-more-btn" style="margin-top: auto; background: none; border: 1px solid #568e9e; color: #568e9e; padding: 10px 22px; border-radius: 25px; font-weight: 600; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; align-self: flex-start;">Leer noticia completa</button>`;

                    blogGrid.innerHTML += `
                        <article 
                            onmouseenter="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 30px 60px rgba(33, 58, 75, 0.12)';" 
                            onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 20px 40px rgba(33, 58, 75, 0.08), 0 2px 8px rgba(33, 58, 75, 0.04)';" 
                            style="background-color: #ffffff; padding: 30px; border-radius: 18px; box-shadow: 0 20px 40px rgba(33, 58, 75, 0.08), 0 2px 8px rgba(33, 58, 75, 0.04); display: flex; flex-direction: column; border: none; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                            
                            <img src="${article.imagen}" alt="${article.titulo}" style="width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 6px 15px rgba(0,0,0,0.03);">
                            <span style="font-size: 0.8rem; color: #568e9e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${article.fecha}</span>
                            <h2 style="font-family: 'Montserrat', sans-serif; font-size: 1.35rem; color: #213a4b; font-weight: 700; margin-bottom: 15px; line-height: 1.4; text-align: left;">${article.titulo}</h2>
                            <p style="font-size: 0.92rem; color: #555555; line-height: 1.6; margin-bottom: 20px; font-weight: 500; text-align: left;">${article.resumen}</p>
                            
                            <!-- Bloque Expandible (Sólo se expandirá si es noticia local) -->
                            <div class="full-content" style="max-height: 0px; opacity: 0; overflow: hidden; font-size: 0.92rem; color: #4a4a4a; line-height: 1.65; border-top: 1px dashed rgba(86, 142, 158, 0.3); padding-top: 15px; margin-bottom: 20px; text-align: left;">
                                ${article.contenido}
                            </div>
                            
                            ${actionButtonHTML}
                        </article>
                    `;
                });

                // Escucha de despliegue cinemático por software (Exclusivo para etiquetas <button>)
                blogGrid.querySelectorAll('article').forEach(card => {
                    const btn = card.querySelector('button.read-more-btn'); // Buscamos solo si es el botón físico
                    const content = card.querySelector('.full-content');
                    
                    if (btn && content) {
                        btn.addEventListener('click', () => {
                            if (content.style.maxHeight === '0px' || !content.style.maxHeight) {
                                content.style.maxHeight = '2000px'; 
                                content.style.opacity = '1';
                                content.style.paddingTop = '15px';
                                content.style.marginTop = '15px';
                                btn.innerText = 'Leer menos';
                                btn.style.backgroundColor = '#568e9e';
                                btn.style.color = '#ffffff';
                                btn.style.borderColor = '#568e9e';
                            } else {
                                content.style.maxHeight = '0px';
                                content.style.opacity = '0';
                                content.style.paddingTop = '0px';
                                content.style.marginTop = '0px';
                                btn.innerText = 'Leer noticia completa';
                                btn.style.backgroundColor = 'transparent';
                                btn.style.color = '#568e9e';
                                btn.style.borderColor = '#568e9e';
                            }
                        });
                    }
                });
            }

            if (blogGrid) {
                renderEditorialBlog(data);
                
                const filterButtons = document.querySelectorAll('.filter-btn');
                filterButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterButtons.forEach(b => {
                            b.style.backgroundColor = '#ffffff';
                            b.style.color = '#213a4b';
                            b.style.borderColor = 'rgba(33, 58, 75, 0.15)';
                        });
                        
                        btn.style.backgroundColor = '#568e9e';
                        btn.style.color = '#ffffff';
                        btn.style.borderColor = '#568e9e';
                        
                        const category = btn.getAttribute('data-category');
                        if (category === 'all') {
                            renderEditorialBlog(data);
                        } else {
                            const filtered = data.filter(a => a.categoria === category);
                            renderEditorialBlog(filtered);
                        }
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error al sincronizar la base de datos de Google Sheets:', error);
        });

    // ==========================================================================
    // 4. MOTOR DE CONVERSIÓN NATIVO CSV A JSON (BYPASS DE API KEYS Y CORS)
    // ==========================================================================
    function parseCSVToJSON(text) {
        let lines = [];
        let row = [''];
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            let next = text[i+1];
            if (c === '"') {
                if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (c === ',' && !inQuotes) {
                row.push('');
            } else if ((c === '\r' || c === '\n') && !inQuotes) {
                if (c === '\r' && next === '\n') { i++; }
                lines.push(row);
                row = [''];
            } else {
                row[row.length - 1] += c;
            }
        }
        if (row.length > 1 || row[0] !== '') lines.push(row);
        if (lines.length === 0) return [];
        
        const headers = lines[0].map(h => h.trim().toLowerCase());
        const jsonData = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].length < headers.length) continue;
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = lines[i][j] ? lines[i][j].trim() : '';
            }
            jsonData.push(obj);
        }
        return jsonData;
    }
});