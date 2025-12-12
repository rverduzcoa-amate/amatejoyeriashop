function loadNewArrivals() {
    const cont = document.getElementById("novedades");
    cont.innerHTML = ""; 

    let nuevos = [];

    for (let categoria in products) {
        products[categoria].forEach(p => {
            if (p.nuevo === true) nuevos.push(p);
        });
    }

    if (nuevos.length === 0) {
        cont.innerHTML = `<p class="no">No new arrivals at the moment.</p>`;
        return;
    }

    let htmlContent = [];

    nuevos.forEach((prod) => {
        const allImgs = Array.isArray(prod.img) ? prod.img : [prod.img];
        const imgSrc = allImgs[0] || '/media/img/placeholder.jpg'; 

            htmlContent.push(`
            <div class="card show">
                <a href="#product?id=${prod.id}" class="card-link" onclick="router.goTo('product?id=${prod.id}'); return false;">
                    <div class="carousel"> 
                        <div class="carousel-images">
                            <img src="${imgSrc}" alt="${escapeHtml(prod.nombre)}" class="active">
                        </div>
                    </div>
                    <h3>${prod.nombre}</h3>
                    <p class="precio">${prod.precio}</p>
                </a>
                <a class="btn" 
                    href="https://wa.me/526674181851?text=Hola!%20Me%20interesa%20${encodeURIComponent(prod.nombre)}" 
                    target="_blank">
                    Buy
                </a>
            </div>
        `);
    });

    cont.innerHTML = htmlContent.join('');
    
    // Card animation
    setTimeout(() => {
        const cards = cont.querySelectorAll('.card');
        cards.forEach((card, i) => {
            setTimeout(() => card.classList.add("show"), i * 100);
        });
    }, 0);
}