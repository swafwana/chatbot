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

window.initGratitudeReset = function () {
    var circle = document.getElementById("gratitudeCircle");
    if (!circle) return;

    var active = false;
    var interval;
    var stepIndex = 0;
    var counter = 0;

    var steps = [
      { text: "Breathe",      instruction: "Take a slow deep breath. Let your shoulders drop. You're about to shift your perspective.",                    emoji: "🌬️", duration: 10 },
      { text: "Notice #1",    instruction: "Think of one thing in your body you're grateful for — your breath, your heartbeat, your hands.",               emoji: "🙏", duration: 20 },
      { text: "Notice #2",    instruction: "Think of one person in your life who makes things a little lighter. Picture their face.",                       emoji: "💛", duration: 20 },
      { text: "Notice #3",    instruction: "Think of one small moment from today — a sip of something warm, a quiet minute, a kind word.",                 emoji: "✨", duration: 20 },
      { text: "Notice #4",    instruction: "Think of something you usually overlook — clean water, a roof, music, your ability to read these words.",       emoji: "🌍", duration: 20 },
      { text: "Notice #5",    instruction: "Think of one thing about yourself you appreciate — a quality, a habit, something you did recently.",            emoji: "💚", duration: 20 },
      { text: "Sit With It",  instruction: "Hold all five things gently in your mind at once. Let gratitude fill the space where worry usually lives.",     emoji: "🌿", duration: 20 },
      { text: "Close",        instruction: "Take one more deep breath. Carry this feeling with you. You have more than you sometimes remember.",            emoji: "☀️", duration: 15 },
    ];

    function runStep() {
      var step = steps[stepIndex];
      var textEl = document.getElementById("gratitudeText");
      var counterEl = document.getElementById("gratitudeCounter");
      var instructionEl = document.getElementById("gratitudeInstruction");
      if (textEl) textEl.textContent = step.text;
      if (counterEl) counterEl.textContent = step.emoji;
      if (instructionEl) instructionEl.textContent = step.instruction;
      circle.style.background = stepIndex % 2 === 0
        ? "radial-gradient(circle, var(--amber-pale), rgba(212,149,106,0.2))"
        : "radial-gradient(circle, var(--sage-pale), rgba(138,180,154,0.3))";
      circle.style.borderColor = stepIndex % 2 === 0 ? "var(--amber)" : "var(--sage-light)";
      counter = step.duration;
    }

    window.startGratitude = function () {
      var btn = document.getElementById("gratitudeBtn");
      var textEl = document.getElementById("gratitudeText");
      var counterEl = document.getElementById("gratitudeCounter");
      var instructionEl = document.getElementById("gratitudeInstruction");

      if (active) {
        active = false;
        clearInterval(interval);
        stepIndex = 0;
        if (textEl) textEl.textContent = "Tap to begin";
        if (counterEl) counterEl.textContent = "🙏";
        if (instructionEl) instructionEl.textContent = "A 3-minute practice to shift your perspective. Find a quiet moment.";
        circle.style.background = "radial-gradient(circle, var(--amber-pale), rgba(212,149,106,0.2))";
        circle.style.borderColor = "var(--amber)";
        if (btn) btn.textContent = "Start Gratitude Reset";
        return;
      }

      active = true;
      stepIndex = 0;
      if (btn) btn.textContent = "Stop";
      runStep();

      interval = setInterval(function () {
        counter--;
        var counterEl = document.getElementById("gratitudeCounter");
        if (counterEl) counterEl.textContent = steps[stepIndex].emoji + " " + counter + "s";
        if (counter <= 0) {
          stepIndex++;
          if (stepIndex >= steps.length) {
            active = false;
            clearInterval(interval);
            stepIndex = 0;
            if (textEl) textEl.textContent = "Complete 🌿";
            if (counterEl) counterEl.textContent = "☀️";
            if (instructionEl) instructionEl.textContent = "Beautiful. You just gave yourself the gift of presence. Come back anytime.";
            if (btn) btn.textContent = "Start Again";
            return;
          }
          runStep();
        }
      }, 1000);
    };

    window.scrollToGratitude = function () {
      var w = document.getElementById("gratitudeWidget");
      if (w) w.scrollIntoView({ behavior: "smooth" });
    };
  }; 

  window.initGrounding = function () {
  var circle = document.getElementById("groundingCircle");
  if (!circle) return;

  var active = false;
  var interval;
  var stepIndex = 0;
  var counter = 0;

  var steps = [
    {
      text: "5 Things",
      instruction: "Look around and notice five things you can see. Take your time with each one.",
      emoji: "👀",
      duration: 20
    },
    {
      text: "4 Things",
      instruction: "Notice four things you can physically feel. Your chair, clothing, feet on the floor, air on your skin.",
      emoji: "✋",
      duration: 20
    },
    {
      text: "3 Things",
      instruction: "Listen carefully and identify three sounds around you.",
      emoji: "👂",
      duration: 20
    },
    {
      text: "2 Things",
      instruction: "Notice two scents in your environment, even if they are subtle.",
      emoji: "🌿",
      duration: 20
    },
    {
      text: "1 Thing",
      instruction: "Notice one thing you can taste, or simply the taste currently in your mouth.",
      emoji: "👅",
      duration: 20
    },
    {
      text: "Present",
      instruction: "Take a slow breath. Notice how your body feels right now. You are here in this moment.",
      emoji: "💚",
      duration: 20
    }
  ];

  function runStep() {
    var step = steps[stepIndex];

    var textEl = document.getElementById("groundingText");
    var counterEl = document.getElementById("groundingCounter");
    var instructionEl = document.getElementById("groundingInstruction");

    if (textEl) textEl.textContent = step.text;
    if (counterEl) counterEl.textContent = step.emoji;
    if (instructionEl) instructionEl.textContent = step.instruction;

    circle.style.background =
      "radial-gradient(circle, var(--sage-pale), rgba(90,158,114,0.25))";
    circle.style.borderColor = "var(--green)";

    counter = step.duration;
  }

  window.startGrounding = function () {
    var btn = document.getElementById("groundingBtn");
    var textEl = document.getElementById("groundingText");
    var counterEl = document.getElementById("groundingCounter");
    var instructionEl = document.getElementById("groundingInstruction");

    if (active) {
      active = false;
      clearInterval(interval);
      stepIndex = 0;

      if (textEl) textEl.textContent = "Tap to begin";
      if (counterEl) counterEl.textContent = "✋";
      if (instructionEl)
        instructionEl.textContent =
          "A simple grounding exercise that reconnects you with the present moment.";

      circle.style.background =
        "radial-gradient(circle, var(--sage-pale), rgba(90,158,114,0.25))";
      circle.style.borderColor = "var(--green)";

      if (btn) btn.textContent = "Start Grounding";
      return;
    }

    active = true;
    stepIndex = 0;

    if (btn) btn.textContent = "Stop";

    runStep();

    interval = setInterval(function () {
      counter--;

      var counterEl = document.getElementById("groundingCounter");
      if (counterEl)
        counterEl.textContent =
          steps[stepIndex].emoji + " " + counter + "s";

      if (counter <= 0) {
        stepIndex++;

        if (stepIndex >= steps.length) {
          active = false;
          clearInterval(interval);
          stepIndex = 0;

          if (textEl) textEl.textContent = "Complete 🌱";
          if (counterEl) counterEl.textContent = "💚";
          if (instructionEl)
            instructionEl.textContent =
              "Well done. You've brought your attention back to the present moment.";

          if (btn) btn.textContent = "Start Again";

          return;
        }

        runStep();
      }
    }, 1000);
  };

  window.scrollToGrounding = function () {
    var w = document.getElementById("groundingWidget");
    if (w) w.scrollIntoView({ behavior: "smooth" });
  };
};
window.showWidget = function (id) {
    document.querySelectorAll(".breathing-widget").forEach(function(widget) {
        widget.style.display = "none";
    });

    var selected = document.getElementById(id);

    if (selected) {
        selected.style.display = "flex";
        selected.scrollIntoView({ behavior: "smooth" });
    }
};
})();