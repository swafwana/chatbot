(function () {
  "use strict";

  window.initRefreshBreathing = function () {
    var circle = document.getElementById("breathingCircle");
    if (!circle) return;

    var breathingActive = false;
    var breathInterval;
    var phases = [
      { text: "Inhale", cls: "inhale", duration: 4 },
      { text: "Hold", cls: "", duration: 4 },
      { text: "Exhale", cls: "exhale", duration: 4 },
      { text: "Hold", cls: "", duration: 4 }
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
  };
})();