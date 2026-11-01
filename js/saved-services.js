
"use strict";

/*
 * NEDIKE — Saved Services Manager
 * File: js/saved-services.js
 *
 * Stores saved service IDs separately for each signed-in demo user.
 * Uses localStorage; this is a frontend prototype feature.
 */

(function () {
  const STORAGE_PREFIX = "nedike_saved_services_";

  function getCurrentUser() {
    const auth = window.NEDIKEAuth;

    if (!auth || typeof auth.getCurrentUser !== "function") {
      return null;
    }

    return auth.getCurrentUser();
  }

  function getStorageKey() {
    const user = getCurrentUser();

    if (!user || !user.id) {
      return null;
    }

    return STORAGE_PREFIX + encodeURIComponent(user.id);
  }

  function readSavedIds() {
    const key = getStorageKey();

    if (!key) return [];

    try {
      const stored = localStorage.getItem(key);

      if (!stored) return [];

      const ids = JSON.parse(stored);

      if (!Array.isArray(ids)) return [];

      return [...new Set(
        ids.filter((id) => typeof id === "string")
      )];
    } catch (error) {
      console.error("NEDIKE: Unable to read saved services.", error);
      return [];
    }
  }

  function writeSavedIds(ids) {
    const key = getStorageKey();

    if (!key) return false;

    try {
      localStorage.setItem(key, JSON.stringify(ids));
      return true;
    } catch (error) {
      console.error("NEDIKE: Unable to save services.", error);
      return false;
    }
  }

  window.NEDIKESavedServices = Object.freeze({
    getAll() {
      return readSavedIds();
    },

    has(serviceId) {
      return readSavedIds().includes(serviceId);
    },

    save(serviceId) {
      if (typeof serviceId !== "string" || !serviceId.trim()) {
        return false;
      }

      const ids = readSavedIds();

      if (ids.includes(serviceId)) {
        return true;
      }

      ids.push(serviceId);
      return writeSavedIds(ids);
    },

    remove(serviceId) {
      const ids = readSavedIds();
      const updated = ids.filter((id) => id !== serviceId);

      if (updated.length === ids.length) {
        return true;
      }

      return writeSavedIds(updated);
    },

    toggle(serviceId) {
      if (this.has(serviceId)) {
        return this.remove(serviceId);
      }

      return this.save(serviceId);
    },

    clear() {
      return writeSavedIds([]);
    }
  });
})();
