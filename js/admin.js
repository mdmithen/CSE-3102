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

  function say(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.style.color = isError ? "#e5534b" : "";
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

  /* ---------- Registered clubs ---------- */

  function loadClubs() {
    var body = document.getElementById("clubs-body");
    if (!body || !sb()) return;

    sb().from("clubs")
      .select("id, name, status, manager_id")
      .order("id")
      .then(function (res) {
        var rows = (res && res.data) || [];

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

  loadClubs();
  loadUsers();

})();
