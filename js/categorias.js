const categorias = [
    { nombre: "Pulseras", icon: "media/img/icons/pulseras.png", key: "pulseras" },
    { nombre: "Cadenas", icon: "media/img/icons/cadenas.png", key: "cadenas" },
    { nombre: "Layers", icon: "media/img/icons/layers.png", key: "layers" },
    { nombre: "Aretes", icon: "media/img/icons/aretes.png", key: "aretes" },
    { nombre: "Anillos", icon: "media/img/icons/anillos.png", key: "anillos" },
    { nombre: "Piercings", icon: "media/img/icons/piercings.png", key: "piercings" },
    { nombre: "Relojes", icon: "media/img/icons/relojes.png", key: "relojes" },
];

function loadCategoriesView() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return; 

    grid.innerHTML = ''; 

    categorias.forEach(cat => {
        const card = document.createElement("div");
        card.classList.add("category-card"); 

        card.innerHTML = `
            <img src="${cat.icon}" alt="${cat.nombre}">
            <p>${cat.nombre}</p>
        `;

        card.addEventListener('click', () => {
            router.goTo(`home?categoria=${cat.key}`);
        });

        grid.appendChild(card);
    });
}


function generateHomeNavButtons() {
    const navCont = document.getElementById("navCategorias"); 
    if (!navCont) return;
    
    navCont.innerHTML = ''; 

    categorias.forEach(cat => {
        const button = document.createElement("button");
        button.textContent = cat.nombre;
        button.onclick = () => {
            router.goTo(`home?categoria=${cat.key}`);
        };
        navCont.appendChild(button);
    });
}