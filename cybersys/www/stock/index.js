/* script.js
 - Carga productos desde /api/method/cybersys.api.stock.get_products
 - Renderiza grid, búsqueda en tiempo real, filtros por categoría y rango de precio
 - Cambiar API_ENDPOINT si corresponde
*/

const API_ENDPOINT = "/api/method/cybersys.api.stock.get_products";
const PLACEHOLDER_IMG = "/assets/frappe/images/no-image.png"; // cambiar si hace falta

// App state
let PRODUCTS = [];         // datos originales traídos de la API
let FILTERED = [];         // productos después de filtros/búsqueda
let CATEGORIES = [];       // lista única de item_group
let MIN_PRICE = 0;
let MAX_PRICE = 0;

// Elementos DOM
const productGrid = document.getElementById("product-grid");
const resultsInfo = document.getElementById("results-info");
const searchInput = document.getElementById("search-input");
const categoriesList = document.getElementById("categories-list");
const clearFiltersBtn = document.getElementById("clear-filters");
const rangeMin = document.getElementById("range-min");
const rangeMax = document.getElementById("range-max");
const minPriceLabel = document.getElementById("min-price-label");
const maxPriceLabel = document.getElementById("max-price-label");
const priceMinInput = document.getElementById("price-min-input");
const priceMaxInput = document.getElementById("price-max-input");
const sortSelect = document.getElementById("sort-select");

// Debounce helper
function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Formatea precio como moneda (S/.)
function formatPrice(v) {
  if (v === null || v === undefined || v === "") return "S/ 0.00";
  const n = Number(v) || 0;
  return n.toLocaleString("es-PE", { style: "currency", currency: "PEN" }).replace("PEN", "S/");
}

