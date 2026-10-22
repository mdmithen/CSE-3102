// ==========================================
// CLUB ADMIN DASHBOARD - login-system.html
// Uses js/auth.js for the role check and
// js/supabase-config.js for the Supabase client.
//
// login-system.html is PUBLIC, so this script must never
// redirect. AUTH.hasRole() only decides whether the Club
// Admin dashboard (#clubAdminPanel) is shown; everything
// below is skipped for anyone who is not a Club Admin.
//
// Reads the SAME tables as before - public.clubs,
// public.players, public.join_requests, public.profiles -
// plus the existing my_club_id / club_approve_request /
// club_reject_request RPCs. No new table, column, RPC or
// schema change is introduced, and no dummy data is used:
// the dashboard cards show "—" for modules that have no
// data source yet instead of inventing numbers.
//
// What a club manager can do
// -------------------------
//  - see which club they manage          -> RPC my_club_id
//  - switch between clubs they manage    -> public.clubs (manager_id)
//  - register a player into that club    -> public.players
//  - see the club roster                 -> public.players
//  - search that roster                  -> frontend filter
//  - see join requests for the club      -> public.join_requests
//  - approve  -> RPC club_approve_request
//                (request approved AND player added to roster)
//  - reject   -> RPC club_reject_request
//
// RLS only lets a manager touch their OWN
// club, so a manager of one club cannot
// edit another club's data.
// ==========================================

