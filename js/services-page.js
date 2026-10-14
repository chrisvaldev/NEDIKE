"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const results = document.getElementById("service-results");

  if (!results) return;

  // Use the shared NEDIKE services catalogue.
  if (
    !window.NEDIKEServices ||
    typeof window.NEDIKEServices.getAll !== "function"
  ) {
    console.error(
      "NEDIKE services catalogue not found. Check that js/services.js loads before js/services-page.js."
    );
    return;
  }

  const searchInput = document.getElementById("service-search");
  const searchForm = document.getElementById("service-search-form");
  const locationSelect = document.getElementById("service-location");
  const sortSelect = document.getElementById("service-sort");
  const count = document.getElementById("service-result-count");
  const empty = document.getElementById("service-empty-state");

  const clearButton = document.getElementById("clear-service-filters");
  const emptyClearButton = document.getElementById("empty-clear-services");

  const services = window.NEDIKEServices.getAll();

  function getValue(name, fallback) {
    const selected = document.querySelector(
      `input[name="${name}"]:checked`
    );

    return selected ? selected.value : fallback;
  }

  function formatLocation(location) {
    if (!location) return "Location not specified";

    if (location.toLowerCase() === "remote") {
      return "Remote";
    }

    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  function render() {
    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const category = getValue("category", "all");
    const priceLimit = getValue("price", "all");
    const location = locationSelect ? locationSelect.value : "all";
    const sort = sortSelect ? sortSelect.value : "recommended";

    let filtered = services.filter((service) => {
      const searchable = [
        service.title,
        service.description,
        service.categoryLabel,
        service.location,
        service.provider,
        service.details
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !query || searchable.includes(query);

      const matchesCategory =
        category === "all" || service.category === category;

      const matchesPrice =
        priceLimit === "all" ||
        service.price <= Number(priceLimit);

      const matchesLocation =
        location === "all" ||
        service.location === location;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesPrice &&
        matchesLocation
      );
    });

    if (sort === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (count) {
      count.textContent =
        `${filtered.length} ${
          filtered.length === 1 ? "service" : "services"
        } found`;
    }

    if (empty) {
      empty.classList.toggle("hidden", filtered.length !== 0);
    }

    results.classList.toggle("hidden", filtered.length === 0);
    results.replaceChildren();

    filtered.forEach((service) => {
      const article = document.createElement("article");
      article.className = "card";

      const image = document.createElement("img");
      image.className = "card-image";
      image.src = service.image;
      image.alt = service.imageAlt || service.title;
      image.loading = "lazy";

      image.addEventListener("error", () => {
        image.style.display = "none";
      });

      const body = document.createElement("div");
      body.className = "card-body";

      const categoryLabel = document.createElement("p");
      categoryLabel.className = "small mb-0";
      categoryLabel.textContent = service.categoryLabel;

      const heading = document.createElement("h3");
      heading.className = "card-title";

      const link = document.createElement("a");
      link.href =
        `service-details.html?id=${encodeURIComponent(service.id)}`;
      link.textContent = service.title;

      heading.appendChild(link);

      const description = document.createElement("p");
      description.className = "card-description";
      description.textContent = service.description;

      const footer = document.createElement("div");
      footer.className = "flex-between";

      const price = document.createElement("span");
      price.className = "price";
      price.textContent =
        window.NEDIKEServices.formatPrice(service.price);

      const place = document.createElement("span");
      place.className = "small muted";
      place.textContent = formatLocation(service.location);

      footer.append(price, place);
      body.append(categoryLabel, heading, description, footer);
      article.append(image, body);
      results.appendChild(article);
    });
  }

  function resetFilters() {
    if (searchInput) searchInput.value = "";

    if (locationSelect) locationSelect.value = "all";
    if (sortSelect) sortSelect.value = "recommended";

    const allCategory = document.querySelector(
      'input[name="category"][value="all"]'
    );

    const allPrices = document.querySelector(
      'input[name="price"][value="all"]'
    );

    if (allCategory) allCategory.checked = true;
    if (allPrices) allPrices.checked = true;

    render();
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      render();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", render);
  }

  if (locationSelect) {
    locationSelect.addEventListener("change", render);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", render);
  }

  document
    .querySelectorAll('input[name="category"], input[name="price"]')
    .forEach((input) => {
      input.addEventListener("change", render);
    });

  if (clearButton) {
    clearButton.addEventListener("click", resetFilters);
  }

  if (emptyClearButton) {
    emptyClearButton.addEventListener("click", resetFilters);
  }

  // Read search and category values passed through the URL.
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  const category = params.get("category");

  if (query && searchInput) {
    searchInput.value = query;
  }

  if (category) {
    const categoryInput = Array.from(
      document.querySelectorAll('input[name="category"]')
    ).find((input) => input.value === category);

    if (categoryInput) {
      categoryInput.checked = true;
    }
  }

  render();
});