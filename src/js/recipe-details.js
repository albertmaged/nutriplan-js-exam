
import { getMealDetails } from "./api.js";

const recipesGrid = document.getElementById("recipes-grid");
const FOOD_LOG_KEY = "nutriplan-foodlog";

function getFoodLog() {
  try {
    const data = JSON.parse(localStorage.getItem(FOOD_LOG_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveFoodLog(items) {
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(items));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[char]);
}

function localDateKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSelectedDate() {
  const input = document.getElementById("foodlog-date");
  return input?.value || localDateKey();
}

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function format(value) {
  return Number(value || 0).toFixed(1).replace(/\.0$/, "");
}

// تقدير تقريبي لكل 100 جرام: calories, protein, carbs, fat
function ingredientNutrition(name) {
  const n = name.toLowerCase();

  if (/oil|butter|ghee/.test(n)) return [884, 0, 0, 100];
  if (/cheese|parmesan|mozzarella/.test(n)) return [350, 25, 3, 27];
  if (/chicken|turkey/.test(n)) return [165, 31, 0, 4];
  if (/beef|lamb|meat/.test(n)) return [250, 26, 0, 15];
  if (/fish|salmon|tuna|shrimp|prawn/.test(n)) return [140, 24, 0, 5];
  if (/pasta|spaghetti|macaroni|noodle|rice/.test(n)) return [150, 5, 30, 1];
  if (/bread|flour|breadcrumb/.test(n)) return [265, 9, 49, 3];
  if (/egg/.test(n)) return [143, 13, 1, 10];
  if (/milk|cream|yogurt/.test(n)) return [100, 4, 5, 6];
  if (/nut|almond|peanut|walnut/.test(n)) return [580, 20, 20, 50];
  if (/sugar|honey/.test(n)) return [390, 0, 100, 0];
  if (/potato/.test(n)) return [80, 2, 17, 0];
  if (/tomato|onion|pepper|spinach|lettuce|carrot|garlic|lemon|broccoli|cucumber|zucchini/.test(n)) {
    return [35, 2, 7, 0.3];
  }
  return [100, 3, 15, 3];
}

// تقدير وزن المكونات من المقادير المكتوبة في الوصفة
function estimateIngredientGrams(measure) {
  const text = String(measure || "").toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?|\d+\s*\/\s*\d+)/);

  if (!match) return 50;

  let amount;
  if (match[1].includes("/")) {
    const parts = match[1].split("/").map(Number);
    amount = parts[0] / (parts[1] || 1);
  } else {
    amount = Number(match[1]);
  }

  if (/kg|kilogram/.test(text)) return amount * 1000;
  if (/\b(g|gram|grams)\b/.test(text)) return amount;
  if (/ml|milliliter/.test(text)) return amount;
  if (/cup/.test(text)) return amount * 150;
  if (/tablespoon|tbsp/.test(text)) return amount * 15;
  if (/teaspoon|tsp/.test(text)) return amount * 5;
  if (/slice/.test(text)) return amount * 30;
  if (/clove/.test(text)) return amount * 5;
  if (/piece|whole|large|medium|small/.test(text)) return amount * 80;

  return amount * 50;
}

function estimateMealNutrition(meal) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (!name) continue;

    const grams = estimateIngredientGrams(measure);
    const values = ingredientNutrition(name);
    const factor = grams / 100;

    totals.calories += values[0] * factor;
    totals.protein += values[1] * factor;
    totals.carbs += values[2] * factor;
    totals.fat += values[3] * factor;
  }

  // التقدير محسوب للحصة الواحدة بافتراض حصتين للوصفة
  return {
    calories: Math.round(totals.calories / 2),
    protein: Number((totals.protein / 2).toFixed(1)),
    carbs: Number((totals.carbs / 2).toFixed(1)),
    fat: Number((totals.fat / 2).toFixed(1))
  };
}

function getIngredients(meal) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (ingredient) ingredients.push({ ingredient, measure });
  }

  return ingredients;
}

