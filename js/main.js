// Minimal global play overlay implementation to prevent fatal errors
function showGlobalPlayOverlay() {
    // Optionally, show a UI overlay here
    console.warn('[DEBUG] showGlobalPlayOverlay called (implement overlay UI if needed)');
}

function hideGlobalPlayOverlay() {
    // Optionally, hide the overlay UI here
    console.warn('[DEBUG] hideGlobalPlayOverlay called (implement overlay UI if needed)');
}
/* ==========================
    CONTROL DE VISTAS HOME
========================== */
function toggleHomeView(showVideos = true) {
    const videoContainer = document.getElementById('videoCarouselContainer');
    const categoryCarousel = document.getElementById('categoryVideoCarouselContainer');
    const titleWrapper = document.querySelector('.section-title-wrapper');

    if (showVideos) {
        if(videoContainer) videoContainer.style.display = 'block';
        if(categoryCarousel) categoryCarousel.style.display = 'flex'; // o block
        if(titleWrapper) titleWrapper.style.display = 'block';
    } else {
        if(videoContainer) videoContainer.style.display = 'none';
        if(categoryCarousel) categoryCarousel.style.display = 'none';
        if(titleWrapper) titleWrapper.style.display = 'none';
    }
// ...existing code...
}
/* ==========================
    CARRUSEL DE VIDEOS (Reels Global con SWIPE)
========================== */
let currentVideoIndex = 0;
let videoElements = [];
let touchStartX = 0;
let videoCarouselContainerElement = null;

let searchProductTimeout = null;

// Fallback UI when autoplay is blocked (battery saver / browser policy)
let globalPlayOverlay = null;
let globalPlayOverlayShown = false;

// LocalStorage key to remember that autoplay was allowed by user
const AUTOPLAY_FLAG_KEY = 'amate_autoplay_allowed_v1';

function isAutoplayAllowed() {
    try { return localStorage.getItem(AUTOPLAY_FLAG_KEY) === '1'; } catch (e) { return false; }
}

function setAutoplayAllowed() {
    try { localStorage.setItem(AUTOPLAY_FLAG_KEY, '1'); } catch (e) { /* noop */ }
}

// Lazy image placeholder and observer (loads images only when near viewport)
const LAZY_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
let lazyImageObserver = null;
// Normalize manifest paths coming from the generator. Many entries use "../media/..."
// Convert leading "../" to absolute paths from site root "/media/..." and clean srcset lists.
function normalizeManifestPath(p) {
    if (!p || typeof p !== 'string') return p;
    return p.replace(/^(?:\.\.\/)+/, '/');
}

function normalizeSrcset(srcset) {
    if (!srcset || typeof srcset !== 'string') return srcset;
    return srcset.split(',').map(s => {
        const parts = s.trim().split(/\s+/);
        if (parts.length === 0) return s;
        return s;
    }).join(', ');
}

function userGesturePlayAll() {
    // Called from a user gesture (click/tap). Try to play all video elements.
    try {
        if (Array.isArray(videoElements)) {
            videoElements.forEach(item => {
                try {
                    item.video.muted = true;
                    const p = item.video.play();
                    if (p && typeof p.then === 'function') p.then(()=>setAutoplayAllowed()).catch(()=>{});
                } catch (e) {}
            });
        }
    } finally {
        hideGlobalPlayOverlay();
        // Start intervals if needed
        startCategoryVideoInterval();
    }
}

