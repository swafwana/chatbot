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

    // =========================
    // MOOD INSIGHTS (existing)
    // =========================
    apiJson("/api/mood/insights/" + encodeURIComponent(uid))
      .then(function (data) {
        var streakEl = document.getElementById("insightsStreak");
        var moodEmojiEl = document.getElementById("insightsMoodEmoji");
        var moodLabelEl = document.getElementById("insightsMoodLabel");
        var patternEl = document.getElementById("insightsPattern");

        if (streakEl) streakEl.textContent = data.streak || 0;

        if (data.most_frequent) {
          if (moodEmojiEl) moodEmojiEl.textContent =
            MOOD_EMOJIS[data.most_frequent] || "😐";
          if (moodLabelEl) moodLabelEl.textContent = data.most_frequent;
        } else {
          if (moodEmojiEl) moodEmojiEl.textContent = "—";
          if (moodLabelEl) moodLabelEl.textContent = "no moods logged this week";
        }

        if (patternEl) {
          patternEl.textContent =
            data.pattern || "Log a few moods to see your pattern.";
        }
      })
      .catch(function () {
        var patternEl = document.getElementById("insightsPattern");
        if (patternEl) patternEl.textContent = "Could not load insights.";
      });

    // =========================
    // JOURNAL INSIGHTS (NEW)
    // =========================
    apiJson("/api/journal/insights/" + encodeURIComponent(uid))
      .then(function (data) {

        var journalCountEl = document.getElementById("journalEntryCount");
        var journalMoodEl = document.getElementById("journalMostMood");
        var journalPatternEl = document.getElementById("journalInsightsPattern");

        if (journalCountEl) {
          journalCountEl.textContent = data.total_entries || 0;
        }

        if (journalMoodEl) {
          journalMoodEl.textContent = data.most_common_mood || "—";
        }

        if (journalPatternEl) {
          journalPatternEl.textContent =
            data.pattern || "Start journaling to see insights.";
        }
      })
      .catch(function () {
        var journalPatternEl =
          document.getElementById("journalInsightsPattern");

        if (journalPatternEl) {
          journalPatternEl.textContent = "Could not load journal insights.";
        }
      });
  };
})();