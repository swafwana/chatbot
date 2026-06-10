(function () {
  "use strict";

  window.initJournal = function () {
    var uid = window.EMO.uid;
    var apiJson = window.EMO.apiJson;
    var escapeHtml = window.EMO.escapeHtml;

    var ta = document.getElementById("journalText");
    var dateEl = document.getElementById("journalDate");
    if (!ta || !dateEl) return;

    dateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    window.updateWordCount = function () {
      var text = ta.value.trim();
      var count = text ? text.split(/\s+/).length : 0;
      var wc = document.getElementById("wordCount");
      if (wc) wc.textContent = count + (count === 1 ? " word" : " words");
    };

    window.toggleTag = function (el) { el.classList.toggle("active"); };

    window.usePrompt = function (el) {
      var p = document.getElementById("journalPrompt");
      if (p) p.textContent = '"' + el.textContent.trim() + '"';
      ta.focus();
    };

    var prompts = {
      Low: [
        "What is one small thing that felt okay today, even briefly?",
        "What does your body need right now that it isn't getting?",
        "What would you say to a friend who felt the way you do today?"
      ],
      Neutral: [
        "What is one thing that brought you a moment of peace today, however small?",
        "What's been quietly on your mind that you haven't said out loud?",
        "Describe your day in three honest words."
      ],
      Good: [
        "What made today feel lighter than usual?",
        "What are you grateful for that you don't say enough?",
        "What momentum do you want to carry into tomorrow?"
      ]
    };

    var promptIndex = 0;
    var viewingEntry = false;

    function setPrompt(mood) {
      var list = prompts[mood] || prompts["Neutral"];
      var p = document.getElementById("journalPrompt");
      if (p) p.textContent = '"' + list[promptIndex % list.length] + '"';
    }

    window.cyclePrompt = function () {
      if (viewingEntry) return;
      var moodItem = document.querySelector(".mood-scale-item.selected");
      var mood = moodItem ? moodItem.dataset.mood : "Neutral";
      promptIndex++;
      setPrompt(mood);
    };

    window.pickMood = function (el) {
      if (viewingEntry) return;
      document.querySelectorAll(".mood-scale-item").forEach(function (i) { i.classList.remove("selected"); });
      el.classList.add("selected");
      promptIndex = 0;
      setPrompt(el.dataset.mood);
    };

    setPrompt("Neutral");

    window.saveEntry = function () {
      var text = ta.value.trim();
      if (!text) { alert("Please write something before saving."); return; }
      viewingEntry = false;
      var moodItem = document.querySelector(".mood-scale-item.selected");
      var moodLabel = moodItem ? moodItem.dataset.mood : null;
      var promptText = document.getElementById("journalPrompt").textContent.replace(/^"|"$/g, "");
      var tags = Array.from(document.querySelectorAll(".tag.active")).map(function (t) { return t.textContent.trim(); }).join(", ");
      apiJson("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, content: text, mood_selected: moodLabel || null, tags: tags || null, prompt: promptText || null })
      })
        .then(function () {
          alert("Entry saved.");
          ta.value = "";
          window.updateWordCount();
          loadJournalRecent();
        })
        .catch(function (e) { alert("Save failed: " + e.message); });
    };

    function loadJournalRecent() {
      var list = document.getElementById("journalRecentList");
      if (!list) return;
      apiJson("/api/journal/" + encodeURIComponent(uid) + "?limit=8")
        .then(function (rows) {
          list.innerHTML = "";
          rows.forEach(function (row) {
            var d = new Date(row.timestamp);
            var item = document.createElement("div");
            item.className = "entry-item";
            item.innerHTML =
              '<div class="entry-date">' + escapeHtml(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })) + '</div>' +
              '<div class="entry-preview">' + escapeHtml((row.content || "").slice(0, 80)) + (row.content && row.content.length > 80 ? "…" : "") + '</div>' +
              '<div class="entry-mood">' + escapeHtml(row.mood || "📝") + '</div>';
            item.onclick = function () { openEntry(row.id); };
            list.appendChild(item);
          });
        })
        .catch(function () {
          list.innerHTML = '<div class="entry-preview">Could not load entries.</div>';
        });
    }

    window.openEntry = function (entryId) {
      apiJson("/api/journal/entry/" + entryId)
        .then(function (entry) {
          viewingEntry = true;
          document.getElementById("newEntryBtn").style.display = "inline-block";
          document.getElementById("cycleBtn").style.display = "none";
          ta.value = entry.content || "";
          window.updateWordCount();
          var mood = entry.mood || "Neutral";
          document.querySelectorAll(".mood-scale-item").forEach(function (item) {
            item.classList.remove("selected");
            if (item.dataset.mood === mood) item.classList.add("selected");
          });
          var p = document.getElementById("journalPrompt");
         if (p && entry.prompt) p.textContent = '"' + entry.prompt + '"';

          var savedTags = (entry.tags || "").split(",").map(function(t) { return t.trim().toLowerCase(); });
          document.querySelectorAll(".tag").forEach(function (t) {
            t.classList.toggle("active", savedTags.includes(t.textContent.trim().toLowerCase()));
          });
        })
        .catch(function () { alert("Could not open entry"); });
    };

    
    

    window.newEntry = function () {
      viewingEntry = false;
      ta.value = "";
      window.updateWordCount();
      document.querySelectorAll(".mood-scale-item").forEach(function (i) { i.classList.remove("selected"); });
      var neutral = document.querySelector('.mood-scale-item[data-mood="Neutral"]');
      if (neutral) neutral.classList.add("selected");
      document.querySelectorAll(".tag.active").forEach(function (t) { t.classList.remove("active"); });
      promptIndex = 0;
      setPrompt("Neutral");
      document.getElementById("newEntryBtn").style.display = "none";
      document.getElementById("cycleBtn").style.display = "inline-block";
    };

    loadJournalRecent();
  };
})();