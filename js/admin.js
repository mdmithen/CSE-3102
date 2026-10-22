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
  console.log("[ADMIN] Script loaded - IIFE started");

  if (!window.AUTH) {
    console.error("[ADMIN] window.AUTH is undefined - auth.js not loaded before admin.js");
    return;
  }

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

  /* Startup connection check */
  console.log("[ADMIN] Supabase client at startup:", sb() ? "CONNECTED" : "NULL - check js/supabase-config.js and CDN script tag");

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
          '<td>' +
            '<a href="#" data-club="' + esc(club.id) + '">Set Manager</a> ' +
            '<a href="#" data-view-players="' + esc(club.id) + '" class="sa-view-players">View Players</a> ' +
            '<a href="#" data-delete="' + esc(club.id) + '" class="sa-delete">Delete</a>' +
          '</td>';
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

        Array.prototype.forEach.call(body.querySelectorAll("a[data-delete]"), function (link) {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            var clubId = Number(link.getAttribute("data-delete"));
            var clubName = link.closest("tr").querySelector("td:nth-child(2)").textContent.trim();
            if (!window.confirm("Delete club '" + clubName + "'? This cannot be undone.")) return;
            deleteClub(clubId);
          });
        });

        Array.prototype.forEach.call(body.querySelectorAll("a[data-view-players]"), function (link) {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            var clubId = Number(link.getAttribute("data-view-players"));
            var clubName = link.closest("tr").querySelector("td:nth-child(2)").textContent.trim();
            viewPlayers(clubId, clubName);
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

  function deleteClub(clubId) {
    if (!sb()) { say("Supabase is not connected.", true); return; }

    say("Deleting club DSC-" + pad(clubId) + "…");

    sb().from("clubs").delete().eq("id", clubId).then(function (res) {
      if (res && res.error) {
        console.error("[DELETE CLUB] Error:", res.error);
        say(res.error.message || "Could not delete the club.", true);
        return;
      }
      say("Club DSC-" + pad(clubId) + " deleted.");
      loadClubs();
    }).catch(function (err) {
      console.error("[DELETE CLUB] Catch error:", err);
      say(errText(err), true);
    });
  }

  /* ---------- view players modal ---------- */

  var viewPlayersModal = document.getElementById("saViewPlayersModal");
  var viewPlayersBackdrop = document.getElementById("saViewPlayersBackdrop");
  var viewPlayersBody = document.getElementById("saViewPlayersBody");
  var viewPlayersTitle = document.getElementById("saViewPlayersTitle");
  var viewPlayersClose = document.getElementById("saViewPlayersClose");
  var viewPlayersDone = document.getElementById("saViewPlayersDone");

  function openViewPlayers() {
    if (viewPlayersModal) viewPlayersModal.hidden = false;
    if (viewPlayersBackdrop) viewPlayersBackdrop.hidden = false;
  }

  function closeViewPlayers() {
    if (viewPlayersModal) viewPlayersModal.hidden = true;
    if (viewPlayersBackdrop) viewPlayersBackdrop.hidden = true;
  }

  if (viewPlayersClose) viewPlayersClose.addEventListener("click", closeViewPlayers);
  if (viewPlayersDone) viewPlayersDone.addEventListener("click", closeViewPlayers);
  if (viewPlayersBackdrop) viewPlayersBackdrop.addEventListener("click", closeViewPlayers);

  function viewPlayers(clubId, clubName) {
    if (!sb()) { say("Supabase is not connected.", true); return; }

    if (viewPlayersTitle) viewPlayersTitle.textContent = "Players — " + esc(clubName);
    if (viewPlayersBody) viewPlayersBody.innerHTML = '<p class="muted">Loading players…</p>';
    openViewPlayers();

    sb().from("players").select("*").eq("club_id", clubId).order("full_name")
      .then(function (res) {
        if (res && res.error) throw res.error;
        var players = res && res.data ? res.data : [];

        if (!players.length) {
          viewPlayersBody.innerHTML = '<p class="muted">No players registered for this club.</p>';
          return;
        }

        var rows = players.map(function (p) {
          return "<tr>" +
            "<td>" + esc(p.full_name) + "</td>" +
            "<td>" + esc(p.position || "—") + "</td>" +
            "<td>" + esc(p.status || "Active") + "</td>" +
            "<td>" + esc(p.jersey_no || "—") + "</td>" +
            "<td>" + esc(p.dob ? String(p.dob).slice(0, 10) : "—") + "</td>" +
          "</tr>";
        }).join("");

        viewPlayersBody.innerHTML =
          '<table><thead><tr>' +
          "<th>Name</th><th>Position</th><th>Status</th><th>Jersey</th><th>DOB</th>" +
          "</tr></thead><tbody>" + rows + "</tbody></table>";
      })
      .catch(function (err) {
        console.error("[VIEW PLAYERS] Error:", err);
        viewPlayersBody.innerHTML = '<p style="color:#DC2626">Could not load players: ' + errText(err) + '</p>';
      });
  }

  /* ---------- districts (dropdown) ---------- */

  var BANGLADESH_DISTRICTS = [
    "Dhaka","Faridpur","Gazipur","Gopalganj","Kishoreganj","Madaripur",
    "Manikganj","Munshiganj","Narayanganj","Narsingdi","Rajbari","Shariatpur",
    "Tangail","Jamalpur","Mymensingh","Netrakona","Sherpur","Bandarban",
    "Brahmanbaria","Chandpur","Chattogram","Cox's Bazar","Cumilla","Feni",
    "Khagrachari","Lakshmipur","Noakhali","Rangamati","Bogura",
    "Chapainawabganj","Joypurhat","Naogaon","Natore","Pabna","Rajshahi",
    "Sirajganj","Bagerhat","Chuadanga","Jashore","Jhenaidah","Khulna",
    "Kushtia","Magura","Meherpur","Narail","Satkhira","Barguna","Barishal",
    "Bhola","Jhalakathi","Patuakhali","Pirojpur","Habiganj","Moulvibazar",
    "Sunamganj","Sylhet","Dinajpur","Gaibandha","Kurigram","Lalmonirhat",
    "Nilphamari","Panchagarh","Rangpur","Thakurgaon"
  ];

  function loadDistricts() {
    var sel = document.getElementById("club-district");
    if (!sel) return;

    sel.innerHTML = '<option value="">Select District</option>';
    BANGLADESH_DISTRICTS.forEach(function (d) {
      var opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      sel.appendChild(opt);
    });
  }

  /* ---------- Add club form ---------- */

  var form = document.querySelector("#addClubForm");
  var submitBtn = document.querySelector("#addClubForm button[type='submit']");
  console.log("[ADMIN] Add club form found:", !!form, "submit button found:", !!submitBtn);
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleAddClub();
    });
  }
  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleAddClub();
    });
  }

  function handleAddClub() {
    console.log("[ADD CLUB] handleAddClub called");
    var sbc = sb();
    console.log("[ADD CLUB] Supabase client:", sbc ? "connected" : "NULL");
    if (!sbc) { say("Supabase is not connected. Check the browser console.", true); return; }

    var name = (document.getElementById("club-name").value || "").trim();
    var districtId = (document.getElementById("club-district").value || "").trim();
    var email = (document.getElementById("club-email").value || "").trim();
    var phone = (document.getElementById("club-contact").value || "").trim();
    var address = (document.getElementById("club-address").value || "").trim();
    var managerEmail = (document.getElementById("club-manager-email").value || "").trim();
    var managerName = (document.getElementById("club-manager-name").value || "").trim();

    console.log("[ADD CLUB] Form data:", { name, districtId, email, phone, address, managerEmail, managerName });

    if (!name) { say("Please enter the club name.", true); return; }
    if (!districtId) { say("Please select a district.", true); return; }
    if (!email) { say("Please enter the club email.", true); return; }
    if (!phone) { say("Please enter a contact number.", true); return; }
    if (!address) { say("Please enter the club address.", true); return; }
    if (!managerEmail) { say("Please enter the manager email.", true); return; }
    if (!managerName) { say("Please enter the manager name.", true); return; }

    say("Saving club…");

    /* Resolve the selected district name to its integer id */
    console.log("[ADD CLUB] Looking up district:", districtId);
    sbc.from("districts")
      .select("id")
      .eq("name", districtId)
      .maybeSingle()
      .then(function (distRes) {
        console.log("[ADD CLUB] District lookup raw result:", JSON.stringify(distRes));
        if (distRes && distRes.error) {
          console.error("[ADD CLUB] District lookup error:", distRes.error);
          say("Database error looking up district: " + distRes.error.message, true);
          return;
        }
        var districtRow = distRes && distRes.data ? distRes.data : null;
        console.log("[ADD CLUB] District row found:", districtRow);
        if (!districtRow) {
          say("District '" + districtId + "' not found in database.", true);
          return;
        }

          console.log("[ADD CLUB] Inserting club with district_id:", districtRow.id);
        return sbc.from("clubs").insert([{
          name: name,
          district_id: districtRow.id,
          email: email,
          phone: phone,
          address: address,
          status: "Active"
        }]).then(function (res) {
          console.log("[ADD CLUB] Club insert raw result:", JSON.stringify(res));
          if (res && res.error) {
            console.error("[ADD CLUB] Club insert error:", res.error);
            say(res.error.message || "Could not create the club.", true);
            return;
          }

          var clubRow = res && res.data && res.data[0] ? res.data[0] : null;
          if (!clubRow) {
            /* Insert succeeded but data not returned — look the club up */
            console.log("[ADD CLUB] No data in insert result, looking up club by name + district");
            return sbc.from("clubs")
              .select("id")
              .eq("name", name)
              .eq("district_id", districtRow.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
              .then(function (lookupRes) {
                if (lookupRes && lookupRes.error) {
                  console.error("[ADD CLUB] Club lookup error:", lookupRes.error);
                  say("Club created but could not find it to link manager.", true);
                  return;
                }
                clubRow = lookupRes && lookupRes.data ? lookupRes.data : null;
                if (!clubRow) {
                  say("Club created but could not find it to link manager.", true);
                  return;
                }
                console.log("[ADD CLUB] Club found via lookup with id:", clubRow.id);
                return createManagerAndLink(sbc, managerEmail, managerName, phone, clubRow, name, address);
              });
          }

          console.log("[ADD CLUB] Club inserted with id:", clubRow.id);
          return createManagerAndLink(sbc, managerEmail, managerName, phone, clubRow, name, address);
        }).catch(function (err) {
          console.error("[ADD CLUB] Insert catch error:", err);
          say(errText(err), true);
        });
      })
      .catch(function (err) {
        console.error("[ADD CLUB] District lookup catch error:", err);
        say(errText(err), true);
      });
  }

  /* Create manager auth account + profile + users, then link to club */
  function createManagerAndLink(sbc, managerEmail, managerName, phone, clubRow, clubName, address) {
    console.log("[ADD CLUB] Creating manager auth user:", managerEmail);
    return sbc.auth.signUp({
      email: managerEmail,
      password: "123456",
      options: {
        data: {
          full_name: managerName,
          role: "club_admin"
        }
      }
    }).then(function (authRes) {
      console.log("[ADD CLUB] Auth signUp result:", JSON.stringify(authRes));
      if (authRes && authRes.error) {
        console.error("[ADD CLUB] Auth signUp error:", authRes.error);
        say("Club created, but manager account failed: " + authRes.error.message, true);
        return;
      }

      var newUser = authRes && authRes.data && authRes.data.user ? authRes.data.user : null;
      if (!newUser) {
        say("Club created, but no manager user returned.", true);
        return;
      }

      console.log("[ADD CLUB] New manager user id:", newUser.id);

      /* Step 3: Upsert profile for the manager */
      return sbc.from("profiles").upsert([{
        id: newUser.id,
        full_name: managerName,
        phone: phone
      }]).then(function (profRes) {
        console.log("[ADD CLUB] Profile upsert result:", JSON.stringify(profRes));
        if (profRes && profRes.error) {
          console.error("[ADD CLUB] Profile upsert error:", profRes.error);
          say("Club + manager account created. Profile save pending.", true);
          return;
        }

        /* Step 3b: Upsert into users table */
        return sbc.from("users").upsert([{
          id: newUser.id,
          full_name: managerName,
          email: managerEmail,
          phone: phone,
          address: address,
          club_name: clubName,
          role: "club_admin"
        }]).then(function (userRes) {
          if (userRes && userRes.error) {
            console.warn("[ADD CLUB] Users upsert error:", userRes.error.message);
            say("Club + manager + profile created. Users table insert pending.", true);
            return;
          }

          /* Step 4: Link manager to the club */
          return sbc.from("clubs").update({ manager_id: newUser.id }).eq("id", clubRow.id).then(function (updRes) {
            console.log("[ADD CLUB] Club manager link result:", JSON.stringify(updRes));
            if (updRes && updRes.error) {
              console.error("[ADD CLUB] Club manager link error:", updRes.error);
              say("Club + manager account created. Manager link pending.", true);
              return;
            }

            console.log("[ADD CLUB] Manager linked to club successfully");
            say("Club registered! Manager account: " + managerEmail + " / 123456");
            form.reset();
            loadClubs();

            /* Sign out the auto-created manager session and return to Super Admin login */
            setTimeout(function () {
              sbc.auth.signOut().then(function () {
                window.location.href = "login.html";
              });
            }, 2000);
          });
        });
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

    /* Keep the URL hash in sync with the open panel */
    try {
      window.location.hash = name;
    } catch (err) {}
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

    /* Also support Back/Forward buttons via hash changes */
    window.addEventListener("hashchange", function () {
      var hash = window.location.hash.replace(/^#/, "");
      if (hash && PANELS[hash]) {
        showPanel(hash);
      }
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

  /* Open the panel from the URL hash, or Dashboard by default */
  var startHash = window.location.hash.replace(/^#/, "");
  if (startHash && PANELS[startHash]) {
    showPanel(startHash);
  } else {
    showPanel("dashboard");
    try { window.location.hash = "dashboard"; } catch (err) {}
  }

  bindNav();
  bindDrawer();

  loadClubs();
  loadUsers();
  loadDistricts();

})();
