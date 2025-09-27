
let allProducts = [];

async function loadProducts() {
    try {
        const response = await frappe.call({
            method: "cybersys.api.stock.get_products"
        });
        allProducts = response.message || [];
        initFilters();
        renderProducts(allProducts);
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

function renderProducts(products) {
    const tbody = document.getElementById("product-list");
    tbody.innerHTML = "";

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No se encontraron productos</td></tr>`;
        return;
    }

    products.forEach(p => {
        const hasImage = p.image && !p.image.includes("placeholder.png");

        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.item_code}</td>
            <td>${p.item_name}</td>
            <td>${p.item_group}</td>
            <td>S/ ${p.standard_rate ? p.standard_rate.toFixed(2) : "0.00"}</td>
            <td>
                <img src="${hasImage ? p.image : '/files/placeholder.png'}" 
                     alt="${hasImage ? p.item_name : 'Sin Imagen'}">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function initFilters() {
    // Categorías
    const categorySelect = document.getElementById("category-filter");
    const uniqueCategories = [...new Set(allProducts.map(p => p.item_group))];
    categorySelect.innerHTML = `<option value="">Todas</option>`;
    uniqueCategories.forEach(c => {
        categorySelect.innerHTML += `<option value="${c}">${c}</option>`;
    });

    // Rango de precios
    const prices = allProducts.map(p => p.standard_rate || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    const minInput = document.getElementById("min-price");
    const maxInput = document.getElementById("max-price");
    const minLabel = document.getElementById("min-price-label");
    const maxLabel = document.getElementById("max-price-label");

    minInput.min = min;
    minInput.max = max;
    minInput.value = min;
    maxInput.min = min;
    maxInput.max = max;
    maxInput.value = max;

    minLabel.textContent = `S/${min}`;
    maxLabel.textContent = `S/${max}`;

    // Listeners
    document.getElementById("search").addEventListener("input", applyFilters);
    categorySelect.addEventListener("change", applyFilters);
    minInput.addEventListener("input", applyFilters);
    maxInput.addEventListener("input", applyFilters);
    document.getElementById("sort").addEventListener("change", applyFilters);
    document.getElementById("image-filter").addEventListener("change", applyFilters);
}

function applyFilters() {
    const searchValue = document.getElementById("search").value.toLowerCase();
    const category = document.getElementById("category-filter").value;
    const minPrice = parseFloat(document.getElementById("min-price").value);
    const maxPrice = parseFloat(document.getElementById("max-price").value);
    const sortOrder = document.getElementById("sort").value;
    const imageFilter = document.getElementById("image-filter").value;

    let filtered = allProducts.filter(p => {
        const matchesSearch =
            p.item_name.toLowerCase().includes(searchValue) ||
            p.item_code.toLowerCase().includes(searchValue);

        const matchesCategory = category ? p.item_group === category : true;
        const price = p.standard_rate || 0;
        const matchesPrice = price >= minPrice && price <= maxPrice;

        const hasImage = p.image && !p.image.includes("placeholder.png");
        const matchesImage =
            imageFilter === "with" ? hasImage :
            imageFilter === "without" ? !hasImage :
            true;

        return matchesSearch && matchesCategory && matchesPrice && matchesImage;
    });

    if (sortOrder === "asc") {
        filtered.sort((a, b) => (a.standard_rate || 0) - (b.standard_rate || 0));
    } else {
        filtered.sort((a, b) => (b.standard_rate || 0) - (a.standard_rate || 0));
    }

    renderProducts(filtered);
}

frappe.ready(loadProducts);
