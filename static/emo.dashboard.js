(function () {
  "use strict";

  window.initDashboard = function () {
    var uid = window.EMO.uid;
    var apiJson = window.EMO.apiJson;

    var emojis = document.querySelector(".mood-emojis");
    if (emojis) {
      emojis.addEventListener("click", function (e) {
        var btn = e.target.closest(".mood-btn");
        if (!btn || !emojis.contains(btn)) return;
        emojis.querySelectorAll(".mood-btn").forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        var mood = btn.getAttribute("title") || "neutral";
        var hint = document.getElementById("dashboardMoodSaved");
        apiJson("/api/mood", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid, mood: mood })
        })
          .then(function (data) {
            if (hint) hint.textContent = data.updated ? "Mood updated." : "Saved — thank you for checking in.";
            if (window.initSidebar) window.initSidebar();
            checkMoodReminder();
          })
          .catch(function (err) { if (hint) hint.textContent = "Could not save: " + err.message; });
      });
    }

    function checkMoodReminder() {
      var banner = document.getElementById("moodReminderBanner");
      if (!banner) return;
      apiJson("/api/mood/latest/" + encodeURIComponent(uid))
        .then(function (data) {
          if (!data.mood || !data.date) {
            banner.style.display = "flex";
            banner.querySelector(".reminder-text").textContent = "You haven't logged your mood yet today.";
            return;
          }
          var last = new Date(data.date);
          var today = new Date();
          last.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          var diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) {
            banner.style.display = "none";
          } else {
            banner.style.display = "flex";
            banner.querySelector(".reminder-text").textContent = diffDays === 1
              ? "You haven't checked in today."
              : "You haven't checked in for " + diffDays + " days.";
          }
        })
        .catch(function () {});
    }

    checkMoodReminder();
  };
})();