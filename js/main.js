/* ===========================================
   CONTROL GLOBAL PARA DETENER CARRUSELES
=========================================== */
let carouselIntervals = {};

/* ==========================
   MOSTRAR CATEGORÍA
========================== */
function showCategory(category) {
    const cont = document.getElementById("products");
    cont.innerHTML = "";

    // ❗ Apagar todos los carruseles anteriores
    Object.values(carouselIntervals).forEach(interval => clearInterval(interval));
    carouselIntervals = {};

    productos[category].forEach((prod, index) => {

        let imgsHTML = "";

        if (Array.isArray(prod.img)) {
            const carouselId = `carousel-${category}-${index}`;

            imgsHTML = `
                <div class="carousel" id="${carouselId}">
                    <div class="carousel-images">
                        ${prod.img.map((img, i) => `
                            <img src="${img}" class="${i === 0 ? 'active' : ''}">
                        `).join('')}
                    </div>

                    <button class="prev" data-id="${carouselId}">‹</button>
                    <button class="next" data-id="${carouselId}">›</button>

                    <div class="dots">
                        ${prod.img.map((_, i) => `
                            <span class="dot ${i===0 ? 'active-dot':''}" data-id="${carouselId}" data-index="${i}"></span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            imgsHTML = `
                <div class="carousel">
                    <img src="${prod.img}" class="active">
                </div>
            `;
        }

        const numeroVendedor = "526674181851"; // reemplaza con tu número real
        cont.innerHTML += `
            <div class="card">
                ${imgsHTML}
                <h3>${prod.nombre}</h3>
                <p class="precio">${prod.precio}</p>
                <a class="btn" 
                href="https://wa.me/${numeroVendedor}?text=${encodeURIComponent(
                    `Hola me encanto esta pieza, quisiera comprarla: ${window.location.href}`
                )}" 
                target="_blank">
                Comprar por WhatsApp
                </a>
            </div>
        `;

    });

    // Activar carruseles nuevos
    setTimeout(animarProductos, 50);
    initAllCarousels();
}

/* ==========================
   INICIAR TODOS LOS CARRUSELES
========================== */
function initAllCarousels() {
    document.querySelectorAll(".carousel").forEach(carousel => {
        const id = carousel.id;
        if (id) initCarousel(id);
    });
}

/* ==========================
   INICIAR CARRUSEL INDIVIDUAL
========================== */
function initCarousel(id) {
    const carousel = document.getElementById(id);
    const imgs = carousel.querySelectorAll("img");
    const dots = carousel.querySelectorAll(".dot");

    let index = 0;

    function update(newIndex) {
        imgs[index].classList.remove("active");
        dots[index].classList.remove("active-dot");

        index = newIndex;

        imgs[index].classList.add("active");
        dots[index].classList.add("active-dot");
    }

    const interval = setInterval(() => {
        update((index + 1) % imgs.length);
    }, 5000);

    carouselIntervals[id] = interval;
}

/* ==========================
   CONTROLES DEL CARRUSEL
========================== */
document.addEventListener("click", e => {
    if (e.target.classList.contains("next") || e.target.classList.contains("prev")) {
        const id = e.target.dataset.id;
        const carousel = document.getElementById(id);
        const imgs = carousel.querySelectorAll("img");
        const dots = carousel.querySelectorAll(".dot");

        let index = [...imgs].findIndex(i => i.classList.contains("active"));
        let newIndex = index;

        if (e.target.classList.contains("next")) {
            newIndex = (index + 1) % imgs.length;
        } else {
            newIndex = (index - 1 + imgs.length) % imgs.length;
        }

        imgs[index].classList.remove("active");
        dots[index].classList.remove("active-dot");
        imgs[newIndex].classList.add("active");
        dots[newIndex].classList.add("active-dot");
    }

    if (e.target.classList.contains("dot")) {
        const id = e.target.dataset.id;
        const newIndex = Number(e.target.dataset.index);

        const carousel = document.getElementById(id);
        const imgs = carousel.querySelectorAll("img");
        const dots = carousel.querySelectorAll(".dot");

        const index = [...imgs].findIndex(i => i.classList.contains("active"));

        imgs[index].classList.remove("active");
        dots[index].classList.remove("active-dot");

        imgs[newIndex].classList.add("active");
        dots[newIndex].classList.add("active-dot");
    }
});

/* ==========================
    BUSQUEDA
========================== */
function buscarProducto() {
    const texto = document.getElementById("searchInput").value.toLowerCase();
    const cont = document.getElementById("products");
    cont.innerHTML = "";

    let resultados = [];

    for (const categoria in productos) {
        productos[categoria].forEach(prod => {
            if (prod.nombre.toLowerCase().includes(texto)) {
                resultados.push({ ...prod });
            }
        });
    }

    if (resultados.length === 0) {
        cont.innerHTML = `<p class="no">No se encontraron productos.</p>`;
        return;
    }

    resultados.forEach(prod => {

        let imagenesHTML = "";

        if (Array.isArray(prod.img)) {
            imagenesHTML = `
                <div class="carousel">
                    ${prod.img.map((img, i) => `
                        <img src="${img}" class="${i === 0 ? 'active' : ''}">
                    `).join("")}

                    <div class="dots">
                        ${prod.img.map((_, i) => `
                            <span class="dot ${i === 0 ? 'active-dot' : ''}" data-index="${i}"></span>
                        `).join("")}
                    </div>

                    <button class="prev">‹</button>
                    <button class="next">›</button>
                </div>
            `;
        } else {
            imagenesHTML = `
                <div class="carousel">
                    <img src="${prod.img}" class="active">
                </div>
            `;
        }

        cont.innerHTML += `
            <div class="card">
                ${imagenesHTML}
                <h3>${prod.nombre}</h3>
                <p class="precio">${prod.precio}</p>
                <a class="btn" href="https://wa.me/52TU_NUMERO?text=Hola!%20Me%20interesa%20${prod.nombre}" target="_blank">Comprar por WhatsApp</a>
            </div>
        `;
    });

    setTimeout(animarProductos, 250);
}

/* ==========================
    Animación
========================== */
function animarProductos() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, i) => {
        setTimeout(() => {
            card.classList.add("show");
        }, 80 * i);
    });
}

function scrollToCategories() {
    const nav = document.querySelector(".categories");
    if (nav) {
        nav.scrollIntoView({ behavior: "smooth" });
    }
}

// Si la URL tiene #categories al cargar, mostrar la primera categoría
window.addEventListener("DOMContentLoaded", () => {
    if(window.location.hash === "#categories") {
        showCategory("pulseras"); // Mostrar la primera categoría
        document.getElementById("products").scrollIntoView({ behavior: "smooth" });
    }
});

// Al cargar la página, revisar si hay ?categoria=algo en la URL
function cargarCategoriaDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('categoria');

    if (cat && productos[cat]) {
        showCategory(cat);
        // Opcional: hacer scroll hasta la sección de productos
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }
}

// Ejecutarlo al cargar
window.addEventListener('DOMContentLoaded', cargarCategoriaDesdeURL);
