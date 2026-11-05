
import { getMealDetails } from "./api.js";

const recipesGrid = document.getElementById("recipes-grid");

const FOOD_LOG_KEY = "nutriplan-foodlog";

// ===============================
// Food Log LocalStorage
// ===============================

function getFoodLog() {
  try {
    return JSON.parse(localStorage.getItem(FOOD_LOG_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFoodLog(items) {
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(items));
}

function addToFoodLog(meal) {
  const foodLog = getFoodLog();

  // Prevent duplicate meals
  const alreadyExists = foodLog.some(
    item => item.mealId === meal.idMeal
  );

  if (alreadyExists) {
    alert("This meal is already in your Food Log!");
    return;
  }

  const loggedMeal = {
    id: Date.now(),
    mealId: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory || "Recipe",
    area: meal.strArea || "",
    date: new Date().toISOString()
  };

  foodLog.push(loggedMeal);

  saveFoodLog(foodLog);
  renderFoodLog();

  return true;
}

// ===============================
// Render Food Log
// ===============================

function renderFoodLog() {
  const list = document.getElementById("logged-items-list");

  if (!list) return;

  const foodLog = getFoodLog();

  if (foodLog.length === 0) {
    list.innerHTML = `
      <p class="text-gray-500 text-center py-4">
        No meals logged yet.
      </p>
    `;
  } else {
    list.innerHTML = foodLog.map(item => `
      <div class="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm mb-3">

        <img
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.name)}"
          class="w-16 h-16 object-cover rounded-lg"
        >

        <div class="flex-1 min-w-0">
          <h5 class="font-semibold text-gray-800">
            ${escapeHTML(item.name)}
          </h5>

          <p class="text-sm text-gray-500">
            ${escapeHTML(item.category)}
          </p>
        </div>

        <button
          type="button"
          class="remove-logged-meal text-red-500 hover:text-red-700"
          data-id="${item.id}"
        >
          <i class="fa-solid fa-trash"></i>
          Remove
        </button>

      </div>
    `).join("");
  }

  // Update logged items count
  const heading = list.previousElementSibling?.querySelector("h4");

  if (heading) {
    heading.textContent = `Logged Items (${foodLog.length})`;
  }

  // Show / hide clear button
  const clearButton = document.getElementById("clear-foodlog");

  if (clearButton) {
    clearButton.style.display =
      foodLog.length > 0 ? "inline-block" : "none";
  }
}

// ===============================
// HTML Escape
// ===============================

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// ===============================
// Recipe Ingredients
// ===============================

function getIngredients(meal) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (ingredient) {
      ingredients.push({ ingredient, measure });
    }
  }

  return ingredients;
}

// ===============================
// Recipe Details Modal
// ===============================

function openRecipeModal(meal) {
  document.getElementById("recipe-details-modal")?.remove();

  const ingredients = getIngredients(meal);

  const modal = document.createElement("div");

  modal.id = "recipe-details-modal";
  modal.className =
    "fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4";

  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">

      <div class="relative">
        <img
          src="${escapeHTML(meal.strMealThumb || "")}"
          alt="${escapeHTML(meal.strMeal)}"
          class="w-full h-64 object-cover"
        />

        <button
          id="close-recipe-modal"
          class="absolute top-4 right-4 bg-white rounded-full w-10 h-10 text-xl shadow"
          aria-label="Close"
        >×</button>
      </div>

      <div class="p-6">

        <span class="text-sm text-emerald-600 font-semibold">
          ${escapeHTML(meal.strCategory || "Recipe")}
        </span>

        <h2 class="text-2xl font-bold text-gray-900 mt-1 mb-2">
          ${escapeHTML(meal.strMeal)}
        </h2>

        <p class="text-sm text-gray-500 mb-6">
          ${escapeHTML(meal.strArea || "")}
        </p>

        <h3 class="text-lg font-bold mb-3">Ingredients</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          ${ingredients.map(item => `
            <label class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <input type="checkbox" class="accent-emerald-600">

              <span class="text-gray-700">
                <strong>${escapeHTML(item.measure || "")}</strong>
                ${escapeHTML(item.ingredient)}
              </span>
            </label>
          `).join("")}
        </div>

        <h3 class="text-lg font-bold mb-3">Instructions</h3>

        <p class="text-gray-700 leading-8 whitespace-pre-line mb-6">
          ${escapeHTML(meal.strInstructions || "No instructions available.")}
        </p>

        ${
          meal.strYoutube
            ? `<a
                 href="${escapeHTML(meal.strYoutube)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="inline-flex items-center gap-2 text-red-600 font-semibold mb-6"
               >
                 <i class="fa-brands fa-youtube"></i>
                 Watch recipe video
               </a>`
            : ""
        }

        <button
          id="add-recipe-to-foodlog"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold"
          type="button"
        >
          <i class="fa-solid fa-clipboard-list mr-2"></i>
          Add to Food Log
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal
  document.getElementById("close-recipe-modal").onclick = () => {
    modal.remove();
  };

  // Close when clicking outside
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.remove();
    }
  });

  // Add meal to LocalStorage and Food Log
  document.getElementById("add-recipe-to-foodlog").onclick = () => {

    const added = addToFoodLog(meal);

    if (added) {
      modal.remove();

      document.getElementById("foodlog-section")
        ?.scrollIntoView({ behavior: "smooth" });

      alert("Meal added successfully!");
    }
  };
}

// ===============================
// Recipe Cards Click
// ===============================

recipesGrid?.addEventListener("click", async event => {
  const card = event.target.closest(".recipe-card");

  if (!card) return;

  const mealId = card.dataset.mealId;

  if (!mealId) return;

  try {
    const meal = await getMealDetails(mealId);

    if (!meal) {
      throw new Error("Recipe not found");
    }

    openRecipeModal(meal);

  } catch (error) {
    console.error("Recipe details error:", error);
    alert("Couldn't load recipe details. Please try again.");
  }
});

// ===============================
// Remove Single Food Log Item
// ===============================

document.addEventListener("click", event => {
  const removeButton = event.target.closest(".remove-logged-meal");

  if (!removeButton) return;

  const id = Number(removeButton.dataset.id);

  const updatedFoodLog = getFoodLog().filter(
    item => item.id !== id
  );

  saveFoodLog(updatedFoodLog);
  renderFoodLog();
});

// ===============================
// Clear Entire Food Log
// ===============================

document.getElementById("clear-foodlog")
  ?.addEventListener("click", () => {

    if (!confirm("Are you sure you want to clear your Food Log?")) {
      return;
    }

    localStorage.removeItem(FOOD_LOG_KEY);
    renderFoodLog();
  });

// ===============================
// Initial Food Log Render
// ===============================

renderFoodLog();
