"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const getElement = (id) => document.getElementById(id);

  const title = getElement("detail-title");
  const subtitle = getElement("detail-subtitle");
  const image = getElement("detail-image");
  const category = getElement("detail-category");
  const location = getElement("detail-location");
  const description = getElement("detail-description");
  const deliverables = getElement("detail-deliverables");
  const price = getElement("detail-price");
  const providerName = getElement("provider-name");
  const providerDescription = getElement("provider-description");
  const contactButton = getElement("contact-provider");
  const saveButton = getElement("save-service");
  const feedback = getElement("detail-feedback");

  const SAVED_SERVICES_KEY = "nedike_saved_services";

  function showFeedback(message) {
    if (feedback) {
      feedback.textContent = message;
    }
  }

  function formatLocation(value) {
    if (!value) return "Location not specified";

    if (value.toLowerCase() === "remote") {
      return "Remote";
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function getSavedServices() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SAVED_SERVICES_KEY) || "[]"
      );

      return Array.isArray(saved)
        ? saved.filter((id) => typeof id === "string")
        : [];
    } catch (error) {
      console.error("Could not read saved services:", error);
      return [];
    }
  }

  function setSavedButtonState(isSaved) {
    if (!saveButton) return;

    saveButton.textContent = isSaved
      ? "Remove saved service"
      : "Save service";

    saveButton.setAttribute("aria-pressed", String(isSaved));
  }

  function setSavedState(serviceId, shouldSave) {
    const savedServices = getSavedServices();

    const updatedServices = shouldSave
      ? [...new Set([...savedServices, serviceId])]
      : savedServices.filter((id) => id !== serviceId);

    try {
      localStorage.setItem(
        SAVED_SERVICES_KEY,
        JSON.stringify(updatedServices)
      );

      setSavedButtonState(shouldSave);

      showFeedback(
        shouldSave
          ? "Service saved in this browser."
          : "Service removed from your saved list."
      );
    } catch (error) {
      console.error("Could not save service:", error);

      showFeedback(
        "Unable to save this service in your browser. Please check your browser storage settings."
      );
    }
  }

  function showNotFound() {
    document.title = "Service Not Found | NEDIKE";

    if (title) title.textContent = "Service not found";

    if (subtitle) {
      subtitle.textContent =
        "This service is unavailable in the current catalogue.";
    }

    if (description) {
      description.textContent =
        "Please return to the services page to explore the available services.";
    }

    if (price) price.textContent = "Unavailable";

    if (image) image.classList.add("hidden");

    if (category) category.textContent = "Unavailable";

    if (location) location.textContent = "—";

    if (deliverables) {
      deliverables.replaceChildren();

      const item = document.createElement("li");
      item.textContent = "Please select an available service.";
      deliverables.appendChild(item);
    }

    if (contactButton) contactButton.disabled = true;
    if (saveButton) saveButton.disabled = true;
  }

  // Confirm that the shared catalogue has loaded.
  const catalogue = window.NEDIKEServices;

  if (
    !catalogue ||
    typeof catalogue.getById !== "function" ||
    typeof catalogue.formatPrice !== "function"
  ) {
    console.error(
      "NEDIKE service catalogue is unavailable. Check the script order in service-details.html."
    );

    showNotFound();
    return;
  }

  // Read the selected service from the URL.
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("id");
  const service = serviceId ? catalogue.getById(serviceId) : null;

  if (!service) {
    showNotFound();
    return;
  }

  const serviceLocation = formatLocation(service.location);

  // Populate the page using the shared catalogue.
  document.title = `${service.title} | NEDIKE`;

  title.textContent = service.title;

  subtitle.textContent =
    `${service.categoryLabel} · ${serviceLocation}`;

  category.textContent = service.categoryLabel;
  location.textContent = serviceLocation;
  description.textContent =
    service.details || service.description;

  price.textContent = catalogue.formatPrice(service.price);

  image.src = service.image;
  image.alt = service.imageAlt || service.title;
  image.classList.remove("hidden");

  image.addEventListener("error", () => {
    image.classList.add("hidden");
  });

  providerName.textContent =
    service.provider || "Demo Student";

  providerDescription.textContent =
    service.providerInfo || "Sample service provider";

  // Display the service's deliverables when available.
  if (deliverables) {
    const items = Array.isArray(service.deliverables)
      ? service.deliverables
      : [
          "Clear communication about your requirements.",
          "Agreement on the work before it begins.",
          "Delivery according to the agreed scope."
        ];

    deliverables.replaceChildren();

    items.forEach((itemText) => {
      const item = document.createElement("li");
      item.textContent = itemText;
      deliverables.appendChild(item);
    });
  }

  // Restore the saved state from this browser.
  const savedServices = getSavedServices();

  setSavedButtonState(savedServices.includes(service.id));

  // Contact is still a demonstration until backend messaging exists.
  if (contactButton) {
    contactButton.addEventListener("click", () => {
      showFeedback(
        "Provider messaging is not available yet. It will be connected when NEDIKE's account and messaging features are implemented."
      );
    });
  }

  // Save or remove the service from the local saved list.
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const isSaved = getSavedServices().includes(service.id);

      setSavedState(service.id, !isSaved);
    });
  }
});