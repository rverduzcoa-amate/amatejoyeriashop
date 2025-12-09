const categorias = [
    { 
        nombre: "Pulseras", 
        icon: "img/icons/pulseras.png", 
        link: "index.html#pulseras" 
    },
    {
        nombre: "Cadenas",
         icon: "img/icons/cadenas.png",
          link: "index.html#cadenas" },
    { 
        nombre: "Layers",
        icon: "img/icons/layers.png",
        link: "index.html#layers" 
    },
    { 
        nombre: "Aretes", 
        icon: "img/icons/aretes.png", 
        link: "index.html#aretes" 
    },
    { 
        nombre: "Anillos", 
        icon: "img/icons/anillos.png", 
        link: "index.html#anillos" 
    },
    { 
        nombre: "Piercings", 
        icon: "img/icons/piercings.png", 
        link: "index.html#piercings" 
    },
    { 
        nombre: "Relojes", 
        icon: "img/icons/relojes.png", 
        link: "index.html#relojes" 
    },
];

const cont = document.getElementById("categorias");
categorias.forEach(cat => {
    const card = document.createElement("div");
    card.classList.add("categoria-card");

    card.innerHTML = `
        <a href="${cat.link}">
            <img src="${cat.icon}" alt="${cat.nombre}">
            <p>${cat.nombre}</p>
        </a>
    `;

    cont.appendChild(card);
});
