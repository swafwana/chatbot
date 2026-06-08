(function () {
  "use strict";

  window.initChat = function () {
    const params = new URLSearchParams(window.location.search);

    const checkinGoalId = params.get("checkin_goal");
    const checkinTitle = params.get("checkin_title");
    console.log("Goal ID:", checkinGoalId);
    console.log("Goal Title:", checkinTitle);
    var uid = window.EMO.uid;
    var apiJson = window.EMO.apiJson;
    var escapeHtml = window.EMO.escapeHtml;
    var formatTime = window.EMO.formatTime;

    var messagesEl = document.getElementById("chatMessages");
    var input = document.getElementById("chatInput");
    if (!messagesEl || !input) return;

    var currentSessionId = null;
    var checkinMessage = params.get("checkin_message");

    if (checkinGoalId && checkinTitle) {
    var banner = document.getElementById("goalCheckinBanner");
    var titleEl = document.getElementById("goalCheckinTitle");
    if (banner && titleEl) {
        banner.style.display = "flex";
        titleEl.textContent = checkinTitle;
    }
    }

    function appendUser(text) {
      var wrap = document.createElement("div");
      wrap.className = "msg user";
      wrap.innerHTML = '<div class="msg-avatar">' + escapeHtml((uid.charAt(0) || "Y").toUpperCase()) + '</div><div><div class="msg-bubble">' + escapeHtml(text) + '</div><div class="msg-time">' + formatTime() + '</div></div>';
      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function appendBot(html, crisis) {
      var wrap = document.createElement("div");
      wrap.className = "msg bot";
      var bubbleClass = "msg-bubble" + (crisis ? " crisis" : "");
      wrap.innerHTML = '<div class="msg-avatar">🌿</div><div><div class="' + bubbleClass + '">' + html + '</div><div class="msg-time">' + formatTime() + '</div></div>';
      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      var t = document.createElement("div");
      t.className = "msg bot";
      t.id = "emoTyping";
      t.innerHTML = '<div class="msg-avatar">🌿</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
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
        body: JSON.stringify({ user_id: uid, message: text, session_id: currentSessionId, checkin_goal_id: checkinGoalId ? parseInt(checkinGoalId) : null })
      })
        .then(function (data) {
          hideTyping();
          var html = escapeHtml(data.response || "").replace(/\n/g, "<br>");
          appendBot(html, !!data.crisis);
        })
        .catch(function (err) {
          hideTyping();
          appendBot(escapeHtml("Something went wrong: " + err.message), false);
        });
    };

    window.handleChatKey = function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); window.sendMessage(); }
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
        other: "It's complicated — a mix of emotions."
      };
      input.value = map[mood] || "I'm not sure how to describe it.";
      window.sendMessage();
    };

    window.sendSuggestion = function (chip) {
      input.value = chip.textContent.trim();
      window.sendMessage();
    };
    window.saveCheckin = function() {
    if (!checkinGoalId || !currentSessionId) return;
    apiJson("/api/goals/" + checkinGoalId + "/checkins/summarize?session_id=" + encodeURIComponent(currentSessionId), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })
    .then(function(data) {
        appendBot("I've saved a note from today's reflection on your goal. <br><br><em>" + escapeHtml(data.note) + "</em><br><br><a href='/goals?user_id=" + encodeURIComponent(uid) + "' class='btn btn-primary'>Back to Goals</a>", false);
        document.getElementById("goalCheckinBanner").style.display = "none";
    })
    .catch(function(err) {
        appendBot("Could not save check-in: " + escapeHtml(err.message), false);
    });
    };

    function loadHistory(sessionId) {
      var url = "/api/chat/history?user_id=" + encodeURIComponent(uid);
      if (sessionId) url += "&session_id=" + encodeURIComponent(sessionId);
      apiJson(url)
        .then(function (messages) {
          if (!messages.length) return;
          messagesEl.innerHTML = "";
          messages.forEach(function (m) {
            var html = escapeHtml(m.content).replace(/\n/g, "<br>");
            if (m.role === "user") appendUser(m.content);
            else appendBot(html, false);
          });
        })
        .catch(function () {});
    }

    function loadSidebar() {
      var sidebar = document.getElementById("chatHistoryList");
      if (!sidebar) return;
      apiJson("/api/chat/sessions?user_id=" + encodeURIComponent(uid))
        .then(function (sessions) {
          sidebar.innerHTML = "";
          sessions.forEach(function (s) {
            var d = new Date(s.timestamp);
            var dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            var div = document.createElement("div");
            div.className = "chat-session" + (s.session_id === currentSessionId ? " active" : "");
            div.innerHTML = '<div class="session-topic">' + escapeHtml(s.preview) + '</div><div class="session-meta">' + dateStr + '</div>';
            div.onclick = function () {
              currentSessionId = s.session_id;
              loadHistory(s.session_id);
              sidebar.querySelectorAll(".chat-session").forEach(function (el) { el.classList.remove("active"); });
              div.classList.add("active");
            };
            sidebar.appendChild(div);
          });
        })
        .catch(function () {});
    }

    window.newChat = function () {
      apiJson("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid })
      }).then(function (data) {
        currentSessionId = data.session_id;
        messagesEl.innerHTML = "";
        loadSidebar();
        var welcome = document.createElement("div");
welcome.className = "msg bot";

var checkinMessage = params.get("checkin_message");

if (checkinGoalId) {
  welcome.innerHTML =
    '<div class="msg-avatar">🌿</div>' +
    '<div><div class="msg-bubble">' +
    (checkinMessage && checkinMessage.includes("first time")
      ? 'You\'ve set a goal to <strong>' + escapeHtml(checkinTitle) + '</strong> — that\'s a great intention. How has it been going so far?'
      : 'Welcome back. How have things been going with <strong>' + escapeHtml(checkinTitle) + '</strong> since your last check-in?'
    ) +
    '</div></div>';

} else {
  welcome.innerHTML =
    '<div class="msg-avatar">🌿</div><div><div class="msg-bubble">Hello — I\'m glad you\'re here. How are you feeling right now?<div class="mood-selector-msg"><div class="mood-option" onclick="selectChatMood(\'peaceful\')"><span>😌</span>Peaceful</div><div class="mood-option" onclick="selectChatMood(\'anxious\')"><span>😰</span>Anxious</div><div class="mood-option" onclick="selectChatMood(\'sad\')"><span>😢</span>Sad</div><div class="mood-option" onclick="selectChatMood(\'confused\')"><span>😕</span>Confused</div><div class="mood-option" onclick="selectChatMood(\'other\')"><span>💬</span>Other</div></div></div></div>';
}

    messagesEl.appendChild(welcome);
      });
    };


    apiJson("/api/chat/sessions?user_id=" + encodeURIComponent(uid))
    .then(function (sessions) {
    loadSidebar();

    if (checkinGoalId) {
      window.newChat();
      return;
    }

    if (sessions.length) {
      currentSessionId = sessions[0].session_id;
      loadHistory(currentSessionId);
    } else {
      window.newChat();
    }
  });
  };
})();