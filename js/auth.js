
"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// NEDIKE Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNGiOxRrWq2h3wHRH2eI-TQXygvwf7BXg",
  authDomain: "nedike.firebaseapp.com",
  projectId: "nedike",
  storageBucket: "nedike.firebasestorage.app",
  messagingSenderId: "255269352987",
  appId: "1:255269352987:web:9f7a8c666183a5e817aabe",
  measurementId: "G-67PPMB3XKX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

const USERS_KEY = "nedike_demo_users";
const SESSION_KEY = "nedike_current_user";
const YEAR_SELECTOR = "[data-auth-year]";

let currentProfile = null;

function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    currentProfile = profile;
    return true;
  } catch (error) {
    console.error("NEDIKE: Could not save profile cache.", error);
    return false;
  }
}

function getLegacyProfile(email) {
  const users = readJSON(USERS_KEY, []);

  if (!Array.isArray(users)) return {};

  const legacyUser = users.find(
    user => normaliseEmail(user?.email) === normaliseEmail(email)
  );

  if (!legacyUser) return {};

  const {
    password,
    ...safeUser
  } = legacyUser;

  return safeUser;
}

function buildProfile(firebaseUser, extraData = {}) {
  const existing = readJSON(SESSION_KEY, null);
  const legacy = getLegacyProfile(firebaseUser.email);

  const existingMatches =
    existing &&
    normaliseEmail(existing.email) === normaliseEmail(firebaseUser.email)
      ? existing
      : {};

  const legacyMatches =
    normaliseEmail(legacy.email) === normaliseEmail(firebaseUser.email)
      ? legacy
      : {};

  const displayName = firebaseUser.displayName || "";

  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

  const firstName =
    extraData.firstName ||
    existingMatches.firstName ||
    legacyMatches.firstName ||
    nameParts[0] ||
    "";

  const lastName =
    extraData.lastName ||
    existingMatches.lastName ||
    legacyMatches.lastName ||
    nameParts.slice(1).join(" ") ||
    "";

  return {
    ...legacyMatches,
    ...existingMatches,
    ...extraData,

    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    userId: firebaseUser.uid,

    firstName,
    lastName,
    first_name: firstName,
    last_name: lastName,

    name: `${firstName} ${lastName}`.trim(),
    fullName: `${firstName} ${lastName}`.trim(),

    email: normaliseEmail(firebaseUser.email),

    school:
      extraData.school ||
      existingMatches.school ||
      legacyMatches.school ||
      "",

    course:
      extraData.course ||
      existingMatches.course ||
      legacyMatches.course ||
      "",

    department:
      extraData.course ||
      existingMatches.department ||
      legacyMatches.department ||
      "",

    level:
      extraData.level ||
      existingMatches.level ||
      legacyMatches.level ||
      "",

    profilePicture:
      firebaseUser.photoURL ||
      extraData.profilePicture ||
      existingMatches.profilePicture ||
      legacyMatches.profilePicture ||
      "",

    profileImage:
      firebaseUser.photoURL ||
      existingMatches.profileImage ||
      "",

    avatar:
      firebaseUser.photoURL ||
      existingMatches.avatar ||
      "",

    bio: extraData.bio || existingMatches.bio || legacyMatches.bio || "",
    skills: extraData.skills || existingMatches.skills || legacyMatches.skills || [],
    location: extraData.location || existingMatches.location || legacyMatches.location || "",

    authProvider: firebaseUser.providerData.some(
      provider => provider.providerId === "google.com"
    ) ? "google" : "password",

    createdAt:
      existingMatches.createdAt ||
      legacyMatches.createdAt ||
      firebaseUser.metadata.creationTime ||
      new Date().toISOString(),

    updatedAt: new Date().toISOString()
  };
}

function showMessage(element, message, type = "error") {
  if (!element) return;

  element.textContent = message;
  element.className = `notice ${type}`;
}

function clearMessage(element) {
  if (!element) return;

  element.textContent = "";
  element.className = "notice hidden";
}

function getSafeReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("next");

  const allowedPages = new Set([
    "profile.html",
    "dashboard.html",
    "task-details.html",
    "service-details.html",
    "course-details.html",
    "services.html",
    "tasks.html",
    "learning.html",
    "create-service.html",
    "create-task.html",
    "edit-profile.html",
    "my-service.html",
    "my-task.html",
    "applications.html"
  ]);

  if (!requested) return "profile.html";

  try {
    const destination = new URL(requested, window.location.href);

    if (
      destination.origin !== window.location.origin ||
      destination.pathname.includes("/") ||
      !allowedPages.has(destination.pathname)
    ) {
      return "profile.html";
    }

    const page = destination.pathname;

    if (
      ["task-details.html", "service-details.html", "course-details.html"]
        .includes(page)
    ) {
      const id = destination.searchParams.get("id");

      if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
        return `${page}?id=${encodeURIComponent(id)}`;
      }
    }

    return page;
  } catch {
    return "profile.html";
  }
}

function redirectAfterLogin() {
  window.location.href = getSafeReturnUrl();
}

function firebaseErrorMessage(error) {
  const messages = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-not-found": "No account was found with this email address.",
    "auth/wrong-password": "The email address or password is incorrect.",
    "auth/invalid-credential": "The email address or password is incorrect.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/weak-password": "Choose a stronger password of at least 8 characters.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
    "auth/unauthorized-domain": "This website domain is not authorised in Firebase Authentication.",
    "auth/network-request-failed": "Network connection failed. Check your internet connection.",
    "auth/account-exists-with-different-credential": "An account already exists with this email using another sign-in method. Sign in with that method first."
  };

  return messages[error.code] ||
    "Authentication could not be completed. Please try again.";
}

async function setRememberPreference(remember) {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}

async function completeAuthentication(firebaseUser, extraData = {}) {
  const profile = buildProfile(firebaseUser, extraData);

  if (!saveProfile(profile)) {
    throw new Error("Your profile could not be saved in this browser.");
  }

  return profile;
}

async function googleSignIn(messageElement, button) {
  clearMessage(messageElement);

  const originalText = button?.textContent || "Continue with Google";

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Connecting to Google...";
    }

    const remember =
      document.getElementById("remember-me")?.checked ?? true;

    await setRememberPreference(remember);

    const result = await signInWithPopup(auth, googleProvider);

    const profile = await completeAuthentication(result.user);

    showMessage(
      messageElement,
      "Google sign-in successful. Opening your NEDIKE account...",
      "success"
    );

    window.setTimeout(redirectAfterLogin, 500);

    return profile;

  } catch (error) {
    console.error("NEDIKE Google authentication:", error);

    showMessage(
      messageElement,
      firebaseErrorMessage(error),
      "error"
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

// Password visibility
document.querySelectorAll("[data-toggle-password]").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.togglePassword);

    if (!input) return;

    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.textContent = visible ? "Hide" : "Show";
    button.setAttribute("aria-pressed", String(visible));
  });
});

// Footer year
document.querySelectorAll(YEAR_SELECTOR).forEach(element => {
  element.textContent = String(new Date().getFullYear());
});

// Google buttons
document.querySelectorAll("[data-google-signin]").forEach(button => {
  button.addEventListener("click", () => {
    const messageElement = document.getElementById(
      button.dataset.messageTarget ||
      (document.getElementById("register-form")
        ? "register-message"
        : "login-message")
    );

    googleSignIn(messageElement, button);
  });
});

// Registration
const registerForm = document.getElementById("register-form");

