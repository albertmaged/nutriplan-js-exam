
const FOOD_LOG_KEY = "nutriplan-foodlog";
const API_URL = "https://world.openfoodfacts.org";

let currentProducts = [];
let selectedGrade = "all";
let selectedCategory = "all";

const searchInput = document.getElementById("product-search-input");
const searchButton = document.getElementById("search-product-btn");
const barcodeInput = document.getElementById("barcode-input");
const barcodeButton = document.getElementById("lookup-barcode-btn");
const productsGrid = document.getElementById("products-grid");
const productsCount = document.getElementById("products-count");

// Convert API product data
function mapProduct(product) {
  const nutrients = product.nutriments || {};

  return {
    code: product.code || "",
    name: product.product_name || "Unknown Product",
    brand: product.brands || "",
    image: product.image_url || "",
    quantity: product.quantity || "",
    category: product.categories || "Product",
    grade: String(product.nutriscore_grade || "unknown").toLowerCase(),
    nova: product.nova_group || "",
    calories: Number(nutrients["energy-kcal_100g"]) || 0,
    protein: Number(nutrients.proteins_100g) || 0,
    carbs: Number(nutrients.carbohydrates_100g) || 0,
    fat: Number(nutrients.fat_100g) || 0,
    sugar: Number(nutrients.sugars_100g) || 0
  };
}

// Search by product name
async function searchProducts(query) {
  if (!query.trim()) {
    alert("Please enter a product name.");
    return;
  }

  showMessage("Searching products...");

  try {
    const params = new URLSearchParams({
      search_terms: query.trim(),
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "30",
      fields: "code,product_name,brands,image_url,quantity,categories,nutriscore_grade,nova_group,nutriments"
    });

    const response = await fetch(
      `${API_URL}/cgi/search.pl?${params.toString()}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    currentProducts = (data.products || [])
      .filter(product => product.product_name)
      .map(mapProduct);

    selectedGrade = "all";
    selectedCategory = "all";

    renderProducts();

  } catch (error) {
    console.error("Product search error:", error);
    showMessage(`Search failed: ${error.message}`);
  }
}

// Search by barcode
async function searchByBarcode(code) {
  const cleanCode = code.trim();

  if (!/^\d{8,14}$/.test(cleanCode)) {
    alert("Please enter a valid barcode.");
    return;
  }

  showMessage("Looking up barcode...");

  try {
    const response = await fetch(
      `${API_URL}/api/v2/product/${encodeURIComponent(cleanCode)}.json`
    );

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      showMessage("Product not found. Try another barcode.");
      return;
    }

    currentProducts = [mapProduct(data.product)];
    selectedGrade = "all";
    selectedCategory = "all";

    renderProducts();

  } catch (error) {
    console.error("Barcode search error:", error);
    showMessage(`Barcode search failed: ${error.message}`);
  }
}

// Show messages
function showMessage(message) {
  if (productsGrid) {
    productsGrid.innerHTML = `
      <p class="text-center text-gray-500 col-span-full py-6">
        ${escapeHTML(message)}
      </p>
    `;
  }

  if (productsCount) {
    productsCount.textContent = "0 products";
  }
}

// Escape HTML
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// Product details modal
function openProductModal(product) {
  document.getElementById("product-details-modal")?.remove();

  const modal = document.createElement("div");

  modal.id = "product-details-modal";

  modal.className =
    "fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3";

  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl">

      <!-- Modal Header -->
      <div class="flex justify-between items-center p-4 border-b">
        <h2 class="text-lg font-bold text-gray-800">
          Product Details
        </h2>

        <button
          type="button"
          id="close-product-modal"
          class="text-gray-500 hover:text-red-500 text-3xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="overflow-y-auto p-5 flex-1">

        <img
          src="${escapeHTML(product.image || "https://placehold.co/300x200?text=No+Image")}"
          alt="${escapeHTML(product.name)}"
          class="w-full h-48 object-contain mb-4"
        >

        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          ${escapeHTML(product.name)}
        </h3>

        <p class="text-gray-500 mb-2">
          ${escapeHTML(product.brand || "Unknown Brand")}
        </p>

        <p class="text-sm text-gray-500 mb-5">
          ${escapeHTML(product.quantity)}
        </p>

        <h3 class="font-bold text-lg mb-3">
          Nutrition Facts
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

          <div class="bg-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-500">Calories</p>
            <p class="font-bold">${product.calories} kcal</p>
          </div>

          <div class="bg-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-500">Protein</p>
            <p class="font-bold">${product.protein} g</p>
          </div>

          <div class="bg-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-500">Carbs</p>
            <p class="font-bold">${product.carbs} g</p>
          </div>

          <div class="bg-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-500">Fat</p>
            <p class="font-bold">${product.fat} g</p>
          </div>

          <div class="bg-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-500">Sugar</p>
            <p class="font-bold">${product.sugar} g</p>
          </div>

          <div class="bg-gray-100 rounded-lg p-4">
            <p class="text-sm text-gray-500">Nutri-Score</p>
            <p class="font-bold uppercase">
              ${escapeHTML(product.grade)}
            </p>
          </div>

        </div>

        <p class="text-xs text-gray-500 mb-3">
          Nutrition values are per 100g.
          Missing values may appear as zero.
        </p>

      </div>

      <!-- Fixed Footer -->
      <div class="p-4 border-t bg-white">
        <button
          type="button"
          id="add-modal-product"
          class="w-full bg-green-600 text-white rounded-lg py-3 font-semibold hover:bg-green-700"
        >
          Add to Food Log
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  document.getElementById("close-product-modal").onclick = () => {
    modal.remove();
  };

  // Close on outside click
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.remove();
    }
  });

  // Add product
  document.getElementById("add-modal-product").onclick = () => {
    const added = addProductToFoodLog(product);

    if (added) {
      modal.remove();
    }
  };
}

// Render products
function renderProducts() {
  if (!productsGrid) return;

  let filtered = [...currentProducts];

  if (selectedGrade !== "all") {
    filtered = filtered.filter(
      product => product.grade === selectedGrade
    );
  }

  if (selectedCategory !== "all") {
    filtered = filtered.filter(product =>
      product.category.toLowerCase().includes(
        selectedCategory.toLowerCase()
      )
    );
  }

  if (productsCount) {
    productsCount.textContent = `${filtered.length} products`;
  }

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <p class="text-center text-gray-500 col-span-full py-6">
        No products found. Try another search.
      </p>
    `;
    return;
  }

  productsGrid.innerHTML = filtered.map((product, index) => `
    <div
      class="product-card bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-lg transition"
      data-index="${index}"
      tabindex="0"
      role="button"
    >

      <img
        src="${escapeHTML(product.image || "https://placehold.co/300x200?text=No+Image")}"
        alt="${escapeHTML(product.name)}"
        class="w-full h-40 object-contain rounded-lg mb-3"
      >

      <h3 class="font-semibold text-gray-800 mb-1">
        ${escapeHTML(product.name)}
      </h3>

      <p class="text-sm text-gray-500 mb-2">
        ${escapeHTML(product.brand)}
      </p>

      <div class="text-sm space-y-1 mb-3">
        <p>Calories: ${product.calories} kcal / 100g</p>
        <p>Protein: ${product.protein} g</p>
        <p>Carbs: ${product.carbs} g</p>
        <p>Fat: ${product.fat} g</p>
      </div>

      <p class="text-sm mb-3">
        Nutri-Score:
        <strong>${escapeHTML(product.grade.toUpperCase())}</strong>
      </p>

      <p class="text-sm text-green-700 text-center mb-3">
        Click to view details
      </p>

      <button
        type="button"
        class="add-product-btn w-full bg-green-600 text-white rounded-lg py-2 hover:bg-green-700"
        data-index="${index}"
      >
        Add to Food Log
      </button>

    </div>
  `).join("");

  // Open modal when clicking card
  productsGrid.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest(".add-product-btn")) return;

      const product = filtered[Number(card.dataset.index)];

      if (product) openProductModal(product);
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        const product = filtered[Number(card.dataset.index)];

        if (product) openProductModal(product);
      }
    });
  });

  // Direct add button
  productsGrid.querySelectorAll(".add-product-btn").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const product = filtered[Number(button.dataset.index)];

      if (product) addProductToFoodLog(product);
    });
  });
}

