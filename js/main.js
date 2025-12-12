/* ==========================
    CONTROL DE VISTAS HOME
========================== */
// Función para ocultar/mostrar el carrusel de videos GLOBAL
function toggleHomeView(showVideos = true) {
    const videoContainer = document.getElementById('videoCarouselContainer');
    if (videoContainer) {
        if (showVideos) {
            videoContainer.style.display = 'block';
        } else {
            videoContainer.style.display = 'none';
        }
    }
}


/* ==========================
    CARRUSEL DE VIDEOS (Reels Global con SWIPE)
========================== */
let currentVideoIndex = 0;
let videoElements = [];
let touchStartX = 0; // Para la logica del swipe.

function initVideoCarousel() {
    const container = document.getElementById('videoSlides');
    if (!container || typeof videosHome === 'undefined' || videosHome.length === 0) {
        console.warn("No se encontraron videos para el carrusel de inicio.");
        return;
    }

    // 1. Inyectar la estructura HTML de los videos
    container.innerHTML = videosHome.map((video, index) => `
        <div id="reel-${index}" class="video-slide-item ${index === 0 ? 'active' : ''}">
            <video preload="auto" playsinline muted>
                <source src="${video.src}" type="video/mp4">
                Tu navegador no soporta videos.
            </video>
        </div>
    `).join('');

    // 2. Obtener referencias, configurar el listener 'ended' y TOUCH EVENTS
    videoElements = [];
    videosHome.forEach((_, index) => {
        const slide = document.getElementById(`reel-${index}`);
        const video = slide.querySelector('video');
        
        // Listener principal: Cambio automático al terminar el video
        video.addEventListener('ended', goToNextVideo);

        // FIX MÓVIL: Intenta forzar el primer fotograma al cargar metadatos
        video.addEventListener('loadedmetadata', () => {
             video.currentTime = 0; 
        });
        
        videoElements.push({ slide, video });
    });
    
    // 3. Ocultar los botones de navegación (si existen)
    document.querySelectorAll('.carousel-control').forEach(btn => {
        btn.style.display = 'none';
    });

    // 4. Agregar lógica de SWIPE (Deslizamiento)
    container.addEventListener('touchstart', handleTouchStart, false);
    container.addEventListener('touchmove', handleTouchMove, false);
    container.addEventListener('touchend', handleTouchEnd, false);

    // 5. Iniciar la reproducción del primer video
    playCurrentVideo();
}

function playCurrentVideo() {
    if (videoElements.length === 0) return;
    
    // Pausar todos los videos
    videoElements.forEach(item => {
        item.video.pause();
        item.slide.classList.remove('active');
    });

    // Activar y reproducir el video actual
    const currentItem = videoElements[currentVideoIndex];
    currentItem.slide.classList.add('active');
    
    // Intentamos reproducir con Promise para manejo de Autoplay
    setTimeout(() => {
        currentItem.video.play().catch(error => {
            console.warn("Autoplay bloqueado en el carrusel principal.", error.name);
        });
    }, 50); 
}

function goToNextVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % videoElements.length;
    playCurrentVideo();
}

function goToPrevVideo() {
    currentVideoIndex = (currentVideoIndex - 1 + videoElements.length) % videoElements.length;
    playCurrentVideo();
}

/* ==========================
    LÓGICA DE SWIPE (DESLIZAMIENTO)
========================== */

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX; 
}

function handleTouchMove(e) {
    // No usamos e.preventDefault() para no bloquear el scroll vertical
}

function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX; 
    const threshold = 50; 

    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            // Deslizamiento hacia la izquierda: Ir al siguiente video
            goToNextVideo();
        } else {
            // Deslizamiento hacia la derecha: Ir al video anterior
            goToPrevVideo();
        }
    }
}

/* ==========================
    CARRUSEL DE CATEGORÍAS (Clicable)
========================== */
let currentCategoryVideoIndex = 0;
let categoryVideoElements = [];
let categoryVideoInterval;

