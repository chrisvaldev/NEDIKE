(function () {
  "use strict";

  const APPLICATIONS_KEY = "nedike_task_applications";
  const PENDING_TASK_KEY = "nedike_pending_task_application";

  document.addEventListener("DOMContentLoaded", initTaskDetails);

  function initTaskDetails() {
    const auth = window.NEDIKEAuth;
    const taskAPI = window.NEDIKETasks;

    const el = {
      title: document.getElementById("task-title"),
      subtitle: document.getElementById("task-subtitle"),
      category: document.getElementById("task-category"),
      location: document.getElementById("task-location"),
      description: document.getElementById("task-description"),
      deliverables: document.getElementById("task-deliverables"),
      skills: document.getElementById("task-skills"),
      budget: document.getElementById("task-budget"),
      duration: document.getElementById("task-duration"),
      workType: document.getElementById("task-work-type"),
      apply: document.getElementById("apply-task"),
      feedback: document.getElementById("task-feedback")
    };

    const taskId = new URLSearchParams(window.location.search).get("id");

    function setText(element, value) {
      if (element) {
        element.textContent = value == null ? "" : String(value);
      }
    }

    function readApplications() {
      try {
        const stored = JSON.parse(
          localStorage.getItem(APPLICATIONS_KEY) || "[]"
        );

        return Array.isArray(stored) ? stored : [];
      } catch (error) {
        console.error("Could not read task applications:", error);
        return [];
      }
    }

    function getCurrentUser() {
      if (!auth || typeof auth.getCurrentUser !== "function") {
        return null;
      }

      return auth.getCurrentUser();
    }

    function getUserId(user) {
      return user ? String(user.id || user.email || "").trim() : "";
    }

    function formatPrice(amount) {
      if (taskAPI && typeof taskAPI.formatPrice === "function") {
        return taskAPI.formatPrice(amount);
      }

      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
      }).format(Number(amount) || 0);
    }

    function getCategoryLabel(task) {
      if (task.categoryLabel) return task.categoryLabel;

      const labels = {
        "graphic-design": "Graphic Design",
        "web-development": "Web Development",
        writing: "Writing",
        photography: "Photography",
        "digital-marketing": "Digital Marketing"
      };

      return labels[task.category] || task.category || "General";
    }

    function getDuration(task) {
      return task.duration || task.deadline || "Not specified";
    }

    function getWorkType(task) {
      const location = String(task.location || "").toLowerCase();

      if (location.includes("remote") || location.includes("online")) {
        return "Remote";
      }

      if (location.includes("onitsha") || location.includes("awka")) {
        return "In person";
      }

      return task.location || "To be agreed";
    }

    function renderList(container, items) {
      if (!container) return;

      container.replaceChildren();

      (Array.isArray(items) ? items : []).forEach(function (item) {
        const li = document.createElement("li");
        li.textContent = String(item);
        container.appendChild(li);
      });
    }

    function showUnavailable(message) {
      setText(el.title, "Task not found");
      setText(el.subtitle, message);
      setText(el.description, message);
      setText(el.budget, "Unavailable");

      if (el.apply) el.apply.disabled = true;
      if (el.feedback) el.feedback.textContent = "";

      document.title = "Task Not Found | NEDIKE";
    }

    if (!taskAPI || typeof taskAPI.getById !== "function") {
      showUnavailable("The task catalogue could not be loaded.");
      console.error("Check that js/tasks.js loads before js/task-details.js.");
      return;
    }

    if (!taskId) {
      showUnavailable("Choose a task from the task directory to view its details.");
      return;
    }

    const task = taskAPI.getById(taskId);

    if (!task) {
      showUnavailable(
        "This task could not be found. Return to the task directory to browse available tasks."
      );
      return;
    }

    // Populate task information.
    setText(el.title, task.title || "Untitled task");
    setText(
      el.subtitle,
      getCategoryLabel(task) + " · " + (task.location || "Location not specified")
    );
    setText(el.category, getCategoryLabel(task));
    setText(el.location, task.location || "Location not specified");
    setText(
      el.description,
      task.details || task.description || "No additional description provided."
    );
    setText(el.budget, formatPrice(task.budget));
    setText(el.duration, getDuration(task));
    setText(el.workType, getWorkType(task));

    renderList(el.deliverables, task.deliverables);
    renderList(el.skills, task.skills);

    document.title = (task.title || "Task Details") + " | NEDIKE";

    function hasApplied(userId) {
      return readApplications().some(function (application) {
        return (
          String(application.taskId) === String(task.id) &&
          String(application.applicantId) === userId
        );
      });
    }

    function showFeedback(message) {
      setText(el.feedback, message);
    }

    function openApplicationForm(user) {
      const userId = getUserId(user);

      if (!userId) {
        showFeedback("We couldn't identify your account. Please log in again.");
        return;
      }

      if (hasApplied(userId)) {
        showFeedback("You've already submitted an application for this task.");
        if (el.apply) el.apply.disabled = true;
        return;
      }

      let form = document.getElementById("task-application-form");

      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      form = document.createElement("form");
      form.id = "task-application-form";
      form.className = "task-application-form";
      form.noValidate = false;

      const heading = document.createElement("h2");
      heading.textContent = "Apply for this task";

      const introduction = document.createElement("p");
      introduction.textContent =
        "Tell the requester why you're suitable and when you can complete the work.";

      const messageLabel = document.createElement("label");
      messageLabel.htmlFor = "application-message";
      messageLabel.textContent = "Your application message";

      const message = document.createElement("textarea");
      message.id = "application-message";
      message.name = "message";
      message.rows = 5;
      message.minLength = 20;
      message.maxLength = 1500;
      message.required = true;
      message.placeholder =
        "Introduce yourself, describe relevant skills, and explain how you would approach this task.";

      const durationLabel = document.createElement("label");
      durationLabel.htmlFor = "application-duration";
      durationLabel.textContent = "Your estimated completion time";

      const duration = document.createElement("input");
      duration.id = "application-duration";
      duration.name = "duration";
      duration.type = "text";
      duration.maxLength = 80;
      duration.required = true;
      duration.placeholder = "e.g. 3 days";

      const error = document.createElement("p");
      error.className = "small";
      error.setAttribute("aria-live", "polite");

      const actions = document.createElement("div");
      actions.className = "task-application-actions";

      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "btn btn-primary";
      submit.textContent = "Submit application";

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn btn-outline";
      cancel.textContent = "Cancel";

      cancel.addEventListener("click", function () {
        form.remove();
        if (el.apply) el.apply.disabled = false;
        showFeedback("");
      });

      actions.append(submit, cancel);
      form.append(
        heading,
        introduction,
        messageLabel,
        message,
        durationLabel,
        duration,
        error,
        actions
      );

      const sidebar = document.querySelector(".detail-sidebar");

      if (sidebar) {
        sidebar.appendChild(form);
      } else {
        document.querySelector(".detail-main")?.appendChild(form);
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        error.textContent = "";

        if (!form.reportValidity()) return;

        // Re-check login and duplicate status at submission time.
        const currentUser = getCurrentUser();
        const currentUserId = getUserId(currentUser);

        if (!currentUserId) {
          localStorage.setItem(PENDING_TASK_KEY, String(task.id));
          window.location.href =
            "login.html?next=" + encodeURIComponent("task-details.html");
          return;
        }

        if (hasApplied(currentUserId)) {
          error.textContent =
            "You've already submitted an application for this task.";
          return;
        }

        const application = {
          id: "application_" + Date.now() + "_" +
            Math.random().toString(36).slice(2, 8),
          taskId: String(task.id),
          taskTitle: String(task.title || ""),
          applicantId: currentUserId,
          applicantName: String(
            currentUser.fullName ||
            currentUser.name ||
            [currentUser.firstName, currentUser.lastName]
              .filter(Boolean)
              .join(" ") ||
            "Student"
          ),
          applicantEmail: String(currentUser.email || ""),
          message: message.value.trim(),
          proposedDuration: duration.value.trim(),
          status: "pending",
          submittedAt: new Date().toISOString()
        };

        const applications = readApplications();
        applications.push(application);

        try {
          localStorage.setItem(
            APPLICATIONS_KEY,
            JSON.stringify(applications)
          );
        } catch (storageError) {
          console.error("Could not save application:", storageError);
          error.textContent =
            "Your application could not be saved in this browser. Please try again.";
          return;
        }

        form.remove();

        if (el.apply) {
          el.apply.disabled = true;
          el.apply.textContent = "Application submitted";
        }

        showFeedback(
          "Your demo application has been saved successfully. You can review it in this browser."
        );
      });

      form.scrollIntoView({ behavior: "smooth", block: "center" });
      message.focus();
    }

    if (el.apply) {
      el.apply.addEventListener("click", function () {
        const user = getCurrentUser();

        if (!user) {
          try {
            localStorage.setItem(PENDING_TASK_KEY, String(task.id));
          } catch (error) {
            console.error("Could not remember selected task:", error);
          }

          window.location.href =
            "login.html?next=" + encodeURIComponent("task-details.html");
          return;
        }

        openApplicationForm(user);
      });
    }

    // Resume the selected task after login returns to this page.
    try {
      const pendingTask = localStorage.getItem(PENDING_TASK_KEY);

      if (pendingTask && pendingTask === String(task.id)) {
        localStorage.removeItem(PENDING_TASK_KEY);

        const user = getCurrentUser();

        if (user) {
          openApplicationForm(user);
        }
      }
    } catch (error) {
      console.error("Could not restore pending application:", error);
    }

    // Restore the submitted state when revisiting the same task.
    const currentUser = getCurrentUser();
    const currentUserId = getUserId(currentUser);

    if (currentUserId && hasApplied(currentUserId) && el.apply) {
      el.apply.disabled = true;
      el.apply.textContent = "Application submitted";
      showFeedback("You've already submitted an application for this task.");
    }
  }
})();
