// ==========================================
// LOGIN - Shared login page for every role.
// Works together with js/auth.js, which asks
// Supabase Auth to verify the password and
// then decides where each role is redirected.
//
// Demo accounts (all passwords: 123456)
//   admin@districtsports.com     -> Super Admin -> admin.html
//   clubadmin@districtsports.com  -> Club Admin  -> login-system.html#clubs
//   player@gmail.com              -> Player      -> player-dashboard.html
// ==========================================

(function () {

  // 1. Grab the elements we need
  var form = document.getElementById("loginForm");
  var emailInput = document.getElementById("email");
  var passInput = document.getElementById("password");
  var errorBox = document.getElementById("error");
  var toggleBtn = document.getElementById("togglePassword");
  var demoRows = document.querySelectorAll(".demo-row");

  // 2. Show / hide password
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var isHidden = passInput.type === "password";
      passInput.type = isHidden ? "text" : "password";
      toggleBtn.textContent = isHidden ? "Hide" : "Show";
      toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
      toggleBtn.setAttribute("aria-pressed", String(isHidden));
      passInput.focus();
    });
  }

  // 3. Demo shortcut buttons fill the form
  Array.prototype.forEach.call(demoRows, function (row) {
    row.addEventListener("click", function () {
      var account = null;
      Array.prototype.forEach.call(demoRows, function (r) {
        r.classList.remove("is-selected");
      });
      row.classList.add("is-selected");

      // Pull the matching demo account so the password always matches
      for (var i = 0; i < AUTH.DEMO_ACCOUNTS.length; i++) {
        if (AUTH.DEMO_ACCOUNTS[i].email === row.dataset.email) {
          account = AUTH.DEMO_ACCOUNTS[i];
          break;
        }
      }

      if (account) {
        emailInput.value = account.email;
        passInput.value = account.password;
      }
      errorBox.textContent = "";
      passInput.focus();
    });
  });

  // 4. Login (Supabase answers asynchronously -> Promise)
  form.addEventListener("submit", function (e) {
    e.preventDefault(); // stop the page reloading

    var email = emailInput.value.trim();
    var pass = passInput.value;

    // Small guard so an empty form gives a friendly message
    if (!email || !pass) {
      errorBox.textContent = "❌ Please enter both your email address and password.";
      return;
    }

    // Stop double submits while Supabase is working
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    errorBox.textContent = "⏳ Signing in…";

    // 5. Ask AUTH to check the account with Supabase
    AUTH.login(email, pass).then(function (result) {
      if (submitBtn) submitBtn.disabled = false;

      if (result.ok) {
        // Role decides where the user lands:
        // Super Admin -> admin.html
        // Club Admin  -> login-system.html#clubs
        // Player      -> player-dashboard.html
        errorBox.textContent = "";
        window.location.href = result.redirect;
      } else {
        errorBox.textContent = result.message;
        errorBox.classList.remove("is-shake");
        void errorBox.offsetWidth; // restart the shake animation
        errorBox.classList.add("is-shake");

        passInput.value = "";
        passInput.focus();
      }
    });
  });

})();