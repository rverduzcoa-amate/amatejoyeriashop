function cargarNovedades() {
    const cont = document.getElementById("novedades");
    cont.innerHTML = ""; 

    let nuevos = [];

    for (let categoria in productos) {
        productos[categoria].forEach(p => {
            if (p.nuevo === true) nuevos.push(p);
        });
    }

    if (nuevos.length === 0) {
        cont.innerHTML = `<p class="no">No hay novedades por ahora.</p>`;
        return;
    }

    let htmlContent = [];

    nuevos.forEach((prod) => {
        const allImgs = Array.isArray(prod.img) ? prod.img : [prod.img];
        // Usamos la primera imagen (ya corregida en productos.js)
        const imgSrc = allImgs[0] || '/media/img/placeholder.jpg'; 

        htmlContent.push(`
            <div class="card show">
                <a href="#producto?id=${prod.id}" class="card-link" onclick="router.goTo('producto?id=${prod.id}'); return false;">
                    <div class="carousel"> 
                        <div class="carousel-images">
                            <img src="${imgSrc}" alt="${prod.nombre}" class="active">
                        </div>
                    </div>
                    <h3>${prod.nombre}</h3>
                    <p class="precio">${prod.precio}</p>
                </a>
                <a class="btn" 
                    href="https://wa.me/526674181851?text=Hola!%20Me%20interesa%20${prod.nombre}" 
                    target="_blank">
                    Comprar
                </a>
            </div>
        `);
    });

    cont.innerHTML = htmlContent.join('');
    
    // Animación de tarjetas
    setTimeout(() => {
        const cards = cont.querySelectorAll('.card');
        cards.forEach((card, i) => {
            setTimeout(() => card.classList.add("show"), i * 100);
        });
    }, 0);
}