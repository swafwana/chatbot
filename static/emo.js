(function () {
  "use strict";

  window.EMO = {};

  window.EMO.resolveUserId = function () {
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
    return fetch(path, options).then(function (r) {
      if (!r.ok) return r.text().then(function (t) {
        throw new Error(t || r.statusText);
      });
      return r.json();
    });
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
    if (window.initAnalytics) window.initAnalytics();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();