(function () {
  "use strict";

  window.initSidebar = function () {
    var uid = window.EMO.uid;
    var apiJson = window.EMO.apiJson;

    var nameEl = document.getElementById("sidebarUserName");
    var av = document.getElementById("sidebarAvatar");
    if (nameEl) nameEl.textContent = uid === "default" ? "You" : uid;
    if (av) av.textContent = (uid.charAt(0) || "Y").toUpperCase();

    var line = document.getElementById("sidebarMoodText");
    if (!line) return;
    apiJson("/api/mood/latest/" + encodeURIComponent(uid))
      .then(function (data) {
        if (!data.mood) { line.textContent = "Log your mood anytime"; return; }
        line.textContent = "Latest: " + data.mood;
        var dash = document.getElementById("dashSuggestionText");
        if (dash && data.suggestions && data.suggestions.length) {
          dash.textContent = data.suggestions[0];
        }
      })
      .catch(function () { line.textContent = "Mood check-in"; });
  };
})();