
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("edit-profile-form");
    const message = document.getElementById("form-message");
    const pictureInput = document.getElementById("picture-file");
    const picturePreview = document.getElementById("picture-preview");
    const pictureInitials = document.getElementById("picture-initials");
    const pictureStatus = document.getElementById("picture-status");
    const confirmPictureButton = document.getElementById("confirm-picture");
    const removePictureButton = document.getElementById("remove-picture");
    const saveButton = document.getElementById("save-profile");
    const bioInput = document.getElementById("bio");
    const bioCount = document.getElementById("bio-count");

    document.getElementById("current-year").textContent =
      new Date().getFullYear();

    let currentUser = null;
    let savedPicture = "";
    let pendingPicture = "";
    let pictureWasRemoved = false;
    let previewObjectUrl = "";

    function showMessage(text, type) {
      message.textContent = text;
      message.className = "form-message show " + type;
      message.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function getValue(user, keys) {
      for (const key of keys) {
        const value = user[key];

        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }

      return "";
    }

    function getInitials(name) {
      const words = name.trim().split(/\s+/).filter(Boolean);

      if (!words.length) return "ND";
      if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

      return (
        words[0][0] + words[words.length - 1][0]
      ).toUpperCase();
    }

    function getFullName(user) {
      return getValue(user, ["fullName", "name"]) ||
        [
          getValue(user, ["firstName", "first_name"]),
          getValue(user, ["lastName", "last_name"])
        ].filter(Boolean).join(" ") ||
        "";
    }

    function setPicturePreview(source, name) {
      picturePreview.replaceChildren();

      if (!source) {
        const initials = document.createElement("span");
        initials.textContent = getInitials(name || "NEDIKE Member");
        picturePreview.appendChild(initials);
        return;
      }

      const image = document.createElement("img");
      image.alt = "Profile picture preview";
      image.src = source;

      image.addEventListener("error", function () {
        picturePreview.replaceChildren();

        const initials = document.createElement("span");
        initials.textContent = getInitials(name || "NEDIKE Member");
        picturePreview.appendChild(initials);

        pictureStatus.textContent =
          "The saved image could not be displayed. Choose another image.";
      }, { once: true });

      picturePreview.appendChild(image);
    }

    function updateBioCount() {
      bioCount.textContent = String(bioInput.value.length);
    }

    function cleanupPreviewUrl() {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = "";
      }
    }

    function loadCurrentUser() {
      if (
        !window.NEDIKEAuth ||
        typeof window.NEDIKEAuth.getCurrentUser !== "function" ||
        typeof window.NEDIKEAuth.updateProfile !== "function"
      ) {
        showMessage(
          "The account system could not be loaded. Check that js/auth.js is available and exposes getCurrentUser() and updateProfile().",
          "error"
        );
        saveButton.disabled = true;
        return false;
      }

      currentUser = window.NEDIKEAuth.getCurrentUser();

      if (!currentUser) {
        window.location.replace("login.html");
        return false;
      }

      const fullName = getFullName(currentUser);
      const parts = fullName.split(/\s+/).filter(Boolean);

      document.getElementById("first-name").value =
        getValue(currentUser, ["firstName", "first_name"]) ||
        parts[0] ||
        "";

      document.getElementById("last-name").value =
        getValue(currentUser, ["lastName", "last_name"]) ||
        parts.slice(1).join(" ");

      document.getElementById("email").value =
        getValue(currentUser, ["email"]);

      document.getElementById("school").value =
        getValue(currentUser, ["school", "institution", "university"]);

      document.getElementById("course").value =
        getValue(currentUser, ["course", "courseOfStudy", "department"]);

      document.getElementById("level").value =
        getValue(currentUser, ["level", "currentLevel", "academicLevel"]);

      document.getElementById("location").value =
        getValue(currentUser, ["location", "city", "state"]);

      bioInput.value =
        getValue(currentUser, ["bio", "about", "description"]);

      const userSkills = currentUser.skills || currentUser.interests || [];

      document.getElementById("skills").value = Array.isArray(userSkills)
        ? userSkills.join(", ")
        : typeof userSkills === "string"
          ? userSkills
          : "";

      savedPicture = getValue(currentUser, [
        "profilePicture", "profileImage", "avatar", "photoURL", "photoUrl"
      ]);

      setPicturePreview(savedPicture, fullName);
      updateBioCount();

      return true;
    }

    pictureInput.addEventListener("change", function () {
      cleanupPreviewUrl();
      pendingPicture = "";
      confirmPictureButton.disabled = true;

      const file = pictureInput.files && pictureInput.files[0];

      if (!file) return;

      const validTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!validTypes.includes(file.type)) {
        pictureInput.value = "";
        pictureStatus.textContent = "Choose a JPG, PNG or WebP image.";
        showMessage("That image format is not supported.", "error");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        pictureInput.value = "";
        pictureStatus.textContent =
          "The selected image is too large. Choose an image under 2 MB.";
        showMessage("Please select an image no larger than 2 MB.", "error");
        return;
      }

      previewObjectUrl = URL.createObjectURL(file);
      setPicturePreview(
        previewObjectUrl,
        getFullName(currentUser || {})
      );

      confirmPictureButton.disabled = false;
      pictureStatus.textContent =
        "Preview ready. Select “Use this picture” to confirm it.";
      message.className = "form-message";
    });

    confirmPictureButton.addEventListener("click", function () {
      const file = pictureInput.files && pictureInput.files[0];

      if (!file) {
        pictureStatus.textContent = "Choose an image first.";
        return;
      }

      const reader = new FileReader();

      confirmPictureButton.disabled = true;
      pictureStatus.textContent = "Preparing your picture...";

      reader.onload = function () {
        if (typeof reader.result !== "string") {
          confirmPictureButton.disabled = false;
          pictureStatus.textContent = "The picture could not be prepared.";
          return;
        }

        pendingPicture = reader.result;
        pictureWasRemoved = false;

        setPicturePreview(pendingPicture, getFullName(currentUser));
        pictureStatus.textContent =
          "Picture confirmed. Click Save changes to keep it.";
        confirmPictureButton.disabled = false;
      };

      reader.onerror = function () {
        confirmPictureButton.disabled = false;
        pictureStatus.textContent =
          "The image could not be read. Please choose it again.";
      };

      reader.readAsDataURL(file);
    });

    removePictureButton.addEventListener("click", function () {
      const hadPicture = Boolean(savedPicture || pendingPicture);

      cleanupPreviewUrl();
      pendingPicture = "";
      savedPicture = "";
      pictureWasRemoved = true;
      pictureInput.value = "";
      confirmPictureButton.disabled = true;

      setPicturePreview("", getFullName(currentUser));
      pictureStatus.textContent =
        "Picture removed. Click Save changes to confirm removal.";

      if (hadPicture) {
        message.className = "form-message";
      }
    });

    bioInput.addEventListener("input", updateBioCount);

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!currentUser) {
        showMessage("Please sign in again before saving your profile.", "error");
        return;
      }

      const firstName = document.getElementById("first-name").value.trim();
      const lastName = document.getElementById("last-name").value.trim();
      const school = document.getElementById("school").value.trim();
      const course = document.getElementById("course").value.trim();
      const level = document.getElementById("level").value;
      const location = document.getElementById("location").value.trim();
      const bio = bioInput.value.trim();

      const skills = [...new Set(
        document.getElementById("skills").value
          .split(",")
          .map(skill => skill.trim())
          .filter(Boolean)
      )];

      if (!firstName || !lastName || !school || !course || !level) {
        showMessage(
          "Please complete your first name, last name, school, course and academic level.",
          "error"
        );
        return;
      }

      if (firstName.length > 60 || lastName.length > 60) {
        showMessage("Names must not exceed 60 characters.", "error");
        return;
      }

      const updates = {
        firstName: firstName,
        lastName: lastName,
        fullName: firstName + " " + lastName,
        name: firstName + " " + lastName,
        school: school,
        course: course,
        level: level,
        location: location,
        bio: bio,
        skills: skills
      };

      if (pendingPicture) {
        updates.profilePicture = pendingPicture;
      } else if (pictureWasRemoved) {
        updates.profilePicture = "";
      }

      saveButton.disabled = true;
      saveButton.textContent = "Saving...";

      try {
        const result = window.NEDIKEAuth.updateProfile(updates);

        if (result === false) {
          throw new Error("The account system did not save the changes.");
        }

        showMessage("Your profile has been updated successfully.", "success");

        window.setTimeout(function () {
          window.location.href = "profile.html";
        }, 700);
      } catch (error) {
        console.error("NEDIKE profile update failed:", error);

        showMessage(
          "Your changes could not be saved. Please try again. If the problem continues, check the updateProfile() function in js/auth.js.",
          "error"
        );

        saveButton.disabled = false;
        saveButton.textContent = "Save changes";
      }
    });

    window.addEventListener("beforeunload", cleanupPreviewUrl);

    loadCurrentUser();
  });
})();
