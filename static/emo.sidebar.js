(function () {
  "use strict";

  window.initSidebar = function () {
    var uid = window.EMO.uid;
    var apiJson = window.EMO.apiJson;

    var nameEl = document.getElementById("sidebarUserName");
    var av = document.getElementById("sidebarAvatar");

    var displayName = uid === "default" ? "You" : uid.split("@")[0];

    if (nameEl) nameEl.textContent = displayName;
    if (av) av.textContent = (displayName.charAt(0) || "Y").toUpperCase();

    // var line = document.getElementById("sidebarMoodText");
    // if (!line) return;
    // apiJson("/api/mood/latest/" + encodeURIComponent(uid))
    //   .then(function (data) {
    //     if (!data.mood) { line.textContent = "Log your mood anytime"; return; }
    //     line.textContent = "Latest: " + data.mood;
    //     var dash = document.getElementById("dashSuggestionText");
    //     if (dash && data.suggestions && data.suggestions.length) {
    //       dash.textContent = data.suggestions[0];
    //     }
    //   })
    //   .catch(function () { line.textContent = "Mood check-in"; });
  };
})();