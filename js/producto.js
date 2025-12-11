/**
 * Muestra el detalle de un producto específico, llamado por el router.
 * @param {string} id - El ID del producto a buscar.
 */
function mostrarDetalleProducto(id) {
    const detalleContenedor = document.getElementById("producto-detalle");
    if (!detalleContenedor) return;
    
    detalleContenedor.innerHTML = '<p>Cargando producto...</p>';

    // 1. Buscar el producto
    if (!id) {
        detalleContenedor.innerHTML = "<p>Error: No se encontró el ID del producto.</p>";
        return;
    }

    let productoEncontrado = null;
    for (const categoria in productos) {
        const encontrado = productos[categoria].find(p => p.id == id); 
        if (encontrado) {
            productoEncontrado = encontrado;
            break;
        }
    }

    if (!productoEncontrado) {
        detalleContenedor.innerHTML = "<p>Producto no disponible.</p>";
        return;
    }

    // 2. POBULAR ESTRUCTURA HTML
    detalleContenedor.innerHTML = `
        <div class="carousel-container">
            <div class="carousel" id="carouselDetalle"></div>
            <div class="carousel-buttons">
                <button id="prevBtn">❮</button>
                <button id="nextBtn">❯</button>
            </div>
            <div class="carousel-dots" id="carouselDots"></div>
        </div>
        <div id="productInfo"></div>
    `;

    // 3. CARRUSEL DE IMÁGENES Y LÓGICA (SOLUCIÓN FADE)
    const carousel = document.getElementById("carouselDetalle");
    const dotsContainer = document.getElementById("carouselDots");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    let index = 0; 
    let imagenes = Array.isArray(productoEncontrado.img)
        ? productoEncontrado.img
        : [productoEncontrado.img];
    
    // Remplazar el array si está vacío
    if(imagenes.length === 0 || !imagenes[0]) {
        imagenes = ['/media/img/placeholder.jpg'];
    }

    // Inyectar las imágenes.
    carousel.innerHTML = imagenes.map((img, i) => `
        <img src="${img}" 
             class="carousel-img ${i === 0 ? 'active-img' : ''}"> 
    `).join("");

    // Generar dots
    dotsContainer.innerHTML = imagenes.map((_, i) =>
        `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
    ).join("");
    
    // FUNCIONES DEL CARRUSEL
    function updateCarousel() {
        dotsContainer.querySelectorAll(".dot").forEach((d, i) => {
            d.classList.toggle("active", i === index);
        });
        
        const allImages = carousel.querySelectorAll(".carousel-img");
        allImages.forEach((img, i) => {
            img.classList.toggle("active-img", i === index); 
        });
    }   

    // Eventos de Navegación (solo si hay más de 1 imagen)
    if (imagenes.length > 1) {
        if (nextBtn) {
            nextBtn.onclick = () => {
                index = (index + 1) % imagenes.length;
                updateCarousel();
            };
        }

        if (prevBtn) {
            prevBtn.onclick = () => {
                index = (index - 1 + imagenes.length) % imagenes.length;
                updateCarousel();
            };
        }
        
        // Eventos de Dots
        dotsContainer.querySelectorAll(".dot").forEach(dot => {
            dot.onclick = () => {
                index = Number(dot.dataset.index);
                updateCarousel();
            };
        });

        // Swipe táctil
        let startX = 0;
        carousel.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
        });
        carousel.addEventListener("touchend", e => {
            let endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) { // Swipe izquierda -> Siguiente
                index = (index + 1) % imagenes.length;
                updateCarousel();
            } else if (endX - startX > 50) { // Swipe derecha -> Anterior
                index = (index - 1 + imagenes.length) % imagenes.length;
                updateCarousel();
            }
        });
    } else {
        // Ocultar botones y dots si es una sola imagen
        if(prevBtn) prevBtn.style.display = 'none';
        if(nextBtn) nextBtn.style.display = 'none';
        if(dotsContainer) dotsContainer.style.display = 'none';
    }


    // 4. INFO DEL PRODUCTO
    document.getElementById("productInfo").innerHTML = `
        <h2>${productoEncontrado.nombre}</h2>
        <p class="precio">${productoEncontrado.precio}</p>
        <p>${productoEncontrado.descripcion || ''}</p>

        <a class="btn-wsp" href="https://wa.me/526674181851?text=Hola! Me interesa el producto: ${productoEncontrado.nombre}">
            Comprar por WhatsApp
        </a>
    `;

    // 5. INICIALIZACIÓN
    updateCarousel(); 
}