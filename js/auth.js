"use strict";

/*
 * NEDIKE FRONTEND AUTHENTICATION DEMO
 *
 * For local frontend prototyping only.
 * This is not secure production authentication.
 * Do not use browser storage for real passwords.
 */

(() => {
    const USERS_KEY = "nedike_demo_users";
    const SESSION_KEY = "nedike_current_user";
    const YEAR_SELECTOR = "[data-auth-year]";

    function getElement(id) {
        return document.getElementById(id);
    }

    function readUsers() {
        try {
            const stored = localStorage.getItem(USERS_KEY);

            if (!stored) return [];

            const users = JSON.parse(stored);

            return Array.isArray(users) ? users : [];
        } catch (error) {
            console.error("NEDIKE: Unable to read demo accounts.", error);
            return null;
        }
    }

    function saveUsers(users) {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error("NEDIKE: Unable to save demo accounts.", error);
            return false;
        }
    }

    function showMessage(element, message, type = "error") {
        if (!element) return;

        element.textContent = message;
        element.classList.remove("hidden", "error", "success");
        element.classList.add(type);
    }

    function clearMessage(element) {
        if (!element) return;

        element.textContent = "";
        element.classList.add("hidden");
        element.classList.remove("error", "success");
    }

    function normaliseEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function getSafeReturnUrl() {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("next");

        // Allow only a simple local HTML filename.
        if (
            requested &&
            /^[a-zA-Z0-9_-]+\.html$/.test(requested)
        ) {
            return requested;
        }

        return "profile.html";
    }

    function setSession(user, remember) {
        try {
            const session = {
                email: user.email,
                signedInAt: new Date().toISOString()
            };

            if (remember) {
                localStorage.setItem(
                    SESSION_KEY,
                    JSON.stringify(session)
                );

                sessionStorage.removeItem(SESSION_KEY);
            } else {
                sessionStorage.setItem(
                    SESSION_KEY,
                    JSON.stringify(session)
                );

                localStorage.removeItem(SESSION_KEY);
            }

            return true;
        } catch (error) {
            console.error("NEDIKE: Unable to create a demo session.", error);
            return false;
        }
    }

    function getStoredSession() {
        try {
            const persistent = localStorage.getItem(SESSION_KEY);
            const temporary = sessionStorage.getItem(SESSION_KEY);
            const stored = persistent || temporary;

            if (!stored) return null;

            const session = JSON.parse(stored);

            if (!session || typeof session.email !== "string") {
                return null;
            }

            return session;
        } catch (error) {
            return null;
        }
    }

    function clearSession() {
        try {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
        } catch (error) {
            console.error("NEDIKE: Unable to clear the demo session.", error);
        }
    }

    function getUserByEmail(email) {
        const users = readUsers();

        if (!users) return null;

        return users.find(
            (user) => normaliseEmail(user.email) === normaliseEmail(email)
        ) || null;
    }

    // Password visibility controls.
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
        button.addEventListener("click", () => {
            const input = getElement(button.dataset.togglePassword);

            if (!input) return;

            const shouldShow = input.type === "password";

            input.type = shouldShow ? "text" : "password";
            button.textContent = shouldShow ? "Hide" : "Show";

            button.setAttribute(
                "aria-label",
                shouldShow ? "Hide password" : "Show password"
            );
        });
    });

    // Footer year.
    document.querySelectorAll(YEAR_SELECTOR).forEach((element) => {
        element.textContent = String(new Date().getFullYear());
    });

    // Registration.
    const registerForm = getElement("register-form");

    if (registerForm) {
        const message = getElement("register-message");

        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();
            clearMessage(message);

            const firstName = getElement("first-name")?.value.trim() || "";
            const lastName = getElement("last-name")?.value.trim() || "";
            const email = normaliseEmail(getElement("email")?.value);
            const school = getElement("school")?.value.trim() || "";
            const course = getElement("course")?.value.trim() || "";
            const level = getElement("level")?.value || "";
            const password = getElement("password")?.value || "";
            const confirmPassword =
                getElement("confirm-password")?.value || "";
            const acceptedTerms =
                getElement("accept-terms")?.checked || false;

            if (
                !firstName ||
                !lastName ||
                !email ||
                !school ||
                !course ||
                !level ||
                !password ||
                !confirmPassword
            ) {
                showMessage(message, "Please complete every required field.");
                return;
            }

            if (!isValidEmail(email)) {
                showMessage(message, "Enter a valid email address.");
                getElement("email")?.focus();
                return;
            }

            if (password.length < 8) {
                showMessage(
                    message,
                    "Your password must contain at least 8 characters."
                );
                getElement("password")?.focus();
                return;
            }

            if (password !== confirmPassword) {
                showMessage(message, "Your passwords do not match.");
                getElement("confirm-password")?.focus();
                return;
            }

            if (!acceptedTerms) {
                showMessage(
                    message,
                    "Please agree to the Terms of Use and Privacy Policy."
                );
                getElement("accept-terms")?.focus();
                return;
            }

            const users = readUsers();

            if (!users) {
                showMessage(
                    message,
                    "Account storage is unavailable. Check your browser settings and try again."
                );
                return;
            }

            const existingUser = users.some(
                (user) => normaliseEmail(user.email) === email
            );

            if (existingUser) {
                showMessage(
                    message,
                    "An account with this email already exists. Please log in instead."
                );
                return;
            }

            /*
             * Demo-only storage.
             * Passwords are stored as plain text.
             * Never use this approach for a deployed application.
             */
            const user = {
                id: `demo_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                email,
                school,
                course,
                level,
                password,
                bio: "",
                skills: [],
                profilePicture: "",
                location: "",
                createdAt: new Date().toISOString()
            };

            users.push(user);

            if (!saveUsers(users)) {
                showMessage(
                    message,
                    "Your account could not be saved. Please check browser storage and try again."
                );
                return;
            }

            showMessage(
                message,
                "Account created successfully. Redirecting to login...",
                "success"
            );

            registerForm.reset();

            window.setTimeout(() => {
                window.location.href = "login.html";
            }, 900);
        });
    }

    // Login.
    const loginForm = getElement("login-form");

    if (loginForm) {
        const message = getElement("login-message");

        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            clearMessage(message);

            const email = normaliseEmail(
                getElement("login-email")?.value
            );

            const password = getElement("login-password")?.value || "";
            const remember = getElement("remember-me")?.checked || false;

            if (!email || !password) {
                showMessage(
                    message,
                    "Enter your email address and password."
                );
                return;
            }

            if (!isValidEmail(email)) {
                showMessage(message, "Enter a valid email address.");
                getElement("login-email")?.focus();
                return;
            }

            const users = readUsers();

            if (!users) {
                showMessage(
                    message,
                    "Account storage is unavailable. Check your browser settings and try again."
                );
                return;
            }

            const user = users.find(
                (item) =>
                    normaliseEmail(item.email) === email &&
                    item.password === password
            );

            if (!user) {
                showMessage(
                    message,
                    "The email address or password is incorrect. Check your details or create an account."
                );
                return;
            }

            if (!setSession(user, remember)) {
                showMessage(
                    message,
                    "We could not create your session. Check browser storage and try again."
                );
                return;
            }

            showMessage(
                message,
                "Login successful. Opening your profile...",
                "success"
            );

            window.setTimeout(() => {
                window.location.href = getSafeReturnUrl();
            }, 500);
        });
    }

    // Helpers for other NEDIKE frontend pages.
    window.NEDIKEAuth = Object.freeze({
        getCurrentUser() {
            const session = getStoredSession();

            if (!session) return null;

            const user = getUserByEmail(session.email);

            if (!user) return null;

            // Never expose the stored password to profile pages.
            const { password, ...safeUser } = user;

            return safeUser;
        },

        isLoggedIn() {
            return this.getCurrentUser() !== null;
        },

        logout() {
            clearSession();
            window.location.href = "login.html";
        },

        updateProfile(updates) {
            const session = getStoredSession();

            if (!session || !updates || typeof updates !== "object") {
                return false;
            }

            const users = readUsers();

            if (!users) return false;

            const index = users.findIndex(
                (item) =>
                    normaliseEmail(item.email) ===
                    normaliseEmail(session.email)
            );

            if (index === -1) return false;

            const allowedFields = [
                "firstName",
                "lastName",
                "school",
                "course",
                "level",
                "location",
                "bio",
                "skills",
                "profilePicture"
            ];

            allowedFields.forEach((field) => {
                if (
                    Object.prototype.hasOwnProperty.call(updates, field)
                ) {
                    users[index][field] = updates[field];
                }
            });

            users[index].fullName =
                `${users[index].firstName || ""} ${
                    users[index].lastName || ""
                }`.trim();

            return saveUsers(users);
        }
    });
})();