function addToFoodLog(meal, nutrition) {
  const foodLog = getFoodLog();
  const today = localDateKey();

  const alreadyExists = foodLog.some(item =>
    item.type === "meal" &&
    item.mealId === meal.idMeal &&
    localDateKey(item.date) === today
  );

  if (alreadyExists) {
    alert("This meal is already in your Food Log today!");
    return false;
  }

  foodLog.push({
    id: Date.now(),
    type: "meal",
    mealId: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory || "Recipe",
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    nutritionEstimated: true,
    date: new Date().toISOString()
  });

  saveFoodLog(foodLog);
  renderFoodLog();
  return true;
}

function ensureNutritionSummary() {
  const section = document.getElementById("foodlog-section");
  const list = document.getElementById("logged-items-list");

  if (!section || !list || document.getElementById("foodlog-nutrition-summary")) return;

  const summary = document.createElement("div");
  summary.id = "foodlog-nutrition-summary";
  summary.className = "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5";

  summary.innerHTML = ["Calories", "Protein", "Carbs", "Fat"].map((label, i) => `
    <div class="bg-white rounded-xl shadow-sm p-3">
      <p class="text-sm text-gray-500">${label}</p>
      <p class="text-lg font-bold text-gray-800" id="foodlog-total-${i}">0</p>
      <p class="text-xs text-gray-400">${i === 0 ? "kcal" : "g"}</p>
    </div>
  `).join("");

  list.parentNode.insertBefore(summary, list);
}

