document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and any existing options
      activitiesList.innerHTML = "";
      // Reset activity select (keep the placeholder option)
      activitySelect.innerHTML = "";
      const placeholderOption = document.createElement("option");
      placeholderOption.value = "";
      placeholderOption.textContent = "-- Select an activity --";
      activitySelect.appendChild(placeholderOption);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (chip-style list or friendly empty state)
        let participantsHtml;
        if (details.participants && details.participants.length) {
          participantsHtml = `
            <ul class="participants-list">
              ${details.participants
                .map(
                  (p) =>
                    `<li class="participant-item"><span class="participant-email">${p}</span><button class="participant-remove" data-email="${p}" title="Remove participant">✕</button></li>`
                )
                .join("")}
            </ul>
          `;
        } else {
          participantsHtml = `<p class="no-participants">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <div class="participants-title">
              <span>Participants</span>
              <span class="participants-count">${details.participants.length}</span>
            </div>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach remove handlers for participant delete buttons
        activityCard.querySelectorAll('.participant-remove').forEach(btn => {
          btn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const email = btn.dataset.email;
            if (!email) return;
            if (!confirm(`Remove ${email} from ${name}?`)) return;

            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const result = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds and refresh activities so participants list updates
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);

      // Refresh activities to reflect the new signup
      fetchActivities();
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