(function () {

  if (!window.AUTH) return;

  /* ---------- role gate ----------
     login-system.html is a PUBLIC page, so the old
     AUTH.requireRole guard was wrong here: it sent every
     visitor - including people who never logged in - to
     login.html, which locked the public Clubs / Players /
     Tournaments / Rankings / News sections.

     AUTH.hasRole() asks the same question without ever
     redirecting. When the answer is "no", the Club Manager
     tools stay hidden and NOTHING below runs, so the
     protected operations are exactly as protected as they
     were before.

     Data protection is not weakened by this: Row Level
     Security in Supabase still decides what a manager can
     read and write, and my_club_id() still pins every query
     to the manager's own club. */

  var isClubAdmin = AUTH.hasRole(AUTH.ROLES.CLUB_ADMIN);
  var panelEl = document.getElementById("clubAdminPanel");
  var gateEl = document.getElementById("clubAdminGate");

  if (panelEl) panelEl.hidden = !isClubAdmin;
  if (gateEl) gateEl.hidden = isClubAdmin;

  /* Presentation only: while a Club Admin is signed in the page
     switches into "app mode", which is the single class that lets
     css/club-admin.css use the full page width and hide the
     public chrome. It is added and removed by this file only, and
     it is never left behind for a signed-out visitor. */
  if (document.body) {
    if (isClubAdmin) document.body.classList.add("cad-mode");
    else document.body.classList.remove("cad-mode");
  }

  if (!isClubAdmin) return;

  var user = AUTH.currentUser();
  var msgEl = document.getElementById("clubMsg");
  var statusEl = document.getElementById("cadStatus");
  var rosterBody = document.getElementById("roster-body");
  var requestsBody = document.getElementById("join-requests-body");

  function sb() {
    return window.SB || null;
  }

  /* Every message is written to the shared status line under the
     top bar as well as into #clubMsg, so feedback raised while the
     manager is on any tab stays visible. Same text, two places. */
  function say(text, isError) {
    var line = text || "";

    if (msgEl) {
      msgEl.textContent = line;
      msgEl.style.color = isError ? "#DC2626" : "";
    }
    if (statusEl) {
      statusEl.textContent = line;
      statusEl.classList.toggle("is-error", !!isError);
    }
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function errText(err) {
    return (err && err.message) ? err.message : "Unknown error";
  }

  /* Last roster page + current search text, for the top-bar filter */
  var lastRoster = [];
  var rosterQuery = "";

  var myClubId = null;
  var activeClubId = null;
  var managedClubs = [];
  var myUserId = null;

  /* Counts lifted from the live tables so the statistic cards
     can never disagree with the roster / requests below them. */
  var counts = { players: null, activePlayers: null, pending: null };

  /* ---------- load my club ---------- */

  function loadMyClub() {
    if (!sb()) return Promise.resolve(null);

    return sb().rpc("my_club_id").then(function (res) {
      myClubId = (res && res.data != null) ? Number(res.data) : null;

      if (!myClubId) {
        say("No club is assigned to you yet. Ask the super admin to make you a club manager.", true);
        if (rosterBody) rosterBody.innerHTML = '<tr><td colspan="4">No club assigned.</td></tr>';
        if (requestsBody) requestsBody.innerHTML = '<tr><td colspan="6">No club assigned.</td></tr>';
        renderStats();
        renderSummary();
        return null;
      }

      activeClubId = myClubId;
      say("Managing club DSC-" + ("00" + myClubId).slice(-3));
      return myClubId;
    }).catch(function (err) {
      say(errText(err), true);
      renderStats();
      renderSummary();
      return null;
    });
  }

  /* ---------- clubs this manager is responsible for ----------

     Reads the SAME public.clubs table and the SAME manager_id
     column that js/admin.js already uses. No new table, RPC,
     schema change or dummy data is introduced. RLS still
     decides what comes back. */

  function myUid() {
    if (myUserId) return Promise.resolve(myUserId);
    if (!sb()) return Promise.resolve(null);
    return sb().auth.getSession().then(function (res) {
      var s = res && res.data ? res.data.session : null;
      myUserId = s && s.user ? s.user.id : null;
      return myUserId;
    }).catch(function () { return null; });
  }

  function loadManagedClubs() {
    if (!sb()) return Promise.resolve([]);

    return myUid().then(function (uid) {
      if (!uid) return [];
      return sb().from("clubs")
        .select("*")
        .eq("manager_id", uid)
        .order("name")
        .then(function (res) {
          return (res && res.data) || [];
        })
        .catch(function () { return []; });
    }).then(function (rows) {
      managedClubs = rows || [];
      renderClubPicker();
      renderBanner();

      // Fall back to the single club from my_club_id() if the
      // manager_id lookup returned nothing.
      if (!managedClubs.length && activeClubId && sb()) {
        return Promise.resolve()
          .then(function () {
            var q = sb().from("clubs").select("*").eq("id", activeClubId);
            return q && typeof q.maybeSingle === "function" ? q.maybeSingle() : null;
          })
          .then(function (res) {
            if (res && res.data) { managedClubs = [res.data]; renderClubPicker(); renderBanner(); }
            return managedClubs;
          })
          .catch(function () { return managedClubs; });
      }
      return managedClubs;
    });
  }

  function currentClub() {
    if (!managedClubs.length) return null;
    var found = null;
    managedClubs.forEach(function (c) { if (Number(c.id) === Number(activeClubId)) found = c; });
    return found || managedClubs[0];
  }

  /* ---------- banner, picker, profile ---------- */

  function firstVal(row, keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
      var v = row ? row[keys[i]] : null;
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return fallback;
  }

  function renderClubPicker() {
    var sel = document.getElementById("cadClubSelect");
    if (!sel) return;

    if (!managedClubs.length) {
      sel.innerHTML = '<option value="">No club assigned</option>';
      return;
    }

    sel.innerHTML = managedClubs.map(function (c) {
      return '<option value="' + esc(c.id) + '"' +
        (Number(c.id) === Number(activeClubId) ? " selected" : "") + ">" +
        esc(firstVal(c, ["name"], "Club #" + c.id)) + "</option>";
    }).join("");
  }

  function renderBanner() {
    var c = currentClub();
    var nameEl = document.getElementById("cadClubName");
    var descEl = document.getElementById("cadClubDesc");

    if (!c) {
      if (nameEl) nameEl.textContent = "No club assigned";
      if (descEl) descEl.textContent = "Ask the Super Admin to assign you as a club manager.";
      return;
    }

    var name = firstVal(c, ["name"], "Club #" + c.id);

    if (nameEl) nameEl.textContent = name;
    if (descEl) {
      var district = firstVal(c, ["district"], null);
      var desc = firstVal(c, ["description", "desc", "about"], null);
      if (!desc) {
        desc = district
          ? "Registered sports club in " + district + " district."
          : "Registered sports club.";
      }
      descEl.textContent = desc;
    }
  }

  function renderClubProfile() {
    var c = currentClub();
    var head = document.getElementById("cadCardName");
    var badges = document.getElementById("cadCardBadges");
    var sub = document.getElementById("cadCardSub");
    var crest = document.getElementById("cadCrest");
    var facts = document.getElementById("cadProfileFacts");

    if (!head) return;

    if (!c) {
      head.textContent = "No club assigned";
      if (badges) badges.innerHTML = "";
      if (sub) sub.textContent = "Ask the Super Admin to assign you as a club manager.";
      if (crest) crest.textContent = "—";
      if (facts) facts.innerHTML = "";
      return;
    }

    var name = firstVal(c, ["name"], "Club #" + c.id);
    head.textContent = name;

    // Crest initials, like the reference card
    if (crest) {
      crest.textContent = String(name).split(/\s+/).filter(Boolean).slice(0, 2)
        .map(function (p) { return p.charAt(0).toUpperCase(); }).join("") || "—";
    }

    // Pill badges: one per sport, then the status
    if (badges) {
      var raw = firstVal(c, ["sports", "sport", "main_sport"], null);
      var sports = [];
      if (raw) {
        sports = (Array.isArray(raw) ? raw : String(raw).split(","))
          .map(function (s) { return String(s).trim(); })
          .filter(Boolean).slice(0, 3);
      }
      var status = firstVal(c, ["status"], null);

      var pills = sports.map(function (s) {
        return '<span class="cad-pill">' + esc(s) + "</span>";
      });
      if (status) pills.push('<span class="cad-pill cad-pill-status">' + esc(status) + "</span>");

      badges.innerHTML = pills.join("");
    }

    // Manager + registration line
    if (sub) {
      var manager = firstVal(c, ["manager_name", "manager"], null);
      var made = firstVal(c, ["created_at"], null);
      var bits = [];
      if (manager) bits.push("Manager " + manager);
      if (made) bits.push("Registered " + String(made).slice(0, 10));
      sub.textContent = bits.length ? bits.join(" • ") : "Club record from the database";
    }

    if (!facts) return;

    var rows = [
      ["Club ID", "DSC-" + ("00" + c.id).slice(-3)],
      ["District", firstVal(c, ["district"], null)],
      ["Contact", firstVal(c, ["phone", "contact"], null)],
      ["Email", firstVal(c, ["email"], null)],
      ["Address", firstVal(c, ["address"], null)],
      ["Status", firstVal(c, ["status"], null)]
    ];

    facts.innerHTML = rows.map(function (r) {
      var has = r[1] !== null && r[1] !== undefined && r[1] !== "";
      return '<div class="cad-fact"><dt>' + esc(r[0]) + "</dt>" +
        "<dd" + (has ? "" : ' class="is-empty"') + ">" +
        esc(has ? r[1] : "Not recorded") + "</dd></div>";
    }).join("");
  }

  /* Summary card on the right: figure + caption rows.
     No icons - the value and its caption carry the meaning. */
  function renderSummary() {
    var host = document.getElementById("cadSummaryFacts");
    if (!host) return;

    var c = currentClub();
    var pct = function (n, d) { return d ? Math.round((n / d) * 100) + "%" : "0%"; };
    var players = counts.players, active = counts.activePlayers;
    var verified = (players && active) ? pct(active, players) : "0%";

    var rows = [
      { value: players === null ? "—" : players, label: "Total players" },
      { value: active === null ? "—" : active, label: "Active players" },
      { value: counts.pending === null ? "—" : counts.pending, label: "Pending requests" },
      { value: verified, label: "Content verified" },
      { value: firstVal(c, ["district"], null), label: "District" },
      { value: firstVal(c, ["founded", "established"], null), label: "Founded" }
    ];

    host.innerHTML = rows.map(function (r) {
      var has = r.value !== null && r.value !== undefined && r.value !== "" && r.value !== "—";
      return '<div class="cad-statrow">' +
        '<b class="' + (has ? "" : "is-empty") + '">' + esc(has ? r.value : "—") + "</b>" +
        '<small>' + esc(r.label) + "</small>" +
      "</div>";
    }).join("");
  }

  /* ---------- six statistic cards ----------

     Only Total Players and Pending Requests are live, because
     those are the two tables this page can actually read.
     The other four show an honest placeholder instead of a
     made-up number. Cards are text only: label, figure, caption. */
  function renderStats() {
    var host = document.getElementById("cadStats");
    if (!host) return;

    var cards = [
      { label: "Total Players",    value: counts.players, live: true,  foot: "Club roster" },
      { label: "Active Teams",     value: null, live: false, foot: "Teams pending" },
      { label: "Upcoming Matches", value: null, live: false, foot: "Matches pending" },
      { label: "Pending Requests", value: counts.pending, live: true,  foot: "Awaiting approval" },
      { label: "Equipment Items",  value: null, live: false, foot: "Equipment pending" },
      { label: "Available Venues", value: null, live: false, foot: "Venues pending" }
    ];

    host.innerHTML = cards.map(function (c) {
      var hasValue = c.value !== null && c.value !== undefined && !isNaN(c.value);
      return '<div class="cad-stat' + (c.live && hasValue ? " is-live" : "") + '">' +
        '<span class="cad-stat-label">' + esc(c.label) + "</span>" +
        "<b>" + esc(hasValue ? c.value : "—") + "</b>" +
        '<span class="cad-stat-foot">' + esc(hasValue ? c.foot : "Not connected yet") + "</span>" +
      "</div>";
    }).join("");

    var bell = document.getElementById("cadNotifCount");
    if (bell) {
      var n = counts.pending || 0;
      bell.textContent = n;
      bell.hidden = n === 0;
    }
  }

  /* ---------- roster ---------- */

  function loadRoster() {
    if (!rosterBody || !sb() || !activeClubId) return;

    lastRoster = [];

    sb().from("players")
      .select("id, full_name, position, status")
      .eq("club_id", activeClubId)
      .order("id")
      .then(function (res) {
        var rows = (res && res.data) || [];
        lastRoster = rows;

        counts.players = rows.length;
        counts.activePlayers = rows.filter(function (p) {
          return String(p.status || "Active").toLowerCase() === "active";
        }).length;
        renderStats();
        renderSummary();

        var chip = document.getElementById("cadRosterCount");
        if (chip) chip.textContent = rows.length + (rows.length === 1 ? " player" : " players");

        paintRoster(rows);
      })
      .catch(function (err) {
        rosterBody.innerHTML = '<tr><td colspan="4">Could not load the roster.</td></tr>';
        say(errText(err), true);
      });
  }

  /* Roster rows, optionally filtered by the top-bar search box.
     Sport / District / Contact were removed from the table: the
     query only ever fetched id, full_name, position and status, so
     those three columns could only ever print "—". */
  function paintRoster(rows) {
    if (!rosterBody) return;

    var q = rosterQuery.toLowerCase().trim();
    var list = !q ? rows : rows.filter(function (p) {
      return [p.full_name, p.position, p.status, p.id].join(" ").toLowerCase().indexOf(q) !== -1;
    });

    if (!rows.length) {
      rosterBody.innerHTML = '<tr><td colspan="4">No players in this club yet.</td></tr>';
      return;
    }
    if (!list.length) {
      rosterBody.innerHTML = '<tr><td colspan="4">No players match "' +
        esc(rosterQuery) + '".</td></tr>';
      return;
    }

    rosterBody.innerHTML = "";
    list.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>PLY-" + ("00" + p.id).slice(-3) + "</td>" +
        "<td>" + esc(p.full_name) + "</td>" +
        "<td>" + esc(p.position || "—") + "</td>" +
        "<td>" + esc(p.status || "Active") + "</td>";
      rosterBody.appendChild(tr);
    });
  }

  /* ---------- join requests ---------- */

  function loadRequests() {
    if (!requestsBody || !sb() || !activeClubId) return;

    sb().from("join_requests")
      .select("id, player_id, note, created_at, status")
      .eq("club_id", activeClubId)
      .order("created_at", { ascending: false })
      .then(function (res) {
        var rows = (res && res.data) || [];

        counts.pending = rows.filter(function (r) {
          return String(r.status || "").toLowerCase() === "pending";
        }).length;
        renderStats();
        renderSummary();

        var chip = document.getElementById("cadRequestCount");
        if (chip) chip.textContent = counts.pending + " pending";

        if (!rows.length) {
          requestsBody.innerHTML = '<tr><td colspan="6">No join requests for this club.</td></tr>';
          return;
        }

        // Emails are not in join_requests, so ask profiles for the names
        var ids = rows.map(function (r) { return r.player_id; });
        return sb().from("profiles")
          .select("id, full_name")
          .in("id", ids)
          .then(function (profRes) {
            var names = {};
            ((profRes && profRes.data) || []).forEach(function (p) {
              names[p.id] = p.full_name;
            });
            renderRequests(rows, names);
          });
      })
      .catch(function (err) {
        requestsBody.innerHTML = '<tr><td colspan="6">Could not load requests.</td></tr>';
        say(errText(err), true);
      });
  }

  function renderRequests(rows, names) {
    requestsBody.innerHTML = "";

    rows.forEach(function (r) {
      var when = r.created_at ? String(r.created_at).slice(0, 10) : "—";
      var tr = document.createElement("tr");
      var actions = "";

      if (r.status === "pending") {
        actions =
          '<a href="#" data-approve="' + esc(r.id) + '">Approve</a> ' +
          '<a href="#" data-reject="' + esc(r.id) + '">Reject</a>';
      }

      // player_id is the auth user id, so show a short readable ref
      var ref = r.player_id ? String(r.player_id).slice(0, 8) + "…" : "—";

      tr.innerHTML =
        "<td>" + esc(ref) + "</td>" +
        "<td>" + esc(names[r.player_id] || "Player") + "</td>" +
        "<td>" + esc(r.note || "—") + "</td>" +
        "<td>" + esc(when) + "</td>" +
        "<td>" + esc(r.status) + "</td>" +
        "<td>" + actions + "</td>";
      requestsBody.appendChild(tr);
    });

    Array.prototype.forEach.call(requestsBody.querySelectorAll("a[data-approve]"), function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        decide(link.getAttribute("data-approve"), true);
      });
    });

    Array.prototype.forEach.call(requestsBody.querySelectorAll("a[data-reject]"), function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        decide(link.getAttribute("data-reject"), false);
      });
    });
  }

  function decide(requestId, approve) {
    var fn = approve ? "club_approve_request" : "club_reject_request";

    sb().rpc(fn, { p_request_id: requestId }).then(function (res) {
      var data = (res && res.data) || {};
      if (data.ok) {
        say(approve ? "Player added to the roster." : "Request rejected.");
        loadRequests();
        loadRoster();
      } else {
        say(data.error || "Could not update the request.", true);
      }
    }).catch(function (err) {
      say(errText(err), true);
    });
  }

  /* ---------- register a player ---------- */

  var form = document.getElementById("playerForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!sb()) { say("Supabase is not connected.", true); return; }
      if (!activeClubId) { say("You are not assigned to a club yet.", true); return; }

      var name = (document.getElementById("player-name").value || "").trim();
      var email = (document.getElementById("player-email").value || "").trim();
      var password = (document.getElementById("player-password").value || "").trim();
      var position = (document.getElementById("player-position").value || "").trim();
      var dob = (document.getElementById("player-dob").value || "").trim();
      var gender = (document.getElementById("player-gender").value || "").trim();
      var district = (document.getElementById("player-district").value || "").trim();
      var sport = (document.getElementById("player-sport").value || "").trim();
      var contact = (document.getElementById("player-contact").value || "").trim();

      if (!name) { say("Please enter the player name.", true); return; }
      if (!email) { say("Please enter the player email.", true); return; }
      if (!password) { say("Please set a password for the player.", true); return; }
      if (password.length < 6) { say("Password must be at least 6 characters.", true); return; }

      say("Creating player account…");

      var sbc = sb();

      /* Step 1: Create Supabase Auth account */
      sbc.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
            role: "player"
          }
        }
      }).then(function (authRes) {
        var newUser = authRes && authRes.data && authRes.data.user ? authRes.data.user : null;
        if (authRes && authRes.error) {
          say(authRes.error.message || "Signup failed.", true);
          return;
        }
        if (!newUser) {
          say("Account created. Confirm email then log in.", true);
          form.reset();
          loadRoster();
          return;
        }

        console.log("[REGISTER PLAYER] New auth user id:", newUser.id);

        /* Step 2: Insert profile linked to auth user */
        return sbc.from("profiles").insert([{
          id: newUser.id,
          full_name: name,
          phone: contact
        }]).then(function (profRes) {
          if (profRes && profRes.error) {
            console.warn("[REGISTER PLAYER] profiles insert:", profRes.error.message);
          }

          /* Step 3: Insert player roster row linked to profile_id */
          return sbc.from("players").insert([{
            profile_id: newUser.id,
            club_id: activeClubId,
            full_name: name,
            position: position || "Player",
            status: "Active",
            dob: dob || null,
            gender: gender || null
          }]).then(function (plyRes) {
            if (plyRes && plyRes.error) {
              say(plyRes.error.message || "Player registered but roster save failed.", true);
              return;
            }
            say("Player registered! Account: " + email + " / " + password);
            form.reset();
            loadRoster();
          });
        });
      }).catch(function (err) {
        say(errText(err), true);
      });
    });
  }

  /* ---------- mobile sidebar drawer ---------- */

  function openDrawer() {
    var sb2 = document.getElementById("cadSidebar");
    var ov = document.getElementById("cadOverlay");
    var burger = document.getElementById("cadBurger");
    if (!sb2) return;
    sb2.classList.add("is-open");
    if (ov) ov.hidden = false;
    if (burger) burger.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    var sb2 = document.getElementById("cadSidebar");
    var ov = document.getElementById("cadOverlay");
    var burger = document.getElementById("cadBurger");
    if (!sb2) return;
    sb2.classList.remove("is-open");
    if (ov) ov.hidden = true;
    if (burger) burger.setAttribute("aria-expanded", "false");
  }

  function bindCadDrawer() {
    var burger = document.getElementById("cadBurger");
    if (burger) {
      burger.addEventListener("click", function () {
        var sb2 = document.getElementById("cadSidebar");
        if (sb2 && sb2.classList.contains("is-open")) closeDrawer();
        else openDrawer();
      });
    }

    var overlay = document.getElementById("cadOverlay");
    if (overlay) overlay.addEventListener("click", closeDrawer);

    // Choosing an item inside the drawer should close it again
    var sideNav = document.querySelector(".cad-side-nav");
    if (sideNav) sideNav.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    // Back to the desktop layout when the window grows
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) closeDrawer();
    });
  }

  /* ---------- views, routing, club switcher, search ---------- */

  /* Every page the sidebar and the URL can address.
     The key matches data-panel, data-tab and data-cad-side. */
  var VIEWS = {
    club: "club", players: "players", teams: "teams", matches: "matches",
    venues: "venues", equipment: "equipment", cards: "cards",
    reports: "reports", requests: "requests", notices: "notices"
  };

  /* js/auth.js sends a Club Manager to login-system.html#clubs, so
     that legacy hash has to open the Dashboard rather than nothing. */
  var URL_ALIASES = { clubs: "club" };

  function viewFromUrl() {
    var raw = String(window.location.hash || "").replace(/^#/, "");
    if (URL_ALIASES[raw]) raw = URL_ALIASES[raw];
    return VIEWS[raw] ? raw : null;
  }

  /* Open a view. push=true records it in history so the browser Back
     and Forward buttons walk through the views the manager visited,
     without ever reloading the page. */
  function setView(name, push) {
    if (!VIEWS[name]) return;
    showPanel(name);
    if (!push) return;

    try {
      window.history.pushState({ cadView: name }, "", "#" + name);
    } catch (err) {
      /* some browsers refuse pushState on a file:// page */
      window.location.hash = name;
    }
  }

  /* ---------- single-page section switching ---------- */

  /* Single-page behaviour: exactly ONE panel is rendered at a time.

     An inactive panel gets display:none from
     css/club-admin.css AND the hidden attribute is set here, so it
     is genuinely removed from the page rather than merely pushed
     off-screen - a screen reader, a find-in-page and a keyboard tab
     order all see only the page that is open.

     The newly opened page also starts at the top of its own scroll
     position, so switching pages never lands the manager halfway
     down something they have not seen yet. */
  function showPanel(name) {
    var panels = document.querySelectorAll("#clubAdminPanel [data-panel]");
    var opened = null;

    Array.prototype.forEach.call(panels, function (p) {
      var on = p.getAttribute("data-panel") === name;
      p.classList.toggle("is-active", on);

      if (on) {
        p.removeAttribute("hidden");
        opened = p;
      } else {
        p.setAttribute("hidden", "");
        p.scrollTop = 0;
      }
    });

    /* Reopening a page always starts from its first line */
    if (opened) opened.scrollTop = 0;

    /* The sidebar is the only navigation, so this highlight is the one
       and only indicator of which page is open. */
    var sideLinks = document.querySelectorAll("#clubAdminPanel .cad-side-nav a[data-cad-side]");
    Array.prototype.forEach.call(sideLinks, function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-cad-side") === name);
    });
  }

  function bindCadNav() {
    var sideNav = document.querySelector(".cad-side-nav");
    if (!sideNav) return;

    sideNav.addEventListener("click", function (e) {
      var link = e.target.closest("a[data-cad-tab]");
      if (!link) return;

      e.preventDefault();
      setView(link.getAttribute("data-cad-tab"), true);
    });

    /* Keyboard support for the sidebar, which is now the only way to
       change page. Up / Down move one item and wrap, Home / End jump
       to the first and last. The links are plain <a> elements, so the
       usual Tab key still walks them as well. */
    sideNav.addEventListener("keydown", function (e) {
      var list = Array.prototype.slice.call(sideNav.querySelectorAll("a[data-cad-tab]"));
      if (!list.length) return;

      var current = list.indexOf(e.target.closest("a[data-cad-tab]"));
      if (current < 0) return;

      var next;
      if (e.key === "ArrowDown") next = (current + 1) % list.length;
      else if (e.key === "ArrowUp") next = (current - 1 + list.length) % list.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = list.length - 1;
      else return;

      e.preventDefault();
      list[next].focus();
    });
  }

  /* Browser Back / Forward. A hash that did not come from setView()
     carries no cadView state, so it is ignored rather than guessed at. */
  function bindCadHistory() {
    window.addEventListener("popstate", function (e) {
      var name = (e.state && e.state.cadView) || viewFromUrl();
      if (name) showPanel(name);
    });
  }

  /* ---------- Notice Board ----------

   Read-only, and deliberately empty.

   There is no notice or announcement source wired to this
   dashboard. The Club Manager scripts only read public.clubs,
   public.players, public.join_requests and public.profiles, and
   the `news` table named in docs/supabase-setup.md is not queried
   by any script in this project and has no schema here either.

   Adding a query for it would be new Supabase logic, which is out
   of scope for this change, so nothing is invented to fill the
   space - the page shows its empty state instead.

   When a real data source exists, put its rows in NOTICES
   ({ title, message, date, status }) and this page renders them.
   Nothing else has to change, and no Publish / Edit / Delete
   controls exist because there is nothing to manage yet. */

  var NOTICES = [];

  function renderNotices() {
    var host = document.getElementById("noticeList");
    if (!host) return;

    if (!NOTICES.length) {
      host.innerHTML =
        '<div class="cad-empty">' +
          "<h3>No notices available yet.</h3>" +
          "<p>This club has not posted any announcements. Notices will " +
          "appear here once a notice data source is connected to the " +
          "Club Manager dashboard.</p>" +
        "</div>";
      return;
    }

    host.innerHTML = NOTICES.map(function (n) {
      return '<article class="notice-item">' +
        '<div class="notice-head">' +
          "<h3>" + esc(n.title) + "</h3>" +
          (n.status ? '<span class="notice-status">' + esc(n.status) + "</span>" : "") +
        "</div>" +
        '<p class="notice-body">' + esc(n.message) + "</p>" +
        (n.date ? '<p class="notice-date">' + esc(n.date) + "</p>" : "") +
      "</article>";
    }).join("");
  }

  /* The Notifications button opens the Join Requests page, which is
     now a page of its own rather than a card inside Players. */
  function bindCadBell() {
    var bell = document.getElementById("cadBell");
    if (!bell) return;

    bell.addEventListener("click", function (e) {
      e.preventDefault();
      setView("requests", true);
    });
  }

  /* Switching clubs reloads the roster and requests for that club */
  function bindClubSwitcher() {
    var sel = document.getElementById("cadClubSelect");
    if (!sel) return;

    sel.addEventListener("change", function () {
      activeClubId = Number(sel.value) || null;
      myClubId = activeClubId;
      rosterQuery = "";
      var search = document.getElementById("cadSearch");
      if (search) search.value = "";

      renderBanner();
      renderClubProfile();
      renderSummary();

      if (!activeClubId) return;
      loadRoster();
      loadRequests();
    });
  }

  /* Top-bar search filters the live roster. Ctrl / Cmd + K also
     focuses the box, so the shortcut still works even though the
     decorative keyboard chip was removed from the interface. */
  function bindCadSearch() {
    var input = document.getElementById("cadSearch");
    if (!input) return;

    input.addEventListener("input", function () {
      rosterQuery = input.value || "";
      paintRoster(lastRoster);
    });

    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* Mirror the signed-in manager into the sidebar */
  function renderIdentity() {
    if (!user) return;

    var initials = String(user.name || "CA").split(/\s+/).filter(Boolean)
      .slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join("");

    var avatar = document.getElementById("cadAvatar");
    if (avatar) avatar.textContent = initials || "CA";

    var sideWho = document.getElementById("cadSideWho");
    if (sideWho) sideWho.textContent = user.name || "Club Admin";
  }

  /* The sidebar also has its own Logout link */
  function bindSideLogout() {
    var link = document.getElementById("cadSideLogout");
    if (!link) return;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      if (!window.confirm("Log out of the Club Admin dashboard?")) return;
      AUTH.logout();
    });
  }

  /* ---------- start ---------- */

  renderIdentity();
  renderStats();
  renderNotices();

  /* Open whichever view the URL asks for. Deep links and the browser
     Back / Forward buttons therefore land on the right page, and the
     Dashboard is the default when there is nothing to open. */
  var startView = viewFromUrl() || "club";
  showPanel(startView);

  try {
    window.history.replaceState({ cadView: startView }, "", "#" + startView);
  } catch (err) { /* file:// - the hash is already correct */ }

  bindCadNav();
  bindCadBell();
  bindCadHistory();
  bindClubSwitcher();
  bindCadSearch();
  bindSideLogout();
  bindCadDrawer();

  loadMyClub().then(function (clubId) {
    if (!clubId) {
      renderClubProfile();
      renderBanner();
      return;
    }
    return loadManagedClubs().then(function () {
      renderClubProfile();
      renderSummary();
      loadRoster();
      loadRequests();
    });
  }).catch(function (err) {
    // Never leave a rejected promise unhandled: report it in the
    // status line and let the already-rendered cards show the placeholders.
    say("Could not load the club dashboard: " + errText(err), true);
  });

})();