// Add product to Food Log
function addProductToFoodLog(product) {
  let foodLog = [];

  try {
    foodLog = JSON.parse(
      localStorage.getItem(FOOD_LOG_KEY)
    ) || [];
  } catch {
    foodLog = [];
  }

  const loggedProduct = {
    id: Date.now() + Math.random(),
    type: "product",
    productId: product.code,
    name: product.name,
    image: product.image,
    category: product.category || "Product",
    calories: product.calories,
    protein: product.protein,
    carbs: product.carbs,
    fat: product.fat,
    quantity: 100,
    date: new Date().toISOString()
  };

  foodLog.push(loggedProduct);

  try {
    localStorage.setItem(
      FOOD_LOG_KEY,
      JSON.stringify(foodLog)
    );
  } catch (error) {
    console.error("Food Log save error:", error);
    alert("Couldn't save this product. Please try again.");
    return false;
  }

 
  alert("Product added to Food Log!");

  document.getElementById("foodlog-section")
    ?.scrollIntoView({ behavior: "smooth" });

  if (typeof window.renderFoodLog === "function") {
    window.renderFoodLog();
  }

  return true;

}

// Nutri-Score filters
document.querySelectorAll(".nutri-score-filter").forEach(button => {
  button.addEventListener("click", () => {
    selectedGrade = button.dataset.grade || "all";
    renderProducts();
  });
});

// Category filters
document.querySelectorAll(".product-category-btn").forEach(button => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category || "all";
    renderProducts();
  });
});

// Search button
searchButton?.addEventListener("click", () => {
  searchProducts(searchInput?.value || "");
});

// Search with Enter
searchInput?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    searchProducts(searchInput.value);
  }
});

// Barcode button
barcodeButton?.addEventListener("click", () => {
  searchByBarcode(barcodeInput?.value || "");
});

// Barcode with Enter
barcodeInput?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    searchByBarcode(barcodeInput.value);
  }
});

// Initial state
if (productsGrid) {
  productsGrid.innerHTML = `
    <p class="text-center text-gray-500 col-span-full py-6">
      Search for a product by name or barcode.
    </p>
  `;
}
