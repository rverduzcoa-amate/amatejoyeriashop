const categories = [
    { name: "Pulseras", icon: "media/img/icons/pulseras.png", key: "pulseras" },
    { name: "Cadenas", icon: "media/img/icons/cadenas.png", key: "cadenas" },
    { name: "Layers", icon: "media/img/icons/layers.png", key: "layers" },
    { name: "Aretes", icon: "media/img/icons/aretes.png", key: "aretes" },
    { name: "Anillos", icon: "media/img/icons/anillos.png", key: "anillos" },
    { name: "Piercings", icon: "media/img/icons/piercings.png", key: "piercings" },
    { name: "Relojes", icon: "media/img/icons/relojes.png", key: "relojes" },
];

function loadCategoriesView() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return; 

    grid.innerHTML = ''; 

    categories.forEach(cat => {
        const card = document.createElement("div");
        card.classList.add("category-card"); 

        card.innerHTML = `
            <img src="${cat.icon}" alt="${cat.name}">
            <p>${cat.name}</p>
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

    categories.forEach(cat => {
        const button = document.createElement("button");
        button.textContent = cat.name;
        button.onclick = () => {
            router.goTo(`home?categoria=${cat.key}`);
        };
        navCont.appendChild(button);
    });
}
