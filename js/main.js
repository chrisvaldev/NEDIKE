
"use strict";

/* =========================================================
   NEDIKE — MAIN JAVASCRIPT
   File: js/main.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeMobileNavigation();
  initializeSearchTabs();
  initializeSearchForms();
  initializeCurrentYear();
  initializeAuthNavigation();
});

/* =========================================================
   01. MOBILE NAVIGATION
   ========================================================= */

function initializeMobileNavigation() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  const closeButton = document.querySelector("[data-menu-close]");

  if (!toggle || !menu) return;

  const toggleIcon = toggle.querySelector(".menu-toggle-icon");
  const originalToggleText = toggleIcon ? toggleIcon.textContent : toggle.textContent;

  let previouslyFocusedElement = null;

  function openMenu() {
    previouslyFocusedElement = document.activeElement;

    menu.inert = false;
    menu.setAttribute("aria-hidden", "false");
    menu.classList.add("is-open");

    document.body.classList.add("mobile-nav-open");

    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");

    if (toggleIcon) {
      toggleIcon.textContent = "×";
    } else {
      toggle.textContent = "×";
    }

    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeMenu(restoreFocus = false) {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menu.inert = true;

    document.body.classList.remove("mobile-nav-open");

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");

    if (toggleIcon) {
      toggleIcon.textContent = originalToggleText.trim() || "☰";
    } else {
      toggle.textContent = originalToggleText.trim() || "☰";
    }

    if (
      restoreFocus &&
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === "function"
    ) {
      previouslyFocusedElement.focus();
    }
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeMenu(true);
    });
  }

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  menu.querySelectorAll("[data-logout-link]").forEach((element) => {
    element.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });

  document.addEventListener("click", (event) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;

    const clickedInsideMenu = menu.contains(event.target);
    const clickedToggle = toggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      closeMenu();
    }
  });
}

/* =========================================================
   02. SEARCH TABS
   ========================================================= */

function initializeSearchTabs() {
  const tabs = document.querySelectorAll("[data-search-type]");

  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        item.setAttribute("aria-pressed", "false");
      });

      tab.setAttribute("aria-pressed", "true");
    });
  });
}

/* =========================================================
   03. SEARCH FORMS
   ========================================================= */

function initializeSearchForms() {
  const forms = document.querySelectorAll("[data-search-form]");

  const routes = {
    services: "services.html",
    tasks: "tasks.html",
    courses: "learning.html"
  };

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const input = form.querySelector("[name='q']");
      const query = input ? input.value.trim() : "";

      const activeTab = document.querySelector(
        "[data-search-type][aria-pressed='true']"
      );

      const selectedType = activeTab
        ? activeTab.dataset.searchType
        : "services";

      const destination = routes[selectedType] || routes.services;
      const url = new URL(destination, window.location.href);

      if (query) {
        url.searchParams.set("q", query);
      }

      window.location.href = url.href;
    });
  });
}

/* =========================================================
   04. CURRENT YEAR
   ========================================================= */

function initializeCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

/* =========================================================
   05. AUTHENTICATION NAVIGATION
   ========================================================= */

function initializeAuthNavigation() {
  const auth = window.NEDIKEAuth;

  const loggedIn = Boolean(
    auth &&
    typeof auth.isLoggedIn === "function" &&
    auth.isLoggedIn()
  );

  updateGuestAndMemberLinks(loggedIn);
  updateDesktopAuthNavigation(loggedIn);
  initializeLogoutButtons();
}

/* =========================================================
   06. GUEST AND MEMBER LINKS
   ========================================================= */

function updateGuestAndMemberLinks(loggedIn) {
  document.querySelectorAll("[data-guest-link]").forEach((link) => {
    link.hidden = loggedIn;
  });

  document.querySelectorAll("[data-member-link]").forEach((link) => {
    link.hidden = !loggedIn;
  });

  document.querySelectorAll("[data-logout-link]").forEach((link) => {
    link.hidden = !loggedIn;
  });
}

/* =========================================================
   07. DESKTOP AUTHENTICATION NAVIGATION
   ========================================================= */

function updateDesktopAuthNavigation(loggedIn) {
  const navigation = document.getElementById("auth-navigation");

  if (!navigation || !loggedIn) return;

  navigation.replaceChildren();

  const profileLink = document.createElement("a");
  profileLink.className = "btn btn-outline btn-sm";
  profileLink.href = "profile.html";
  profileLink.textContent = "My profile";

  const dashboardLink = document.createElement("a");
  dashboardLink.className = "btn btn-primary btn-sm";
  dashboardLink.href = "dashboard.html";
  dashboardLink.textContent = "Dashboard";

  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.className = "btn btn-outline btn-sm";
  logoutButton.textContent = "Log out";

  logoutButton.addEventListener("click", handleLogout);

  navigation.append(profileLink, dashboardLink, logoutButton);
}

/* =========================================================
   08. LOGOUT BUTTONS AND LINKS
   ========================================================= */

function initializeLogoutButtons() {
  document.querySelectorAll("[data-logout-link]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (element.tagName === "A") {
        event.preventDefault();
      }

      handleLogout();
    });
  });
}

/* =========================================================
   09. LOGOUT HANDLER
   ========================================================= */

function handleLogout() {
  const auth = window.NEDIKEAuth;

  if (!auth || typeof auth.logout !== "function") {
    console.error(
      "NEDIKE authentication is not available. Check js/auth.js."
    );
    return;
  }

  auth.logout();
}
