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
}

/* ==========================
    CARRUSEL DE VIDEOS (Reels Global con SWIPE)
========================== */
let currentVideoIndex = 0;
let videoElements = [];
let touchStartX = 0;

function initVideoCarousel() {
    const container = document.getElementById('videoSlides');
    // Validamos que existan datos de videos
    if (!container || typeof videosHome === 'undefined' || videosHome.length === 0) {
        return;
    }

    container.innerHTML = videosHome.map((video, index) => `
        <div id="reel-${index}" class="video-slide-item ${index === 0 ? 'active' : ''}">
            <video preload="auto" playsinline muted ${video.poster ? `poster="${video.poster}"` : ''}>
                <source src="${video.src}" type="video/mp4">
            </video>
        </div>
    `).join('');

    videoElements = [];
    videosHome.forEach((_, index) => {
        const slide = document.getElementById(`reel-${index}`);
        const video = slide.querySelector('video');
        
        video.addEventListener('ended', goToNextVideo);
        // Fix para móviles: forzar tiempo 0 al cargar
        video.addEventListener('loadedmetadata', () => { video.currentTime = 0; });
        
        videoElements.push({ slide, video });
    });
    
    // Eventos de Swipe (Passive true mejora rendimiento de scroll)
    const carouselContainer = document.getElementById('videoCarouselContainer');
    if (carouselContainer) {
        carouselContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        carouselContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
        carouselContainer.addEventListener('touchend', handleTouchEnd);
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
        currentItem.video.play().catch(error => {
            // Es normal que falle autoplay en móviles si no hay interacción, no es un error crítico
            // console.warn("Autoplay bloqueado.", error.name);
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
            
            <video preload="auto" playsinline muted ${video.poster ? `poster="${video.poster}"` : ''}>
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
            // console.warn("Autoplay categoría bloqueado.", error.name);
        });
    }, 50); 
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
        categorias: null,
        novedades: null,
        producto: null,
        busqueda: null,
        cuenta: null, 
        cart: null
    },

    showView(viewName) {
        // Inicialización de vistas
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
                
                // Limpiar productos (porque estamos en el home principal)
                const productsCont = document.getElementById("products");
                if (productsCont) productsCont.innerHTML = ""; 
            }

            if (viewName === 'categorias') {
                // Cargar grid de categorías
                if (typeof cargarVistaCategorias === 'function') cargarVistaCategorias();
            }
            
            if (viewName === 'novedades') {
                if (typeof cargarNovedades === 'function') cargarNovedades();
            }
            
            if (viewName === 'busqueda') {
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
        if (viewToShow === 'producto' && params.has('id')) {
            this.showView('producto');
            if (typeof mostrarDetalleProducto === 'function') {
                mostrarDetalleProducto(params.get('id'));
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
window.addEventListener('DOMContentLoaded', () => {
    router.handleRoute();
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

    // Aquí se asume que la variable global `productos` (cargada por productos.js) está disponible
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
                    <div class="carousel-images">${imgContainerHTML}</div>
                    <button class="prev" data-id="${carouselId}">‹</button>
                    <button class="next" data-id="${carouselId}">›</button>
                    <div class="dots">
                        ${allImgs.map((_, i) => `<span class="dot ${i === 0 ? 'active-dot' : ''}" data-index="${i}" data-id="${carouselId}"></span>`).join('')}
                    </div>
                </div>
            `;
        } else {
            const imgSrc = allImgs[0] || 'media/img/placeholder.jpg';
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
    BÚSQUEDA
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
    // Recorrer el objeto global de productos (asumiendo que viene de productos.js)
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
    // Se inserta el contenedor de productos con la clase products para que aplique el grid
    cont.innerHTML = `<section id="products">${htmlContent.join('')}</section>`;
    
    setTimeout(animarProductos, 250);
}

/* ==========================
    ANIMACIÓN
========================== */
function animarProductos() {
    document.querySelectorAll(".card").forEach((card,i)=>{
        setTimeout(()=>card.classList.add("show"), 80*i);
    });
}