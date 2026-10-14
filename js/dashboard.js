/* =========================================================
   NEDIKE — STUDENT DASHBOARD
   File: js/dashboard.js

   Reads task applications from localStorage and displays
   the current student's application history.
   ========================================================= */

(function () {
  "use strict";

  const APPLICATIONS_KEY = "nedike_task_applications";

  const elements = {
    userName: document.getElementById("dashboard-user-name"),
    total: document.getElementById("total-applications"),
    pending: document.getElementById("pending-applications"),
    accepted: document.getElementById("accepted-applications"),
    list: document.getElementById("dashboard-application-list"),
    empty: document.getElementById("dashboard-empty-state")
  };

  function readApplications() {
    try {
      const stored = localStorage.getItem(APPLICATIONS_KEY);
      const applications = stored ? JSON.parse(stored) : [];

      return Array.isArray(applications) ? applications : [];
    } catch (error) {
      console.error("NEDIKE: Could not read task applications.", error);
      return [];
    }
  }

  function getCurrentUser() {
    const auth = window.NEDIKEAuth;

    if (!auth) {
      return null;
    }

    if (typeof auth.getCurrentUser === "function") {
      return auth.getCurrentUser();
    }

    return null;
  }

  function getUserIdentifier(user) {
    if (!user) {
      return "";
    }

    return String(user.id || user.email || user.emailAddress || "")
      .trim()
      .toLowerCase();
  }

  function getDisplayName(user) {
    if (!user) {
      return "Student";
    }

    const fullName = [
      user.firstName,
      user.lastName
    ].filter(Boolean).join(" ").trim();

    return (
      user.fullName ||
      user.name ||
      fullName ||
      user.username ||
      "Student"
    );
  }

  function getApplicationStatus(application) {
    return String(application.status || "pending").toLowerCase();
  }

  function formatDate(value) {
    if (!value) {
      return "Date not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function formatBudget(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "Budget not available";
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    element.textContent = text || "";

    return element;
  }

  function createApplicationCard(application) {
    const card = document.createElement("article");
    card.className = "dashboard-application-card";

    const main = document.createElement("div");
    main.className = "dashboard-application-main";

    const title = createTextElement(
      "h3",
      "dashboard-application-title",
      application.taskTitle || application.title || "Untitled task"
    );

    const meta = document.createElement("div");
    meta.className = "dashboard-application-meta";

    meta.appendChild(
      createTextElement(
        "span",
        "",
        "Applied " + formatDate(application.submittedAt)
      )
    );

    if (application.proposedDuration) {
      meta.appendChild(
        createTextElement(
          "span",
          "",
          "Duration: " + application.proposedDuration
        )
      );
    }

    main.appendChild(title);
    main.appendChild(meta);

    if (application.message) {
      main.appendChild(
        createTextElement(
          "p",
          "dashboard-application-message",
          application.message
        )
      );
    }

    const side = document.createElement("div");
    side.className = "dashboard-application-side";

    const status = getApplicationStatus(application);
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    const statusBadge = createTextElement(
      "span",
      "application-status application-status-" + status,
      statusLabel
    );

    side.appendChild(statusBadge);

    if (application.budget != null) {
      side.appendChild(
        createTextElement(
          "span",
          "dashboard-application-budget",
          formatBudget(application.budget)
        )
      );
    }

    const taskId = application.taskId;

    if (taskId) {
      const taskLink = document.createElement("a");
      taskLink.className = "text-link";
      taskLink.href =
        "task-details.html?id=" + encodeURIComponent(taskId);
      taskLink.textContent = "View task →";

      side.appendChild(taskLink);
    }

    card.appendChild(main);
    card.appendChild(side);

    return card;
  }

  function renderApplications(applications) {
    elements.list.replaceChildren();

    if (applications.length === 0) {
      elements.list.hidden = true;
      elements.empty.hidden = false;
      return;
    }

    elements.list.hidden = false;
    elements.empty.hidden = true;

    applications.forEach(function (application) {
      elements.list.appendChild(createApplicationCard(application));
    });
  }

  function updateSummary(applications) {
    const pendingCount = applications.filter(function (application) {
      return getApplicationStatus(application) === "pending";
    }).length;

    const acceptedCount = applications.filter(function (application) {
      return getApplicationStatus(application) === "accepted";
    }).length;

    elements.total.textContent = String(applications.length);
    elements.pending.textContent = String(pendingCount);
    elements.accepted.textContent = String(acceptedCount);
  }

  function showMessage(message) {
    elements.list.replaceChildren(
      createTextElement("p", "dashboard-message", message)
    );

    elements.list.hidden = false;
    elements.empty.hidden = true;

    updateSummary([]);
  }

  function initDashboard() {
    const user = getCurrentUser();

    if (!user) {
      showMessage("Please log in to view your task applications.");

      const returnUrl = "dashboard.html";

      window.setTimeout(function () {
        window.location.href =
          "login.html?next=" + encodeURIComponent(returnUrl);
      }, 1200);

      return;
    }

    elements.userName.textContent = getDisplayName(user);

    const userIdentifier = getUserIdentifier(user);

    if (!userIdentifier) {
      showMessage(
        "Your account could not be identified. Please check your login setup."
      );
      return;
    }

    const applications = readApplications();

    const myApplications = applications
      .filter(function (application) {
        const applicantIdentifier = String(
          application.applicantId ||
          application.applicantEmail ||
          ""
        ).trim().toLowerCase();

        return applicantIdentifier === userIdentifier;
      })
      .sort(function (a, b) {
        return new Date(b.submittedAt || 0) -
          new Date(a.submittedAt || 0);
      });

    updateSummary(myApplications);
    renderApplications(myApplications);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
})();


