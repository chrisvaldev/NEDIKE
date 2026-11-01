
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const results = document.getElementById("saved-service-results");
  const emptyState = document.getElementById("saved-empty-state");
  const count = document.getElementById("saved-count");
  const notice = document.getElementById("saved-notice");
  const logoutButton = document.getElementById("logout-button");
  const currentYear = document.getElementById("current-year");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  const auth = window.NEDIKEAuth;
  const savedManager = window.NEDIKESavedServices;
  const catalogue = window.NEDIKEServices;

  if (!auth || typeof auth.getCurrentUser !== "function") {
    console.error("NEDIKE authentication manager is unavailable.");
    return;
  }

  if (!auth.getCurrentUser()) {
    const returnUrl = window.location.pathname + window.location.search;
    window.location.replace(
      `login.html?return=${encodeURIComponent(returnUrl)}`
    );
    return;
  }

  if (
    !savedManager ||
    typeof savedManager.getAll !== "function" ||
    typeof savedManager.remove !== "function"
  ) {
    console.error("NEDIKE saved-services manager is unavailable.");
    showNotice("Saved services could not be loaded. Please refresh the page.");
    return;
  }

  if (
    !catalogue ||
    typeof catalogue.getAll !== "function" ||
    typeof catalogue.formatPrice !== "function"
  ) {
    console.error("NEDIKE services catalogue is unavailable.");
    showNotice("The services catalogue could not be loaded. Please refresh the page.");
    return;
  }

  const allServices = catalogue.getAll();

  function showNotice(message) {
    if (!notice) return;

    notice.textContent = message;
    notice.classList.add("show");
  }

  function formatLocation(location) {
    if (!location) return "Location not specified";

    if (location.toLowerCase() === "remote") return "Remote";

    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  function createServiceCard(service) {
    const article = document.createElement("article");
    article.className = "service-card";

    if (service.image) {
      const image = document.createElement("img");
      image.className = "service-image";
      image.src = service.image;
      image.alt = service.imageAlt || service.title;
      image.loading = "lazy";

      image.addEventListener("error", () => {
        image.style.display = "none";
      });

      article.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "service-body";

    const category = document.createElement("p");
    category.className = "service-category";
    category.textContent = service.categoryLabel || "Service";

    const heading = document.createElement("h2");
    heading.className = "service-title";

    const titleLink = document.createElement("a");
    titleLink.href =
      `service-details.html?id=${encodeURIComponent(service.id)}`;
    titleLink.textContent = service.title;

    heading.appendChild(titleLink);

    const description = document.createElement("p");
    description.className = "service-description";
    description.textContent = service.description || "";

    const meta = document.createElement("div");
    meta.className = "service-meta";

    const price = document.createElement("span");
    price.className = "service-price";
    price.textContent = catalogue.formatPrice(service.price);

    const location = document.createElement("span");
    location.className = "service-location";
    location.textContent = formatLocation(service.location);

    meta.append(price, location);

    const actions = document.createElement("div");
    actions.className = "service-actions";

    const viewLink = document.createElement("a");
    viewLink.className = "button button-primary";
    viewLink.href =
      `service-details.html?id=${encodeURIComponent(service.id)}`;
    viewLink.textContent = "View service";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "Remove saved";
    removeButton.setAttribute(
      "aria-label",
      `Remove ${service.title} from saved services`
    );

    removeButton.addEventListener("click", () => {
      const removed = savedManager.remove(service.id);

      if (!removed) {
        showNotice("This service could not be removed. Please try again.");
        return;
      }

      showNotice(`${service.title} was removed from your saved services.`);
      render();
    });

    actions.append(viewLink, removeButton);
    body.append(category, heading, description, meta, actions);
    article.appendChild(body);

    return article;
  }

  function render() {
    const savedIds = savedManager.getAll();
    const savedIdSet = new Set(savedIds);

    const savedServices = allServices.filter((service) =>
      savedIdSet.has(service.id)
    );

    if (count) {
      count.textContent =
        `${savedServices.length} ${
          savedServices.length === 1 ? "saved service" : "saved services"
        }`;
    }

    if (results) {
      results.replaceChildren();

      savedServices.forEach((service) => {
        results.appendChild(createServiceCard(service));
      });

      results.classList.toggle("hidden", savedServices.length === 0);
    }

    if (emptyState) {
      emptyState.classList.toggle("hidden", savedServices.length !== 0);
    }
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      auth.logout();
    });
  }

  render();
});
