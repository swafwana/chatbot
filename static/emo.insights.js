(function () {
  "use strict";

  window.initInsights = function () {
    if (!document.getElementById("insightsStreak")) return;

    var uid = window.EMO.uid;
    var apiJson = window.EMO.apiJson;

    var MOOD_EMOJIS = {
      happy: "😊", calm: "😌", neutral: "😐", anxious: "😰",
      sad: "😢", angry: "😠", stressed: "😤", excited: "🤩"
    };

    apiJson("/api/mood/insights/" + encodeURIComponent(uid))
      .then(function (data) {
        var streakEl = document.getElementById("insightsStreak");
        var moodEmojiEl = document.getElementById("insightsMoodEmoji");
        var moodLabelEl = document.getElementById("insightsMoodLabel");
        var patternEl = document.getElementById("insightsPattern");
        if (streakEl) streakEl.textContent = data.streak || 0;
        if (data.most_frequent) {
          if (moodEmojiEl) moodEmojiEl.textContent = MOOD_EMOJIS[data.most_frequent] || "😐";
          if (moodLabelEl) moodLabelEl.textContent = data.most_frequent;
        } else {
          if (moodEmojiEl) moodEmojiEl.textContent = "—";
          if (moodLabelEl) moodLabelEl.textContent = "no moods logged this week";
        }
        if (patternEl) patternEl.textContent = data.pattern || "Log a few moods to see your pattern.";
      })
      .catch(function () {
        var patternEl = document.getElementById("insightsPattern");
        if (patternEl) patternEl.textContent = "Could not load insights.";
      });
  };
})();