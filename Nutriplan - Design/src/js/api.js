console.log("NUTRIPLAN MAIN JS LOADED");

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export async function getCategories() {
  const response = await fetch(`${BASE_URL}/categories.php`);

  if (!response.ok) {
    throw new Error("Couldn't load categories");
  }

  const data = await response.json();
  return data.categories || [];
}

export async function getMeals() {
  const categories = [
    "Beef",
    "Chicken",
    "Dessert",
    "Seafood",
    "Vegetarian",
    "Pasta",
    "Breakfast"
  ];

  const results = await Promise.all(
    categories.map(async (category) => {
      const response = await fetch(
        `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data.meals || []).map((meal) => ({
        ...meal,
        strCategory: category
      }));
    })
  );

  const uniqueMeals = new Map();

  results.flat().forEach((meal) => {
    uniqueMeals.set(meal.idMeal, meal);
  });

  return Array.from(uniqueMeals.values()).slice(0, 25);
}

export async function searchMeals(query) {
  const response = await fetch(
    `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Search failed");
  }

  const data = await response.json();
  return data.meals || [];
}

export async function getMealsByCategory(category) {
  const response = await fetch(
    `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`
  );

  if (!response.ok) {
    throw new Error("Couldn't load this category");
  }

  const data = await response.json();
  return data.meals || [];
}


console.log("NUTRIPLAN MAIN JS FINISHED");


// Get full recipe details by ID
export async function getMealDetails(id) {
  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to load recipe details");
  }

  const data = await response.json();
  return data.meals?.[0] || null;
}