// Small util to escape HTML for attribute values
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function initVideoCarousel() {
    console.log('[DEBUG] initVideoCarousel called');
    const container = document.getElementById('videoSlides');
    console.log('[DEBUG] #videoSlides:', container);
    console.log('[DEBUG] videosHome:', typeof videosHome, Array.isArray(videosHome) ? videosHome.length : videosHome);
    // Validamos que existan datos de videos
    if (!container || typeof videosHome === 'undefined' || videosHome.length === 0) {
        console.warn('[DEBUG] Aborting: container missing or videosHome undefined/empty');
        return;
    }

    // Defer video loading/decoding until user interacts
    container.innerHTML = videosHome.map((video, index) => `
        <div id="reel-${index}" class="video-slide-item ${index === 0 ? 'active' : ''}">
            <video preload="none" playsinline muted data-src="${video.src}" ${video.poster ? `poster="${video.poster}"` : ''}>
                <source data-src="${video.src}" type="video/mp4">
            </video>
        </div>
    `).join('');

    videoElements = [];
    videosHome.forEach((_, index) => {
        const slide = document.getElementById(`reel-${index}`);
        const video = slide.querySelector('video');
        // Only load video src on first user gesture
        video.loadDeferred = function() {
            if (!video.src) {
                const src = video.getAttribute('data-src');
                if (src) video.src = src;
                const source = video.querySelector('source');
                if (source && source.getAttribute('data-src')) source.src = source.getAttribute('data-src');
                video.load();
            }
        };
        video.addEventListener('ended', goToNextVideo);
        video.addEventListener('loadedmetadata', () => { video.currentTime = 0; });
        videoElements.push({ slide, video });
    });

    videoCarouselContainerElement = document.getElementById('videoCarouselContainer');
    if (videoCarouselContainerElement) {
        videoCarouselContainerElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        videoCarouselContainerElement.addEventListener('touchmove', handleTouchMove, { passive: true });
        videoCarouselContainerElement.addEventListener('touchend', handleTouchEnd);
    }
    // Try to load and play videos automatically
    loadAllVideosOnce();
}

function loadAllVideosOnce() {
    if (Array.isArray(videoElements)) {
        videoElements.forEach(item => {
            if (item.video && typeof item.video.loadDeferred === 'function') item.video.loadDeferred();
        });
    }
    playCurrentVideo();
}

