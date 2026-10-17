/* ==========================================
   AUTH - Supabase backed login
   Single source of truth for the demo accounts,
   the session and role-based redirects.
   Loaded by: login.js, admin.js,
   player-dashboard.js, login-system.html

   How it works now
   ----------------
   1. The email + password is verified by
      Supabase Auth (js/supabase-config.js).
   2. The role (super_admin / club_admin /
       player) is read from the `profiles`
       table (setup SQL lives in the team chat,
       not in this repo).
   3. A small cache (ds_session) is written to
      browser storage so page guards like
      AUTH.requireRole() can stay synchronous
      and fast.

   NOTE: This is still a class-project demo.
   Real authorization must also be enforced
   with Row Level Security in Supabase.
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

  /* Used when the profiles row is missing/empty */
  var DEFAULT_ROLE = ROLES.PLAYER;

  /* ---------- DEMO ACCOUNTS (autofill only) ----------
     These are only used by the "click to fill"
     buttons on login.html. The password check is
     done by Supabase, NOT here.
     All demo passwords: 123456
  ------------------------------------- */
  var DEMO_ACCOUNTS = [
    {
      email: "admin@districtsports.com",
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

  /* ---------- supabase helpers ---------- */
  function client() {
    return window.SB || null;
  }

  /* Read role + name from public.profiles.
     Returns null if the table/policy is missing. */
  function loadProfile(user) {
    var sb = client();
    if (!sb) return Promise.resolve(null);

    return sb.from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle()
      .then(function (res) {
        return res && res.data ? res.data : null;
      })
      .catch(function (err) {
        console.warn(
          "profiles table not readable (" +
          (err && err.message ? err.message : "unknown") +
          "). The profiles policy/trigger SQL has not " +
          "been run - ask for it in the team chat."
        );
        return null;
      });
  }

  function pickRole(profile, user) {
    if (profile && profile.role) return profile.role;
    if (user && user.user_metadata && user.user_metadata.role) return user.user_metadata.role;
    return DEFAULT_ROLE;
  }

  function pickName(profile, user) {
    if (profile && profile.full_name) return profile.full_name;
    if (user && user.user_metadata && user.user_metadata.full_name) return user.user_metadata.full_name;
    if (user && user.email) return user.email.split("@")[0];
    return "User";
  }

  /* ---------- session (small local cache) ---------- */

  /* Minimal session. The password is never stored. */
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

  function currentUser() { return session(); }

  function isLoggedIn() { return session() !== null; }

  /* ---------- non-redirecting role checks ----------
     Use these on pages that are PUBLIC but contain a
     protected panel (see login-system.html). The visitor
     stays exactly where they are; the panel is simply
     hidden or shown. Nothing is fetched from Supabase.

     requireRole() below stays the guard for pages that are
     fully protected, so nothing here weakens it. */

  /* The role of the signed-in user, or null when nobody is signed in */
  function currentRole() {
    var s = session();
    return s ? s.role : null;
  }

  /* True only when that exact role is signed in. */
  function hasRole(role) {
    return currentRole() === role;
  }

  /* ---------- friendly error messages ---------- */
  function friendlyError(err) {
    var msg = (err && err.message) ? String(err.message) : "";

    if (/Invalid login credentials/i.test(msg)) {
      return "❌ Invalid email address or password. Please try again.";
    }
    if (/Email not confirmed/i.test(msg)) {
      return "❌ Your email is not confirmed. Confirm it from the Supabase dashboard, or disable “Confirm email”.";
    }
    if (/rate limit/i.test(msg)) {
      return "⚠️ Too many attempts. Please wait a minute and try again.";
    }
    if (/Failed to fetch|NetworkError|fetch failed/i.test(msg)) {
      return "⚠️ Cannot reach Supabase. Check your internet connection.";
    }
    return "❌ " + (msg || "Login failed. Please try again.");
  }

  /* ---------- public API ---------- */

  /* Verify email + password with Supabase, then
     store the role so page guards keep working.
     Returns a Promise (this step is async now). */
  function login(email, password) {
    var sb = client();

    if (!sb) {
      return Promise.resolve({
        ok: false,
        message: "⚠️ Supabase is not connected. Check js/supabase-config.js and the CDN script tag."
      });
    }

    return sb.auth.signInWithPassword({
      email: String(email).trim(),
      password: password
    })
    .then(function (res) {
      var user = res && res.data ? res.data.user : null;

      if (!user) {
        return { ok: false, message: "❌ Invalid email address or password. Please try again." };
      }

      return loadProfile(user).then(function (profile) {
        var role = pickRole(profile, user);
        var name = pickName(profile, user);

        setSession({ role: role, name: name, email: user.email });

        return {
          ok: true,
          role: role,
          name: name,
          email: user.email,
          redirect: REDIRECTS[role] || LOGIN_PAGE
        };
      });
    })
    .catch(function (err) {
      return { ok: false, message: friendlyError(err) };
    });
  }

  function redirectFor(role) {
    return REDIRECTS[role] || LOGIN_PAGE;
  }

  /* Clear the session and return to the shared login page. */
  function logout() {
    clearSession();

    var sb = client();
    var go = function () { window.location.href = LOGIN_PAGE; };

    if (sb) {
      // signOut() is best effort; we always leave the page
      sb.auth.signOut().then(go, go);
    } else {
      go();
    }
  }

  /* Page protection. Returns false if the visitor must leave.
     Synchronous: it reads the local cache written at login. */
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

  /* Re-check the cached session against Supabase.
     - session expired / signed out elsewhere -> back to login
     - profile role changed (e.g. admin) -> update the cache */
  function syncWithServer() {
    var sb = client();
    var cached = session();
    if (!sb || !cached) return;

    sb.auth.getSession()
      .then(function (res) {
        var live = res && res.data ? res.data.session : null;

        if (!live) {
          // Supabase no longer knows us -> log out locally
          clearSession();
          window.location.replace(LOGIN_PAGE);
          return null;
        }

        return loadProfile(live.user).then(function (profile) {
          if (!profile) return;
          var role = pickRole(profile, live.user);
          var name = pickName(profile, live.user);
          if (role !== cached.role || name !== cached.name) {
            setSession({ role: role, name: name, email: cached.email });
            if (role !== cached.role) {
              window.location.replace(redirectFor(role));
            }
          }
        });
      })
      .catch(function (err) {
        console.warn("Supabase session check failed:", err);
      });
  }

  // Run once on load (only when someone is signed in)
  if (typeof window !== "undefined") {
    if (session()) { syncWithServer(); }
  }

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
    currentRole: currentRole,
    hasRole: hasRole,
    isLoggedIn: isLoggedIn,
    syncWithServer: syncWithServer
  };
})();

// Make it available to plain <script> tags on other pages
if (typeof window !== "undefined") { window.AUTH = AUTH; }
