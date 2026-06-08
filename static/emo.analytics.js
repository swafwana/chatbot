(function () {
  "use strict";

  window.initAnalytics = function () {
    var heatmap = document.getElementById("heatmap");
    if (!heatmap) return;

    var moodLevels = [0,1,2,1,3,4,3,1,2,3,4,4,3,2,2,3,3,2,4,3,3,1,2,3,3,4,4,3,2,3,0,0,0,0,0];
    var labels = ["-", "Low", "Okay", "Good", "Great"];
    heatmap.innerHTML = "";
    moodLevels.forEach(function (level) {
      var day = document.createElement("div");
      day.className = "heat-day heat-" + level;
      day.title = "Mood: " + (labels[level] || "-");
      heatmap.appendChild(day);
    });

    var container = document.getElementById("monthlyBars");
    if (!container) return;
    container.innerHTML = "";
    var months = [
      { m: "Oct", v: 55 }, { m: "Nov", v: 62 }, { m: "Dec", v: 48 },
      { m: "Jan", v: 58 }, { m: "Feb", v: 65 }, { m: "Mar", v: 71 }, { m: "Apr", v: 76 }
    ];
    var max = 80;
    months.forEach(function (item) {
      var wrap = document.createElement("div");
      wrap.className = "monthly-bar-wrap";
      var pct = Math.round((item.v / max) * 120);
      var color = item.v >= 70 ? "var(--sage)" : item.v >= 60 ? "var(--sage-light)" : "var(--blush)";
      wrap.innerHTML = '<div class="monthly-bar-val">' + item.v + '%</div><div class="monthly-bar" style="height:' + pct + 'px;background:' + color + '"></div><div class="monthly-bar-label">' + item.m + '</div>';
      container.appendChild(wrap);
    });
  };
})();