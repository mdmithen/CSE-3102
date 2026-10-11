/* ==========================================
   AUTH - Shared demo authentication helpers
   Single source of truth for demo accounts,
   the demo session and role-based redirects.
   Loaded by: login.js, admin.js,
   player-dashboard.js

   NOTE: Frontend demo only. Credentials live
   in this file, so anyone can read them in
   the page source. This is NOT real security
   and must be replaced by server-side auth
   (Supabase Auth) before any public use.
   ========================================== */

var AUTH = (function () {

  /* ---------- constants ---------- */
  var LOGIN_PAGE = "login.html";

  var ROLES = {
    SUPER_ADMIN: "super_admin",
    CLUB_ADMIN:  "club_admin",
    PLAYER:      "player"
  };

  /* Where each role lands after login */
  var REDIRECTS = {
    super_admin: "admin.html",
    club_admin:  "login-system.html#clubs",
    player:      "player-dashboard.html"
  };

  /* ---------- DEMO ACCOUNTS ----------
     admin@gmail.com  -> pre-existing admin credential (kept as-is)
     player@gmail.com -> added in Part 1 (kept as-is)
     clubadmin@districtsports.com -> new, confirmed with the team
     All demo passwords are 123456.
  ------------------------------------- */
  var DEMO_ACCOUNTS = [
    {
      email: "admin@gmail.com",
      password: "123456",
      role: ROLES.SUPER_ADMIN,
      label: "Super Admin",
      name: "System Admin",
      redirect: REDIRECTS.super_admin
    },
    {
      email: "clubadmin@districtsports.com",
      password: "123456",
      role: ROLES.CLUB_ADMIN,
      label: "Club Admin",
      name: "Ahmed Rahman",
      redirect: REDIRECTS.club_admin
    },
    {
      email: "player@gmail.com",
      password: "123456",
      role: ROLES.PLAYER,
      label: "Player",
      name: "Rahim Ahmed",
      redirect: REDIRECTS.player
    }
  ];

  /* ---------- safe storage ----------
     Some browsers restrict storage on file:// URLs,
     so fall back instead of throwing. */
  var memory = {};

  var backend = (function () {
    try {
      var s = window.sessionStorage;
      s.setItem("__t", "1");
      s.removeItem("__t");
      return s;
    } catch (e) {
      try {
        var l = window.localStorage;
        l.setItem("__t", "1");
        l.removeItem("__t");
        return l;
      } catch (e2) {
        return null;
      }
    }
  })();

  var KEY = "ds_session";

  function read() {
    try {
      return backend ? backend.getItem(KEY) : (memory[KEY] || null);
    } catch (e) {
      return memory[KEY] || null;
    }
  }

  function write(value) {
    try {
      if (backend) { backend.setItem(KEY, value); return; }
    } catch (e) { /* fall through to memory */ }
    memory[KEY] = value;
  }

  function wipe() {
    try { if (backend) backend.removeItem(KEY); } catch (e) {}
    delete memory[KEY];
  }

  /* ---------- public API ---------- */

  /* Minimal demo session. The password is never stored. */
  function setSession(account) {
    write(JSON.stringify({
      role: account.role,
      name: account.name,
      email: account.email,
      loggedInAt: new Date().toISOString()
    }));
  }

  function session() {
    var raw = read();
    if (!raw) return null;
    try {
      var s = JSON.parse(raw);
      return (s && s.role) ? s : null;
    } catch (e) {
      wipe();
      return null;
    }
  }

  function clearSession() { wipe(); }

  /* Check an email + password against the demo accounts. */
  function login(email, password) {
    var match = DEMO_ACCOUNTS.filter(function (a) {
      return a.email.toLowerCase() === String(email).toLowerCase()
          && a.password === password;
    })[0];

    if (!match) {
      return {
        ok: false,
        message: "❌ Invalid email address or password. Please try again."
      };
    }

    setSession(match);
    return {
      ok: true,
      role: match.role,
      name: match.name,
      redirect: match.redirect
    };
  }

  function redirectFor(role) {
    return REDIRECTS[role] || LOGIN_PAGE;
  }

  /* Clear the demo session and return to the shared login page. */
  function logout() {
    clearSession();
    window.location.href = LOGIN_PAGE;
  }

  /* Page protection. Returns false if the visitor must leave. */
  function requireRole(role) {
    var s = session();

    if (!s) {
      clearSession();
      window.location.replace(LOGIN_PAGE);
      return false;
    }

    if (s.role !== role) {
      // Logged in, but on the wrong dashboard - send them to their own
      window.location.replace(redirectFor(s.role));
      return false;
    }

    return true;
  }

  /* Show who is signed in, if anyone. */
  function currentUser() { return session(); }

  function isLoggedIn() { return session() !== null; }

  /* ---------- exports ---------- */
  return {
    LOGIN_PAGE: LOGIN_PAGE,
    ROLES: ROLES,
    REDIRECTS: REDIRECTS,
    DEMO_ACCOUNTS: DEMO_ACCOUNTS,
    setSession: setSession,
    session: session,
    currentUser: currentUser,
    clearSession: clearSession,
    login: login,
    logout: logout,
    redirectFor: redirectFor,
    requireRole: requireRole,
    isLoggedIn: isLoggedIn
  };
})();

// Make it available to plain <script> tags on other pages
if (typeof window !== "undefined") { window.AUTH = AUTH; }