function initCategoryVideoCarousel() {
    const container = document.getElementById('categoryVideoSlides');
    if (!container || typeof categoryVideoBanners === 'undefined' || categoryVideoBanners.length === 0) return;

    // 1. Inyectar la estructura HTML de los videos de categorías
    container.innerHTML = categoryVideoBanners.map((video, index) => `
        <div id="cat-reel-${index}" 
             class="category-video-slide-item ${index === 0 ? 'active' : ''}"
             onclick="router.goTo('${video.link}')" style="cursor: pointer;">
            
            <video preload="auto" playsinline muted>
                <source src="${video.src}" type="video/mp4">
            </video>
            
            <div class="video-overlay">
                <h3>${video.titulo}</h3>
                <p>Toca para ver productos 👆</p>
            </div>
        </div>
    `).join('');

    // 2. Obtener referencias y configurar
    categoryVideoElements = [];
    categoryVideoBanners.forEach((_, index) => {
        const slide = document.getElementById(`cat-reel-${index}`);
        const video = slide.querySelector('video');

        // FIX MÓVIL: Intenta forzar el primer fotograma al cargar metadatos
        video.addEventListener('loadedmetadata', () => {
             video.currentTime = 0; 
        });

        categoryVideoElements.push({ slide, video });
    });

    // 3. Iniciar el carrusel de categorías (basado en tiempo)
    startCategoryVideoInterval();
    
    // 4. Asegurar que el primer video se reproduzca
    playCurrentCategoryVideo();
}

function startCategoryVideoInterval() {
    if (categoryVideoInterval) clearInterval(categoryVideoInterval);
    categoryVideoInterval = setInterval(goToNextCategoryVideo, 4000); 
}

function playCurrentCategoryVideo() {
    if (categoryVideoElements.length === 0) return;
    
    categoryVideoElements.forEach(item => {
        item.video.pause();
        item.slide.classList.remove('active');
    });

    const currentItem = categoryVideoElements[currentCategoryVideoIndex];
    currentItem.slide.classList.add('active');
    
    setTimeout(() => {
        currentItem.video.play().catch(error => {
            console.warn("Autoplay de categoría bloqueado.", error.name);
        });
    }, 50); 
}

function goToNextCategoryVideo() {
    currentCategoryVideoIndex = (currentCategoryVideoIndex + 1) % categoryVideoElements.length;
    playCurrentCategoryVideo();
}

/* [Omitido el resto de main.js (Router, showCategory, etc.) ya que no se modificó más que los videos] */

