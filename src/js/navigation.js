
const pages = {
  meals: [
    "search-filters-section",
    "meal-categories-section",
    "all-recipes-section"
  ],
  products: ["products-section"],
  foodlog: ["foodlog-section"]
};

const allSections = [
  "search-filters-section",
  "meal-categories-section",
  "all-recipes-section",
  "meal-details",
  "products-section",
  "foodlog-section"
];

const pageInfo = {
  meals: {
    title: "Meals & Recipes",
    description: "Discover delicious and nutritious recipes tailored for you"
  },
  products: {
    title: "Product Scanner",
    description: "Search food products and check their nutrition information"
  },
  foodlog: {
    title: "Food Log",
    description: "Track and monitor your daily nutrition intake"
  }
};

function showPage(pageName) {
  if (!pages[pageName]) return;

  allSections.forEach(id => {
    const section = document.getElementById(id);
    if (section) section.style.display = "none";
  });

  pages[pageName].forEach(id => {
    const section = document.getElementById(id);
    if (section) section.style.display = "";
  });

  const title = document.querySelector("#header h1");
  const description = document.querySelector("#header p");

  if (title) title.textContent = pageInfo[pageName].title;
  if (description) description.textContent = pageInfo[pageName].description;

  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link.dataset.page === pageName;

    link.classList.toggle("bg-emerald-50", active);
    link.classList.toggle("text-emerald-700", active);
    link.classList.toggle("text-gray-600", !active);

    const label = link.querySelector("span");

    if (label) {
      label.classList.toggle("font-semibold", active);
      label.classList.toggle("font-medium", !active);
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageName === "foodlog") {
    window.renderFoodLog?.();
  }
}

// Sidebar navigation
document.addEventListener("click", event => {
  const link = event.target.closest(".nav-link");

  if (!link) return;

  const pageName = link.dataset.page;

  if (!pageName || !pages[pageName]) return;

  event.preventDefault();
  showPage(pageName);
});

// Quick navigation buttons
document.querySelectorAll(".quick-log-btn").forEach((button, index) => {
  button.addEventListener("click", () => {
    showPage(index === 0 ? "meals" : "products");
  });
});

// Initial page
showPage("meals");

window.showNutriPlanPage = showPage;
