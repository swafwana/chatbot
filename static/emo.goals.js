(function () {
  "use strict";

  window.initGoals = function () {
    var activeList = document.getElementById("activeGoalsList");
    if (!activeList) return;

    var uid = window.EMO.uid;
    var apiJson = window.EMO.apiJson;
    var escapeHtml = window.EMO.escapeHtml;

    var currentCheckinGoalId = null;
    var currentResolveGoalId = null;

    // ── Modal: Add Goal ──
    window.openAddGoal = function () {
      document.getElementById("goalTitle").value = "";
      document.getElementById("goalWhy").value = "";
      document.getElementById("addGoalModal").classList.add("open");
    };

    window.closeAddGoal = function () {
      document.getElementById("addGoalModal").classList.remove("open");
    };

    window.submitGoal = function () {
      var title = document.getElementById("goalTitle").value.trim();
      var why = document.getElementById("goalWhy").value.trim();
      if (!title) { alert("Please enter a goal."); return; }
      apiJson("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, title: title, why: why || null })
      })
        .then(function () {
          window.closeAddGoal();
          loadGoals();
        })
        .catch(function (err) { alert("Could not save goal: " + err.message); });
    };

    // ── Modal: Check-in ──
    window.openCheckin = function (goalId, goalTitle) {
    window.location.href = "/chat?user_id=" + encodeURIComponent(uid) +
    "&checkin_goal=" + goalId +
    "&checkin_title=" + encodeURIComponent(goalTitle);
    };
    window.closeCheckin = function () {
      document.getElementById("checkinModal").classList.remove("open");
      currentCheckinGoalId = null;
    };

    window.submitCheckin = function () {
      var note = document.getElementById("checkinNote").value.trim();
      if (!note) { alert("Write something first."); return; }
      apiJson("/api/goals/" + currentCheckinGoalId + "/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note })
      })
        .then(function () {
          window.closeCheckin();
          loadGoals();
        })
        .catch(function (err) { alert("Could not save check-in: " + err.message); });
    };

    // ── Modal: Resolve ──
    window.openResolve = function (goalId) {
      currentResolveGoalId = goalId;
      document.getElementById("resolveNote").value = "";
      document.getElementById("resolveModal").classList.add("open");
    };

    window.closeResolve = function () {
      document.getElementById("resolveModal").classList.remove("open");
      currentResolveGoalId = null;
    };

    window.submitResolve = function () {
      var note = document.getElementById("resolveNote").value.trim();
      if (!note) { alert("Write a closing note first."); return; }
      apiJson("/api/goals/" + currentResolveGoalId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", closing_note: note })
      })
        .then(function () {
          window.closeResolve();
          loadGoals();
        })
        .catch(function (err) { alert("Could not resolve goal: " + err.message); });
    };

    // ── Pause / Reactivate ──
    window.pauseGoal = function (goalId) {
      apiJson("/api/goals/" + goalId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" })
      })
        .then(function () { loadGoals(); })
        .catch(function (err) { alert("Could not pause goal: " + err.message); });
    };

    window.reactivateGoal = function (goalId) {
      apiJson("/api/goals/" + goalId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" })
      })
        .then(function () { loadGoals(); })
        .catch(function (err) { alert("Could not reactivate goal: " + err.message); });
    };

    // ── Delete ──
    window.deleteGoal = function (goalId) {
      if (!confirm("Delete this goal and all its check-ins?")) return;
      apiJson("/api/goals/" + goalId, { method: "DELETE" })
        .then(function () { loadGoals(); })
        .catch(function (err) { alert("Could not delete: " + err.message); });
    };

    // ── Toggle resolved section ──
    window.toggleResolved = function () {
      var list = document.getElementById("resolvedGoalsList");
      var arrow = document.getElementById("resolvedArrow");
      var isOpen = list.style.display !== "none";
      list.style.display = isOpen ? "none" : "block";
      arrow.classList.toggle("open", !isOpen);
    };

    // ── Helpers ──
    function formatDate(str) {
      if (!str) return "";
      var d = new Date(str);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function buildCheckinThread(checkins) {
      if (!checkins || checkins.length === 0) return "";
      var html = '<div class="checkin-thread">';
      checkins.forEach(function (c) {
        html +=
          '<div class="checkin-item">' +
            '<div class="checkin-dot"></div>' +
            '<div class="checkin-body">' +
              '<div class="checkin-note">' + escapeHtml(c.note) + '</div>' +
              '<div class="checkin-date">' + formatDate(c.created_at) + '</div>' +
            '</div>' +
          '</div>';
      });
      html += '</div>';
      return html;
    }

    function buildActiveCard(goal) {
      var card = document.createElement("div");
      card.className = "goal-card";
      card.innerHTML =
        '<div class="goal-card-header">' +
          '<div class="goal-title">' + escapeHtml(goal.title) + '</div>' +
          '<span class="status-pill status-' + goal.status + '">' + goal.status + '</span>' +
        '</div>' +
        (goal.why ? '<div class="goal-why">"' + escapeHtml(goal.why) + '"</div>' : '') +
        buildCheckinThread(goal.checkins) +
        '<div class="goal-actions">' +
          '<button type="button" class="goal-action-btn" onclick="openCheckin(' + goal.id + ', ' + JSON.stringify(goal.title) + ')">+ Check in</button>'+
          (goal.status === "active"
            ? '<button type="button" class="goal-action-btn" onclick="pauseGoal(' + goal.id + ')">Pause</button>'
            : '<button type="button" class="goal-action-btn" onclick="reactivateGoal(' + goal.id + ')">Reactivate</button>'
          ) +
          '<button type="button" class="goal-action-btn" onclick="openResolve(' + goal.id + ')">Resolve</button>' +
          '<button type="button" class="goal-action-btn danger" onclick="deleteGoal(' + goal.id + ')">Delete</button>' +
        '</div>';
      return card;
    }

    function buildResolvedCard(goal) {
      var card = document.createElement("div");
      card.className = "goal-card";
      card.style.opacity = "0.7";
      card.innerHTML =
        '<div class="goal-card-header">' +
          '<div class="goal-title">' + escapeHtml(goal.title) + '</div>' +
          '<span class="status-pill status-' + goal.status + '">' + goal.status + '</span>' +
        '</div>' +
        (goal.why ? '<div class="goal-why">"' + escapeHtml(goal.why) + '"</div>' : '') +
        buildCheckinThread(goal.checkins) +
        (goal.closing_note
          ? '<div class="closing-note">"' + escapeHtml(goal.closing_note) + '"</div>'
          : '') +
        '<div class="goal-actions">' +
          '<button type="button" class="goal-action-btn danger" onclick="deleteGoal(' + goal.id + ')">Delete</button>' +
        '</div>';
      return card;
    }

    // ── Load ──
    function loadGoals() {
      apiJson("/api/goals/" + encodeURIComponent(uid))
        .then(function (goals) {
          var active = goals.filter(function (g) { return g.status !== "resolved"; });
          var resolved = goals.filter(function (g) { return g.status === "resolved"; });

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
            active.forEach(function (goal) {
              activeList.appendChild(buildActiveCard(goal));
            });
          }

          var resolvedList = document.getElementById("resolvedGoalsList");
          var resolvedCount = document.getElementById("resolvedCount");
          resolvedList.innerHTML = "";
          resolved.forEach(function (goal) {
            resolvedList.appendChild(buildResolvedCard(goal));
          });
          if (resolvedCount) resolvedCount.textContent = "(" + resolved.length + ")";
        })
        .catch(function () {
          activeList.innerHTML = '<div class="empty-state"><p>Could not load goals.</p></div>';
        });
    }

    loadGoals();
  };
})();