/* ==========================
    OBJETO ROUTER SPA
========================== */
const router = {
    views: {
        home: null,
        categorias: null,
        novedades: null,
        producto: null,
        busqueda: null,
        cuenta: null, 
        cart: null
    },

    showView(viewName) {
        if (!this.views.home) {
            this.views.home = document.getElementById('vista-home');
            this.views.categorias = document.getElementById('vista-categorias');
            this.views.novedades = document.getElementById('vista-novedades');
            this.views.producto = document.getElementById('vista-producto');
            this.views.busqueda = document.getElementById('vista-busqueda'); 
            this.views.cuenta = document.getElementById('vista-cuenta'); 
            this.views.cart = document.getElementById('vista-cart');
        }
        
        Object.values(this.views).forEach(v => v?.classList.remove('active-view'));

        const targetView = this.views[viewName];
        if (targetView) {
            targetView.classList.add('active-view');
            document.querySelector('.main-content').scrollTo(0,0);

            if (viewName === 'home') {
                if (typeof initVideoCarousel === 'function') initVideoCarousel();
                if (typeof toggleHomeView === 'function') toggleHomeView(true);
                
                if (typeof initCategoryVideoCarousel === 'function') initCategoryVideoCarousel();
                
                const productsCont = document.getElementById("products");
                if (productsCont) productsCont.innerHTML = ""; 
                const categoryCarousel = document.getElementById('categoryVideoCarouselContainer');
                if (categoryCarousel) categoryCarousel.style.display = 'block'; 
            }

            if (viewName === 'categorias') {
                document.querySelector('#vista-categorias h1').textContent = 'Catálogo Completo';
                if (typeof cargarVistaCategorias === 'function') cargarVistaCategorias();
            }
            if (viewName === 'novedades') {
                if (typeof cargarNovedades === 'function') cargarNovedades();
            }
            if (viewName === 'busqueda') {
                const searchInput = document.getElementById('searchInput');
                searchInput.value = '';
                document.getElementById('searchResults').innerHTML = '';
            }
            
        } else {
            this.goTo('home');
        }
    },

    handleRoute() {
        const hash = window.location.hash.slice(1);
        
        if (!hash) {
            this.showView('home'); 
            return;
        }

        const [route, paramsStr] = hash.split('?');
        const params = new URLSearchParams(paramsStr || '');
        let viewToShow = route || 'home';

        if (viewToShow === 'producto' && params.has('id')) {
            this.showView('producto');
            if (typeof mostrarDetalleProducto === 'function') {
                mostrarDetalleProducto(params.get('id'));
            }
            return;
        }
        
        if (viewToShow === 'busqueda') {
            this.showView('busqueda');
            return;
        }

        if (viewToShow === 'categorias') {
            this.showView('categorias');
            return;
        }

        if (viewToShow === 'novedades') {
            this.showView('novedades');
            return;
        }

        if (viewToShow === 'home' && params.has('categoria')) {
             this.showView('home');
             const categoria = params.get('categoria');
             if (typeof showCategory === 'function') {
                 showCategory(categoria); 
             }
             return;
        }

        this.showView('home');
    },

    goTo(newHash) {
        window.location.hash = newHash;
    },

    goBack() {
        history.back();
    }
};

/* ==========================
    ESCUCHADORES
========================== */
window.addEventListener('hashchange', () => router.handleRoute());
window.addEventListener('DOMContentLoaded', () => {
    router.handleRoute();
});

/* ==========================
    CARRUSELES DE PRODUCTOS (Miniaturas)
========================== */
let carouselIntervals = {};

function initAllCarousels() {
    Object.values(carouselIntervals).forEach(interval => clearInterval(interval));
    carouselIntervals = {};

    document.querySelectorAll(".carousel").forEach(carousel => {
        const id = carousel.id;
        const imgsContainer = carousel.querySelector(".carousel-images");
        const imgs = imgsContainer?.querySelectorAll("img");
        const dots = carousel.querySelectorAll(".dot");

        if (!id || !imgs || imgs.length <= 1) return; 

        let index = 0;
        
        function update(newIndex) {
            imgs[index].classList.remove("active");
            if(dots[index]) dots[index].classList.remove("active-dot");
            
            index = newIndex;
            
            imgs[index].classList.add("active");
            if(dots[index]) dots[index].classList.add("active-dot");
        }

        if (imgs.length > 1) {
            const interval = setInterval(() => update((index + 1) % imgs.length), 3500);
            carouselIntervals[id] = interval;
        }

        const prevBtn = carousel.querySelector(".prev");
        const nextBtn = carousel.querySelector(".next");
        
        if(prevBtn) {
            prevBtn.onclick = e => {
                e.preventDefault(); e.stopPropagation();
                update((index - 1 + imgs.length) % imgs.length);
            };
        }
        if(nextBtn) {
            nextBtn.onclick = e => {
                e.preventDefault(); e.stopPropagation();
                update((index + 1) % imgs.length);
            };
        }
    });
}

