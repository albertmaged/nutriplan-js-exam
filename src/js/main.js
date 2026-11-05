
import {
  getCategories,
  getMeals,
  searchMeals,
  getMealsByCategory
} from "./api.js";

const recipesGrid = document.getElementById("recipes-grid");
const categoriesGrid = document.getElementById("categories-grid");
const recipesCount = document.getElementById("recipes-count");
const searchInput = document.getElementById("search-input");

let allMeals = [];
let searchTimer;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function showLoading(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
    </div>
  `;
}

function showError(container, message) {
  if (!container) return;

  container.innerHTML = `
    <p class="col-span-full text-center text-red-500 py-8">
      ${escapeHTML(message)}
    </p>
  `;
}

function renderMeals(meals) {
  if (!recipesGrid) return;

  if (!meals || meals.length === 0) {
    recipesGrid.innerHTML = `
      <p class="col-span-full text-center text-gray-500 py-10">
        No recipes found. Try another search.
      </p>
    `;

    if (recipesCount) {
      recipesCount.textContent = "Showing 0 recipes";
    }

    return;
  }

  recipesGrid.innerHTML = meals.map((meal) => `
    <article
      class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      data-meal-id="${escapeHTML(meal.idMeal)}"
    >
      <div class="relative h-48 overflow-hidden">
        <img
          src="${escapeHTML(meal.strMealThumb || "")}"
          alt="${escapeHTML(meal.strMeal)}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div class="absolute bottom-3 left-3">
          <span class="px-2 py-1 bg-white/90 text-xs font-semibold rounded-full text-gray-700">
            ${escapeHTML(meal.strCategory || "Recipe")}
          </span>
        </div>
      </div>

      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
          ${escapeHTML(meal.strMeal)}
        </h3>

        <p class="text-xs text-gray-500">
          Click to explore this recipe
        </p>
      </div>
    </article>
  `).join("");

  if (recipesCount) {
    recipesCount.textContent = `Showing ${meals.length} recipes`;
  }
}

function renderCategories(categories) {
  if (!categoriesGrid) return;

  categoriesGrid.innerHTML = categories.map((category) => `
    <button
      type="button"
      data-category="${escapeHTML(category.strCategory)}"
      class="category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all text-center"
    >
      <img
        src="${escapeHTML(category.strCategoryThumb || "")}"
        alt="${escapeHTML(category.strCategory)}"
        class="w-16 h-16 object-cover rounded-full mx-auto mb-2"
        loading="lazy"
      />

      <span class="text-sm font-medium text-gray-700">
        ${escapeHTML(category.strCategory)}
      </span>
    </button>
  `).join("");
}

async function loadApp() {
  showLoading(recipesGrid);

  if (categoriesGrid) {
    showLoading(categoriesGrid);
  }

  try {
    const [meals, categories] = await Promise.all([
      getMeals(),
      getCategories()
    ]);

    allMeals = meals;

    renderMeals(allMeals);
    renderCategories(categories);

    console.log("NutriPlan loaded successfully!");
    console.log("Meals:", allMeals.length);
    console.log("Categories:", categories.length);

  } catch (error) {
    console.error("NutriPlan loading error:", error);

    showError(
      recipesGrid,
      "Couldn't load recipes. Please refresh the page."
    );

    showError(
      categoriesGrid,
      "Couldn't load categories."
    );
  }
}

// Search recipes
searchInput?.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(async () => {
    const query = searchInput.value.trim();

    if (!query) {
      renderMeals(allMeals);
      return;
    }

    showLoading(recipesGrid);

    try {
      const meals = await searchMeals(query);
      renderMeals(meals);
    } catch (error) {
      console.error("Search error:", error);
      showError(recipesGrid, "Search failed. Please try again.");
    }
  }, 400);
});

// Filter recipes by category
categoriesGrid?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) return;

  const category = button.dataset.category;

  showLoading(recipesGrid);

  try {
    const meals = await getMealsByCategory(category);

    renderMeals(
      meals.map((meal) => ({
        ...meal,
        strCategory: category
      }))
    );

  } catch (error) {
    console.error("Category error:", error);
    showError(recipesGrid, "Couldn't load this category.");
  }
});

// Start NutriPlan
loadApp();