function renderFoodLog() {
  const list = document.getElementById("logged-items-list");
  if (!list) return;

  ensureNutritionSummary();

  const selectedDate = getSelectedDate();
  const allItems = getFoodLog();

  const foodLog = allItems.filter(item =>
    item.date && localDateKey(item.date) === selectedDate
  );

  if (!foodLog.length) {
    list.innerHTML = `
      <p class="text-gray-500 text-center py-4">No items logged for this day.</p>
    `;
  } else {
    list.innerHTML = foodLog.map(item => `
      <div class="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm mb-3">
        <img src="${escapeHTML(item.image || "")}"
          alt="${escapeHTML(item.name)}"
          class="w-16 h-16 object-cover rounded-lg">

        <div class="flex-1 min-w-0">
          <h5 class="font-semibold text-gray-800">${escapeHTML(item.name)}</h5>
          <p class="text-sm text-gray-500">${escapeHTML(item.category || item.type || "")}</p>
          <p class="text-xs text-gray-500 mt-1">
            ${format(item.calories)} kcal · P ${format(item.protein)}g ·
            C ${format(item.carbs)}g · F ${format(item.fat)}g
          </p>
          ${item.nutritionEstimated ? '<p class="text-xs text-amber-600">Estimated nutrition</p>' : ""}
        </div>

        <button type="button"
          class="remove-logged-meal text-red-500 hover:text-red-700"
          data-id="${item.id}">
          <i class="fa-solid fa-trash"></i> Remove
        </button>
      </div>
    `).join("");
  }

  const totals = foodLog.reduce((sum, item) => {
    sum.calories += number(item.calories);
    sum.protein += number(item.protein);
    sum.carbs += number(item.carbs);
    sum.fat += number(item.fat);
    return sum;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const values = [totals.calories, totals.protein, totals.carbs, totals.fat];
  values.forEach((value, i) => {
    const element = document.getElementById(`foodlog-total-${i}`);
    if (element) element.textContent = format(value);
  });

  const heading = list.previousElementSibling?.querySelector("h4");
  if (heading) heading.textContent = `Logged Items (${foodLog.length})`;

  const clearButton = document.getElementById("clear-foodlog");
  if (clearButton) clearButton.style.display = foodLog.length ? "inline-block" : "none";
}

window.renderFoodLog = renderFoodLog;

function openRecipeModal(meal) {
  document.getElementById("recipe-details-modal")?.remove();

  const ingredients = getIngredients(meal);
  const nutrition = estimateMealNutrition(meal);
  const modal = document.createElement("div");

  modal.id = "recipe-details-modal";
  modal.className = "fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4";

  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="relative">
        <img src="${escapeHTML(meal.strMealThumb || "")}"
          alt="${escapeHTML(meal.strMeal)}" class="w-full h-64 object-cover">
        <button id="close-recipe-modal"
          class="absolute top-4 right-4 bg-white rounded-full w-10 h-10 text-xl shadow"
          aria-label="Close">×</button>
      </div>

      <div class="p-6">
        <span class="text-sm text-emerald-600 font-semibold">${escapeHTML(meal.strCategory || "Recipe")}</span>
        <h2 class="text-2xl font-bold text-gray-900 mt-1 mb-2">${escapeHTML(meal.strMeal)}</h2>
        <p class="text-sm text-gray-500 mb-6">${escapeHTML(meal.strArea || "")}</p>

        <h3 class="text-lg font-bold mb-3">Nutrition Facts</h3>
        <p class="text-xs text-amber-600 mb-3">Approximate estimate per serving (assuming 2 servings).</p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="bg-gray-100 rounded-lg p-3"><p class="text-sm text-gray-500">Calories</p><p class="font-bold">${nutrition.calories} kcal</p></div>
          <div class="bg-gray-100 rounded-lg p-3"><p class="text-sm text-gray-500">Protein</p><p class="font-bold">${nutrition.protein} g</p></div>
          <div class="bg-gray-100 rounded-lg p-3"><p class="text-sm text-gray-500">Carbs</p><p class="font-bold">${nutrition.carbs} g</p></div>
          <div class="bg-gray-100 rounded-lg p-3"><p class="text-sm text-gray-500">Fat</p><p class="font-bold">${nutrition.fat} g</p></div>
        </div>

        <h3 class="text-lg font-bold mb-3">Ingredients</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          ${ingredients.map(item => `
            <label class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <input type="checkbox" class="accent-emerald-600">
              <span class="text-gray-700"><strong>${escapeHTML(item.measure || "")}</strong> ${escapeHTML(item.ingredient)}</span>
            </label>
          `).join("")}
        </div>

        <h3 class="text-lg font-bold mb-3">Instructions</h3>
        <p class="text-gray-700 leading-8 whitespace-pre-line mb-6">${escapeHTML(meal.strInstructions || "No instructions available.")}</p>

        ${meal.strYoutube ? `<a href="${escapeHTML(meal.strYoutube)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-red-600 font-semibold mb-6"><i class="fa-brands fa-youtube"></i> Watch recipe video</a>` : ""}

        <button id="add-recipe-to-foodlog" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold" type="button">
          <i class="fa-solid fa-clipboard-list mr-2"></i> Add to Food Log
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("close-recipe-modal").onclick = () => modal.remove();

  modal.addEventListener("click", event => {
    if (event.target === modal) modal.remove();
  });

  document.getElementById("add-recipe-to-foodlog").onclick = () => {
    if (addToFoodLog(meal, nutrition)) {
      modal.remove();
      document.getElementById("foodlog-section")?.scrollIntoView({ behavior: "smooth" });
      alert("Meal added successfully!");
    }
  };
}

recipesGrid?.addEventListener("click", async event => {
  const card = event.target.closest(".recipe-card");
  if (!card) return;

  const mealId = card.dataset.mealId;
  if (!mealId) return;

  try {
    const meal = await getMealDetails(mealId);
    if (!meal) throw new Error("Recipe not found");
    openRecipeModal(meal);
  } catch (error) {
    console.error("Recipe details error:", error);
    alert("Couldn't load recipe details. Please try again.");
  }
});

document.addEventListener("click", event => {
  const removeButton = event.target.closest(".remove-logged-meal");
  if (!removeButton) return;

  const id = Number(removeButton.dataset.id);
  saveFoodLog(getFoodLog().filter(item => Number(item.id) !== id));
  renderFoodLog();
});


document.getElementById("clear-foodlog")?.addEventListener("click", () => {
  if (!confirm("Are you sure you want to clear your Food Log?")) return;

  localStorage.removeItem(FOOD_LOG_KEY);
  renderFoodLog();

  const selectedDate = getSelectedDate();
  const remaining = getFoodLog().filter(item =>
    !item.date || localDateKey(item.date) !== selectedDate
  );

  saveFoodLog(remaining);
  renderFoodLog();
});

document.getElementById("foodlog-date")?.addEventListener("change", renderFoodLog);

renderFoodLog();
