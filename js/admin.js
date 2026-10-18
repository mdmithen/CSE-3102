// ==========================================
// ADMIN PANEL - Super Admin only
// Uses the shared AUTH module (js/auth.js)
// and the Supabase client (js/supabase-config.js).
//
// What this page can do
// ---------------------
//  - create a club                      -> public.clubs
//  - assign a club manager by email     -> RPC admin_set_manager
//    (that user automatically becomes club_admin)
//  - see every registered club          -> public.clubs
//  - see every user + role              -> RPC admin_list_users
//
// Row Level Security does the real
// protecting: even this page can only do
// what the super_admin policies allow.
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

  // 3. Logout clears the session and returns to login.html
  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!window.confirm("Log out of the Admin Panel?")) return;
      AUTH.logout();
    });
  }

  /* ========== Supabase part ========== */

  function sb() {
    return window.SB || null;
  }

  var msgEl = document.getElementById("adminMsg");
  var statusEl = document.getElementById("saStatus");

  /* Every message is mirrored into the status line under the top bar,
     so feedback raised in one panel stays visible from any panel. */
  function say(text, isError) {
    var line = text || "";
    if (msgEl) {
      msgEl.textContent = line;
      msgEl.style.color = isError ? "#DC2626" : "";
    }
    if (statusEl) statusEl.textContent = line;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function pad(n) {
    return ("00" + n).slice(-3);
  }

  function badge(status) {
    var s = String(status || "").toLowerCase();
    if (s === "active") return '<span class="badge green">Active</span>';
    if (s === "pending") return '<span class="badge yellow">Pending</span>';
    return '<span class="badge">' + esc(status || "-") + "</span>";
  }

  function roleBadge(role) {
    var r = String(role || "player");
    if (r === "super_admin") return '<span class="badge green">Super Admin</span>';
    if (r === "club_admin") return '<span class="badge yellow">Club Admin</span>';
    return '<span class="badge">Player</span>';
  }

  function errText(err) {
    return (err && err.message) ? err.message : "Unknown error";
  }

  /* ---------- dashboard overview ----------

     The four boxes that used to sit on this page (48 clubs,
     620 players, 12 tournaments, 8 districts) were hard-coded
     literals, not real figures.

     They are gone. What is left is counted from the two results
     this dashboard already receives: the clubs query and the
     admin_list_users RPC. Tournaments, Districts, Players and
     Venues are not shown at all, because nothing in this project
     queries them and inventing a number would be dishonest.

     Nothing here adds a query or changes how an existing one is
     handled - it only reads the row count that has already
     arrived. */

  var counts = { clubs: null, users: null };

  function renderStats() {
    var host = document.getElementById("saStats");
    if (!host) return;

    var cards = [
      { label: "Registered Clubs", value: counts.clubs, foot: "Counted from the clubs table" },
      { label: "All Users",        value: counts.users, foot: "Counted from admin_list_users" }
    ];

    host.innerHTML = cards.map(function (c) {
      var has = c.value !== null && c.value !== undefined && !isNaN(c.value);
      return '<div class="sa-stat">' +
        '<span class="sa-stat-label">' + esc(c.label) + "</span>" +
        "<b>" + esc(has ? c.value : "—") + "</b>" +
        '<span class="sa-stat-foot">' + esc(has ? c.foot : "Not connected yet") + "</span>" +
      "</div>";
    }).join("");
  }

  /* ---------- Registered clubs ---------- */

  function loadClubs() {
    var body = document.getElementById("clubs-body");
    if (!body || !sb()) return;

    sb().from("clubs")
      .select("id, name, status, manager_id")
      .order("id")
      .then(function (res) {
        var rows = (res && res.data) || [];

        counts.clubs = rows.length;
        renderStats();

        var clubChip = document.getElementById("saClubCount");
        if (clubChip) clubChip.textContent = rows.length + (rows.length === 1 ? " club" : " clubs");

        if (!rows.length) {
          body.innerHTML = '<tr><td colspan="5" class="muted">No clubs yet — add the first one above.</td></tr>';
          return;
        }

        body.innerHTML = "";
        rows.forEach(function (club) {
          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>DSC-" + pad(club.id) + "</td>" +
            "<td>" + esc(club.name) + "</td>" +
            "<td>" + (club.manager_id ? "Assigned" : "—") + "</td>" +
            "<td>" + badge(club.status) + "</td>" +
            '<td><a href="#" data-club="' + esc(club.id) + '">Set Manager</a></td>';
          body.appendChild(tr);
        });

        Array.prototype.forEach.call(body.querySelectorAll("a[data-club]"), function (link) {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            var clubId = Number(link.getAttribute("data-club"));
            var email = window.prompt("Email of the existing user who should manage this club:");
            if (email && email.trim()) setManager(clubId, email.trim());
          });
        });
      })
      .catch(function (err) {
        body.innerHTML = '<tr><td colspan="5" class="muted">Could not load clubs.</td></tr>';
        say(errText(err), true);
      });
  }

  function setManager(clubId, email) {
    sb().rpc("admin_set_manager", {
      p_club_id: clubId,
      p_manager_email: email
    }).then(function (res) {
      var data = (res && res.data) || {};
      if (data.ok) {
        say("Manager assigned to club DSC-" + pad(clubId) + ".");
        loadClubs();
      } else {
        say(data.error || "Could not assign manager.", true);
      }
    }).catch(function (err) {
      say(errText(err), true);
    });
  }

  /* ---------- Add club form ---------- */

  var form = document.querySelector("#add-club form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!sb()) { say("Supabase is not connected.", true); return; }

      var name = (document.getElementById("club-name").value || "").trim();
      var phone = (document.getElementById("club-contact").value || "").trim();
      var managerEmail = (document.getElementById("club-manager-email").value || "").trim();

      if (!name) { say("Please enter the club name.", true); return; }

      say("Saving club…");

      sb().rpc("admin_create_club", {
        p_name: name,
        p_phone: phone,
        p_email: "",
        p_manager_email: managerEmail
      }).then(function (res) {
        var data = (res && res.data) || {};
        if (data.ok) {
          var text = "Club created (DSC-" + pad(data.club_id) + ").";
          if (data.warning) text += " " + data.warning;
          say(text);
          form.reset();
          loadClubs();
        } else {
          say(data.error || "Could not create the club.", true);
        }
      }).catch(function (err) {
        say(errText(err), true);
      });
    });
  }

  /* ---------- All users ---------- */

  function loadUsers() {
    var body = document.getElementById("users-body");
    if (!body || !sb()) return;

    sb().rpc("admin_list_users").then(function (res) {
      var rows = (res && res.data) || [];

      counts.users = rows.length;
      renderStats();

      var userChip = document.getElementById("saUserCount");
      if (userChip) userChip.textContent = rows.length + (rows.length === 1 ? " user" : " users");

      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="4" class="muted">No users found.</td></tr>';
        return;
      }

      body.innerHTML = "";
      rows.forEach(function (u) {
        var tr = document.createElement("tr");
        var joined = u.created_at ? String(u.created_at).slice(0, 10) : "—";
        tr.innerHTML =
          "<td>" + esc(u.email) + "</td>" +
          "<td>" + esc(u.full_name || "—") + "</td>" +
          "<td>" + roleBadge(u.role) + "</td>" +
          "<td>" + esc(joined) + "</td>";
        body.appendChild(tr);
      });
    }).catch(function (err) {
      body.innerHTML = '<tr><td colspan="4" class="muted">Could not load users.</td></tr>';
      say(errText(err), true);
    });
  }

  /* ---------- panel navigation ----------

     The sidebar is the only navigation. Exactly one panel is
     rendered at a time: an inactive panel gets display:none from
     css/admin.css AND the hidden attribute is set here, so it is
     genuinely removed rather than pushed off screen.

     There is no horizontal tab bar and no duplicate navigation -
     each menu item simply reveals the one panel it belongs to. */

  var PANELS = {
    dashboard: { title: "Dashboard", sub: "Manage clubs across all districts." },
    clubs:     { title: "Clubs",     sub: "Every registered club, and who manages it." },
    users:     { title: "Users",     sub: "Everyone with an account, and their role." },
    "add-club": { title: "Add Club",  sub: "Register a new club and its manager." }
  };

  function showPanel(name) {
    var panels = document.querySelectorAll("#saPanels [data-panel]");
    var known = !!PANELS[name];
    if (!known) name = "dashboard";

    Array.prototype.forEach.call(panels, function (p) {
      var on = p.getAttribute("data-panel") === name;
      p.classList.toggle("is-active", on);
      if (on) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });

    var links = document.querySelectorAll(".sa-nav a[data-sa-nav]");
    Array.prototype.forEach.call(links, function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-sa-nav") === name);
    });

    var meta = PANELS[name];
    var titleEl = document.getElementById("saPageTitle");
    var subEl = document.getElementById("saPageSub");
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.sub;
  }

  function bindNav() {
    var nav = document.querySelector(".sa-nav");
    if (!nav) return;

    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a[data-sa-nav]");
      if (!link) return;
      e.preventDefault();
      showPanel(link.getAttribute("data-sa-nav"));
      closeDrawer();
    });
  }

  /* ---------- mobile sidebar drawer ---------- */

  function openDrawer() {
    var sb = document.getElementById("saSidebar");
    var ov = document.getElementById("saOverlay");
    var burger = document.getElementById("saBurger");
    if (!sb) return;
    sb.classList.add("is-open");
    if (ov) ov.hidden = false;
    if (burger) burger.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    var sb = document.getElementById("saSidebar");
    var ov = document.getElementById("saOverlay");
    var burger = document.getElementById("saBurger");
    if (!sb) return;
    sb.classList.remove("is-open");
    if (ov) ov.hidden = true;
    if (burger) burger.setAttribute("aria-expanded", "false");
  }

  function bindDrawer() {
    var burger = document.getElementById("saBurger");
    if (burger) {
      burger.addEventListener("click", function () {
        var sb = document.getElementById("saSidebar");
        if (sb && sb.classList.contains("is-open")) closeDrawer();
        else openDrawer();
      });
    }

    var overlay = document.getElementById("saOverlay");
    if (overlay) overlay.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) closeDrawer();
    });
  }

  /* ---------- start ---------- */

  renderStats();
  showPanel("dashboard");

  bindNav();
  bindDrawer();

  loadClubs();
  loadUsers();

})();
