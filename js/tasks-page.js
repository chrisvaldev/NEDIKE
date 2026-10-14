(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", initTasksPage);

  function initTasksPage() {
    const taskAPI = window.NEDIKETasks;

    if (!taskAPI || typeof taskAPI.getAll !== "function") {
      console.error(
        "NEDIKE Tasks: js/tasks.js must load before js/tasks-page.js."
      );
      return;
    }

    const searchForm = document.getElementById("task-search-form");
    const searchInput = document.getElementById("task-search");
    const resultsContainer = document.getElementById("task-results");
    const resultCount = document.getElementById("task-result-count");
    const emptyState = document.getElementById("task-empty-state");
    const sortSelect = document.getElementById("task-sort");
    const clearButton = document.getElementById("clear-task-filters");
    const emptyClearButton = document.getElementById("empty-clear-tasks");

    if (!resultsContainer) {
      console.error("NEDIKE Tasks: #task-results was not found.");
      return;
    }

    let allTasks = taskAPI.getAll();

    if (!Array.isArray(allTasks)) {
      allTasks = [];
    }

    const params = new URLSearchParams(window.location.search);

    if (searchInput && params.has("q")) {
      searchInput.value = params.get("q") || "";
    }

    function getSelectedValue(name) {
      const selected = document.querySelector(
        'input[name="' + name + '"]:checked'
      );

      return selected ? selected.value : "all";
    }

    function formatPrice(amount) {
      if (typeof taskAPI.formatPrice === "function") {
        return taskAPI.formatPrice(amount);
      }

      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
      }).format(Number(amount) || 0);
    }

    function escapeHTML(value) {
      return String(value == null ? "" : value).replace(
        /[&<>"']/g,
        function (character) {
          const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
          };

          return entities[character];
        }
      );
    }

    function normalise(value) {
      return String(value == null ? "" : value)
        .toLowerCase()
        .trim();
    }

    function getCategory(task) {
      return task.category || "";
    }

    function getLocation(task) {
      return normalise(task.location);
    }

    function getDurationDays(task) {
      const duration = String(
        task.duration || task.deadline || ""
      );

      const match = duration.match(/\d+/);
      return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
    }

    function matchesBudget(task, selectedBudget) {
      if (selectedBudget === "all") {
        return true;
      }

      const budget = Number(task.budget) || 0;
      const limit = Number(selectedBudget);

      return budget <= limit;
    }

    function matchesLocation(task, selectedLocation) {
      if (selectedLocation === "all") {
        return true;
      }

      const location = getLocation(task);

      if (selectedLocation === "remote") {
        return (
          location.includes("remote") ||
          location.includes("online")
        );
      }

      return location.includes(normalise(selectedLocation));
    }

    function matchesSearch(task, query) {
      if (!query) {
        return true;
      }

      const searchableText = [
        task.title,
        task.description,
        task.details,
        task.category,
        task.categoryLabel,
        task.location,
        task.postedBy
      ]
        .map(normalise)
        .join(" ");

      return searchableText.includes(query);
    }

    function getFilteredTasks() {
      const query = normalise(searchInput ? searchInput.value : "");
      const category = getSelectedValue("task-category");
      const budget = getSelectedValue("task-budget");
      const location = getSelectedValue("task-location");
      const sortBy = sortSelect ? sortSelect.value : "recommended";

      let tasks = allTasks.filter(function (task) {
        const categoryMatches =
          category === "all" || getCategory(task) === category;

        return (
          categoryMatches &&
          matchesBudget(task, budget) &&
          matchesLocation(task, location) &&
          matchesSearch(task, query)
        );
      });

      if (sortBy === "budget-low") {
        tasks.sort(function (a, b) {
          return (Number(a.budget) || 0) - (Number(b.budget) || 0);
        });
      } else if (sortBy === "budget-high") {
        tasks.sort(function (a, b) {
          return (Number(b.budget) || 0) - (Number(a.budget) || 0);
        });
      } else if (sortBy === "deadline") {
        tasks.sort(function (a, b) {
          return getDurationDays(a) - getDurationDays(b);
        });
      }

      return tasks;
    }

    function getCategoryLabel(task) {
      if (task.categoryLabel) {
        return task.categoryLabel;
      }

      const labels = {
        "graphic-design": "Graphic Design",
        "web-development": "Web Development",
        writing: "Writing",
        photography: "Photography",
        "digital-marketing": "Digital Marketing"
      };

      return labels[task.category] || task.category || "General";
    }

    function getTaskDuration(task) {
      return task.duration || task.deadline || "Not specified";
    }

    function createTaskCard(task) {
      const taskId = encodeURIComponent(String(task.id || ""));
      const title = escapeHTML(task.title || "Untitled task");
      const description = escapeHTML(
        task.description || task.details || "No description provided."
      );
      const category = escapeHTML(getCategoryLabel(task));
      const location = escapeHTML(task.location || "Not specified");
      const duration = escapeHTML(getTaskDuration(task));
      const budget = escapeHTML(formatPrice(task.budget));

      return `
        <article class="task-card">
          <div class="task-card-content">
            <div class="task-card-top">
              <span class="task-category">${category}</span>
              <span class="task-budget">${budget}</span>
            </div>

            <h3 class="task-card-title">
              <a href="task-details.html?id=${taskId}">
                ${title}
              </a>
            </h3>

            <p class="task-card-description">${description}</p>

            <div class="task-card-meta">
              <span>${location}</span>
              <span>${duration}</span>
            </div>

            <a
              class="task-card-link"
              href="task-details.html?id=${taskId}"
              aria-label="View task: ${title}"
            >
              View task
            </a>
          </div>
        </article>
      `;
    }

    function updateCount(count) {
      if (!resultCount) {
        return;
      }

      resultCount.textContent =
        count + (count === 1 ? " task found" : " tasks found");
    }

    function renderTasks() {
      const tasks = getFilteredTasks();

      resultsContainer.innerHTML = tasks
        .map(createTaskCard)
        .join("");

      updateCount(tasks.length);

      if (emptyState) {
        emptyState.hidden = tasks.length > 0;
      }

      resultsContainer.hidden = tasks.length === 0;
    }

    function clearFilters() {
      if (searchInput) {
        searchInput.value = "";
      }

      document
        .querySelectorAll(
          'input[name="task-category"], ' +
          'input[name="task-budget"], ' +
          'input[name="task-location"]'
        )
        .forEach(function (input) {
          input.checked = input.value === "all";
        });

      if (sortSelect) {
        sortSelect.value = "recommended";
      }

      const cleanURL = new URL(window.location.href);
      cleanURL.searchParams.delete("q");

      window.history.replaceState({}, "", cleanURL.pathname +
        cleanURL.search + cleanURL.hash);

      renderTasks();
    }

    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        renderTasks();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderTasks);
    }

    document
      .querySelectorAll(
        'input[name="task-category"], ' +
        'input[name="task-budget"], ' +
        'input[name="task-location"]'
      )
      .forEach(function (input) {
        input.addEventListener("change", renderTasks);
      });

    if (sortSelect) {
      sortSelect.addEventListener("change", renderTasks);
    }

    if (clearButton) {
      clearButton.addEventListener("click", clearFilters);
    }

    if (emptyClearButton) {
      emptyClearButton.addEventListener("click", clearFilters);
    }

    renderTasks();
  }
})();