function playCurrentVideo() {
    if (videoElements.length === 0) return;
    
    videoElements.forEach(item => {
        item.video.pause();
        item.slide.classList.remove('active');
    });

    const currentItem = videoElements[currentVideoIndex];
    currentItem.slide.classList.add('active');
    
    setTimeout(() => {
        const p = currentItem.video.play();
        if (p && typeof p.then === 'function') {
            p.then(()=>{ setAutoplayAllowed(); hideGlobalPlayOverlay(); }).catch(error => {
                // Autoplay blocked (battery saver / browser policy). Show a tap-to-play overlay.
                showGlobalPlayOverlay();
            });
        }
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
    LÓGICA DE SWIPE
========================== */
function handleTouchStart(e) {
    // Solo captura el inicio del toque
    touchStartX = e.touches[0].clientX; 
}

function handleTouchMove(e) {
    // Permitimos scroll vertical natural (no hacemos nada aquí)
}

function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX; 
    const threshold = 50; 

    // Aquí evitamos el swipe horizontal agresivo, porque este carrusel es vertical.
    // Para carruseles verticales, se usaría e.touches[0].clientY.
    // Si la intención es pasar de reel a reel verticalmente, se necesita cambiar la lógica de 'Y'.
    // Mantendremos la lógica de 'X' solo como fallback, aunque lo ideal es el scroll vertical natural.
    if (Math.abs(diff) > threshold) {
        // Lógica de swipe horizontal original (puede que quieras eliminarla si el carrusel es 100% vertical)
        /*
        if (diff > 0) {
            goToNextVideo();
        } else {
            goToPrevVideo();
        }
        */
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

    container.innerHTML = categoryVideoBanners.map((video, index) => `
        <div id="cat-reel-${index}" 
             class="category-video-slide-item ${index === 0 ? 'active' : ''}"
             onclick="router.goTo('${video.link}')" style="cursor: pointer;">
            
            <video preload="metadata" autoplay playsinline muted ${video.poster ? `poster="${video.poster}"` : ''}>
                <source src="${video.src}" type="video/mp4">
            </video>
            
            <div class="video-overlay">
                <h3>${video.titulo}</h3>
                <p>Toca para ver productos 👆</p>
            </div>
        </div>
    `).join('');

    categoryVideoElements = [];
    categoryVideoBanners.forEach((_, index) => {
        const slide = document.getElementById(`cat-reel-${index}`);
        const video = slide.querySelector('video');
        video.addEventListener('loadedmetadata', () => { video.currentTime = 0; });
        categoryVideoElements.push({ slide, video });
    });

    startCategoryVideoInterval();
    playCurrentCategoryVideo();
}

function startCategoryVideoInterval() {
    if (categoryVideoInterval) clearInterval(categoryVideoInterval);
    categoryVideoInterval = setInterval(goToNextCategoryVideo, 4000); 
}

function cleanupHome() {
    // Pause and clean video carousels
    try {
        if (Array.isArray(videoElements)) {
            videoElements.forEach(item => {
                try { item.video.pause(); } catch (e) {}
                item.slide?.classList.remove('active');
            });
        }

        if (Array.isArray(categoryVideoElements)) {
            categoryVideoElements.forEach(item => {
                try { item.video.pause(); } catch (e) {}
                item.slide?.classList.remove('active');
            });
        }

        if (categoryVideoInterval) {
            clearInterval(categoryVideoInterval);
            categoryVideoInterval = null;
        }

        if (videoCarouselContainerElement) {
            videoCarouselContainerElement.removeEventListener('touchstart', handleTouchStart);
            videoCarouselContainerElement.removeEventListener('touchmove', handleTouchMove);
            videoCarouselContainerElement.removeEventListener('touchend', handleTouchEnd);
            videoCarouselContainerElement = null;
        }
        // Ensure overlay is hidden when leaving home
        try { hideGlobalPlayOverlay(); } catch (e) {}
    } catch (err) {
        // noop
    }
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
        const p = currentItem.video.play();
        if (p && typeof p.then === 'function') {
            p.then(()=>{ setAutoplayAllowed(); hideGlobalPlayOverlay(); }).catch(error => {
                // Autoplay blocked for category video; show overlay so user can enable playback.
                showGlobalPlayOverlay();
            });
        }
    }, 50);
}

// Try to play home videos immediately on view load. If browser blocks autoplay,
// the overlay will be shown to request a user gesture.
function attemptImmediateHomePlay() {
    try {
        // Try play the main reels (first one)
        if (Array.isArray(videoElements) && videoElements.length) {
            const v = videoElements[0];
            v.video.muted = true;
            v.video.play().catch(() => { showGlobalPlayOverlay(); });
        }

        // Try play first category video
        if (Array.isArray(categoryVideoElements) && categoryVideoElements.length) {
            const cv = categoryVideoElements[0];
            cv.video.muted = true;
            cv.video.play().catch(() => { showGlobalPlayOverlay(); });
        }
    } catch (e) {
        // noop
    }
}

function goToNextCategoryVideo() {
    currentCategoryVideoIndex = (currentCategoryVideoIndex + 1) % categoryVideoElements.length;
    playCurrentCategoryVideo();
}

/* ==========================
    OBJETO ROUTER SPA
========================== */
const router = {
    views: {
        home: null,
        categories: null,
        newArrivals: null,
        product: null,
        search: null,
        account: null, 
        cart: null
    },

    showView(viewName) {
        // Inicialización de vistas
        if (!this.views.home) {
            this.views.home = document.getElementById('view-home');
            this.views.categories = document.getElementById('view-categories');
            this.views.newArrivals = document.getElementById('view-newArrivals');
            this.views.product = document.getElementById('view-product');
            this.views.search = document.getElementById('view-search'); 
            this.views.account = document.getElementById('view-account'); 
            this.views.cart = document.getElementById('view-cart');
        }
        
        Object.values(this.views).forEach(v => v?.classList.remove('active-view'));

        const targetView = this.views[viewName];

        // Clean up home resources when navigating away
        if (viewName !== 'home' && typeof cleanupHome === 'function') cleanupHome();
        if (targetView) {
            targetView.classList.add('active-view');
            
            // CORRECCIÓN: Usar solo window.scrollTo(0,0) para resetear el scroll de la página.
            // Eliminar el scroll al main-content que causaba conflictos en iOS.
            window.scrollTo(0,0); 

            // LOGICA ESPECIFICA DE VISTAS
            if (viewName === 'home') {
                
                // Mostrar los videos (Por defecto, Home muestra carruseles)
                if (typeof toggleHomeView === 'function') toggleHomeView(true);
                
                // Iniciar carruseles
                if (typeof initVideoCarousel === 'function') initVideoCarousel();
                if (typeof initCategoryVideoCarousel === 'function') initCategoryVideoCarousel();

                // Attempt to start playback immediately; overlay will appear if blocked.
                if (typeof attemptImmediateHomePlay === 'function') attemptImmediateHomePlay();
                
                // Limpiar productos (porque estamos en el home principal)
                const productsCont = document.getElementById("products");
                if (productsCont) productsCont.innerHTML = ""; 
                // Home does not render products here (keep home light)
            }

            if (viewName === 'categories') {
                // Cargar grid de categorías
                if (typeof loadCategoriesView === 'function') loadCategoriesView();
            }
            
            if (viewName === 'newArrivals') {
                if (typeof loadNewArrivals === 'function') loadNewArrivals();
            }
            
            if (viewName === 'search') {
                const searchInput = document.getElementById('searchInput');
                if(searchInput) searchInput.value = '';
                const searchResults = document.getElementById('searchResults');
                if(searchResults) searchResults.innerHTML = '';
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

        // Manejo de parámetros especiales
            if (viewToShow === 'product' && params.has('id')) {
            this.showView('product');
            if (typeof showProductDetail === 'function') {
                showProductDetail(params.get('id'));
            }
            return;
        }
        
        // Manejo de home con categoría seleccionada
        if (viewToShow === 'home' && params.has('categoria')) {
              this.showView('home');
              const categoria = params.get('categoria');
              if (typeof showCategory === 'function') {
                  // showCategory llama a toggleHomeView(false) para ocultar videos y mostrar productos.
                  showCategory(categoria); 
              }
              return;
        }

        // Rutas simples
        this.showView(viewToShow);
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
window.addEventListener('hashchange', () => router.handleRoute());
window.addEventListener('DOMContentLoaded', () => {
    router.handleRoute();

    // Try to enable playback on first user gesture (touch or click).
    function firstGestureHandler() {
        try { userGesturePlayAll(); } catch (e) {}
        document.removeEventListener('touchstart', firstGestureHandler, { passive: true });
        document.removeEventListener('click', firstGestureHandler);
    }

    document.addEventListener('touchstart', firstGestureHandler, { passive: true });
    document.addEventListener('click', firstGestureHandler);

    // Try to load image manifest (generated by tools/generate_responsive_images.js)
    try {
        fetch('/media/image-manifest.json').then(res => {
            if (!res.ok) return null;
            return res.json();
        }).then(json => {
            if (json) window.imageManifest = json;
            // After manifest loads, ensure any deferred images can pick up srcset
            try { observeLazyImages(); } catch (e) {}
        }).catch(()=>{});
    } catch (e) {}
});

/* ==========================
    CARRUSELES DE PRODUCTOS (Miniaturas en Grid)
========================== */
let carouselIntervals = {};

function initAllCarousels() {
    // Detener y limpiar intervalos anteriores
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
            // Inicializar carrusel automático
            const interval = setInterval(() => update((index + 1) % imgs.length), 3500);
            carouselIntervals[id] = interval;
        }

        // Eventos de botones de navegación (Prev/Next)
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
    MOSTRAR CATEGORÍA (Renderiza Productos)
========================== */
function showCategory(category) {
    const cont = document.getElementById("products");
    if(!cont) return;
    cont.innerHTML = "";

    // Ocultar los videos del home, mostrar solo productos
    toggleHomeView(false);

    const productsByCategory = products[category];
    if (!productsByCategory || productsByCategory.length === 0) {
        cont.innerHTML = `<p class="no">No products found in category ${category}.</p>`;
        return;
    }

    // If category is large, use virtualization (windowed rendering)
    const VIRTUALIZE_THRESHOLD = 40;
    if (productsByCategory.length > VIRTUALIZE_THRESHOLD) {
        // cleanup any previous virtual listeners
        if (cont.__virtualCleanup) { try { cont.__virtualCleanup(); } catch (e) {} }

        const list = productsByCategory;
        // create virtual list scaffolding
        cont.innerHTML = '<div class="virtual-list" style="position:relative"><div class="vs-top"></div><div class="vs-items"></div><div class="vs-bottom"></div></div>';
        const vs = cont.querySelector('.virtual-list');
        const vsTop = vs.querySelector('.vs-top');
        const vsItems = vs.querySelector('.vs-items');
        const vsBottom = vs.querySelector('.vs-bottom');

        // estimate item height by rendering a single invisible card
        const estimateCard = (function(){
            try {
                const tmp = document.createElement('div');
                tmp.style.position = 'absolute'; tmp.style.visibility = 'hidden'; tmp.style.left = '0';
                tmp.appendChild(buildResponsivePicture((Array.isArray(list[0].img)?list[0].img[0]:list[0].img) || 'media/img/placeholder.jpg', { loadImmediately: true, alt: list[0].nombre || 'Producto', index: 0 }));
                tmp.appendChild(document.createElement('h3'));
                cont.appendChild(tmp);
                const h = tmp.getBoundingClientRect().height || 260;
                cont.removeChild(tmp);
                return Math.max(120, Math.round(h));
            } catch (e) { return 260; }
        })();

        const itemHeight = estimateCard;
        const totalHeight = itemHeight * list.length;
        vsBottom.style.height = totalHeight + 'px';

        let rafId = null;
        const buffer = 6;

        function renderRange(start, end) {
            start = Math.max(0, start); end = Math.min(list.length, end);
            const topHeight = start * itemHeight;
            const bottomHeight = Math.max(0, totalHeight - end * itemHeight);
            vsTop.style.height = topHeight + 'px';
            vsBottom.style.height = bottomHeight + 'px';
            // create nodes
            vsItems.innerHTML = '';
            const frag = document.createDocumentFragment();
            for (let i = start; i < end; i++) {
                const prod = list[i];
                const card = document.createElement('div');
                card.className = 'card card-link';
                card.style.cursor = 'pointer';
                card.dataset.productId = prod.id;
                const imgsContainer = document.createElement('div'); imgsContainer.className = 'carousel';
                const imgsInner = document.createElement('div'); imgsInner.className = 'carousel-images';
                const allImgs = Array.isArray(prod.img) ? prod.img : (prod.img ? [prod.img] : []);
                const pic = buildResponsivePicture(allImgs[0] || 'media/img/placeholder.jpg', { loadImmediately: false, alt: prod.nombre || 'Producto', index: 0 });
                imgsInner.appendChild(pic);
                imgsContainer.appendChild(imgsInner);
                card.appendChild(imgsContainer);
                const title = document.createElement('h3'); title.textContent = prod.nombre || 'Producto';
                const price = document.createElement('p'); price.className = 'precio'; price.textContent = prod.precio || '';
                card.appendChild(title); card.appendChild(price);
                frag.appendChild(card);
            }
            vsItems.appendChild(frag);
            // Observe new images
            try { observeLazyImages(); } catch (e) {}
            attachProductClickHandler();
        }

        function onScroll() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
                const containerTop = cont.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
                const start = Math.floor((scrollTop - containerTop) / itemHeight) - buffer;
                const end = Math.ceil((scrollTop - containerTop + viewportHeight) / itemHeight) + buffer;
                renderRange(start, end);
            });
        }

        // initial render: first viewport
        renderRange(0, Math.min(list.length, Math.ceil(window.innerHeight / itemHeight) + buffer));
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        cont.__virtualCleanup = () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
            cont.__virtualCleanup = null;
        };
        return; // virtualization active
}

    // Fallback: small categories, render all at once (existing logic)
    const frag = document.createDocumentFragment();
    for (let i = 0; i < productsByCategory.length; i++) {
        const prod = productsByCategory[i];
        const card = document.createElement('div');
        card.className = 'card card-link';
        card.style.cursor = 'pointer';
        card.dataset.productId = prod.id;

        const allImgs = Array.isArray(prod.img) ? prod.img : (prod.img ? [prod.img] : []);
        const hasMultiple = allImgs.length > 1;

        let imgsContainer = document.createElement('div');
        imgsContainer.className = 'carousel';
        const imgsInner = document.createElement('div');
        imgsInner.className = 'carousel-images';

        if (hasMultiple) {
            allImgs.forEach((img, idx) => {
                const pic = buildResponsivePicture(img, { loadImmediately: idx === 0, alt: prod.nombre || 'Producto', index: idx });
                imgsInner.appendChild(pic);
            });
            imgsContainer.appendChild(imgsInner);
            const prev = document.createElement('button'); prev.className = 'prev'; prev.textContent = '‹'; prev.setAttribute('data-id', `carousel-${category}-${i}`);
            const next = document.createElement('button'); next.className = 'next'; next.textContent = '›'; next.setAttribute('data-id', `carousel-${category}-${i}`);
            imgsContainer.appendChild(prev);
            imgsContainer.appendChild(next);
            const dots = document.createElement('div'); dots.className = 'dots';
            allImgs.forEach((_, d) => {
                const span = document.createElement('span'); span.className = d === 0 ? 'dot active-dot' : 'dot'; span.setAttribute('data-index', d); span.setAttribute('data-id', `carousel-${category}-${i}`);
                dots.appendChild(span);
            });
            imgsContainer.appendChild(dots);
        } else {
            const imgSrc = allImgs[0] || 'media/img/placeholder.jpg';
            const pic = buildResponsivePicture(imgSrc, { loadImmediately: true, alt: prod.nombre || 'Producto', index: 0 });
            imgsInner.appendChild(pic);
            imgsContainer.appendChild(imgsInner);
        }

        const title = document.createElement('h3'); title.textContent = prod.nombre || 'Producto';
        const price = document.createElement('p'); price.className = 'precio'; price.textContent = prod.precio || '';

        card.appendChild(imgsContainer);
        card.appendChild(title);
        card.appendChild(price);
        frag.appendChild(card);
    }
    cont.appendChild(frag);
    try { observeLazyImages(); } catch (e) {}
    setTimeout(() => { animateProducts(); initAllCarousels(); }, 0);

    attachProductClickHandler();
}

/* ==========================
    BÚSQUEDA
========================== */
function searchProduct() {
    clearTimeout(searchProductTimeout);
    searchProductTimeout = setTimeout(() => {
        const inputEl = document.getElementById("searchInput");
        const texto = inputEl ? inputEl.value.toLowerCase() : '';
        const cont = document.getElementById("searchResults"); 
        if (!cont) return;
        cont.innerHTML = "";

        if (texto.length < 3) {
            cont.innerHTML = `<p class="no">Type at least 3 letters to search.</p>`;
            return;
        }

        let resultados = [];
        // Iterate the global products object
        for(const cat in products) {
            products[cat].forEach(prod=>{
                if(prod.nombre.toLowerCase().includes(texto)) resultados.push(prod);
            });
        }

        if(resultados.length===0) {
            cont.innerHTML = `<p class="no">No results found for "${escapeHtml(texto)}".</p>`;
            return;
        }

        // Build DOM nodes instead of large innerHTML strings for better incremental rendering
        const section = document.createElement('section');
        section.id = 'products';
        resultados.forEach((prod) => {
            const card = document.createElement('div');
            card.className = 'card card-link';
            card.dataset.productId = prod.id;
            card.style.cursor = 'pointer';

            const carousel = document.createElement('div'); carousel.className = 'carousel';
            const inner = document.createElement('div'); inner.className = 'carousel-images';
            const imgSrc = Array.isArray(prod.img) ? prod.img[0] : prod.img;
            const pic = buildResponsivePicture(imgSrc || 'media/img/placeholder.jpg', { loadImmediately: true, alt: prod.nombre || 'Product', index: 0 });
            inner.appendChild(pic);
            carousel.appendChild(inner);
            card.appendChild(carousel);

            const h3 = document.createElement('h3'); h3.textContent = prod.nombre;
            const p = document.createElement('p'); p.className = 'precio'; p.textContent = prod.precio;
            card.appendChild(h3); card.appendChild(p);

            section.appendChild(card);
        });
        cont.appendChild(section);

        // ensure delegation and lazy images are applied
        attachProductClickHandler();
        try { observeLazyImages(); } catch (e) {}
        setTimeout(animateProducts, 250);
    }, 250);
}

/* ==========================
    ANIMACIÓN
========================== */
function animateProducts() {
    document.querySelectorAll(".card").forEach((card,i)=>{
        setTimeout(()=>card.classList.add("show"), 80*i);
    });
}

/* ==========================
    RENDER HOME PRODUCTS (Incremental)
   Render the homepage product feed in small chunks. If a global `homeProducts`
   array exists it will be used; otherwise we flatten `products`.
========================== */
function renderHomeProducts() {
    const cont = document.getElementById('products');
    if (!cont) return;
    cont.innerHTML = '';

    // Build feed: prefer `homeProducts` if present (allows curated feed), else flatten all categories
    let feed = (typeof homeProducts !== 'undefined' && Array.isArray(homeProducts)) ? homeProducts : [];
    if (feed.length === 0 && typeof products !== 'undefined') {
        for (const cat in products) {
            if (Array.isArray(products[cat])) feed = feed.concat(products[cat]);
        }
    if (!feed || feed.length === 0) return;

    // --- Virtualization for home feed ---
    const VIRTUALIZE_THRESHOLD = 30;
    const SKELETON_COUNT = 8;
    const bufferRows = 4;
    const cardHeight = 260;
    const total = feed.length;
    let scrollHandler = null;
    let resizeHandler = null;
    let cleanupVirtual = null;
    if (cont.__virtualCleanup) { try { cont.__virtualCleanup(); } catch (e) {} }

    if (total > VIRTUALIZE_THRESHOLD) {
        cont.innerHTML = '<div class="virtual-list" style="position:relative"><div class="vs-top"></div><div class="vs-items"></div><div class="vs-bottom"></div></div>';
        const vs = cont.querySelector('.virtual-list');
        const vsTop = vs.querySelector('.vs-top');
        const vsItems = vs.querySelector('.vs-items');
        const vsBottom = vs.querySelector('.vs-bottom');
        const totalHeight = cardHeight * total;
        vsBottom.style.height = totalHeight + 'px';
        // Skeletons for first paint
        vsItems.innerHTML = '';
        for (let i = 0; i < SKELETON_COUNT; i++) {
            const skel = document.createElement('div');
            skel.className = 'card card-skeleton';
            skel.style.height = cardHeight + 'px';
            vsItems.appendChild(skel);
        }
        setTimeout(() => {
            function renderRange() {
                const scrollTop = window.scrollY || window.pageYOffset || 0;
                const contTop = cont.getBoundingClientRect().top + scrollTop;
                const viewportHeight = window.innerHeight || 800;
                const startIdx = Math.max(0, Math.floor((scrollTop - contTop) / cardHeight) - bufferRows);
                const endIdx = Math.min(total, Math.ceil((scrollTop - contTop + viewportHeight) / cardHeight) + bufferRows);
                vsTop.style.height = (startIdx * cardHeight) + 'px';
                vsBottom.style.height = ((total - endIdx) * cardHeight) + 'px';
                vsItems.innerHTML = '';
                for (let i = startIdx; i < endIdx; i++) {
                    const prod = feed[i];
                    const card = document.createElement('div');
                    card.className = 'card card-link';
                    card.style.cursor = 'pointer';
                    card.dataset.productId = prod.id;
                    const allImgs = Array.isArray(prod.img) ? prod.img : (prod.img ? [prod.img] : []);
                    const imgSrc = allImgs[0] || 'media/img/placeholder.jpg';
                    const pic = buildResponsivePicture(imgSrc, { loadImmediately: false, alt: prod.nombre || 'Producto', index: 0 });
                    pic.querySelector('img').setAttribute('loading', 'lazy');
                    card.appendChild(pic);
                    const title = document.createElement('h3'); title.textContent = prod.nombre || 'Producto';
                    const price = document.createElement('p'); price.className = 'precio'; price.textContent = prod.precio || '';
                    card.appendChild(title); card.appendChild(price);
                    vsItems.appendChild(card);
                }
                try { observeLazyImages(); } catch (e) {}
                attachProductClickHandler();
            }
            renderRange();
            scrollHandler = () => { renderRange(); };
            resizeHandler = () => { renderRange(); };
            window.addEventListener('scroll', scrollHandler, { passive: true });
            window.addEventListener('resize', resizeHandler);
        }, 0);
        cleanupVirtual = () => {
            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('resize', resizeHandler);
            cont.__virtualCleanup = null;
        };
        cont.__virtualCleanup = cleanupVirtual;
        return;
    }
    // Fallback: small feeds, render all at once (existing logic)

}

// Build a responsive <picture> element using the image manifest when available.
function buildResponsivePicture(src, { loadImmediately = false, alt = '', index = 0 } = {}) {
    const pic = document.createElement('picture');
    const manifestEntry = (window.imageManifest && window.imageManifest[src]) ? window.imageManifest[src] : null;

    if (manifestEntry && manifestEntry.srcset_avif) {
        const s = document.createElement('source'); s.type = 'image/avif'; s.srcset = normalizeSrcset(manifestEntry.srcset_avif); if (manifestEntry.sizes) s.sizes = manifestEntry.sizes; pic.appendChild(s);
    }
    if (manifestEntry && manifestEntry.srcset_webp) {
        const s2 = document.createElement('source'); s2.type = 'image/webp'; s2.srcset = normalizeSrcset(manifestEntry.srcset_webp); if (manifestEntry.sizes) s2.sizes = manifestEntry.sizes; pic.appendChild(s2);
    }

    const img = document.createElement('img');
    img.alt = alt || '';
    img.className = index === 0 ? 'active loading' : 'loading';
    img.loading = 'lazy'; img.decoding = 'async';

    if (manifestEntry && manifestEntry.width && manifestEntry.height) {
        // set moderate display width to help layout (not necessarily full original)
        img.width = Math.min(manifestEntry.width, 600);
        img.height = Math.round(img.width * (manifestEntry.height / manifestEntry.width));
    }

    if (loadImmediately) {
        if (manifestEntry && manifestEntry.default) {
            img.src = normalizeManifestPath(manifestEntry.default);
            if (manifestEntry.srcset_avif) img.srcset = normalizeSrcset(manifestEntry.srcset_avif);
            else if (manifestEntry.srcset_webp) img.srcset = normalizeSrcset(manifestEntry.srcset_webp);
            if (manifestEntry.sizes) img.sizes = manifestEntry.sizes;
        } else {
            img.src = src;
        }
    } else {
        // defer loading
        img.dataset.src = (manifestEntry && manifestEntry.default) ? normalizeManifestPath(manifestEntry.default) : src;
        img.src = LAZY_PLACEHOLDER;
        img.dataset.manifest = src;
    }

    img.addEventListener('load', () => { img.classList.remove('loading'); img.classList.add('loaded'); });
    pic.appendChild(img);
    return pic;
}
// Lightweight manifest getter (handles late-loaded manifest)
function getManifestEntry(key) {
    if (!key) return null;
    try { return (window.imageManifest && window.imageManifest[key]) ? window.imageManifest[key] : null; } catch (e) { return null; }
}

// Decide chunk sizes based on viewport to prioritize first-paint on mobile
function getChunkSize(preferred = 20) {
    try {
        const w = window.innerWidth || document.documentElement.clientWidth || 1024;
        if (w < 480) return Math.max(6, Math.floor(preferred / 3));
        if (w < 900) return Math.max(8, Math.floor(preferred / 2));
        return preferred;
    } catch (e) { return preferred; }
}

// Centralized click handler for product cards (uses delegation)
function attachProductClickHandler() {
    const container = document.getElementById('products');
    if (!container || container.__productClickAttached) return;
    container.addEventListener('click', (ev) => {
        let el = ev.target;
        // walk up until card element
        while (el && el !== container && !el.classList?.contains('card')) el = el.parentNode;
        if (!el || el === container) return;
        const id = el.dataset.productId;
        if (id) router.goTo(`product?id=${encodeURIComponent(id)}`);
    });
    container.__productClickAttached = true;
}
}