if (registerForm) {
  const message = document.getElementById("register-message");

  registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage(message);

    const firstName = document.getElementById("first-name")?.value.trim() || "";
    const lastName = document.getElementById("last-name")?.value.trim() || "";
    const email = normaliseEmail(document.getElementById("email")?.value);
    const school = document.getElementById("school")?.value.trim() || "";
    const course = document.getElementById("course")?.value.trim() || "";
    const level = document.getElementById("level")?.value || "";
    const password = document.getElementById("password")?.value || "";
    const confirmPassword = document.getElementById("confirm-password")?.value || "";
    const acceptedTerms = document.getElementById("accept-terms")?.checked || false;

    if (!firstName || !lastName || !email || !school || !course || !level || !password || !confirmPassword) {
      showMessage(message, "Please complete every required field.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(message, "Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      showMessage(message, "Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage(message, "Your passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      showMessage(message, "Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    const submitButton = registerForm.querySelector('[type="submit"]');
    const originalText = submitButton?.textContent || "Create my account";

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";
      }

      await setRememberPreference(true);

      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const fullName = `${firstName} ${lastName}`.trim();

      await updateProfile(credential.user, {
        displayName: fullName
      });

      await completeAuthentication(credential.user, {
        firstName,
        lastName,
        school,
        course,
        department: course,
        level,
        bio: "",
        skills: [],
        location: "",
        profilePicture: ""
      });

      showMessage(
        message,
        "Your NEDIKE account has been created successfully. Redirecting...",
        "success"
      );

      registerForm.reset();

      window.setTimeout(redirectAfterLogin, 800);

    } catch (error) {
      console.error("NEDIKE registration:", error);
      showMessage(message, firebaseErrorMessage(error));

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

// Login
const loginForm = document.getElementById("login-form");

if (loginForm) {
  const message = document.getElementById("login-message");

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage(message);

    const email = normaliseEmail(
      document.getElementById("login-email")?.value
    );

    const password =
      document.getElementById("login-password")?.value || "";

    const remember =
      document.getElementById("remember-me")?.checked || false;

    if (!email || !password) {
      showMessage(message, "Enter your email address and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(message, "Enter a valid email address.");
      return;
    }

    const submitButton = loginForm.querySelector('[type="submit"]');
    const originalText = submitButton?.textContent || "Log in";

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";
      }

      await setRememberPreference(remember);

      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await completeAuthentication(credential.user);

      showMessage(message, "Login successful. Opening your account...", "success");

      window.setTimeout(redirectAfterLogin, 500);

    } catch (error) {
      console.error("NEDIKE login:", error);
      showMessage(message, firebaseErrorMessage(error));

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

// Keep the local profile cache in sync with Firebase authentication.
onAuthStateChanged(auth, async firebaseUser => {
  if (firebaseUser) {
    try {
      await completeAuthentication(firebaseUser);
    } catch (error) {
      console.error("NEDIKE profile synchronisation:", error);
    }
  } else {
    currentProfile = null;

    // Do not remove a profile cache here.
    // Firebase may still be restoring its saved session.
  }
});

// Public authentication helpers used by other NEDIKE pages.
window.NEDIKEAuth = Object.freeze({
  getCurrentUser() {
    const stored = readJSON(SESSION_KEY, null);

    if (!stored || !stored.email) return null;

    const { password, ...safeUser } = stored;
    return safeUser;
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  getFirebaseUser() {
    return auth.currentUser;
  },

  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      currentProfile = null;
      window.location.href = "login.html";
    } catch (error) {
      console.error("NEDIKE logout:", error);
      throw error;
    }
  },

  async updateProfile(updates) {
    if (!auth.currentUser || !updates || typeof updates !== "object") {
      return false;
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "school",
      "course",
      "level",
      "location",
      "bio",
      "skills",
      "profilePicture",
      "headline",
      "professionalTitle",
      "specialties",
      "state",
      "city",
      "website",
      "portfolio"
    ];

    const safeUpdates = {};

    allowedFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        safeUpdates[field] = updates[field];
      }
    });

    try {
      const existing = this.getCurrentUser() || {};

      const merged = {
        ...existing,
        ...safeUpdates
      };

      const firstName = merged.firstName || "";
      const lastName = merged.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();

      await updateProfile(auth.currentUser, {
        displayName: fullName || auth.currentUser.displayName || ""
      });

      const updated = buildProfile(auth.currentUser, {
        ...merged,
        firstName,
        lastName,
        name: fullName,
        fullName
      });

      return saveProfile(updated);

    } catch (error) {
      console.error("NEDIKE: Profile update failed.", error);
      return false;
    }
  }
});
