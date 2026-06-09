(function () {
  "use strict";

  // redirect if already logged in
  if (localStorage.getItem("emo_token")) {
    var uid = localStorage.getItem("emo_user_id") || "default";
    window.location.href = "/dashboard?user_id=" + encodeURIComponent(uid);
  }

  function showError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  window.switchTab = function (tab) {
    document.querySelectorAll(".auth-tab").forEach(function (t) {
      t.classList.remove("active");
    });
    document.querySelectorAll(".auth-form").forEach(function (f) {
      f.classList.remove("active");
    });
    document.getElementById(tab + "Form").classList.add("active");
    event.target.classList.add("active");
  };

  window.handleLogin = function () {
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPassword").value;
    showError("loginError", "");

    if (!email || !password) {
      showError("loginError", "Please fill in all fields.");
      return;
    }

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          showError("loginError", res.data.detail || "Login failed.");
          return;
        }
        localStorage.setItem("emo_token", res.data.token);
        localStorage.setItem("emo_user_id", res.data.user_id);
        window.location.href =
          "/dashboard?user_id=" + encodeURIComponent(res.data.user_id);
      })
      .catch(function () {
        showError("loginError", "Something went wrong. Try again.");
      });
  };

  window.handleRegister = function () {
    var email = document.getElementById("registerEmail").value.trim();
    var password = document.getElementById("registerPassword").value;
    var confirm = document.getElementById("registerConfirm").value;
    showError("registerError", "");

    if (!email || !password || !confirm) {
      showError("registerError", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      showError("registerError", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      showError("registerError", "Password must be at least 6 characters.");
      return;
    }

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          showError("registerError", res.data.detail || "Registration failed.");
          return;
        }
        localStorage.setItem("emo_token", res.data.token);
        localStorage.setItem("emo_user_id", res.data.user_id);
        window.location.href =
          "/dashboard?user_id=" + encodeURIComponent(res.data.user_id);
      })
      .catch(function () {
        showError("registerError", "Something went wrong. Try again.");
      });
  };
})();