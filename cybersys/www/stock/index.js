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
    products.forEach(p => {
        let card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-name">${p.item_name}</div>
            <div class="product-price">S/ ${p.standard_rate || "0.00"}</div>
        `;
        productList.appendChild(card);
    });
}
