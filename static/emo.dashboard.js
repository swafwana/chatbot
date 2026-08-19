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
    apiJson("/api/mood/latest/" + encodeURIComponent(uid))
  .then(function(data) {
    if (!data.mood || !data.date) return;

    var last = new Date(data.date);
    var today = new Date();

    last.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (last.getTime() !== today.getTime()) return;

    document.querySelectorAll(".mood-btn").forEach(function(btn) {
      btn.classList.remove("selected");

      if (btn.getAttribute("title") === data.mood) {
        btn.classList.add("selected");
      }
    });
  })
  .catch(function() {});

    checkMoodReminder();
    initDashboardGreeting();
    initDashboardStats(uid, apiJson);
  };

  // ---- Greeting + date header ----
  function initDashboardGreeting() {
    var h = new Date().getHours();
    var el = document.getElementById("dashGreeting");
    if (el) el.textContent = h < 12 ? "Good morning ☀️" : h < 17 ? "Good afternoon 🌤️" : "Good evening 🌙";
    var dateEl = document.getElementById("todayDate");
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }
  }

  // ---- Dashboard stats / chart / insights ---------------------------------
  // Field names are confirmed against routes/mood.py, routes/journal.py,
  // and routes/goals.py. `pick()` is kept as a thin safety net (not a guess
  // mechanism) in case those routes change shape later.
  function initDashboardStats(uid, apiJson) {
    var MOOD_SCORES = {
      happy: 9, excited: 9, calm: 7.5, neutral: 5,
      anxious: 3, stressed: 3, sad: 2, angry: 2
    };
    var MOOD_EMOJI = {
      happy: "😊", calm: "😌", neutral: "😐", anxious: "😰",
      sad: "😢", angry: "😠", stressed: "😤", excited: "🤩"
    };
    // suggestions.py returns a plain list[str] per mood, with no icon/title —
    // this maps mood -> a display icon locally since the API doesn't send one.
    var SUGGESTION_ICONS = {
      anxious: "🌬️", stressed: "🧘", sad: "📔", angry: "🌬️",
      happy: "🌿", calm: "🌿", neutral: "🌿", excited: "🌿"
    };

    function pick(obj, keys, fallback) {
      if (!obj || typeof obj !== "object") return fallback;
      for (var i = 0; i < keys.length; i++) {
        var v = obj[keys[i]];
        if (v !== undefined && v !== null) return v;
      }
      return fallback;
    }

    // Wraps apiJson (already carries the Bearer token) so one failed call
    // doesn't break the rest of the dashboard.
    function safeFetch(url) {
      return apiJson(url).catch(function (err) {
        console.warn("Dashboard fetch failed:", url, err);
        return null;
      });
    }

    function last7Days() {
      var days = [];
      for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
      }
      return days;
    }

    function dateKey(d) {
      return d.toISOString().slice(0, 10);
    }

    // ---- Weekly mood chart + Mood Score stat ----
    function renderMoodChart(history) {
      var wrap = document.getElementById("moodChartWrap");
      var entries = Array.isArray(history) ? history : [];

      if (!entries.length) {
        wrap.innerHTML = "<div class=\"empty-state-text\">No mood entries yet — log today's mood above and your weekly trend will show up here.</div>";
        document.getElementById("statMoodScore").textContent = "—";
        document.getElementById("statMoodDelta").textContent = "No data yet";
        return;
      }

      var byDay = {};
      entries.forEach(function (e) {
        var rawDate = pick(e, ["date", "timestamp"], null);
        var mood = pick(e, ["mood"], null);
        if (!rawDate || !mood) return;
        var key = String(rawDate).slice(0, 10);
        var score = MOOD_SCORES[mood] !== undefined ? MOOD_SCORES[mood] : 5;
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(score);
      });

      var days = last7Days();
      var dayLabels = days.map(function (d) { return d.toLocaleDateString("en-US", { weekday: "short" }); });
      var dayScores = days.map(function (d) {
        var scores = byDay[dateKey(d)];
        if (!scores || !scores.length) return null;
        return scores.reduce(function (a, b) { return a + b; }, 0) / scores.length;
      });

      wrap.innerHTML = "<div class=\"mood-bar-chart\" id=\"moodBarChart\"></div><div class=\"day-labels\" id=\"moodDayLabels\"></div>";
      var chartEl = document.getElementById("moodBarChart");
      var labelsEl = document.getElementById("moodDayLabels");

      dayScores.forEach(function (score, i) {
        var bar = document.createElement("div");
        bar.className = "mood-bar";
        if (score === null) {
          bar.style.background = "var(--border)";
          bar.style.height = "6%";
          bar.dataset.val = "No entry";
        } else {
          bar.style.background = score >= 7 ? "var(--sage)" : score >= 4.5 ? "var(--sage-light)" : "var(--blush)";
          bar.style.height = Math.max(6, (score / 10) * 100) + "%";
          bar.dataset.val = score.toFixed(1);
        }
        chartEl.appendChild(bar);

        var label = document.createElement("div");
        label.className = "day-label";
        label.textContent = dayLabels[i];
        labelsEl.appendChild(label);
      });

      var validScores = dayScores.filter(function (s) { return s !== null; });
      var statValueEl = document.getElementById("statMoodScore");
      var statDeltaEl = document.getElementById("statMoodDelta");
      if (validScores.length) {
        var avg = validScores.reduce(function (a, b) { return a + b; }, 0) / validScores.length;
        statValueEl.textContent = avg.toFixed(1);

        var prevDays = [];
        for (var i = 13; i >= 7; i--) {
          var d = new Date(); d.setDate(d.getDate() - i); prevDays.push(d);
        }
        var prevScores = prevDays
          .map(function (d) { return byDay[dateKey(d)]; })
          .filter(Boolean)
          .map(function (arr) { return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length; });

        if (prevScores.length) {
          var prevAvg = prevScores.reduce(function (a, b) { return a + b; }, 0) / prevScores.length;
          var delta = avg - prevAvg;
          statDeltaEl.textContent = (delta >= 0 ? "↑ +" : "↓ ") + delta.toFixed(1) + " this week";
          statDeltaEl.className = "stat-delta" + (delta < 0 ? " down" : "");
        } else {
          statDeltaEl.textContent = "Estimated from mood, not a stored score";
          statDeltaEl.className = "stat-delta muted";
        }
      } else {
        statValueEl.textContent = "—";
        statDeltaEl.textContent = "No data this week";
      }
    }

    // ---- Mood streak stat ----
    function renderMoodStreak(insights) {
      var streak = pick(insights, ["streak"], null);
      var el = document.getElementById("statMoodStreak");
      if (streak === null) {
        el.textContent = "—";
        document.getElementById("statMoodStreakDelta").textContent = "Log today to start one";
      } else {
        el.textContent = streak;
        document.getElementById("statMoodStreakDelta").textContent = streak > 0 ? "days logged in a row" : "Log today to start one";
      }
    }

    // ---- Journal entries stat ----
    // journal/insights.py has no day-streak logic — it just counts up to the
    // last 7 entries (see the .limit(7) in routes/journal.py's journal_insights).
    // Copy is phrased to not imply a lifetime total or a consecutive-day streak.
    function renderJournalStat(journalInsights) {
      var count = pick(journalInsights, ["total_entries"], 0);
      var el = document.getElementById("statJournalStreak");
      var deltaEl = document.getElementById("statJournalDelta");
      if (!count) {
        el.textContent = "0";
        deltaEl.textContent = "Write your first entry";
      } else {
        el.textContent = count;
        deltaEl.textContent = count === 1 ? "entry recently" : "entries recently";
      }
    }

    // ---- Active goals stat ----
    function renderGoalsStat(goals) {
      var list = Array.isArray(goals) ? goals : [];
      var active = list.filter(function (g) { return pick(g, ["status"], "active") === "active"; });
      document.getElementById("statGoals").textContent = active.length;
      document.getElementById("statGoalsDelta").textContent = active.length ? "in progress" : "Set one in chat";
    }

    // ---- AI insights list ----
    function renderInsightsList(moodInsights, journalInsights) {
      var wrap = document.getElementById("insightsListWrap");
      var items = [];

      var moodPattern = pick(moodInsights, ["pattern"], null);
      if (moodPattern) items.push({ color: "var(--sage)", text: moodPattern });

      var journalPattern = pick(journalInsights, ["pattern"], null);
      if (journalPattern) items.push({ color: "var(--lavender)", text: journalPattern });

      var mostFrequent = pick(moodInsights, ["most_frequent"], null);
      if (mostFrequent) {
        items.push({
          color: "var(--blush)",
          html: "Your most logged mood recently has been <strong>" + mostFrequent + "</strong> " + (MOOD_EMOJI[mostFrequent] || "") + "."
        });
      }

      // top_tags is only present when journal_insights has entries — absent (undefined) on the empty-state branch
      var topTags = pick(journalInsights, ["top_tags"], null);
      if (topTags && topTags.length) {
        items.push({
          color: "var(--amber)",
          html: "You write about <strong>" + topTags.slice(0, 3).join(", ") + "</strong> most often in your journal."
        });
      }

      if (!items.length) {
        wrap.innerHTML = "<div class=\"empty-state-text\">Keep checking in — patterns show up here after a few days of mood logs and journal entries.</div>";
        return;
      }

      wrap.innerHTML = "";
      items.slice(0, 4).forEach(function (item) {
        var row = document.createElement("div");
        row.className = "insight-item";
        var dot = document.createElement("div");
        dot.className = "insight-dot";
        dot.style.background = item.color;
        var textDiv = document.createElement("div");
        textDiv.className = "insight-text";
        if (item.html) {
          textDiv.innerHTML = item.html; // built locally above, not raw user/API text
        } else {
          textDiv.textContent = item.text; // AI-generated pattern text — always as plain text
        }
        row.appendChild(dot);
        row.appendChild(textDiv);
        wrap.appendChild(row);
      });
    }

    // ---- Today's suggestion ----
    // Confirmed shape from routes/mood.py + services/suggestions.py:
    // { mood: string|null, date?: string, suggestions: string[] } — always 2 short strings.
    function renderSuggestion(latest) {
      var mood = pick(latest, ["mood"], null);
      var suggestions = pick(latest, ["suggestions"], null);

      document.getElementById("dashSuggestionIcon").textContent = SUGGESTION_ICONS[mood] || "🌿";
      document.getElementById("dashSuggestionTitle").textContent = mood
        ? "Because you're feeling " + mood
        : "A moment for you";

      var textEl = document.getElementById("dashSuggestionText");
      textEl.innerHTML = "";
      if (Array.isArray(suggestions) && suggestions.length) {
        var ul = document.createElement("ul");
        ul.style.margin = "0";
        ul.style.paddingLeft = "18px";
        suggestions.slice(0, 2).forEach(function (s) {
          var li = document.createElement("li");
          li.textContent = s;
          li.style.marginBottom = "4px";
          ul.appendChild(li);
        });
        textEl.appendChild(ul);
      } else {
        textEl.textContent = "Take three slow breaths and check in with your body.";
      }
    }

    // ---- Recent journal entry preview ----
    // Confirmed shape from routes/journal.py list_entries: array of
    // {id, content, mood, tags, timestamp} — note there's no "title" field,
    // even though the JournalEntry model has one; this endpoint doesn't return it.
    function renderRecentJournal(entries) {
      var wrap = document.getElementById("recentJournalWrap");
      var list = Array.isArray(entries) ? entries : [];

      if (!list.length) {
        wrap.innerHTML = "<div class=\"empty-state-text\">You haven't journaled yet — your most recent entry will show up here once you write one.</div>";
        return;
      }

      var entry = list[0];
      var mood = pick(entry, ["mood"], null);
      var rawDate = pick(entry, ["timestamp"], null);
      var dateStr = rawDate ? new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
      var content = pick(entry, ["content"], "") || "";
      var excerpt = content.length > 140 ? content.slice(0, 140).trim() + "…" : content;

      wrap.innerHTML = "<div class=\"journal-preview-date\"></div><div class=\"journal-preview-excerpt\"></div>";
      wrap.querySelector(".journal-preview-date").textContent = dateStr + (mood ? " · " + (MOOD_EMOJI[mood] || "") + " " + mood : "");
      // set via textContent to avoid rendering raw journal content as HTML
      wrap.querySelector(".journal-preview-excerpt").textContent = excerpt;
    }

    Promise.all([
      safeFetch("/api/mood/history/" + encodeURIComponent(uid)),
      safeFetch("/api/mood/insights/" + encodeURIComponent(uid)),
      safeFetch("/api/journal/insights/" + encodeURIComponent(uid)),
      safeFetch("/api/mood/latest/" + encodeURIComponent(uid)),
      safeFetch("/api/goals/" + encodeURIComponent(uid)),
      safeFetch("/api/journal/" + encodeURIComponent(uid) + "?limit=1")
    ]).then(function (results) {
      var history = results[0], moodInsights = results[1], journalInsights = results[2],
          latest = results[3], goals = results[4], recentEntries = results[5];

      renderMoodChart(history);
      renderMoodStreak(moodInsights);
      renderJournalStat(journalInsights);
      renderGoalsStat(goals);
      renderInsightsList(moodInsights, journalInsights);
      renderSuggestion(latest);
      renderRecentJournal(recentEntries);
    });
  }
})();