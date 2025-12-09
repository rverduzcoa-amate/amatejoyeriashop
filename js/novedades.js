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
        cont.innerHTML = `<p>No hay novedades por ahora.</p>`;
        return;
    }

    nuevos.forEach((prod, i) => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <img src="${prod.img}" alt="${prod.nombre}">
            <h3>${prod.nombre}</h3>
            <p class="precio">${prod.precio}</p>
            <a class="btn" href="https://wa.me/52TU_NUMERO?text=Hola!%20Me%20interesa%20${prod.nombre}" target="_blank">Comprar</a>
        `;

        cont.appendChild(card);

        setTimeout(() => card.classList.add("show"), i * 150);
    });
}

cargarNovedades();