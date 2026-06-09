(function () {
  "use strict";

  // ── Auth guard ──
  var token = localStorage.getItem("emo_token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  window.EMO = {};

  window.EMO.resolveUserId = function () {
    var stored = localStorage.getItem("emo_user_id");
    if (stored && stored.trim()) return stored.trim();
    var q = new URLSearchParams(window.location.search).get("user_id");
    if (q && q.trim()) return q.trim();
    return window.__EMO_USER_ID__ || "default";
  };

  window.EMO.escapeHtml = function (text) {
    var d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  };

  window.EMO.formatTime = function () {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  window.EMO.apiJson = function (path, options) {
    options = options || {};
    options.headers = options.headers || {};
    var t = localStorage.getItem("emo_token");
    if (t) options.headers["Authorization"] = "Bearer " + t;
    return fetch(path, options).then(function (r) {
      if (r.status === 401) {
        localStorage.removeItem("emo_token");
        localStorage.removeItem("emo_user_id");
        window.location.href = "/login";
        return;
      }
      if (!r.ok) return r.text().then(function (t) {
        throw new Error(t || r.statusText);
      });
      return r.json();
    });
  };

  window.EMO.logout = function () {
    localStorage.removeItem("emo_token");
    localStorage.removeItem("emo_user_id");
    window.location.href = "/login";
  };

  window.EMO.uid = window.EMO.resolveUserId();

  function boot() {
    window.EMO.uid = window.EMO.resolveUserId();
    if (window.initSidebar) window.initSidebar();
    if (window.initDashboard) window.initDashboard();
    if (window.initChat) window.initChat();
    if (window.initJournal) window.initJournal();
    if (window.initGoals) window.initGoals();
    if (window.initInsights) window.initInsights();
    if (window.initRefreshBreathing) window.initRefreshBreathing();
    if (window.initBodyScan) window.initBodyScan();
    if (window.initGratitudeReset) window.initGratitudeReset();
    if (window.initGrounding) window.initGrounding();
    if (window.initAnalytics) window.initAnalytics();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();