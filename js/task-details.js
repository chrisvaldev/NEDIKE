
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
        const stored = localStorage.getItem(APPLICATIONS_KEY);

        if (stored === null || stored.trim() === "") {
          return { success: true, applications: [] };
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          return { success: false, applications: [] };
        }

        return {
          success: true,
          applications: parsed.filter(function (item) {
            return item && typeof item === "object";
          })
        };
      } catch (error) {
        console.error("Could not read task applications:", error);

        return { success: false, applications: [] };
      }
    }

    function getCurrentUser() {
      if (!auth || typeof auth.getCurrentUser !== "function") {
        return null;
      }

      try {
        return auth.getCurrentUser();
      } catch (error) {
        console.error("Could not retrieve the current user:", error);
        return null;
      }
    }

    function getUserId(user) {
      return user
        ? String(user.id || user.email || "").trim()
        : "";
    }

    function getUserEmail(user) {
      return user ? String(user.email || "").trim().toLowerCase() : "";
    }

    function getLoginUrl() {
      const returnPage =
        "task-details.html?id=" + encodeURIComponent(String(task.id));

      return "login.html?next=" + encodeURIComponent(returnPage);
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

    function getCategoryLabel(taskData) {
      if (taskData.categoryLabel) {
        return taskData.categoryLabel;
      }

      const labels = {
        "graphic-design": "Graphic Design",
        "web-development": "Web Development",
        writing: "Writing",
        photography: "Photography",
        "digital-marketing": "Digital Marketing"
      };

      return (
        labels[taskData.category] ||
        taskData.category ||
        "General"
      );
    }

    function getDuration(taskData) {
      if (taskData.durationLabel) {
        return taskData.durationLabel;
      }

      if (taskData.duration != null && taskData.duration !== "") {
        const value = String(taskData.duration);

        if (/^\d+(\.\d+)?$/.test(value)) {
          return value + (Number(value) === 1 ? " day" : " days");
        }

        return value;
      }

      return taskData.deadline || "Not specified";
    }

    function getWorkType(taskData) {
      const location = String(taskData.location || "").toLowerCase();

      if (location.includes("remote") || location.includes("online")) {
        return "Remote";
      }

      if (location.includes("onitsha") || location.includes("awka")) {
        return "In person";
      }

      return taskData.location || "To be agreed";
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

      if (el.apply) {
        el.apply.disabled = true;
      }

      if (el.feedback) {
        el.feedback.textContent = "";
      }

      document.title = "Task Not Found | NEDIKE";
    }

    if (!taskAPI || typeof taskAPI.getById !== "function") {
      showUnavailable("The task catalogue could not be loaded.");
      console.error(
        "Check that js/tasks.js loads before js/task-details.js."
      );
      return;
    }

    if (!taskId) {
      showUnavailable(
        "Choose a task from the task directory to view its details."
      );
      return;
    }

    let task;

    try {
      task = taskAPI.getById(taskId);
    } catch (error) {
      console.error("Could not load the selected task:", error);
      showUnavailable("The selected task could not be loaded.");
      return;
    }

    if (!task) {
      showUnavailable(
        "This task could not be found. Return to the task directory to browse available tasks."
      );
      return;
    }

    // Populate the selected task's details.
    setText(el.title, task.title || "Untitled task");

    setText(
      el.subtitle,
      getCategoryLabel(task) +
        " · " +
        (task.location || "Location not specified")
    );

    setText(el.category, getCategoryLabel(task));
    setText(el.location, task.location || "Location not specified");

    setText(
      el.description,
      task.details ||
        task.description ||
        "No additional description provided."
    );

    setText(el.budget, formatPrice(task.budget));
    setText(el.duration, getDuration(task));
    setText(el.workType, getWorkType(task));

    renderList(el.deliverables, task.deliverables);
    renderList(el.skills, task.skills);

    document.title = (task.title || "Task Details") + " | NEDIKE";

    function findExistingApplication(user) {
      const result = readApplications();

      if (!result.success) {
        return { success: false, application: null };
      }

      const userId = getUserId(user);
      const email = getUserEmail(user);

      const application = result.applications.find(function (item) {
        const sameTask =
          String(item.taskId || "") === String(task.id);

        const sameUserId =
          userId &&
          String(
            item.applicantId ||
            item.applicantID ||
            item.userId ||
            ""
          ).trim() === userId;

        const sameEmail =
          email &&
          String(
            item.applicantEmail ||
            item.applicantEmailAddress ||
            item.email ||
            ""
          ).trim().toLowerCase() === email;

        return sameTask && (sameUserId || sameEmail);
      });

      return {
        success: true,
        application: application || null
      };
    }

    function showFeedback(message) {
      setText(el.feedback, message);
    }

    function redirectToLogin() {
      try {
        localStorage.setItem(
          PENDING_TASK_KEY,
          String(task.id)
        );
      } catch (error) {
        console.error("Could not remember the selected task:", error);
      }

      window.location.href = getLoginUrl();
    }

    function openApplicationForm(user) {
      const userId = getUserId(user);

      if (!userId) {
        showFeedback(
          "We couldn't identify your account. Please log in again."
        );
        return;
      }

      const existing = findExistingApplication(user);

      if (!existing.success) {
        showFeedback(
          "Your application records could not be read. Please check your browser storage and try again."
        );
        return;
      }

      if (existing.application) {
        showFeedback(
          "You've already submitted an application for this task."
        );

        if (el.apply) {
          el.apply.disabled = true;
          el.apply.textContent = "Application submitted";
        }

        return;
      }

      let form = document.getElementById("task-application-form");

      if (form) {
        form.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        return;
      }

      form = document.createElement("form");
      form.id = "task-application-form";
      form.className = "task-application-form";

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
      error.setAttribute("role", "status");
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

        if (el.apply) {
          el.apply.disabled = false;
        }

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
      const main = document.querySelector(".detail-main");

      if (sidebar) {
        sidebar.appendChild(form);
      } else if (main) {
        main.appendChild(form);
      } else {
        showFeedback(
          "The application form could not be displayed on this page."
        );
        return;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        error.textContent = "";

        if (!form.reportValidity()) {
          return;
        }

        const messageValue = message.value.trim();
        const durationValue = duration.value.trim();

        if (messageValue.length < 20) {
          error.textContent =
            "Please write at least 20 characters in your application message.";
          message.focus();
          return;
        }

        if (!durationValue) {
          error.textContent =
            "Please enter your estimated completion time.";
          duration.focus();
          return;
        }

        // Re-check the session before saving.
        const currentUser = getCurrentUser();
        const currentUserId = getUserId(currentUser);

        if (!currentUserId) {
          redirectToLogin();
          return;
        }

        const existingApplication = findExistingApplication(currentUser);

        if (!existingApplication.success) {
          error.textContent =
            "Your application records could not be read. Please try again.";
          return;
        }

        if (existingApplication.application) {
          error.textContent =
            "You've already submitted an application for this task.";
          return;
        }

        const application = {
          id:
            "application_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2, 8),

          taskId: String(task.id),
          taskTitle: String(task.title || ""),
          taskBudget: Number(task.budget) || 0,
          applicantId: currentUserId,
          applicantName: String(
            currentUser.fullName ||
              currentUser.name ||
              [
                currentUser.firstName,
                currentUser.lastName
              ]
                .filter(Boolean)
                .join(" ") ||
              "Student"
          ),
          applicantEmail: getUserEmail(currentUser),
          message: messageValue,
          proposedDuration: durationValue,
          status: "pending",
          submittedAt: new Date().toISOString()
        };

        const result = readApplications();

        if (!result.success) {
          error.textContent =
            "Your application records could not be read. Please try again.";
          return;
        }

        // Check again against the latest stored records before saving.
        const alreadyExists = result.applications.some(function (item) {
          const sameTask =
            String(item.taskId || "") === String(task.id);

          const sameId =
            String(item.applicantId || "").trim() === currentUserId;

          const email = getUserEmail(currentUser);

          const sameEmail =
            email &&
            String(item.applicantEmail || "")
              .trim()
              .toLowerCase() === email;

          return sameTask && (sameId || sameEmail);
        });

        if (alreadyExists) {
          error.textContent =
            "You've already submitted an application for this task.";
          return;
        }

        result.applications.push(application);

        try {
          localStorage.setItem(
            APPLICATIONS_KEY,
            JSON.stringify(result.applications)
          );
        } catch (storageError) {
          console.error("Could not save application:", storageError);

          error.textContent =
            "Your application could not be saved in this browser. Check available storage and try again.";
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

      form.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      message.focus();
    }

    if (el.apply) {
      el.apply.addEventListener("click", function (event) {
        // Prevent navigation if the apply control is a link.
        if (el.apply.tagName === "A") {
          event.preventDefault();
        }

        const user = getCurrentUser();

        if (!user || !getUserId(user)) {
          redirectToLogin();
          return;
        }

        openApplicationForm(user);
      });
    }

    // Restore the selected task after login.
    try {
      const pendingTask = localStorage.getItem(PENDING_TASK_KEY);

      if (pendingTask && pendingTask === String(task.id)) {
        localStorage.removeItem(PENDING_TASK_KEY);

        const user = getCurrentUser();

        if (user && getUserId(user)) {
          openApplicationForm(user);
        }
      }
    } catch (error) {
      console.error("Could not restore pending application:", error);
    }

    // Restore the submitted state when revisiting this task.
    const currentUser = getCurrentUser();

    if (currentUser && getUserId(currentUser) && el.apply) {
      const existing = findExistingApplication(currentUser);

      if (!existing.success) {
        showFeedback(
          "Your saved application records could not be read."
        );
      } else if (existing.application) {
        el.apply.disabled = true;
        el.apply.textContent = "Application submitted";

        showFeedback(
          "You've already submitted an application for this task."
        );
      }
    }
  }
})();
