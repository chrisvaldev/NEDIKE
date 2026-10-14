(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        const notice = document.getElementById("profile-notice");
        const logoutButton = document.getElementById("logout-button");

        // Update footer year.
        const yearElement = document.getElementById("current-year");

        if (yearElement) {
            yearElement.textContent = String(new Date().getFullYear());
        }

        function showNotice(message) {
            if (!notice) return;

            notice.textContent = message;
            notice.classList.add("show");
        }

        function firstValue(user, keys) {
            for (const key of keys) {
                const value = user[key];

                if (typeof value === "string" && value.trim()) {
                    return value.trim();
                }
            }

            return "";
        }

        function getInitials(name) {
            const words = String(name || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean);

            if (words.length === 0) return "ND";

            if (words.length === 1) {
                return words[0].slice(0, 2).toUpperCase();
            }

            return (
                words[0][0] +
                words[words.length - 1][0]
            ).toUpperCase();
        }

        function setText(id, value, fallback) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = value || fallback;
            }
        }

        function renderSkills(value) {
            const container = document.getElementById("profile-skills");
            const count = document.getElementById("profile-skills-count");

            if (!container) return;

            let skills = [];

            if (Array.isArray(value)) {
                skills = value;
            } else if (typeof value === "string" && value.trim()) {
                skills = value.split(/[,;\n]/);
            }

            skills = [
                ...new Set(
                    skills
                        .filter((skill) => typeof skill === "string")
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                )
            ];

            container.replaceChildren();

            if (skills.length === 0) {
                const empty = document.createElement("p");

                empty.className = "empty-text";
                empty.textContent =
                    "Add your skills to help other students discover what you do.";

                container.appendChild(empty);

                if (count) {
                    count.textContent = "No skills added yet";
                }

                return;
            }

            skills.forEach((skill) => {
                const tag = document.createElement("span");

                tag.className = "skill";
                tag.textContent = skill;

                container.appendChild(tag);
            });

            if (count) {
                count.textContent =
                    skills.length +
                    (skills.length === 1
                        ? " skill added"
                        : " skills added");
            }
        }

        function renderProfile(user) {
            const firstName = firstValue(user, [
                "firstName",
                "first_name"
            ]);

            const lastName = firstValue(user, [
                "lastName",
                "last_name"
            ]);

            const fullName =
                firstValue(user, ["fullName", "name"]) ||
                [firstName, lastName].filter(Boolean).join(" ") ||
                "NEDIKE Member";

            const school = firstValue(user, [
                "school",
                "institution",
                "university"
            ]);

            const course = firstValue(user, [
                "course",
                "courseOfStudy",
                "department"
            ]);

            const level = firstValue(user, [
                "level",
                "currentLevel",
                "academicLevel"
            ]);

            const location = firstValue(user, [
                "location",
                "city",
                "state"
            ]);

            const email = firstValue(user, ["email"]);

            const bio = firstValue(user, [
                "bio",
                "about",
                "description"
            ]);

            const picture = firstValue(user, [
                "profilePicture",
                "profileImage",
                "avatar",
                "photoURL",
                "photoUrl"
            ]);

            setText("profile-name", fullName, "NEDIKE Member");

            setText(
                "profile-school-line",
                [school, level].filter(Boolean).join(" · "),
                "Complete your student details"
            );

            setText("profile-course", course, "Course not added");
            setText("profile-level", level, "Level not added");
            setText("profile-location", location, "Location not added");

            setText(
                "profile-bio",
                bio,
                "Tell other students a little about yourself, your interests and the work you enjoy doing."
            );

            setText("profile-email", email, "Not available");
            setText("profile-school", school, "Not added");
            setText("profile-course-full", course, "Not added");

            const avatar = document.getElementById("profile-avatar");

            if (avatar) {
                const initials = getInitials(fullName);

                avatar.replaceChildren();

                if (picture) {
                    const image = document.createElement("img");

                    image.src = picture;
                    image.alt = fullName + "'s profile picture";

                    image.addEventListener(
                        "error",
                        () => {
                            avatar.replaceChildren();

                            const fallback = document.createElement("span");
                            fallback.textContent = initials;

                            avatar.appendChild(fallback);
                        },
                        { once: true }
                    );

                    avatar.appendChild(image);
                } else {
                    const fallback = document.createElement("span");

                    fallback.id = "avatar-initials";
                    fallback.textContent = initials;

                    avatar.appendChild(fallback);
                }
            }

            renderSkills(user.skills || user.interests || []);
        }

        function loadProfile() {
            if (
                !window.NEDIKEAuth ||
                typeof window.NEDIKEAuth.getCurrentUser !== "function"
            ) {
                showNotice(
                    "We could not load your account. Please check that js/auth.js is available and reload the page."
                );

                return;
            }

            const user = window.NEDIKEAuth.getCurrentUser();

            if (!user) {
                window.location.replace("login.html");
                return;
            }

            renderProfile(user);
        }

        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                const confirmed = window.confirm(
                    "Are you sure you want to sign out?"
                );

                if (!confirmed) return;

                if (
                    window.NEDIKEAuth &&
                    typeof window.NEDIKEAuth.logout === "function"
                ) {
                    window.NEDIKEAuth.logout();
                    return;
                }

                window.location.replace("login.html");
            });
        }

        loadProfile();
    });
})();