/* ==========================
    MOSTRAR CATEGORÍA (Muestra Productos y Oculta Carruseles)
========================== */
function showCategory(category) {
    const cont = document.getElementById("products");
    cont.innerHTML = ""; 
    
    // --- LÓGICA CRÍTICA: OCULTAR CARRUSELES AL VER PRODUCTOS ---
    const categoryCarousel = document.getElementById('categoryVideoCarouselContainer');
    if(categoryCarousel) {
        categoryCarousel.style.display = 'none'; // Oculta el carrusel clicable
    }

    // Oculta el carrusel global de reels
    toggleHomeView(false); 
    // --------------------------------------------------------

    const productosDeCategoria = productos[category]; 
    
    if (!productosDeCategoria || productosDeCategoria.length === 0) {
        cont.innerHTML = `<p class="no">No se encontraron productos en la categoría ${category}.</p>`;
        return; 
    }

    let htmlContent = [];

    productosDeCategoria.forEach((prod,index) => {
        let imgsHTML = "";
        const allImgs = Array.isArray(prod.img) ? prod.img : [prod.img];
        const hasMultiple = allImgs.length > 1;
        
        let imgContainerHTML = '';

        if (hasMultiple) {
            const carouselId = `carousel-${category}-${index}`;
            
            imgContainerHTML = allImgs.map((img, i) => 
                `<img src="${img}" class="${i === 0 ? 'active' : ''}">`
            ).join('');
            
            imgsHTML = `
                <div class="carousel" id="${carouselId}">
                    <div class="carousel-images">
                        ${imgContainerHTML}
                    </div>
                    <button class="prev" data-id="${carouselId}">‹</button>
                    <button class="next" data-id="${carouselId}">›</button>
                    <div class="dots">
                        ${allImgs.map((_, i) => `<span class="dot ${i === 0 ? 'active-dot' : ''}" data-index="${i}" data-id="${carouselId}"></span>`).join('')}
                    </div>
                </div>
            `;
        } else {
            // Imagen única - USANDO ESTRUCTURA CONSISTENTE
            const imgSrc = allImgs[0] || '/media/img/placeholder.jpg';
            imgsHTML = `
                <div class="carousel">
                    <div class="carousel-images">
                        <img src="${imgSrc}" class="active">
                    </div>
                </div>
            `;
        }

        htmlContent.push(`
            <div class="card card-link" onclick="router.goTo('producto?id=${prod.id}')" style="cursor: pointer;">
                ${imgsHTML}
                <h3>${prod.nombre || 'Producto'}</h3>
                <p class="precio">${prod.precio || ''}</p>
            </div>
        `);
    });

    cont.innerHTML = htmlContent.join(''); 

    setTimeout(() => {
        animarProductos(); 
        initAllCarousels();
    }, 0); 
}

/* ==========================
    BÚSQUEDA (Dirigida a #searchResults)
========================== */
function buscarProducto() {
    const texto = document.getElementById("searchInput").value.toLowerCase();
    const cont = document.getElementById("searchResults"); 
    cont.innerHTML = "";

    if (texto.length < 3) {
        cont.innerHTML = `<p class="no">Escribe al menos 3 letras para buscar.</p>`;
        return;
    }

    let resultados = [];
    for(const cat in productos) {
        productos[cat].forEach(prod=>{
            if(prod.nombre.toLowerCase().includes(texto)) resultados.push(prod);
        });
    }

    if(resultados.length===0) {
        cont.innerHTML = `<p class="no">No se encontraron resultados para "${texto}".</p>`;
        return;
    }

    let htmlContent = [];
    resultados.forEach((prod) => {
        const imgSrc = Array.isArray(prod.img) ? prod.img[0] : prod.img;
        // Renderizado usando la estructura consistente
        htmlContent.push(`
            <div class="card card-link" onclick="router.goTo('producto?id=${prod.id}')">
                <div class="carousel">
                    <div class="carousel-images">
                        <img src="${imgSrc}" class="active">
                    </div>
                </div>
                <h3>${prod.nombre}</h3>
                <p class="precio">${prod.precio}</p>
            </div>
        `);
    });
    cont.innerHTML = htmlContent.join('');
    
    setTimeout(animarProductos, 250);
}

/* ==========================
    ANIMACIÓN DE TARJETAS
========================== */
function animarProductos() {
    // La animación ahora se aplica a las tarjetas en #products (home) y #searchResults (búsqueda)
    document.querySelectorAll("#products .card, #searchResults .card").forEach((card,i)=>{
        setTimeout(()=>card.classList.add("show"), 80*i);
    });
}