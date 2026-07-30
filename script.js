document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. LÓGICA DEL MENÚ MÓVIL
    // ==========================================================================
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const icon = menuToggle.querySelector('i');
            icon.className = mainNav.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
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
    // 2. EFECTO MUELLE (PEEK ANIMATION) EN LOS SERVICIOS
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
                const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                element.scrollLeft = start + change * ease;
                if (elapsed < duration) requestAnimationFrame(animate);
                else if (callback) callback();
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
                            smoothScroll(slider, slider.clientWidth * 0.40, 600, () => {
                                smoothScroll(slider, 0, 500, () => slider.classList.remove('no-snap'));
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
    // 3. CONEXIÓN INSTANTÁNEA (PROMISE.ALL PARA NOTICIAS Y CATEGORÍAS)
    // ==========================================================================
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlAQXbX3TtvgSTtfHl49R3BrpfL53Khk_ubOgtmLXTZEQ-tbmZWOkC0dOJ2aUSyOmcuA/exec';
    const noCacheStamp = new Date().getTime();

    const categoriesFetch = fetch('categories.json?t=' + noCacheStamp)
        .then(res => res.ok ? res.json() : Promise.reject())
        .catch(() => fetch('admin/manage_categories.php?t=' + noCacheStamp).then(res => res.ok ? res.json() : []))
        .catch(() => []);

    Promise.all([
        fetch(GOOGLE_SCRIPT_URL + '?t=' + noCacheStamp)
            .then(res => res.ok ? res.json() : [])
            .catch(() => []),
        categoriesFetch
    ])
    .then(([newsData, categoriesData]) => {
        
        if (!categoriesData || categoriesData.length === 0) {
            categoriesData = [
                {id: "infantil", name: "Infantil y Aprendizaje"},
                {id: "adultos", name: "Adultos y Deglución"},
                {id: "saac", name: "Sistemas SAAC"},
                {id: "consejos", name: "Consejos en Casa"}
            ];
        }

        newsData.forEach(article => {
            if (!article.categoria || article.categoria.trim() === '') {
                article.categoria = 'consejos';
            } else {
                article.categoria = article.categoria.trim().toLowerCase();
            }

            if (article.fecha) {
                const dateObj = new Date(article.fecha);
                if (!isNaN(dateObj.getTime())) {
                    article.fecha = dateObj.toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    });
                }
            }
        });

        // ----------------------------------------------------------------------
        // A. RENDERIZADO EN LA PORTADA (INDEX.HTML)
        // ----------------------------------------------------------------------
        const newsSlider = document.getElementById('news-slider');
        if (newsSlider && newsData.length > 0) {
            newsSlider.innerHTML = ''; 
            
            const style = document.createElement('style');
            style.innerHTML = `
                #news-slider { overflow-x: auto !important; scroll-snap-type: none !important; -webkit-overflow-scrolling: touch !important; -ms-overflow-style: none !important; scrollbar-width: none !important; } 
                #news-slider::-webkit-scrollbar { display: none !important; }
                .resumen-html p { margin-top: 0; margin-bottom: 5px; }
                .resumen-html p:last-child { margin-bottom: 0; }
            `;
            document.head.appendChild(style);

            newsSlider.style.cssText = 'display: flex !important; flex-wrap: nowrap !important; gap: 25px; cursor: grab; user-select: none; box-sizing: border-box;';
            
            newsData.forEach(article => {
                const isExternal = article.url_externa && article.url_externa.trim() !== '';
                const linkHref = isExternal ? article.url_externa.trim() : 'noticias.html';
                const linkTarget = isExternal ? 'target="_blank"' : '';
                const linkText = isExternal ? 'Ver artículo completo &rarr;' : 'Leer más &rarr;';
                
                let formattedResumen = article.resumen || '';
                if (formattedResumen && !formattedResumen.includes('<p>')) {
                    formattedResumen = formattedResumen.replace(/\n/g, '<br>');
                }

                newsSlider.innerHTML += `
                    <div class="service-card" style="background: #ffffff; padding: 25px; border-radius: 15px; box-shadow: 0 8px 20px rgba(33, 58, 75, 0.05); color: #3a3a3a; text-align: left; align-items: flex-start; border: 1px solid rgba(86, 142, 158, 0.15); display: flex; flex-direction: column; transition: transform 0.2s; box-sizing: border-box; margin: 0; min-width: 0; scroll-snap-align: none !important;">
                        <img src="admin/${article.imagen}" alt="${article.titulo}" class="service-img" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" onerror="this.src='${article.imagen}'" draggable="false">
                        <span style="font-size: 0.8rem; color: #568e9e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${article.fecha}</span>
                        <h3 style="color: #213a4b; font-size: 1.15rem; margin: 8px 0 12px 0; text-align: left; display: block; font-weight: 700; line-height: 1.4;">${article.titulo}</h3>
                        <div class="resumen-html" style="font-size: 0.88rem; color: #555555; text-align: left; margin-bottom: 15px; line-height: 1.6; font-weight: 500;">${formattedResumen}</div>
                        <a href="${linkHref}" ${linkTarget} style="color: #568e9e; font-weight: 700; text-decoration: none; font-size: 0.9rem; margin-top: auto; transition: color 0.2s;" draggable="false">${linkText}</a>
                    </div>
                `;
            });

            const wrapper = newsSlider.parentElement;
            const controls = document.createElement('div');
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
                    if (elapsed < duration) newsAnimationId = requestAnimationFrame(animate);
                    else { newsSlider.scrollLeft = target; newsAnimationId = null; }
                };
                newsAnimationId = requestAnimationFrame(animate);
            }

            function startAutoPlay() {
                stopAutoPlay();
                autoPlayInterval = setInterval(() => {
                    if (window.innerWidth <= 1024 && isNewsVisibleInViewport) return;
                    if (currentIndex < newsData.length - itemsPerView) { currentIndex++; } else { currentIndex = 0; }
                    performCarouselScroll();
                }, 5000);
            }

            function stopAutoPlay() { if (autoPlayInterval) clearInterval(autoPlayInterval); }

            wrapper.addEventListener('mouseenter', stopAutoPlay);
            wrapper.addEventListener('mouseleave', startAutoPlay);

            function updateCarouselLayout() {
                const width = window.innerWidth;
                if (width > 1024) itemsPerView = 3; else if (width >= 650) itemsPerView = 2; else itemsPerView = 1; 

                const cards = newsSlider.querySelectorAll('.service-card');
                if (cards.length === 0) return;
                const cardWidth = (newsSlider.getBoundingClientRect().width - (gap * (itemsPerView - 1))) / itemsPerView;

                cards.forEach(card => { card.style.flex = `0 0 ${cardWidth}px`; });

                dotsContainer.innerHTML = '';
                const maxIndex = newsData.length - itemsPerView;
                const totalDots = maxIndex >= 0 ? maxIndex + 1 : 1;

                for (let i = 0; i < totalDots; i++) {
                    const dot = document.createElement('span');
                    dot.style.cssText = 'width: 10px; height: 10px; border-radius: 50%; background-color: rgba(86, 142, 158, 0.25); cursor: pointer; transition: all 0.3s ease;';
                    if (i === currentIndex) { dot.style.backgroundColor = '#568e9e'; dot.style.transform = 'scale(1.25)'; }
                    dot.addEventListener('click', () => { currentIndex = i; performCarouselScroll(); });
                    dotsContainer.appendChild(dot);
                }

                if (currentIndex > maxIndex) currentIndex = Math.max(0, maxIndex);
                performCarouselScroll();
            }

            function performCarouselScroll() {
                const cards = newsSlider.querySelectorAll('.service-card');
                if (cards.length === 0) return;
                smoothScrollNewsTo(currentIndex * (cards[0].getBoundingClientRect().width + gap));
                const dots = dotsContainer.querySelectorAll('span');
                dots.forEach((dot, idx) => {
                    dot.style.backgroundColor = idx === currentIndex ? '#568e9e' : 'rgba(86, 142, 158, 0.25)';
                    dot.style.transform = idx === currentIndex ? 'scale(1.25)' : 'scale(1)';
                });
            }

            btnPrev.addEventListener('click', () => {
                if (currentIndex > 0) currentIndex--; else currentIndex = newsData.length - itemsPerView;
                performCarouselScroll();
            });

            btnNext.addEventListener('click', () => {
                if (currentIndex < newsData.length - itemsPerView) currentIndex++; else currentIndex = 0;
                performCarouselScroll();
            });

            let isDragging = false;
            let startX;
            let initialScrollLeft;

            newsSlider.addEventListener('scroll', () => {
                if (isDragging || newsAnimationId) return;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const stepSize = newsSlider.querySelectorAll('.service-card')[0].getBoundingClientRect().width + gap;
                    currentIndex = Math.max(0, Math.min(Math.round(newsSlider.scrollLeft / stepSize), newsData.length - itemsPerView));
                    performCarouselScroll();
                }, 180);
            });

            newsSlider.addEventListener('mousedown', (e) => {
                isDragging = true; stopAutoPlay();
                if (newsAnimationId) cancelAnimationFrame(newsAnimationId);
                newsSlider.style.cursor = 'grabbing';
                startX = e.pageX; initialScrollLeft = newsSlider.scrollLeft;
            });

            const stopDrag = () => {
                if (!isDragging) return;
                isDragging = false; newsSlider.style.cursor = 'grab';
                const stepSize = newsSlider.querySelectorAll('.service-card')[0].getBoundingClientRect().width + gap;
                currentIndex = Math.max(0, Math.min(Math.round(newsSlider.scrollLeft / stepSize), newsData.length - itemsPerView));
                performCarouselScroll(); startAutoPlay();
            };

            newsSlider.addEventListener('mouseleave', stopDrag);
            newsSlider.addEventListener('mouseup', stopDrag);
            newsSlider.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                newsSlider.scrollLeft = initialScrollLeft - ((e.pageX - startX) * 1.5);
            });
            newsSlider.addEventListener('touchstart', () => { stopAutoPlay(); if (newsAnimationId) cancelAnimationFrame(newsAnimationId); }, { passive: true });
            newsSlider.addEventListener('touchend', () => { startAutoPlay(); });

            window.addEventListener('resize', updateCarouselLayout);
            setTimeout(() => { updateCarouselLayout(); startAutoPlay(); }, 150);
        }

        // ----------------------------------------------------------------------
        // B. LÓGICA DEL MODAL DE NOTICIAS (TARJETA GIGANTE)
        // ----------------------------------------------------------------------
        const articleModal = document.getElementById('article-modal');
        const modalImg = document.getElementById('modal-image');
        const modalMeta = document.getElementById('modal-meta');
        const modalTitle = document.getElementById('modal-title');
        const modalText = document.getElementById('modal-text');
        const btnCloseModal = document.getElementById('close-modal');
        const btnCloseModalBottom = document.getElementById('close-modal-bottom');

        function openArticleModal(article, categoryName) {
            if(!articleModal) return;
            
            let formattedContenido = article.contenido || '';
            if (formattedContenido && !formattedContenido.includes('<p>')) {
                formattedContenido = formattedContenido.replace(/\n/g, '<br>');
            }
            
            modalImg.src = `admin/${article.imagen}`;
            modalImg.onerror = function() { this.src = article.imagen; }; 
            modalMeta.innerText = `${article.fecha} | ${categoryName}`;
            modalTitle.innerText = article.titulo;
            modalText.innerHTML = formattedContenido;
            
            articleModal.style.display = 'flex';
            void articleModal.offsetWidth; 
            articleModal.classList.add('show');
            document.body.style.overflow = 'hidden'; 
        }

        function closeArticleModal() {
            if(!articleModal) return;
            articleModal.classList.remove('show');
            document.body.style.overflow = ''; 
            setTimeout(() => {
                articleModal.style.display = 'none';
            }, 300); 
        }

        if (btnCloseModal) btnCloseModal.addEventListener('click', closeArticleModal);
        if (btnCloseModalBottom) btnCloseModalBottom.addEventListener('click', closeArticleModal);
        
        if (articleModal) {
            articleModal.addEventListener('click', (e) => {
                if(e.target === articleModal) closeArticleModal(); 
            });
        }
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape' && articleModal && articleModal.classList.contains('show')) {
                closeArticleModal();
            }
        });


        // ----------------------------------------------------------------------
        // C. RENDERIZADO EN BLOG (NOTICIAS.HTML) - CATEGORÍAS RESPONSIVAS
        // ----------------------------------------------------------------------
        const blogGrid = document.getElementById('blog-articles-grid');
        const desktopFiltersContainer = document.getElementById('desktop-filters');
        const mobileFiltersContainer = document.getElementById('mobile-filters');
        
        function renderEditorialBlog(articlesToShow) {
            if (!blogGrid) return;
            if (articlesToShow.length === 0) {
                blogGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #213a4b; font-family: 'Montserrat', sans-serif;">
                        <i class="fas fa-folder-open" style="font-size: 2.5rem; color: #568e9e; margin-bottom: 15px; opacity: 0.7;"></i>
                        <p style="font-weight: 600; font-size: 1.1rem;">No hay artículos publicados en esta categoría todavía.</p>
                    </div>`;
                return;
            }
            
            blogGrid.innerHTML = ''; 
            
            articlesToShow.forEach((article, index) => {
                const isExternal = article.url_externa && article.url_externa.trim() !== '';
                
                let formattedResumen = article.resumen || '';
                if (formattedResumen && !formattedResumen.includes('<p>')) {
                    formattedResumen = formattedResumen.replace(/\n/g, '<br>');
                }
                
                const actionButtonHTML = isExternal 
                    ? `<a href="${article.url_externa.trim()}" target="_blank" class="read-more-btn external-btn" style="margin-top: auto; background: none; border: 1px solid #568e9e; color: #568e9e; padding: 10px 22px; border-radius: 25px; font-weight: 600; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; align-self: flex-start; text-decoration: none; text-align: center;">Ver artículo externo <i class="fas fa-external-link-alt" style="font-size: 0.75rem; margin-left: 4px;"></i></a>`
                    : `<button class="read-more-btn internal-article-btn" data-index="${index}" style="margin-top: auto; background: none; border: 1px solid #568e9e; color: #568e9e; padding: 10px 22px; border-radius: 25px; font-weight: 600; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.3s ease; align-self: flex-start;">Leer noticia completa</button>`;

                blogGrid.innerHTML += `
                    <article onmouseenter="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 30px 60px rgba(33, 58, 75, 0.12)';" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 20px 40px rgba(33, 58, 75, 0.08), 0 2px 8px rgba(33, 58, 75, 0.04)';" style="background-color: #ffffff; padding: 30px; border-radius: 18px; box-shadow: 0 20px 40px rgba(33, 58, 75, 0.08), 0 2px 8px rgba(33, 58, 75, 0.04); display: flex; flex-direction: column; border: none; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                        <img src="admin/${article.imagen}" alt="${article.titulo}" style="width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 6px 15px rgba(0,0,0,0.03);" onerror="this.src='${article.imagen}'">
                        <span style="font-size: 0.8rem; color: #568e9e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${article.fecha}</span>
                        <h2 style="font-family: 'Montserrat', sans-serif; font-size: 1.35rem; color: #213a4b; font-weight: 700; margin-bottom: 15px; line-height: 1.4; text-align: left;">${article.titulo}</h2>
                        <div class="resumen-html" style="font-size: 0.92rem; color: #555555; line-height: 1.6; margin-bottom: 25px; font-weight: 500; text-align: left;">${formattedResumen}</div>
                        ${actionButtonHTML}
                    </article>
                `;
            });

            blogGrid.querySelectorAll('button.internal-article-btn').forEach(btn => {
                btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = '#568e9e'; btn.style.color = '#ffffff'; });
                btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = 'transparent'; btn.style.color = '#568e9e'; });

                btn.addEventListener('click', (e) => {
                    const idx = btn.getAttribute('data-index');
                    const article = articlesToShow[idx];
                    
                    let catName = article.categoria;
                    if(categoriesData) {
                        const catObj = categoriesData.find(c => c.id === article.categoria);
                        if(catObj) catName = catObj.name;
                    }
                    
                    openArticleModal(article, catName);
                });
            });
            
            blogGrid.querySelectorAll('a.external-btn').forEach(btn => {
                btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = '#568e9e'; btn.style.color = '#ffffff'; });
                btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = 'transparent'; btn.style.color = '#568e9e'; });
            });
        }

        if ((desktopFiltersContainer || mobileFiltersContainer) && blogGrid) {
            
            if(desktopFiltersContainer) desktopFiltersContainer.innerHTML = '';
            if(mobileFiltersContainer) mobileFiltersContainer.innerHTML = '';

            // --- MODO ESCRITORIO (Botonera) ---
            if(desktopFiltersContainer) {
                const btnAllDesktop = document.createElement('button');
                btnAllDesktop.className = 'filter-btn active';
                btnAllDesktop.setAttribute('data-category', 'all');
                btnAllDesktop.innerText = 'Todas';
                desktopFiltersContainer.appendChild(btnAllDesktop);

                categoriesData.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = 'filter-btn';
                    btn.setAttribute('data-category', cat.id);
                    btn.innerText = cat.name;
                    desktopFiltersContainer.appendChild(btn);
                });
            }

            // --- MODO MÓVIL (Botón Todas + Select) ---
            if(mobileFiltersContainer) {
                const btnAllMobile = document.createElement('button');
                btnAllMobile.className = 'filter-btn active';
                btnAllMobile.setAttribute('data-category', 'all');
                btnAllMobile.innerText = 'Todas';
                mobileFiltersContainer.appendChild(btnAllMobile);

                const selectMobile = document.createElement('select');
                selectMobile.className = 'filter-select';
                const defaultOpt = document.createElement('option');
                defaultOpt.value = 'all';
                defaultOpt.innerText = 'Categorías...';
                selectMobile.appendChild(defaultOpt);

                categoriesData.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id;
                    opt.innerText = cat.name;
                    selectMobile.appendChild(opt);
                });
                mobileFiltersContainer.appendChild(selectMobile);
            }

            // --- LÓGICA DE FILTRADO UNIFICADA ---
            function applyFilter(category) {
                // Sincronizar UI Escritorio
                if(desktopFiltersContainer) {
                    desktopFiltersContainer.querySelectorAll('.filter-btn').forEach(b => {
                        b.classList.remove('active');
                        if (b.getAttribute('data-category') === category) b.classList.add('active');
                    });
                }

                // Sincronizar UI Móvil
                if(mobileFiltersContainer) {
                    const mobileBtnAll = mobileFiltersContainer.querySelector('button');
                    const mobileSelect = mobileFiltersContainer.querySelector('select');
                    if (category === 'all') {
                        mobileBtnAll.classList.add('active');
                        mobileSelect.value = 'all';
                    } else {
                        mobileBtnAll.classList.remove('active');
                        mobileSelect.value = category;
                    }
                }

                // Renderizar Noticias
                if (category === 'all') {
                    renderEditorialBlog(newsData);
                } else {
                    const filtered = newsData.filter(a => a.categoria === category);
                    renderEditorialBlog(filtered);
                }
            }

            // Asignar Eventos
            if(desktopFiltersContainer) {
                desktopFiltersContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', () => applyFilter(btn.getAttribute('data-category')));
                });
            }

            if(mobileFiltersContainer) {
                const mobileBtnAll = mobileFiltersContainer.querySelector('button');
                const mobileSelect = mobileFiltersContainer.querySelector('select');
                
                mobileBtnAll.addEventListener('click', () => applyFilter('all'));
                mobileSelect.addEventListener('change', (e) => applyFilter(e.target.value));
            }

            renderEditorialBlog(newsData);
        } else if (blogGrid) {
            renderEditorialBlog(newsData);
        }

    }).catch(error => console.error('Error al sincronizar datos:', error));

    if ('BroadcastChannel' in window) {
        const syncChannel = new BroadcastChannel('logopedia_sync');
        syncChannel.onmessage = (event) => {
            if (event.data === 'refresh') window.location.reload();
        };
    }
});