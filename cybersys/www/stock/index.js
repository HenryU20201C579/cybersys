let productList = document.getElementById("product-list");

frappe.ready(() => {
    frappe.call({
        method: "cybersys.api.stock.get_products",
        callback: function (r) {
            if (r.message) {
                render_products(r.message);
            }
        }
    });
});

function render_products(products) {
    productList.innerHTML = "";

    // Agrupar por categoría
    const grouped = {};
    products.forEach(p => {
        if (!grouped[p.item_group]) {
            grouped[p.item_group] = [];
        }
        grouped[p.item_group].push(p);
    });

    // Crear secciones por categoría
    for (const [category, items] of Object.entries(grouped)) {
        let section = document.createElement("div");
        section.className = "category-section";

        section.innerHTML = `<h2 class="category-title">${category}</h2>`;

        let grid = document.createElement("div");
        grid.className = "product-grid";

        items.forEach(p => {
            let card = document.createElement("div");
            card.className = "product-card";

            card.innerHTML = `
                <img src="${p.image || '/assets/frappe/images/no-image.png'}" 
                     alt="${p.item_name}" class="product-img"/>
                <div class="product-name">${p.item_name}</div>
                <div class="product-price">S/ ${p.standard_rate || "0.00"}</div>
            `;
            grid.appendChild(card);
        });

        section.appendChild(grid);
        productList.appendChild(section);
    }
}
