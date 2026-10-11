// ==========================================
// ADMIN PANEL - Guard + logout
// Uses the shared AUTH module (js/auth.js).
//
// The panel is Super Admin only. If nobody is
// signed in, or a Player/Club Admin is signed
// in, the visitor is sent back to the shared
// login page or to their own dashboard.
// ==========================================

(function () {

  if (!window.AUTH) return;

  // 1. Block the page for anyone who is not a Super Admin
  if (!AUTH.requireRole(AUTH.ROLES.SUPER_ADMIN)) return;

  // 2. Show the signed-in admin in the sidebar card
  var user = AUTH.currentUser();
  if (user) {
    var nameEl = document.getElementById("adminName");
    var mailEl = document.getElementById("adminEmail");
    if (nameEl) nameEl.textContent = user.name;
    if (mailEl) mailEl.textContent = user.email;
  }

  // 3. Logout clears the demo session and returns to login.html
  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!window.confirm("Log out of the Admin Panel?")) return;
      AUTH.logout();
    });
  }

})();