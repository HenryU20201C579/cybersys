frappe.ready(() => {
    cargarProductos();
});

function cargarProductos() {
    frappe.call({
        method: "cybersys.api.stock.get_products",
        callback: function(r) {
            if (r.message) {
                renderizarProductos(r.message);
            } else {
                document.getElementById("products-container").innerHTML =
                    "<p>No se encontraron productos.</p>";
            }
        }
    });
}

function renderizarProductos(productos) {
    const container = document.getElementById("products-container");
    container.innerHTML = "";

    productos.forEach(prod => {
        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
            <img src="${prod.image || '/assets/frappe/images/ui/no-image.png'}" alt="${prod.item_name}">
            <h3>${prod.item_name}</h3>
            <p><strong>Grupo:</strong> ${prod.item_group}</p>
            <p><strong>Precio:</strong> ${prod.standard_rate || "N/A"} </p>
            <p><strong>UOM:</strong> ${prod.stock_uom}</p>
            <p>${prod.description || ""}</p>
        `;
        container.appendChild(card);
    });
}