// Fetch de productos
async function fetchProducts() {
  try {
    const res = await fetch(API_ENDPOINT, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    // payload.message debería ser el array
    const items = payload && payload.message ? payload.message : [];
    PRODUCTS = items.map(normalizeItem);
    afterLoad();
  } catch (err) {
    console.error("Error obteniendo productos:", err);
    resultsInfo.textContent = "Error al cargar productos. Revisa la consola.";
  }
}

// Normaliza campos que vengan nulos / strings
function normalizeItem(i) {
  // en ERPNext image puede venir como ruta o vacío. standard_rate a número.
  return {
    item_code: i.item_code || i.name || "",
    item_name: i.item_name || i.item_code || "Sin nombre",
    item_group: i.item_group || "Sin categoría",
    image: i.image || i.image_url || i.image_path || null,
    standard_rate: i.standard_rate !== undefined && i.standard_rate !== null ? Number(i.standard_rate) : 0
  };
}

// Después de cargar: inicializa filtros y render
function afterLoad() {
  if (!PRODUCTS.length) {
    resultsInfo.textContent = "No se encontraron productos.";
    productGrid.innerHTML = "";
    return;
  }

  // calcular precios min/max y categorías únicas
  MIN_PRICE = Math.min(...PRODUCTS.map(p => p.standard_rate));
  MAX_PRICE = Math.max(...PRODUCTS.map(p => p.standard_rate));
  if (!isFinite(MIN_PRICE)) MIN_PRICE = 0;
  if (!isFinite(MAX_PRICE)) MAX_PRICE = 0;

  CATEGORIES = Array.from(new Set(PRODUCTS.map(p => p.item_group))).sort();

  // inicializar controles
  initCategoryControls();
  initPriceControls();
  initSearch();
  initSort();

  // primer render
  FILTERED = PRODUCTS.slice();
  applyFiltersAndRender();
}

// Inicializa lista de categorías (checkboxes)
function initCategoryControls() {
  categoriesList.innerHTML = "";
  CATEGORIES.forEach((cat, idx) => {
    const id = `cat-${idx}`;
    const label = document.createElement("label");
    label.className = "category-item";
    label.innerHTML = `<input type="checkbox" value="${escapeHtml(cat)}" id="${id}" checked /> <span>${escapeHtml(cat)}</span>`;
    categoriesList.appendChild(label);

    // add listener
    label.querySelector("input").addEventListener("change", () => {
      applyFiltersAndRender();
    });
  });
}

// Inicializa slider/rangos de precio
function initPriceControls() {
  const min = Math.floor(MIN_PRICE);
  const max = Math.ceil(MAX_PRICE || min + 1); // asegurar rango
  rangeMin.min = min; rangeMin.max = max; rangeMin.value = min;
  rangeMax.min = min; rangeMax.max = max; rangeMax.value = max;

  priceMinInput.min = min; priceMinInput.max = max; priceMinInput.value = min;
  priceMaxInput.min = min; priceMaxInput.max = max; priceMaxInput.value = max;

  updatePriceLabels();

  const updateFromRange = () => {
    let a = Number(rangeMin.value);
    let b = Number(rangeMax.value);
    if (a > b) { // sincronizar para que min <= max
      const tmp = a; a = b; b = tmp;
    }
    priceMinInput.value = a;
    priceMaxInput.value = b;
    updatePriceLabels();
    applyFiltersAndRender();
  };

  const updateFromInputs = () => {
    let a = Number(priceMinInput.value) || min;
    let b = Number(priceMaxInput.value) || max;
    if (a > b) [a, b] = [b, a];
    if (a < min) a = min; if (b > max) b = max;
    rangeMin.value = a; rangeMax.value = b;
    updatePriceLabels();
    applyFiltersAndRender();
  };

  rangeMin.addEventListener("input", debounce(updateFromRange, 40));
  rangeMax.addEventListener("input", debounce(updateFromRange, 40));
  priceMinInput.addEventListener("change", updateFromInputs);
  priceMaxInput.addEventListener("change", updateFromInputs);
}

// Actualiza las etiquetas de min/max precio
function updatePriceLabels() {
  minPriceLabel.textContent = formatPrice(Number(priceMinInput.value || rangeMin.value));
  maxPriceLabel.textContent = formatPrice(Number(priceMaxInput.value || rangeMax.value));
}

// Inicializa búsqueda con debounce
function initSearch() {
  searchInput.addEventListener("input", debounce(() => applyFiltersAndRender(), 220));
}

// Inicializa sort
function initSort() {
  sortSelect.addEventListener("change", () => applyFiltersAndRender());
}

// Limpia filtros
clearFiltersBtn.addEventListener("click", () => {
  // marcar todas las categorías
  categoriesList.querySelectorAll("input[type=checkbox]").forEach(chk => chk.checked = true);
  // reset precios
  rangeMin.value = Math.floor(MIN_PRICE);
  rangeMax.value = Math.ceil(MAX_PRICE);
  priceMinInput.value = Math.floor(MIN_PRICE);
  priceMaxInput.value = Math.ceil(MAX_PRICE);
  updatePriceLabels();
  searchInput.value = "";
  sortSelect.value = "default";
  applyFiltersAndRender();
});

// Lógica de filtros + búsqueda + orden
function applyFiltersAndRender() {
  // Obtener categorías seleccionadas
  const checkedCats = Array.from(categoriesList.querySelectorAll("input[type=checkbox]"))
    .filter(c => c.checked).map(c => c.value);

  const q = (searchInput.value || "").trim().toLowerCase();
  const minP = Number(priceMinInput.value || rangeMin.value) || 0;
  const maxP = Number(priceMaxInput.value || rangeMax.value) || Infinity;

  FILTERED = PRODUCTS.filter(p => {
    const inCategory = checkedCats.length ? checkedCats.includes(p.item_group) : true;
    const priceOk = p.standard_rate >= minP && p.standard_rate <= maxP;
    const textOk = !q || (`${p.item_name} ${p.item_code}`).toLowerCase().includes(q);
    return inCategory && priceOk && textOk;
  });

  // Sorting
  const sortVal = sortSelect.value;
  if (sortVal === "price-asc") FILTERED.sort((a,b)=>a.standard_rate-b.standard_rate);
  else if (sortVal === "price-desc") FILTERED.sort((a,b)=>b.standard_rate-a.standard_rate);
  else if (sortVal === "name-asc") FILTERED.sort((a,b)=> String(a.item_name).localeCompare(b.item_name));

  renderProducts(FILTERED);
  updateResultsInfo();
}

// Render del grid
function renderProducts(items) {
  productGrid.innerHTML = "";
  if (!items.length) {
    productGrid.innerHTML = `<div style="padding:30px;background:#fff;border-radius:12px;border:1px solid #eef2f5">No se encontraron productos con esos filtros.</div>`;
    return;
  }

  // Render tarjetas
  const frag = document.createDocumentFragment();
  items.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="img-wrap">
        <img loading="lazy" src="${escapeHtml(p.image) || PLACEHOLDER_IMG}" alt="${escapeHtml(p.item_name)}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      </div>
      <div class="meta">
        <div class="title">${escapeHtml(p.item_name)}</div>
        <div class="category">${escapeHtml(p.item_group)} · <small class="muted">${escapeHtml(p.item_code)}</small></div>
        <div class="price">${formatPrice(p.standard_rate)}</div>
      </div>
    `;
    frag.appendChild(card);
  });
  productGrid.appendChild(frag);
}

// Actualiza info de resultados
function updateResultsInfo() {
  const shown = FILTERED.length;
  const total = PRODUCTS.length;
  resultsInfo.textContent = `${shown} / ${total} productos`;
}

// Escape de HTML para evitar inyección en el DOM
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Inicializa todo
(function init() {
  // Mostrar placeholders mientras carga
  resultsInfo.textContent = "Cargando productos...";
  // fetch
  fetchProducts();
})();
