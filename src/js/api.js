
const MEAL_DB_BASE =
  "https://www.themealdb.com/api/json/v1/1";

export const NUTRIPLAN_API_BASE =
  "https://nutriplanbe-production.up.railway.app/api";

// ===============================
// Generic Backend Request
// ===============================

export async function backendRequest(
  endpoint,
  {
    method = "GET",
    body,
    token,
    headers = {}
  } = {}
) {
  const response = await fetch(
    `${NUTRIPLAN_API_BASE}${endpoint}`,
    {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `API Error: ${response.status}`
    );
  }

  return data;
}

// ===============================
// TheMealDB API
// ===============================

async function mealDBRequest(endpoint) {
  const response = await fetch(`${MEAL_DB_BASE}/${endpoint}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }

  const data = await response.json();

  return data;
}

export async function getCategories() {
  const data = await mealDBRequest("categories.php");
  return data.categories || [];
}

export async function getMeals() {
  const data = await mealDBRequest("search.php?s=chicken");
  return data.meals || [];
}

export async function searchMeals(query) {
  const data = await mealDBRequest(
    `search.php?s=${encodeURIComponent(query)}`
  );

  return data.meals || [];
}

export async function getMealsByCategory(category) {
  const data = await mealDBRequest(
    `filter.php?c=${encodeURIComponent(category)}`
  );

  return data.meals || [];
}

export async function getMealDetails(id) {
  const data = await mealDBRequest(
    `lookup.php?i=${encodeURIComponent(id)}`
  );

  return data.meals?.[0] || null;
}
