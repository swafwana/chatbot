(function () {
  "use strict";

  function resolveUserId() {
    var q = new URLSearchParams(window.location.search).get("user_id");
    if (q && q.trim()) return q.trim();
    return window.__EMO_USER_ID__ || "default";
  }

  var uid = resolveUserId();

  function escapeHtml(text) {
    var d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  function formatTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function apiJson(path, options) {
    return fetch(path, options).then(function (r) {
      if (!r.ok) return r.text().then(function (t) {
        throw new Error(t || r.statusText);
      });
      return r.json();
    });
  }

  function updateSidebarUser() {
    var nameEl = document.getElementById("sidebarUserName");
    var av = document.getElementById("sidebarAvatar");
    if (nameEl) nameEl.textContent = uid === "default" ? "You" : uid;
    if (av) av.textContent = (uid.charAt(0) || "Y").toUpperCase();
  }

  function refreshSidebarMood() {
    var line = document.getElementById("sidebarMoodText");
    if (!line) return;
    apiJson("/api/mood/latest/" + encodeURIComponent(uid))
      .then(function (data) {
        if (!data.mood) {
          line.textContent = "Log your mood anytime";
          return;
        }
        line.textContent = "Latest: " + data.mood;
        var dash = document.getElementById("dashSuggestionText");
        if (dash && data.suggestions && data.suggestions.length) {
          dash.textContent = data.suggestions[0];
        }
      })
      .catch(function () {
        line.textContent = "Mood check-in";
      });
  }

  function initDashboardMoods() {
    var emojis = document.querySelector(".mood-emojis");
    if (!emojis) return;

    emojis.addEventListener("click", function(e) {
        var btn = e.target.closest(".mood-btn");
        if (!btn || !emojis.contains(btn)) return;

        emojis.querySelectorAll(".mood-btn").forEach(function(b) {
            b.classList.remove("selected");
        });
        btn.classList.add("selected");

        var mood = btn.getAttribute("title") || "neutral";
        var hint = document.getElementById("dashboardMoodSaved");

        apiJson("/api/mood", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: uid, mood: mood })
        })
        .then(function(data) {
            if (hint) {
                hint.textContent = data.updated
                    ? "Mood updated."
                    : "Saved — thank you for checking in.";
            }
            refreshSidebarMood();
            checkMoodReminder();
        })
        .catch(function(err) {
            if (hint) hint.textContent = "Could not save: " + err.message;
        });
    });
}
function checkMoodReminder() {
    var banner = document.getElementById("moodReminderBanner");
    if (!banner) return;

    apiJson("/api/mood/latest/" + encodeURIComponent(uid))
        .then(function(data) {
            if (!data.mood || !data.date) {
                banner.style.display = "flex";
                banner.querySelector(".reminder-text").textContent =
                    "You haven't logged your mood yet today.";
                return;
            }

            var last = new Date(data.date);
            var today = new Date();
            last.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            var diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                banner.style.display = "none";
            } else if (diffDays === 1) {
                banner.style.display = "flex";
                banner.querySelector(".reminder-text").textContent =
                    "You haven't checked in today.";
            } else {
                banner.style.display = "flex";
                banner.querySelector(".reminder-text").textContent =
                    "You haven't checked in for " + diffDays + " days.";
            }
        })
        .catch(function() {});
}

  function initChat() {
    var messagesEl = document.getElementById("chatMessages");
    var input = document.getElementById("chatInput");
   
    if (!messagesEl || !input) return;
    var currentSessionId = null;

    function appendUser(text) {
      var wrap = document.createElement("div");
      wrap.className = "msg user";
      wrap.innerHTML =
        '<div class="msg-avatar">' +
        escapeHtml((uid.charAt(0) || "Y").toUpperCase()) +
        "</div><div><div class=" +
        '"msg-bubble">' +
        escapeHtml(text) +
        "</div><div class=\"msg-time\">" +
        formatTime() +
        "</div></div>";
      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function appendBot(html, crisis) {
      var wrap = document.createElement("div");
      wrap.className = "msg bot";
      var bubbleClass = "msg-bubble" + (crisis ? " crisis" : "");
      wrap.innerHTML =
        '<div class="msg-avatar">🌿</div><div><div class="' +
        bubbleClass +
        '">' +
        html +
        '</div><div class="msg-time">' +
        formatTime() +
        "</div></div>";
      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      var t = document.createElement("div");
      t.className = "msg bot";
      t.id = "emoTyping";
      t.innerHTML =
        '<div class="msg-avatar">🌿</div><div class="typing-indicator">' +
        '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      messagesEl.appendChild(t);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
      var t = document.getElementById("emoTyping");
      if (t) t.remove();
    }

    window.sendMessage = function () {
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      input.style.height = "";
      appendUser(text);
      showTyping();
      apiJson("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, message: text,session_id: currentSessionId }),
      })
        .then(function (data) {
          hideTyping();
          var reply = data.response || "";
          var crisis = !!data.crisis;
          var html = crisis ? escapeHtml(reply).replace(/\n/g, "<br>") : escapeHtml(reply).replace(/\n/g, "<br>");
          appendBot(html, crisis);
        })
        .catch(function (err) {
          hideTyping();
          appendBot(escapeHtml("Something went wrong: " + err.message), false);
        });
    };

    window.handleChatKey = function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        window.sendMessage();
      }
    };

    window.autoResize = function (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    };

    window.selectChatMood = function (mood) {
      var map = {
        peaceful: "I'm feeling quite peaceful today, actually.",
        anxious: "I'm feeling pretty anxious and unsettled.",
        sad: "I'm feeling sad and a bit low right now.",
        confused: "I'm feeling confused and unsure about things.",
        other: "It's complicated — a mix of emotions.",
      };
      input.value = map[mood] || "I'm not sure how to describe it.";
      window.sendMessage();
    };

    window.sendSuggestion = function (chip) {
      input.value = chip.textContent.trim();
      window.sendMessage();
    };
    function loadHistory(sessionId) {
  var url = "/api/chat/history?user_id=" + encodeURIComponent(uid);
  if (sessionId) url += "&session_id=" + encodeURIComponent(sessionId);
  apiJson(url)
    .then(function(messages) {
      if (!messages.length) return;
      messagesEl.innerHTML = "";
      messages.forEach(function(m) {
        var html = escapeHtml(m.content).replace(/\n/g, "<br>");
        if (m.role === "user") appendUser(m.content);
        else appendBot(html, false);
      });
    })
    .catch(function() {});
}
function loadSidebar() {
  var sidebar = document.getElementById("chatHistoryList");
  if (!sidebar) return;
  apiJson("/api/chat/sessions?user_id=" + encodeURIComponent(uid))
    .then(function(sessions) {
      sidebar.innerHTML = "";
      sessions.forEach(function(s) {
        var d = new Date(s.timestamp);
        var dateStr = d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
        var div = document.createElement("div");
        div.className = "chat-session" + (s.session_id === currentSessionId ? " active" : "");
        div.innerHTML = '<div class="session-topic">' + escapeHtml(s.preview) + '</div><div class="session-meta">' + dateStr + '</div>';
        div.onclick = function() {
          currentSessionId = s.session_id;
          loadHistory(s.session_id);
          sidebar.querySelectorAll(".chat-session").forEach(function(el) { el.classList.remove("active"); });
          div.classList.add("active");
        };
        sidebar.appendChild(div);
      });
    })
    .catch(function() {});
}
window.newChat = function() {
  apiJson("/api/chat/session", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({user_id: uid})
  }).then(function(data) {
    currentSessionId = data.session_id;
    messagesEl.innerHTML = "";
    loadSidebar();
    // show welcome message
    var welcome = document.createElement("div");
    welcome.className = "msg bot";
    welcome.innerHTML = '<div class="msg-avatar">🌿</div><div><div class="msg-bubble">Hello — I\'m glad you\'re here. How are you feeling right now?<div class="mood-selector-msg"><div class="mood-option" onclick="selectChatMood(\'peaceful\')"><span>😌</span>Peaceful</div><div class="mood-option" onclick="selectChatMood(\'anxious\')"><span>😰</span>Anxious</div><div class="mood-option" onclick="selectChatMood(\'sad\')"><span>😢</span>Sad</div><div class="mood-option" onclick="selectChatMood(\'confused\')"><span>😕</span>Confused</div><div class="mood-option" onclick="selectChatMood(\'other\')"><span>💬</span>Other</div></div></div></div>';
    messagesEl.appendChild(welcome);
  });
};
apiJson("/api/chat/sessions?user_id=" + encodeURIComponent(uid))
  .then(function(sessions) {
    loadSidebar();
    if (sessions.length) {
      currentSessionId = sessions[0].session_id;
      loadHistory(currentSessionId);
    } else {
      window.newChat();
    }
  });
  
  }

  function initJournal() {
    var ta = document.getElementById("journalText");
    var dateEl = document.getElementById("journalDate");
    if (!ta || !dateEl) return;

    dateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    window.updateWordCount = function () {
      var text = ta.value.trim();
      var count = text ? text.split(/\s+/).length : 0;
      var wc = document.getElementById("wordCount");
      if (wc) wc.textContent = count + (count === 1 ? " word" : " words");
    };

   
    window.toggleTag = function (el) {
      el.classList.toggle("active");
    };

    window.usePrompt = function (el) {
      var p = document.getElementById("journalPrompt");
      if (p) p.textContent = '"' + el.textContent.trim() + '"';
      ta.focus();
    };
    var prompts = {
  Low: [
    "What is one small thing that felt okay today, even briefly?",
    "What does your body need right now that it isn't getting?",
    "What would you say to a friend who felt the way you do today?",
  ],
  Neutral: [
    "What is one thing that brought you a moment of peace today, however small?",
    "What's been quietly on your mind that you haven't said out loud?",
    "Describe your day in three honest words.",
  ],
  Good: [
    "What made today feel lighter than usual?",
    "What are you grateful for that you don't say enough?",
    "What momentum do you want to carry into tomorrow?",
  ],
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
  document.querySelectorAll(".mood-scale-item").forEach(function (i) {
    i.classList.remove("selected");
  });
  el.classList.add("selected");
  promptIndex = 0;
  setPrompt(el.dataset.mood);
};
// set initial prompt on load
setPrompt("Neutral");

    window.saveEntry = function () {

      var text = ta.value.trim();
      if (!text) {
        alert("Please write something before saving.");
        return;
      }
      viewingEntry = false;
     var moodItem = document.querySelector(".mood-scale-item.selected");
     var moodLabel = moodItem ? moodItem.dataset.mood : null;
     var promptText = document.getElementById("journalPrompt").textContent.replace(/^"|"$/g, "");
     var tags = Array.from(document.querySelectorAll(".tag.active"))
    .map(function (t) { return t.textContent.trim(); })
    .join(", ");
  apiJson("/api/journal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: uid,
      content: text,
      mood_selected: moodLabel || null,
      tags: tags || null,
      prompt: promptText || null,
    }),
  })
    .then(function () {
      alert("Entry saved.");
      ta.value = "";
      window.updateWordCount();
      loadJournalRecent();
    })
    .catch(function (e) {
      alert("Save failed: " + e.message);
    });
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
              '<div class="entry-date">' +
              escapeHtml(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })) +
              '</div><div class="entry-preview">' +
              escapeHtml((row.content || "").slice(0, 80)) +
              (row.content && row.content.length > 80 ? "…" : "") +
              '</div><div class="entry-mood">' +
              escapeHtml(row.mood || "📝") +
              "</div>";
              item.onclick = function() {
                openEntry(row.id);
              };
            list.appendChild(item);
          });
        })
        .catch(function () {
          list.innerHTML = '<div class="entry-preview">Could not load entries.</div>';
        });
    }
    window.openEntry = function(entryId) {
  apiJson("/api/journal/entry/" + entryId)
    .then(function(entry) {
      viewingEntry = true;
      document.getElementById("newEntryBtn").style.display = "inline-block";
      document.getElementById("cycleBtn").style.display = "none";
      ta.value = entry.content || "";
      window.updateWordCount();
      var mood = entry.mood || "Neutral";
      document.querySelectorAll(".mood-scale-item").forEach(function(item) {
        item.classList.remove("selected");
        if (item.dataset.mood === mood) item.classList.add("selected");
      });
       var p = document.getElementById("journalPrompt");
      if (p && entry.prompt) p.textContent = '"' + entry.prompt + '"';
    })
  
    .catch(function() {
      alert("Could not open entry");
    });
};
window.newEntry = function() {
  viewingEntry = false;
  ta.value = "";
  window.updateWordCount();
  document.querySelectorAll(".mood-scale-item").forEach(function(i) { i.classList.remove("selected"); });
  document.querySelector('.mood-scale-item[data-mood="Neutral"]').classList.add("selected");
  document.querySelectorAll(".tag.active").forEach(function(t) { t.classList.remove("active"); });
  promptIndex = 0;
  setPrompt("Neutral");
  document.getElementById("newEntryBtn").style.display = "none";
  document.getElementById("cycleBtn").style.display = "inline-block";
};


    loadJournalRecent();
  }

  function initRefreshBreathing() {
    var circle = document.getElementById("breathingCircle");
    if (!circle) return;

    var breathingActive = false;
    var breathInterval;
    var phases = [
      { text: "Inhale", cls: "inhale", duration: 4 },
      { text: "Hold", cls: "", duration: 4 },
      { text: "Exhale", cls: "exhale", duration: 4 },
      { text: "Hold", cls: "", duration: 4 },
    ];

    window.startBreathing = function () {
      var textEl = document.getElementById("breathingText");
      var counterEl = document.getElementById("breathingCounter");
      var btn = document.getElementById("breathingBtn");
      if (!textEl || !counterEl) return;

      if (breathingActive) {
        breathingActive = false;
        clearInterval(breathInterval);
        textEl.textContent = "Tap to begin";
        counterEl.textContent = "4";
        circle.className = "breathing-circle";
        if (btn) btn.textContent = "Start Exercise";
        return;
      }
      breathingActive = true;
      if (btn) btn.textContent = "Stop Exercise";
      var phaseIndex = 0;
      var counter = phases[0].duration;

      function runPhase() {
        var phase = phases[phaseIndex];
        textEl.textContent = phase.text;
        counterEl.textContent = String(counter);
        circle.className = "breathing-circle " + (phase.cls || "");
      }

      runPhase();
      breathInterval = setInterval(function () {
        counter--;
        if (counter <= 0) {
          phaseIndex = (phaseIndex + 1) % phases.length;
          counter = phases[phaseIndex].duration;
        }
        runPhase();
      }, 1000);
    };

    window.scrollToBreathing = function () {
      var w = document.getElementById("breathingWidget");
      if (w) w.scrollIntoView({ behavior: "smooth" });
    };
  }

  function initStressToggle() {
    window.toggleDone = function (el) {
      el.classList.toggle("completed");
      el.textContent = el.classList.contains("completed") ? "✓" : "";
    };
  }

  function initAnalytics() {
    var heatmap = document.getElementById("heatmap");
    if (!heatmap) return;

    function buildHeatmap() {
      var moodLevels = [0, 1, 2, 1, 3, 4, 3, 1, 2, 3, 4, 4, 3, 2, 2, 3, 3, 2, 4, 3, 3, 1, 2, 3, 3, 4, 4, 3, 2, 3, 0, 0, 0, 0, 0];
      var labels = ["-", "Low", "Okay", "Good", "Great"];
      heatmap.innerHTML = "";
      moodLevels.forEach(function (level) {
        var day = document.createElement("div");
        day.className = "heat-day heat-" + level;
        day.title = "Mood: " + (labels[level] || "-");
        heatmap.appendChild(day);
      });
    }

    function buildMonthlyBars() {
      var container = document.getElementById("monthlyBars");
      if (!container) return;
      container.innerHTML = "";
      var months = [
        { m: "Oct", v: 55 },
        { m: "Nov", v: 62 },
        { m: "Dec", v: 48 },
        { m: "Jan", v: 58 },
        { m: "Feb", v: 65 },
        { m: "Mar", v: 71 },
        { m: "Apr", v: 76 },
      ];
      var max = 80;
      months.forEach(function (_ref) {
        var m = _ref.m;
        var v = _ref.v;
        var wrap = document.createElement("div");
        wrap.className = "monthly-bar-wrap";
        var pct = Math.round((v / max) * 120);
        var color = v >= 70 ? "var(--sage)" : v >= 60 ? "var(--sage-light)" : "var(--blush)";
        wrap.innerHTML =
          '<div class="monthly-bar-val">' +
          v +
          '%</div><div class="monthly-bar" style="height:' +
          pct +
          "px;background:" +
          color +
          '"></div><div class="monthly-bar-label">' +
          m +
          "</div>";
        container.appendChild(wrap);
      });
    }

    buildHeatmap();
    buildMonthlyBars();
  }
  function initGoals() {
    var activeList = document.getElementById("activeGoalsList");
    
    if (!activeList) return;

    var selectedType = null;

    // type selector in modal
    document.querySelectorAll(".type-option").forEach(function(btn) {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".type-option").forEach(function(b) {
                b.classList.remove("selected");
            });
            btn.classList.add("selected");
            selectedType = btn.dataset.type;
        });
    });

    window.openAddGoal = function() {
        document.getElementById("goalTitle").value = "";
        document.getElementById("goalWhy").value = "";
        document.getElementById("goalDescription").value = "";
        document.querySelectorAll(".type-option").forEach(function(b) {
            b.classList.remove("selected");
        });
        selectedType = null;
        document.getElementById("addGoalModal").classList.add("open");
    };

    window.closeAddGoal = function() {
        document.getElementById("addGoalModal").classList.remove("open");
    };

    window.submitGoal = function() {
        var title = document.getElementById("goalTitle").value.trim();
        var why = document.getElementById("goalWhy").value.trim();
        var description = document.getElementById("goalDescription").value.trim();

        if (!title) { alert("Please enter a goal."); return; }
        if (!selectedType) { alert("Please select a category."); return; }

        apiJson("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: uid,
                title: title,
                why: why || null,
                description: description || null,
                goal_type: selectedType
            })
        })
        .then(function() {
            window.closeAddGoal();
            loadGoals();
        })
        .catch(function(err) {
            alert("Could not save goal: " + err.message);
        });
    };

    window.deleteGoal = function(goalId) {
        if (!confirm("Are you sure you want to delete this goal?")) return;
        apiJson("/api/goals/" + goalId, { method: "DELETE" })
            .then(function() { loadGoals(); })
            .catch(function(err) { alert("Could not delete: " + err.message); });
    };
    window.updateGoalState = function(goalId, state) {
    if (!state) return;
    apiJson("/api/goals/" + goalId + "/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: state })
    })
    .then(function() {
        loadGoals();
    })
    .catch(function(err) {
        alert("Could not update state: " + err.message);
    });
    };

    window.checkinGoal = function(goalId) {
        // redirect to chat with check-in context
        window.location.href = "/chat?user_id=" + encodeURIComponent(uid) + "&checkin_goal=" + goalId;
    };

    window.toggleCompleted = function() {
        var list = document.getElementById("completedGoalsList");
        var arrow = document.getElementById("completedArrow");
        var isOpen = list.style.display !== "none";
        list.style.display = isOpen ? "none" : "flex";
        list.style.flexDirection = "column";
        list.style.gap = "12px";
        arrow.classList.toggle("open", !isOpen);
    };

    function getStateLabel(state) {
        var map = {
            in_progress: "In Progress",
            struggling:  "Struggling",
            paused:      "Paused",
            completed:   "Completed"
        };
        return map[state] || state;
    }

    function getCheckinText(last_checkin) {
        if (!last_checkin) return "No check-in yet";
        var d = new Date(last_checkin);
        var now = new Date();
        var diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Checked in today";
        if (diffDays === 1) return "Checked in yesterday";
        return "Checked in " + diffDays + " days ago";
    }

    function updateLimitBar(activeCount) {
        var dots = document.querySelectorAll(".goal-limit-dot");
        dots.forEach(function(dot, i) {
            dot.classList.toggle("filled", i < activeCount);
        });
        var text = document.getElementById("goalLimitText");
        if (text) text.textContent = activeCount + " of 5 active goals";
        var sub = document.getElementById("goalCountSub");
        if (sub) sub.textContent = "Your personal goals · " + activeCount + " of 5 active";
    }

    function buildActiveCard(goal) {
    var card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML =
        '<div class="goal-card-left">' +
            '<div class="goal-card-top">' +
                '<div class="goal-title">' + escapeHtml(goal.title) + '</div>' +
                '<span class="goal-type-badge badge-' + goal.goal_type + '">' + escapeHtml(goal.goal_type) + '</span>' +
            '</div>' +
            (goal.why ? '<div class="goal-why">"' + escapeHtml(goal.why) + '"</div>' : '') +
            '<div class="goal-meta">' +
                '<div class="goal-state state-' + goal.state + '">' +
                    '<div class="state-dot dot-' + goal.state + '"></div>' +
                    getStateLabel(goal.state) +
                '</div>' +
                '<div>' + getCheckinText(goal.last_checkin) + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="goal-card-actions">' +
            '<select class="goal-action-btn" onchange="updateGoalState(' + goal.id + ', this.value)">' +
                '<option value="">Change state</option>' +
                '<option value="in_progress"' + (goal.state === 'in_progress' ? ' selected' : '') + '>In Progress</option>' +
                '<option value="struggling"'  + (goal.state === 'struggling'  ? ' selected' : '') + '>Struggling</option>' +
                '<option value="paused"'      + (goal.state === 'paused'      ? ' selected' : '') + '>Paused</option>' +
                '<option value="completed"'   + (goal.state === 'completed'   ? ' selected' : '') + '>Completed</option>' +
            '</select>' +
            '<button type="button" class="goal-action-btn" onclick="checkinGoal(' + goal.id + ')">Check In</button>' +
            '<button type="button" class="goal-action-btn danger" onclick="deleteGoal(' + goal.id + ')">Delete</button>' +
        '</div>';
    return card;
}
    function buildCompletedCard(goal) {
        var card = document.createElement("div");
        card.className = "completed-card";
        card.innerHTML =
            '<div class="completed-card-top">' +
                '<span style="color:var(--lavender)">✅</span>' +
                '<div class="completed-title">' + escapeHtml(goal.title) + '</div>' +
                '<span class="goal-type-badge badge-' + goal.goal_type + '">' + escapeHtml(goal.goal_type) + '</span>' +
            '</div>' +
            (goal.checkin_note ? '<div class="completed-note">"' + escapeHtml(goal.checkin_note) + '"</div>' : '');
        return card;
    }

    function loadGoals() {
        apiJson("/api/goals/" + encodeURIComponent(uid))
            .then(function(goals) {
                var active = goals.filter(function(g) { return g.state !== "completed"; });
                var completed = goals.filter(function(g) { return g.state === "completed"; });

                activeList.innerHTML = "";
                if (active.length === 0) {
                    activeList.innerHTML =
                        '<div class="empty-state">' +
                        '<div class="empty-state-icon">🌱</div>' +
                        '<h3>No active goals yet</h3>' +
                        '<p>Set an intention and Serenity will check in with you along the way.</p>' +
                        '<button type="button" class="btn btn-primary" onclick="openAddGoal()">+ Add Your First Goal</button>' +
                        '</div>';
                } else {
                    active.forEach(function(goal) {
                        activeList.appendChild(buildActiveCard(goal));
                    });
                }

                var completedList = document.getElementById("completedGoalsList");
                var completedCount = document.getElementById("completedCount");
                completedList.innerHTML = "";
                completed.forEach(function(goal) {
                    completedList.appendChild(buildCompletedCard(goal));
                });
                if (completedCount) completedCount.textContent = "(" + completed.length + ")";

                updateLimitBar(active.length);
            })
            .catch(function() {
                activeList.innerHTML = '<div class="empty-state"><p>Could not load goals.</p></div>';
            });
    }

    loadGoals();
}

  function boot() {
    uid = resolveUserId();
    window.__EMO_USER_ID__ = uid;
    updateSidebarUser();
    refreshSidebarMood();
    initDashboardMoods();
    checkMoodReminder();      // add this line
    initChat();
    initJournal();
    initRefreshBreathing();
    initStressToggle();
    initAnalytics();
    initGoals(); 
}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
