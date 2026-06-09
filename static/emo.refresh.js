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

  window.initBodyScan = function () {
    var circle = document.getElementById("bodyScanCircle");
    if (!circle) return;

    var scanActive = false;
    var scanInterval;
    var stepIndex = 0;
    var counter = 0;

    var steps = [
      { text: "Settle In",        instruction: "Find a comfortable position. Close your eyes gently and take three slow, deep breaths.",           emoji: "😌", duration: 15 },
      { text: "Head & Scalp",     instruction: "Bring your attention to the top of your head. Notice any tension in your scalp and let it soften.", emoji: "🧠", duration: 15 },
      { text: "Face & Jaw",       instruction: "Soften your forehead, relax your eyes, unclench your jaw. Let your face be completely at ease.",    emoji: "😮‍💨", duration: 15 },
      { text: "Neck & Shoulders", instruction: "Notice your neck and shoulders. Let them drop away from your ears. Release any tightness.",         emoji: "🫧", duration: 15 },
      { text: "Chest & Heart",    instruction: "Feel your chest rise and fall with each breath. Place your awareness on your heartbeat.",            emoji: "💚", duration: 15 },
      { text: "Arms & Hands",     instruction: "Relax your arms, elbows, wrists and fingers. Let them feel heavy and warm.",                        emoji: "🙌", duration: 15 },
      { text: "Stomach",          instruction: "Bring attention to your belly. Let it be soft. Notice the gentle movement of your breath here.",    emoji: "🌀", duration: 15 },
      { text: "Lower Back",       instruction: "Scan your lower back. If there's tension, breathe into it and let it melt with each exhale.",       emoji: "🌿", duration: 15 },
      { text: "Hips & Pelvis",    instruction: "Relax your hips, pelvis and glutes. Let the weight of your body be fully supported.",               emoji: "🪨", duration: 15 },
      { text: "Legs & Knees",     instruction: "Soften your thighs, knees and calves. Feel the heaviness and warmth spreading down your legs.",     emoji: "🦵", duration: 15 },
      { text: "Feet & Toes",      instruction: "Bring awareness to your feet and toes. Wiggle them gently, then let them completely relax.",        emoji: "👣", duration: 15 },
      { text: "Whole Body",       instruction: "Now feel your whole body at once — heavy, warm, completely at rest. Stay here as long as you need.", emoji: "✨", duration: 20 },
    ];

    function runStep() {
      var step = steps[stepIndex];
      var textEl = document.getElementById("bodyScanText");
      var counterEl = document.getElementById("bodyScanCounter");
      var instructionEl = document.getElementById("bodyScanInstruction");
      if (textEl) textEl.textContent = step.text;
      if (counterEl) counterEl.textContent = step.emoji;
      if (instructionEl) instructionEl.textContent = step.instruction;
      circle.style.background = stepIndex % 2 === 0
        ? "radial-gradient(circle, var(--lavender-pale), rgba(155,142,196,0.3))"
        : "radial-gradient(circle, var(--sage-pale), rgba(138,180,154,0.3))";
      circle.style.borderColor = stepIndex % 2 === 0 ? "var(--lavender)" : "var(--sage-light)";
      counter = step.duration;
    }

    window.startBodyScan = function () {
      var btn = document.getElementById("bodyScanBtn");
      var textEl = document.getElementById("bodyScanText");
      var counterEl = document.getElementById("bodyScanCounter");
      var instructionEl = document.getElementById("bodyScanInstruction");

      if (scanActive) {
        scanActive = false;
        clearInterval(scanInterval);
        stepIndex = 0;
        if (textEl) textEl.textContent = "Tap to begin";
        if (counterEl) counterEl.textContent = "🧠";
        if (instructionEl) instructionEl.textContent = "A gentle scan from head to toe. Find a comfortable position.";
        circle.style.background = "radial-gradient(circle, var(--lavender-pale), rgba(155,142,196,0.3))";
        circle.style.borderColor = "var(--lavender)";
        if (btn) btn.textContent = "Start Body Scan";
        return;
      }

      scanActive = true;
      stepIndex = 0;
      if (btn) btn.textContent = "Stop";
      runStep();

      scanInterval = setInterval(function () {
        counter--;
        var counterEl = document.getElementById("bodyScanCounter");
        if (counterEl) counterEl.textContent = steps[stepIndex].emoji + " " + counter + "s";
        if (counter <= 0) {
          stepIndex++;
          if (stepIndex >= steps.length) {
            scanActive = false;
            clearInterval(scanInterval);
            stepIndex = 0;
            if (textEl) textEl.textContent = "Complete 🌿";
            if (counterEl) counterEl.textContent = "✨";
            if (instructionEl) instructionEl.textContent = "Well done. Take a moment before you move. You did great.";
            if (btn) btn.textContent = "Start Again";
            return;
          }
          runStep();
        }
      }, 1000);
    };

    window.scrollToBodyScan = function () {
      var w = document.getElementById("bodyScanWidget");
      if (w) w.scrollIntoView({ behavior: "smooth" });
    };
  };

  

})();