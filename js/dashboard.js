
/* =========================================================
   NEDIKE — STUDENT DASHBOARD
   File: js/dashboard.js

   Reads demonstration task applications from localStorage
   and displays the current student's application history.
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

    function getCurrentUser() {
        const auth = window.NEDIKEAuth;

        if (!auth || typeof auth.getCurrentUser !== "function") {
            return null;
        }

        return auth.getCurrentUser();
    }

    function readApplications() {
        try {
            const stored = localStorage.getItem(APPLICATIONS_KEY);

            if (!stored) {
                return { success: true, applications: [] };
            }

            const applications = JSON.parse(stored);

            if (!Array.isArray(applications)) {
                return { success: false, applications: [] };
            }

            return {
                success: true,
                applications: applications.filter(function (application) {
                    return (
                        application &&
                        typeof application === "object" &&
                        !Array.isArray(application)
                    );
                })
            };
        } catch (error) {
            console.error(
                "NEDIKE: Could not read task applications.",
                error
            );

            return { success: false, applications: [] };
        }
    }

    function normaliseIdentifier(value) {
        return String(value || "").trim().toLowerCase();
    }

    function getUserIdentifiers(user) {
        if (!user) return [];

        return [
            user.id,
            user.email,
            user.emailAddress
        ]
            .map(normaliseIdentifier)
            .filter(Boolean);
    }

    function getApplicationIdentifiers(application) {
        return [
            application.applicantId,
            application.applicantEmail,
            application.applicantEmailAddress
        ]
            .map(normaliseIdentifier)
            .filter(Boolean);
    }

    function getDisplayName(user) {
        if (!user) return "Student";

        const firstAndLastName = [
            user.firstName,
            user.lastName
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return (
            user.fullName ||
            user.name ||
            firstAndLastName ||
            user.username ||
            "Student"
        );
    }

    function getApplicationStatus(application) {
        const status = String(
            application.status || "pending"
        )
            .trim()
            .toLowerCase();

        const supportedStatuses = new Set([
            "pending",
            "accepted",
            "rejected",
            "withdrawn",
            "completed"
        ]);

        return supportedStatuses.has(status) ? status : "pending";
    }

    function formatDate(value) {
        if (!value) return "Date not available";

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
        if (
            value === null ||
            value === undefined ||
            value === "" ||
            !Number.isFinite(Number(value))
        ) {
            return "Budget not available";
        }

        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(Number(value));
    }

    function createTextElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        element.textContent = String(text || "");

        return element;
    }

    function createApplicationCard(application) {
        const card = document.createElement("article");
        card.className = "dashboard-application-card";

        const main = document.createElement("div");
        main.className = "dashboard-application-main";

        main.appendChild(
            createTextElement(
                "h3",
                "dashboard-application-title",
                application.taskTitle ||
                    application.title ||
                    "Untitled task"
            )
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
        const statusLabel =
            status.charAt(0).toUpperCase() + status.slice(1);

        side.appendChild(
            createTextElement(
                "span",
                "application-status application-status-" + status,
                statusLabel
            )
        );

        if (
            application.budget !== null &&
            application.budget !== undefined &&
            application.budget !== ""
        ) {
            side.appendChild(
                createTextElement(
                    "span",
                    "dashboard-application-budget",
                    formatBudget(application.budget)
                )
            );
        }

        if (application.taskId) {
            const taskLink = document.createElement("a");

            taskLink.className = "text-link";
            taskLink.href =
                "task-details.html?id=" +
                encodeURIComponent(String(application.taskId));
            taskLink.textContent = "View task";

            side.appendChild(taskLink);
        }

        card.append(main, side);

        return card;
    }

    function updateSummary(applications) {
        const pendingCount = applications.filter(function (application) {
            return getApplicationStatus(application) === "pending";
        }).length;

        const acceptedCount = applications.filter(function (application) {
            return getApplicationStatus(application) === "accepted";
        }).length;

        if (elements.total) {
            elements.total.textContent = String(applications.length);
        }

        if (elements.pending) {
            elements.pending.textContent = String(pendingCount);
        }

        if (elements.accepted) {
            elements.accepted.textContent = String(acceptedCount);
        }
    }

    function showMessage(message) {
        if (elements.list) {
            elements.list.replaceChildren(
                createTextElement("p", "dashboard-message", message)
            );
            elements.list.hidden = false;
        }

        if (elements.empty) {
            elements.empty.hidden = true;
        }

        updateSummary([]);
    }

    function renderApplications(applications) {
        if (!elements.list) {
            console.error(
                "NEDIKE: Dashboard application list was not found."
            );
            return;
        }

        elements.list.replaceChildren();

        if (applications.length === 0) {
            elements.list.hidden = true;

            if (elements.empty) {
                elements.empty.hidden = false;
            }

            return;
        }

        elements.list.hidden = false;

        if (elements.empty) {
            elements.empty.hidden = true;
        }

        applications.forEach(function (application) {
            elements.list.appendChild(
                createApplicationCard(application)
            );
        });
    }

    function initDashboard() {
        if (!elements.list) {
            console.error(
                "NEDIKE: Required dashboard application list is missing."
            );
            return;
        }

        const user = getCurrentUser();

        if (!user) {
            showMessage("Please log in to view your task applications.");

            window.setTimeout(function () {
                window.location.href =
                    "login.html?next=" +
                    encodeURIComponent("dashboard.html");
            }, 1200);

            return;
        }

        if (elements.userName) {
            elements.userName.textContent = getDisplayName(user);
        }

        const userIdentifiers = getUserIdentifiers(user);

        if (userIdentifiers.length === 0) {
            showMessage(
                "Your account could not be identified. Please check your login setup."
            );
            return;
        }

        const result = readApplications();

        if (!result.success) {
            showMessage(
                "Your application history could not be loaded. Please refresh the page and try again."
            );
            return;
        }

        const myApplications = result.applications
            .filter(function (application) {
                const applicantIdentifiers =
                    getApplicationIdentifiers(application);

                return applicantIdentifiers.some(function (identifier) {
                    return userIdentifiers.includes(identifier);
                });
            })
            .sort(function (a, b) {
                const dateA = new Date(a.submittedAt || 0).getTime();
                const dateB = new Date(b.submittedAt || 0).getTime();

                return (
                    (Number.isFinite(dateB) ? dateB : 0) -
                    (Number.isFinite(dateA) ? dateA : 0)
                );
            });

        updateSummary(myApplications);
        renderApplications(myApplications);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initDashboard,
            { once: true }
        );
    } else {
        initDashboard();
    }
})();
