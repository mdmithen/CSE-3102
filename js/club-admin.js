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
// What a club manager can d
// -------------------------
//  - see which club they manage          -> RPC my_club_id
//  - switch between clubs they manage    -> public.clubs (manager_id)
//  - register a player into that club    -> public.players
//  - see the club roster                 -> public.players
//  - search that roster                  -> frontend filter
//  - edit a roster player's details      -> UPDATE public.players
//  - delete a player from the roster     -> DELETE public.players
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
        if (rosterBody) rosterBody.innerHTML = '<tr><td colspan="5">No club assigned.</td></tr>';
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
      { label: "Upcoming Matches", value: null, live: false, foot: "Matches pending" },
      { label: "Pending Requests", value: counts.pending, live: true,  foot: "Awaiting approval" },
      { label: "Equipment Items",  value: null, live: false, foot: "Equipment pending" }
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

    // dob + gender ride along so the Edit button can prefill the form
    sb().from("players")
      .select("id, full_name, position, status, dob, gender")
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

        /* Match notices list the roster's players in their squad
           picker. Notices may have rendered before the roster
           arrived, so re-render them once the players are known. */
        if (typeof renderNotices === "function" && lastNotices) {
          renderNotices(lastNotices);
        }
      })
      .catch(function (err) {
        rosterBody.innerHTML = '<tr><td colspan="5">Could not load the roster.</td></tr>';
        say(errText(err), true);
      });
  }

  /* Roster rows, optionally filtered by the top-bar search box.
     Sport / District / Contact were removed from the table: the
     query only ever fetched id, full_name, position and status, so
     those three columns could only ever print "—".

     The Action column carries the Edit and Delete buttons, which
     work on the public.players row in Supabase: Edit prefills the
     Register card above (its submit then UPDATEs the row), Delete
     removes the row after a confirmation. RLS still only lets a
     manager touch players of their OWN club. */
  function paintRoster(rows) {
    if (!rosterBody) return;

    var q = rosterQuery.toLowerCase().trim();
    var list = !q ? rows : rows.filter(function (p) {
      return [p.full_name, p.position, p.status, p.id].join(" ").toLowerCase().indexOf(q) !== -1;
    });

    if (!rows.length) {
      rosterBody.innerHTML = '<tr><td colspan="5">No players in this club yet.</td></tr>';
      return;
    }
    if (!list.length) {
      rosterBody.innerHTML = '<tr><td colspan="5">No players match "' +
        esc(rosterQuery) + '".</td></tr>';
      return;
    }

    rosterBody.innerHTML = "";
    list.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>PLY-" + ("00" + p.id).slice(-3) + "</td>" +
        "<td>" + esc(p.full_name || p.name || ("Player #" + p.id)) + "</td>" +
        "<td>" + esc(p.position || "—") + "</td>" +
        "<td>" + esc(p.status || "Active") + "</td>" +
        '<td><div style="display:flex; gap:6px;">' +
          '<button type="button" class="sa-btn" style="padding:4px 8px; font-size:12px;" data-edit-player="' + esc(p.id) + '">Edit</button>' +
          '<button type="button" class="sa-btn" style="padding:4px 8px; font-size:12px; color:#DC2626;" data-del-player="' + esc(p.id) + '">Delete</button>' +
        '</div></td>';
      rosterBody.appendChild(tr);
    });

    Array.prototype.forEach.call(rosterBody.querySelectorAll("button[data-edit-player]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        editPlayer(btn.getAttribute("data-edit-player"));
      });
    });

    Array.prototype.forEach.call(rosterBody.querySelectorAll("button[data-del-player]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        deletePlayer(btn.getAttribute("data-del-player"));
      });
    });
  }

  /* ---------- edit / delete a roster player ---------- */

  /* The Register card doubles as the Edit card. Switching modes is
     presentational only: the email and password fields are hidden
     (and un-required, so the browser does not block submission on
     an invisible field) because editing roster details never
     touches the player's auth account. */
  function setPlayerFormMode(editing) {
    var heading = document.getElementById("playerFormHeading");
    var submitBtn = document.getElementById("playerSubmitBtn");
    var cancelBtn = document.getElementById("playerCancelBtn");
    var authFields = document.querySelectorAll("#playerForm .player-auth-field");

    if (heading) heading.textContent = editing ? "Edit Player" : "Register New Player";
    if (submitBtn) submitBtn.textContent = editing ? "Save Changes" : "Register Player";
    if (cancelBtn) cancelBtn.hidden = !editing;

    Array.prototype.forEach.call(authFields, function (wrap) {
      wrap.hidden = editing;
      var input = wrap.querySelector("input");
      if (!input) return;
      if (editing) input.removeAttribute("required");
      else input.setAttribute("required", "");
    });
  }

  function findRosterPlayer(id) {
    var found = null;
    (lastRoster || []).forEach(function (p) {
      if (String(p.id) === String(id)) found = p;
    });
    return found;
  }

  function editPlayer(id) {
    var found = findRosterPlayer(id);
    if (!found) return;

    var editIdEl = document.getElementById("player-edit-id");
    if (editIdEl) editIdEl.value = found.id;

    var nameEl = document.getElementById("player-name");
    var posEl = document.getElementById("player-position");
    var dobEl = document.getElementById("player-dob");
    var genderEl = document.getElementById("player-gender");

    if (nameEl) nameEl.value = found.full_name || "";
    if (posEl) posEl.value = found.position || "";
    if (dobEl) dobEl.value = found.dob ? String(found.dob).slice(0, 10) : "";
    if (genderEl) genderEl.value = found.gender || "";

    setPlayerFormMode(true);

    say("Editing " + (found.full_name || "player") +
        ". Change the fields above and click Save Changes.");
    var card = document.getElementById("register-player");
    if (card) card.scrollIntoView({ behavior: "smooth" });
  }

  function deletePlayer(id) {
    var found = findRosterPlayer(id);
    var who = (found && found.full_name) ? found.full_name : "this player";

    if (!confirm("Delete " + who + " from the club roster? This cannot be undone.")) return;

    var sbc = sb();
    if (!sbc) { say("Supabase is not connected.", true); return; }

    sbc.from("players").delete().eq("id", id).then(function (res) {
      if (res && res.error) throw res.error;
      say(who + " was deleted from the roster.");
      loadRoster();
    }).catch(function (err) {
      console.error("[ROSTER] Delete error:", err);
      say("Could not delete " + who + ": " + errText(err), true);
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

  /* ---------- register a player / edit a roster player ---------- */

  var form = document.getElementById("playerForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!sb()) { say("Supabase is not connected.", true); return; }
      if (!activeClubId) { say("You are not assigned to a club yet.", true); return; }

      var editId = ((document.getElementById("player-edit-id") || {}).value || "").trim();
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

      var sbc = sb();

      /* ---------- EDIT MODE: update the existing roster row ----------
         Only roster details are written. The player's login email and
         password live in Supabase auth and are never changed here. */
      if (editId) {
        say("Saving changes…");

        sbc.from("players").update({
          full_name: name,
          position: position || "Player",
          dob: dob || null,
          gender: gender || null
        }).eq("id", editId).then(function (res) {
          if (res && res.error) throw res.error;

          /* Best effort: keep the display name on the profile in sync,
             because the player dashboard reads profiles first. It is
             allowed to fail - profiles RLS may block another user's
             row, and the roster edit above has already succeeded. */
          var existing = findRosterPlayer(editId);
          var profileId = existing ? existing.profile_id : null;
          if (profileId) {
            sbc.from("profiles").update({ full_name: name })
              .eq("id", profileId)
              .then(function () {})
              .catch(function () {});
          }

          say("Player information updated.");
          form.reset();
          document.getElementById("player-edit-id").value = "";
          setPlayerFormMode(false);
          loadRoster();
        }).catch(function (err) {
          console.error("[ROSTER] Update error:", err);
          say("Could not update player: " + errText(err), true);
        });
        return;
      }

      /* ---------- REGISTER MODE: create the account + roster row ---------- */

      if (!email) { say("Please enter the player email.", true); return; }
      if (!password) { say("Please set a password for the player.", true); return; }
      if (password.length < 6) { say("Password must be at least 6 characters.", true); return; }

      say("Creating player account…");

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

    /* Cancel Edit / Clear both leave edit mode and empty the form,
       so the card always falls back to "Register New Player". */
    function resetPlayerForm() {
      var editIdEl = document.getElementById("player-edit-id");
      if (editIdEl) editIdEl.value = "";
      setPlayerFormMode(false);
    }

    var playerCancelBtn = document.getElementById("playerCancelBtn");
    if (playerCancelBtn) {
      playerCancelBtn.addEventListener("click", function () {
        form.reset();
        resetPlayerForm();
        say("Edit cancelled.");
      });
    }

    var playerResetBtn = document.getElementById("playerResetBtn");
    if (playerResetBtn) {
      playerResetBtn.addEventListener("click", resetPlayerForm);
    }
  }

  /* ---------- schedule a match ---------- */

  var matchForm = document.getElementById("matchForm");
  var matchMsg = document.getElementById("matchMsg");
  var matchList = document.getElementById("matchList");
  var matchCount = document.getElementById("matchCount");

  /* Matches of the active club, with opponent names resolved.
     Reused by the Player Stats scope dropdown, so a manager can
     record statistics for a specific match. */
  var clubMatchesList = [];

  function sayMatch(text, isError) {
    if (matchMsg) {
      matchMsg.textContent = text || "";
      matchMsg.style.color = isError ? "#DC2626" : "";
    }
  }

  /* Load all clubs for away club dropdown */
  function loadAllClubs() {
    var sbc = sb();
    if (!sbc || !document.getElementById("match-away-club")) return;

    var sel = document.getElementById("match-away-club");
    sel.innerHTML = '<option value="">Select away club</option>';

    sbc.from("clubs").select("id, name, status").order("name").then(function (res) {
      var rows = (res && res.data) || [];
      rows.forEach(function (c) {
        if (c.id === activeClubId) return; // don't allow self
        var opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name + " (" + c.status + ")";
        sel.appendChild(opt);
      });
    }).catch(function () {
      sel.innerHTML = '<option value="">Could not load clubs</option>';
    });
  }

  /* Load matches for current club */
  function loadMatches() {
    var sbc = sb();
    if (!sbc || !activeClubId || !matchList) return;

    matchList.innerHTML = '<tr><td colspan="5">Loading matches…</td></tr>';

    sbc.from("matches").select("*")
      .or(`home_club_id.eq.${activeClubId},away_club_id.eq.${activeClubId}`)
      .order("match_date", { ascending: false })
      .then(function (res) {
        if (res && res.error) throw res.error;
        var matches = res && res.data ? res.data : [];
        matchCount.textContent = matches.length + (matches.length === 1 ? " match" : " matches");

        if (!matches.length) {
          matchList.innerHTML = '<tr><td colspan="5">No matches scheduled yet.</td></tr>';
          return;
        }

        // Load club names for opponent display
        var clubIds = matches.map(function (m) {
          return m.home_club_id === activeClubId ? m.away_club_id : m.home_club_id;
        });
        var clubMap = {};

        sbc.from("clubs").select("id, name").in("id", clubIds).then(function (cres) {
          (cres && cres.data || []).forEach(function (c) {
            clubMap[c.id] = c.name;
          });

          /* Keep a copy with readable opponent names for the
             "Tournament / Scope" dropdown in Player Stats. */
          clubMatchesList = matches.map(function (m) {
            var oppId = (m.home_club_id === activeClubId) ? m.away_club_id : m.home_club_id;
            return {
              id: m.id,
              match_date: m.match_date,
              venue: m.venue,
              status: m.status,
              home_club_id: m.home_club_id,
              away_club_id: m.away_club_id,
              opponent: clubMap[oppId] || ("Club #" + oppId),
              is_home: m.home_club_id === activeClubId
            };
          });

          // Refresh the stats scope lists so the new matches appear
          if (typeof rebuildStatScopeOptions === "function") rebuildStatScopeOptions();

          /* Notices may have rendered before this club's matches
             loaded, which hides the squad button. Re-render them now
             that the notice can be matched to a real match. */
          if (typeof renderNotices === "function" && lastNotices && lastNotices.length) {
            renderNotices(lastNotices);
          }

          matchList.innerHTML = matches.map(function (m) {
            var oppId = m.home_club_id === activeClubId ? m.away_club_id : m.home_club_id;
            var oppName = clubMap[oppId] || ("Club #" + oppId);
            var status = m.status || "scheduled";
            var statusClass = status === "completed" ? "completed" : status === "cancelled" ? "cancelled" : "scheduled";
            var homeScore = (m.home_score !== null && m.home_score !== undefined) ? m.home_score : "-";
            var awayScore = (m.away_score !== null && m.away_score !== undefined) ? m.away_score : "-";
            var score = homeScore + " - " + awayScore;
            var isHost = m.home_club_id === activeClubId;

            /* Only the host club records the result. That result is
               what the Welcome page Club Rankings is built from. */
            var resultCell;
            if (status === "completed") {
              resultCell = '<span class="cad-badge completed">🏁 ' + esc(score) + "</span>";
            } else if (isHost) {
              resultCell =
                '<div style="display:flex; gap:4px; align-items:center;">' +
                  '<input type="number" min="0" style="width:54px;" data-result-home="' + esc(m.id) + '" value="' +
                    (homeScore === "-" ? "" : esc(homeScore)) + '" placeholder="0">' +
                  "<span>–</span>" +
                  '<input type="number" min="0" style="width:54px;" data-result-away="' + esc(m.id) + '" value="' +
                    (awayScore === "-" ? "" : esc(awayScore)) + '" placeholder="0">' +
                  '<button type="button" class="sa-btn" style="padding:4px 8px; font-size:12px;" data-save-result="' +
                    esc(m.id) + '">Save</button>' +
                "</div>";
            } else {
              resultCell = '<small style="color:var(--muted);">Awaiting host result</small>';
            }

            return "<tr>" +
              "<td>" + esc(oppName) + "</td>" +
              "<td>" + esc(formatDateFromISO(m.match_date)) + "</td>" +
              "<td>" + esc(m.venue || "—") + "</td>" +
              "<td><span class=\"cad-badge " + statusClass + "\">" + esc(status) + "</span></td>" +
              "<td>" + resultCell + "</td>" +
            "</tr>";
          }).join("");

          Array.prototype.forEach.call(matchList.querySelectorAll("button[data-save-result]"), function (btn) {
            btn.addEventListener("click", function (e) {
              e.preventDefault();
              saveMatchResult(btn.getAttribute("data-save-result"));
            });
          });
        });
      }).catch(function (err) {
        console.error("[MATCHES] Load error:", err);
        matchList.innerHTML = '<tr><td colspan="5">Could not load matches.</td></tr>';
      });
  }

  /* Host club saves the final result: this marks the match completed
     and feeds the public Club Rankings (3 pts win / 1 pt draw). */
  function saveMatchResult(matchId) {
    var sbc = sb();
    if (!sbc || !activeClubId || !matchList) return;

    var hEl = matchList.querySelector('input[data-result-home="' + matchId + '"]');
    var aEl = matchList.querySelector('input[data-result-away="' + matchId + '"]');
    if (!hEl || !aEl) return;

    var hs = parseInt(hEl.value, 10);
    var as = parseInt(aEl.value, 10);

    if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) {
      sayMatch("Enter both scores (0 or more) before saving the result.", true);
      return;
    }

    sayMatch("Saving match result…");

    sbc.from("matches")
      .update({ home_score: hs, away_score: as, status: "completed" })
      .eq("id", matchId)
      .then(function (res) {
        if (res && res.error) throw res.error;
        sayMatch("Result saved (" + hs + "–" + as + "). Club Rankings updated on the Welcome page.");
        loadMatches();
      }).catch(function (err) {
        console.error("[MATCHES] Result save:", err);
        sayMatch("Could not save the result: " + errText(err), true);
      });
  }

  function formatDateFromISO(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  /* ---------- running tournaments (approved clubs & squads) ---------- */

  /* Tournaments this club organizes that already have at least one
     approved entry. The host opens one to see its clubs, their players,
     and can jump straight into that player's tournament stat. */
  var runningTournData = [];   // [{ tournament, clubs: [{ club_id, name, players }] }]
  var runningStatRows = {};    // "tid:club:player" -> player_stats row

  function loadRunningTournaments() {
    var host = document.getElementById("runningTournamentList");
    if (!host) return;

    var sbc = sb();
    if (!sbc || !activeClubId) return;

    host.innerHTML = '<div class="cad-empty"><p>Loading tournaments…</p></div>';

    sbc.from("tournaments").select("*").eq("club_id", activeClubId)
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (res && res.error) throw res.error;
        var tournaments = (res && res.data) || [];

        if (!tournaments.length) {
          runningTournData = [];
          runningStatRows = {};
          renderRunningTournaments();
          return;
        }

        var ids = tournaments.map(function (t) { return t.id; });

        return Promise.all([
          sbc.from("tournament_requests").select("*")
            .in("tournament_id", ids).eq("status", "approved"),
          sbc.from("tournament_players")
            .select("tournament_id, club_id, player_id, player_name")
            .in("tournament_id", ids),
          sbc.from("player_stats").select("*").in("tournament_id", ids)
        ]).then(function (out) {
          var reqs = (out[0] && out[0].data) || [];
          var players = (out[1] && out[1].data) || [];
          var stats = (out[2] && out[2].data) || [];

          runningStatRows = {};
          stats.forEach(function (s) {
            runningStatRows[s.tournament_id + ":" + s.club_id + ":" + s.player_id] = s;
          });

          var clubIds = {};
          reqs.forEach(function (r) { if (r.club_id) clubIds[r.club_id] = true; });
          players.forEach(function (p) { if (p.club_id) clubIds[p.club_id] = true; });

          var names = {};
          var nameIds = Object.keys(clubIds);
          var namesReady = nameIds.length
            ? sbc.from("clubs").select("id, name").in("id", nameIds).then(function (cRes) {
                ((cRes && cRes.data) || []).forEach(function (c) { names[c.id] = c.name; });
              })
            : Promise.resolve();

          return namesReady.then(function () {
            runningTournData = tournaments.map(function (t) {
              var clubs = {};

              players.filter(function (p) { return String(p.tournament_id) === String(t.id); })
                .forEach(function (p) {
                  var key = String(p.club_id);
                  if (!clubs[key]) {
                    clubs[key] = {
                      club_id: p.club_id,
                      name: names[p.club_id] || ("Club #" + p.club_id),
                      players: []
                    };
                  }
                  clubs[key].players.push(p);
                });

              /* An approved club with no squad rows yet still shows up */
              reqs.filter(function (r) { return String(r.tournament_id) === String(t.id); })
                .forEach(function (r) {
                  var key = String(r.club_id);
                  if (!clubs[key]) {
                    clubs[key] = {
                      club_id: r.club_id,
                      name: names[r.club_id] || r.team_name || ("Club #" + r.club_id),
                      players: []
                    };
                  }
                });

              return {
                tournament: t,
                clubs: Object.keys(clubs).map(function (k) { return clubs[k]; })
              };
            }).filter(function (row) { return row.clubs.length > 0; });

            renderRunningTournaments();
          });
        });
      }).catch(function (err) {
        console.warn("[RUNNING_TOURN] load:", err);
        host.innerHTML = '<div class="cad-empty"><p>Could not load running tournaments.</p></div>';
      });
  }

  function runningPlayerRow(tid, clubId, p) {
    var key = tid + ":" + clubId + ":" + p.player_id;
    var existing = runningStatRows[key];
    var name = p.player_name || ("Player #" + p.player_id);

    var summary = "No stats yet";
    if (existing) {
      summary = existing.sport === "Cricket"
        ? "🏏 " + (existing.runs || 0) + " runs • " + (existing.wickets || 0) + " wkts"
        : "⚽ " + (existing.goals || 0) + " goals • " + (existing.assists || 0) + " assists";
    }

    return '<div class="running-player">' +
        '<span class="running-player-name">' + esc(name) + "</span>" +
        '<span class="running-player-stat">' + esc(summary) + "</span>" +
        '<button type="button" class="sa-btn" style="padding:4px 10px; font-size:12px;" ' +
          'data-update-stat="' + esc(tid) + ":" + esc(clubId) + ":" + esc(p.player_id) + '">' +
          (existing ? "Edit Stats" : "Add Stats") +
        "</button>" +
      "</div>";
  }

  function renderRunningTournaments() {
    var host = document.getElementById("runningTournamentList");
    if (!host) return;

    var chip = document.getElementById("runningTournCount");
    if (chip) {
      chip.textContent = runningTournData.length +
        (runningTournData.length === 1 ? " tournament" : " tournaments");
    }

    if (!runningTournData.length) {
      host.innerHTML =
        '<div class="cad-empty">' +
          "<h3>No running tournament yet.</h3>" +
          "<p>Approve a registration request in Tournament Registration Requests — " +
          "that tournament then appears here with its clubs and players.</p>" +
        "</div>";
      return;
    }

    host.innerHTML = runningTournData.map(function (row) {
      var t = row.tournament;
      var totalPlayers = row.clubs.reduce(function (n, c) { return n + c.players.length; }, 0);

      var clubsHtml = row.clubs.map(function (c) {
        var clubKey = esc(t.id) + "-" + esc(c.club_id);
        var playerRows = c.players.length
          ? c.players.map(function (p) { return runningPlayerRow(t.id, c.club_id, p); }).join("")
          : '<p class="cad-note" style="margin:6px 0;">No players registered by this club yet.</p>';

        return '<div class="running-club">' +
            '<div class="running-club-head">' +
              "<div>" +
                "<b>" + esc(c.name) + "</b> " +
                '<small style="color:var(--muted);">' + c.players.length + " players</small>" +
              "</div>" +
              '<button type="button" class="sa-btn" style="padding:4px 10px; font-size:12px;" ' +
                'data-toggle-running-club="' + clubKey + '">Show Players</button>' +
            "</div>" +
            '<div id="runningClub-' + clubKey + '" hidden>' + playerRows + "</div>" +
          "</div>";
      }).join("");

      return '<div class="running-tourn">' +
          '<div class="running-tourn-head">' +
            '<div class="running-tourn-title">' +
              "<b>🏆 " + esc(t.title) + "</b>" +
              '<div class="running-tourn-meta">' +
                esc(t.sport || "Sport") +
                (t.start_date ? " • " + esc(String(t.start_date).slice(0, 10)) : "") +
                (t.end_date ? " → " + esc(String(t.end_date).slice(0, 10)) : "") +
                " • " + row.clubs.length + " approved club" + (row.clubs.length === 1 ? "" : "s") +
                " • " + totalPlayers + " players" +
              "</div>" +
            "</div>" +
            '<button type="button" class="sa-btn sa-btn-primary" style="padding:5px 12px; font-size:12px;" ' +
              'data-toggle-running="' + esc(t.id) + '">View Clubs</button>' +
          "</div>" +
          '<div class="running-tourn-body" id="runningTourn-' + esc(t.id) + '" hidden>' +
            clubsHtml +
          "</div>" +
        "</div>";
    }).join("");

    Array.prototype.forEach.call(host.querySelectorAll("button[data-toggle-running]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var panel = document.getElementById("runningTourn-" + btn.getAttribute("data-toggle-running"));
        if (!panel) return;
        panel.hidden = !panel.hidden;
        btn.textContent = panel.hidden ? "View Clubs" : "Hide Clubs";
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("button[data-toggle-running-club]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var panel = document.getElementById("runningClub-" + btn.getAttribute("data-toggle-running-club"));
        if (!panel) return;
        panel.hidden = !panel.hidden;
        btn.textContent = panel.hidden ? "Show Players" : "Hide Players";
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("button[data-update-stat]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var parts = String(btn.getAttribute("data-update-stat")).split(":");
        openStatFormFor(parts[0], parts[1], parts[2]);
      });
    });
  }

  /* Opens the Player Stats form already scoped to this tournament, club
     and player, so the host can update the numbers in one click. */
  function openStatFormFor(tid, clubId, playerId) {
    if (typeof setView === "function") setView("stats", true);
    else if (typeof showPanel === "function") showPanel("stats");

    /* Make sure the tournament itself is an option in the scope select */
    var known = (myTournamentsList || []).some(function (t) { return String(t.id) === String(tid); });
    if (!known) {
      (runningTournData || []).forEach(function (row) {
        if (String(row.tournament.id) === String(tid)) myTournamentsList.push(row.tournament);
      });
    }
    rebuildStatScopeOptions();
    if (statTournSelect) statTournSelect.value = String(tid);

    delete statTournamentSquads[tid];
    loadSquadsForTournament(tid).then(function () {
      renderStatClubOptions();
      if (statClubSelect) statClubSelect.value = String(clubId);
      renderStatPlayerOptions();
      if (statPlayerSelect) statPlayerSelect.value = String(playerId);

      var existing = runningStatRows[tid + ":" + clubId + ":" + playerId];
      if (existing) {
        fillStatForm(existing);
      } else {
        document.getElementById("stat-edit-id").value = "";
        if (statSportSelect) statSportSelect.value = "Football";
        renderStatPositions("Football");
        renderSportGroups();
        if (statFormHeading) statFormHeading.textContent = "Add Tournament Stats";
        if (statSubmitBtn) statSubmitBtn.textContent = "Save Player Stats";
      }
    });

    var card = document.getElementById("cad-player-stats-form-card");
    if (card) setTimeout(function () { card.scrollIntoView({ behavior: "smooth" }); }, 150);
  }

  /* Match form submit */
  if (matchForm) {
    matchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var sbc = sb();
      if (!sbc) { sayMatch("Supabase is not connected.", true); return; }
      if (!activeClubId) { sayMatch("You are not assigned to a club yet.", true); return; }

      var homeClubId = activeClubId;
      var awayClubId = (document.getElementById("match-away-club").value || "").trim();
      var matchDate = document.getElementById("match-date").value;
      var venue = (document.getElementById("match-venue").value || "").trim();

      if (!awayClubId) { sayMatch("Please select an away club.", true); return; }
      if (!matchDate) { sayMatch("Please select a match date.", true); return; }

      var btn = matchForm.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      sayMatch("Scheduling match…");

      /* Step 1: Insert match */
      sbc.from("matches").insert([{
        home_club_id: homeClubId,
        away_club_id: Number(awayClubId),
        match_date: matchDate,
        venue: venue || null,
        status: "scheduled"
      }]).then(function (res) {
        if (res && res.error) throw res.error;

        var matchRow = res && res.data && res.data[0] ? res.data[0] : null;
        if (!matchRow) {
          sayMatch("Match created but no data returned.", true);
          if (btn) btn.disabled = false;
          return;
        }

        /* Step 2: Create notice for all clubs (invites them to register) */
        var awaySelect = document.getElementById("match-away-club");
        var awayName = awaySelect && awaySelect.options[awaySelect.selectedIndex]
          ? awaySelect.options[awaySelect.selectedIndex].text : "Away club";
        var homeName = (document.getElementById("match-home-club").value || "Home club");

        var noticeTitle = "Match Invitation — " + homeName + " vs " + awayName;
        var noticeBody = "A match has been scheduled and your club is invited to register a squad.\n" +
          "Home: " + homeName + "\n" +
          "Away: " + awayName + "\n" +
          "Date: " + formatDateFromISO(matchDate) + "\n" +
          (venue ? "Venue: " + venue + "\n" : "") +
          "\nOpen this notice on the Notice Board to pick the players who will play.";

        return sbc.from("notices").insert([{
          user_id: null, // system notice
          title: noticeTitle,
          body: noticeBody,
          category: "match",
          match_id: matchRow.id,
          is_published: true,
          author_id: null,
          created_at: new Date().toISOString()
        }]).then(function (noticeRes) {
          if (noticeRes && noticeRes.error) {
            console.warn("[MATCH] Notice insert:", noticeRes.error.message);
            // Match was created even if notice failed
          }

          sayMatch("Match scheduled! Notice published to all clubs.");
          matchForm.reset();
          loadMatches();
          loadNotices(); // refresh notices
          if (btn) btn.disabled = false;
        });
      }).catch(function (err) {
        console.error("[MATCH] Error:", err);
        sayMatch(errText(err), true);
        if (btn) btn.disabled = false;
      });
    });
  }

  /* ====================================================
     TOURNAMENTS & REGISTRATION REQUESTS (Matches panel)
     ==================================================== */
  var tournamentForm = document.getElementById("tournamentForm");
  var tournMsg = document.getElementById("tournMsg");
  var cadTournFilter = document.getElementById("cadTournFilter");
  var cadTournRequestsBody = document.getElementById("cadTournRequestsBody");
  var cadTournReqCount = document.getElementById("cadTournReqCount");

  var myTournamentsList = [];
  var myTournRequestsList = [];

  function sayTourn(text, isError) {
    if (tournMsg) {
      tournMsg.textContent = text || "";
      tournMsg.style.color = isError ? "#DC2626" : "var(--green)";
    }
    if (text) say(text, isError);
  }

  /* Handle Tournament Form Submission */
  if (tournamentForm) {
    tournamentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var sbc = sb();
      if (!sbc) { sayTourn("Supabase is not connected.", true); return; }
      if (!activeClubId) { sayTourn("You are not assigned to a club yet.", true); return; }

      var title = (document.getElementById("tourn-title").value || "").trim();
      var sport = document.getElementById("tourn-sport").value;
      var venue = (document.getElementById("tourn-venue").value || "").trim();
      var startDate = document.getElementById("tourn-start-date").value;
      var endDate = document.getElementById("tourn-end-date").value || null;
      var deadline = document.getElementById("tourn-deadline").value;
      var maxTeams = parseInt(document.getElementById("tourn-max-teams").value, 10) || 16;
      var entryFee = (document.getElementById("tourn-fee").value || "").trim() || "Free";
      var desc = (document.getElementById("tourn-desc").value || "").trim();

      if (!title || !startDate || !deadline || !venue) {
        sayTourn("Please fill in all required tournament fields.", true);
        return;
      }

      var btn = tournamentForm.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      sayTourn("Publishing tournament notice…");

      sbc.from("tournaments").insert([{
        club_id: activeClubId,
        title: title,
        sport: sport,
        venue: venue,
        start_date: startDate,
        end_date: endDate,
        registration_deadline: deadline,
        max_teams: maxTeams,
        entry_fee: entryFee,
        description: desc || null,
        status: "open",
        created_at: new Date().toISOString()
      }]).then(function (res) {
        if (res && res.error) throw res.error;

        // Also publish to notices table for platform-wide notice boards
        var clubName = currentClub() ? currentClub().name : "District Sports Club";
        var noticeBody = "🏆 Tournament: " + title + "\n" +
          "Organized by: " + clubName + "\n" +
          "Sport: " + sport + " | Venue: " + venue + "\n" +
          "Dates: " + startDate + (endDate ? " to " + endDate : "") + "\n" +
          "Registration Deadline: " + deadline + "\n" +
          "Entry Fee: " + entryFee + "\n" +
          (desc ? "\n" + desc : "");

        sbc.from("notices").insert([{
          title: "🏆 " + title + " (Tournament)",
          body: noticeBody,
          category: "tournament",
          tournament_id: (res && res.data && res.data[0] ? res.data[0].id : null),
          is_published: true,
          created_at: new Date().toISOString()
        }]).then(function () {
          sayTourn("Tournament notice published successfully! Live on Welcome page.");
          tournamentForm.reset();
          loadTournamentsAndRequests();
          loadNotices();
          if (btn) btn.disabled = false;
        }).catch(function (notErr) {
          console.warn("[TOURNAMENT] Notice insert warning:", notErr);
          sayTourn("Tournament notice published successfully! Live on Welcome page.");
          tournamentForm.reset();
          loadTournamentsAndRequests();
          if (btn) btn.disabled = false;
        });
      }).catch(function (err) {
        console.error("[TOURNAMENT] Error:", err);
        sayTourn("Error publishing tournament: " + errText(err) + " (Make sure tournaments SQL table exists in Supabase)", true);
        if (btn) btn.disabled = false;
      });
    });
  }

  /* Load tournaments posted by activeClubId and their registration requests */
  function loadTournamentsAndRequests() {
    var sbc = sb();
    if (!sbc || !activeClubId || !cadTournRequestsBody) return;

    cadTournRequestsBody.innerHTML = '<tr><td colspan="9">Loading tournament requests…</td></tr>';

    sbc.from("tournaments").select("*").eq("club_id", activeClubId).order("created_at", { ascending: false })
      .then(function (res) {
        if (res && res.error) throw res.error;
        myTournamentsList = (res && res.data) || [];

        // Tournament list feeds the Player Stats scope dropdown
        if (typeof rebuildStatScopeOptions === "function") rebuildStatScopeOptions();

        // Populate tournament filter dropdown
        if (cadTournFilter) {
          var currentVal = cadTournFilter.value || "all";
          var opts = '<option value="all">All My Tournaments (' + myTournamentsList.length + ')</option>';
          myTournamentsList.forEach(function (t) {
            opts += '<option value="' + esc(t.id) + '">' + esc(t.title) + " (" + esc(t.sport || "Sport") + ")</option>";
          });
          cadTournFilter.innerHTML = opts;
          cadTournFilter.value = currentVal;
        }

        if (!myTournamentsList.length) {
          cadTournRequestsBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 24px; color: var(--muted);">' +
            'You have not posted any tournaments yet. Use the form above to announce a tournament!' +
            '</td></tr>';
          if (cadTournReqCount) cadTournReqCount.textContent = "0 requests";
          return;
        }

        var tournIds = myTournamentsList.map(function (t) { return t.id; });
        return sbc.from("tournament_requests").select("*").in("tournament_id", tournIds).order("created_at", { ascending: false })
          .then(function (reqRes) {
            if (reqRes && reqRes.error) throw reqRes.error;
            myTournRequestsList = (reqRes && reqRes.data) || [];
            renderTournamentRequestsTable();
          });
      }).catch(function (err) {
        console.warn("[TOURNAMENT_REQ] Load:", err);
        cadTournRequestsBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 20px; color: var(--muted);">' +
          'No tournament requests available or tables pending in Supabase.' +
          '</td></tr>';
      });
  }

  function renderTournamentRequestsTable() {
    if (!cadTournRequestsBody) return;

    var filterId = cadTournFilter ? cadTournFilter.value : "all";
    var filtered = myTournRequestsList;
    if (filterId !== "all") {
      filtered = filtered.filter(function (r) { return String(r.tournament_id) === String(filterId); });
    }

    if (cadTournReqCount) {
      cadTournReqCount.textContent = filtered.length + " request" + (filtered.length === 1 ? "" : "s");
    }

    if (!filtered.length) {
      cadTournRequestsBody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 24px; color: var(--muted);">' +
        'No registration requests received yet for the selected tournament.' +
        '</td></tr>';
      return;
    }

    // Map tournament id to title
    var tournMap = {};
    myTournamentsList.forEach(function (t) { tournMap[t.id] = t.title; });

    cadTournRequestsBody.innerHTML = filtered.map(function (r) {
      var tournTitle = tournMap[r.tournament_id] || "Tournament #" + r.tournament_id;
      var when = r.created_at ? String(r.created_at).slice(0, 10) : "—";
      var statusClass = r.status === "approved" ? "cad-chip-green" : (r.status === "rejected" ? "cad-chip-red" : "cad-chip-quiet");

      var contactInfo = esc(r.contact_email || "");
      if (r.contact_phone) {
        contactInfo += (contactInfo ? "<br>" : "") + '<small style="color:var(--muted);">' + esc(r.contact_phone) + "</small>";
      }

      var actions = "";
      if (r.status === "pending") {
        actions = '<div style="display:flex; gap:6px;">' +
          '<button type="button" class="sa-btn sa-btn-primary" style="padding:4px 8px; font-size:12px;" data-tourn-decide="' + esc(r.id) + '" data-action="approve">Approve</button>' +
          '<button type="button" class="sa-btn" style="padding:4px 8px; font-size:12px; color:#DC2626;" data-tourn-decide="' + esc(r.id) + '" data-action="reject">Reject</button>' +
          '</div>';
      } else {
        actions = '<span style="font-size:12px; font-weight:bold; color:' + (r.status === "approved" ? "#16A34A" : "#DC2626") + '">' +
          (r.status === "approved" ? "✓ Approved" : "✗ Rejected") +
          '</span>';
      }

      return "<tr>" +
        "<td><b>" + esc(tournTitle) + "</b></td>" +
        "<td>" + esc(r.team_name || "—") + (r.player_count ? ' <small style="color:var(--muted)">(' + esc(r.player_count) + " players)</small>" : "") + "</td>" +
        "<td><span class=\"cad-chip\">" + esc(r.applicant_type || "Club") + "</span></td>" +
        "<td>" + esc(r.contact_name || "—") + "</td>" +
        "<td>" + contactInfo + "</td>" +
        "<td>" + esc(r.district || "—") + "</td>" +
        "<td>" + esc(when) + "</td>" +
        "<td><span class=\"cad-chip " + statusClass + "\">" + esc(r.status || "pending") + "</span></td>" +
        "<td>" + actions + "</td>" +
        "</tr>";
    }).join("");

    // Bind approve and reject buttons
    Array.prototype.forEach.call(cadTournRequestsBody.querySelectorAll("button[data-tourn-decide]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var reqId = btn.getAttribute("data-tourn-decide");
        var action = btn.getAttribute("data-action");
        decideTournamentRequest(reqId, action === "approve" ? "approved" : "rejected");
      });
    });
  }

  function decideTournamentRequest(reqId, newStatus) {
    var sbc = sb();
    if (!sbc) return;

    sbc.from("tournament_requests").update({ status: newStatus }).eq("id", reqId)
      .then(function (res) {
        if (res && res.error) throw res.error;
        sayTourn("Request marked as " + newStatus + ".");
        loadTournamentsAndRequests();
        loadRunningTournaments();
      }).catch(function (err) {
        console.error("[TOURNAMENT_REQ] Decide error:", err);
        sayTourn("Could not update request: " + errText(err), true);
      });
  }

  if (cadTournFilter) {
    cadTournFilter.addEventListener("change", function () {
      renderTournamentRequestsTable();
    });
  }

  /* ====================================================
     PLAYER STATISTICS (Tournament & Lifetime Records)
     ==================================================== */
  var playerStatsForm = document.getElementById("playerStatsForm");
  var statMsg = document.getElementById("statMsg");
  var statPlayerSelect = document.getElementById("stat-player-select");
  var statClubSelect = document.getElementById("stat-club-select");
  var statTournSelect = document.getElementById("stat-tourn-select");
  var statSportSelect = document.getElementById("stat-sport");
  var cadStatsScopeFilter = document.getElementById("cadStatsScopeFilter");
  var cadPlayerStatsBody = document.getElementById("cadPlayerStatsBody");
  var cadPlayerStatsCount = document.getElementById("cadPlayerStatsCount");
  var statFormHeading = document.getElementById("statFormHeading");
  var statSubmitBtn = document.getElementById("statSubmitBtn");
  var statResetBtn = document.getElementById("statResetBtn");

  var clubPlayerStatsList = [];

  function sayPlayerStat(text, isError) {
    if (statMsg) {
      statMsg.textContent = text || "";
      statMsg.style.color = isError ? "#DC2626" : "var(--green)";
    }
    if (text) say(text, isError);
  }

  /* Position list depends on the chosen sport: a football stat never
     offers "Batsman" and a cricket stat never offers "Goalkeeper".
     A stored position that is not in the list (old rows were always
     saved as sport "Football") is kept as an extra option so editing
     an old row never silently changes its position. */
  var STAT_POSITIONS = {
    Football: [
      ["Forward", "Forward / Striker"],
      ["Midfielder", "Midfielder"],
      ["Defender", "Defender"],
      ["Goalkeeper", "Goalkeeper"],
      ["Winger", "Winger"]
    ],
    Cricket: [
      ["Batsman", "Batsman"],
      ["Bowler", "Bowler"],
      ["All-Rounder", "All-Rounder"],
      ["Wicket Keeper", "Wicket Keeper"]
    ]
  };

  function currentStatSport() {
    return (statSportSelect && statSportSelect.value) ? statSportSelect.value : "Football";
  }

  function statScopeLabelForMatch(m) {
    var when = m.match_date ? String(m.match_date).slice(0, 10) : "TBD";
    return "🏟️ Match: " + m.opponent + " — " + when;
  }

  /* Rebuilds the "Tournament / Scope" dropdowns from the current
     tournaments AND the club's matches, so a stat can be recorded
     for one specific match. Values look like "123" (tournament) or
     "match:45" (match). */
  function rebuildStatScopeOptions() {
    var tournaments = myTournamentsList || [];
    var matches = clubMatchesList || [];

    if (statTournSelect) {
      var tVal = statTournSelect.value;
      var tOpts = '<option value="">Overall / Lifetime Career</option>';
      tournaments.forEach(function (t) {
        tOpts += '<option value="' + esc(t.id) + '">🏆 ' + esc(t.title) + "</option>";
      });
      matches.forEach(function (m) {
        tOpts += '<option value="match:' + esc(m.id) + '">' + esc(statScopeLabelForMatch(m)) + "</option>";
      });
      statTournSelect.innerHTML = tOpts;
      statTournSelect.value = tVal;
      if (tVal && !statTournSelect.value) statTournSelect.value = "";
    }

    if (cadStatsScopeFilter) {
      var scopeVal = cadStatsScopeFilter.value || "all";
      var sOpts = '<option value="all">All Tournaments & Lifetime</option>' +
                  '<option value="lifetime">Overall / Lifetime Only</option>';
      tournaments.forEach(function (t) {
        sOpts += '<option value="' + esc(t.id) + '">🏆 ' + esc(t.title) + "</option>";
      });
      matches.forEach(function (m) {
        sOpts += '<option value="match:' + esc(m.id) + '">' + esc(statScopeLabelForMatch(m)) + "</option>";
      });
      cadStatsScopeFilter.innerHTML = sOpts;
      cadStatsScopeFilter.value = scopeVal;
      if (scopeVal && !cadStatsScopeFilter.value) cadStatsScopeFilter.value = "all";
    }
  }

  /* Two separate input interfaces: football fields for a football
     stat, cricket fields for a cricket stat. Only one group is
     ever visible; both stay in the DOM so a later edit can refill
     both sides of an existing row.

     The `required` marker moves with the visible group: a hidden
     required input would silently block form submission in most
     browsers. */
  function renderSportGroups() {
    var isCricket = currentStatSport() === "Cricket";
    var fb = document.getElementById("statGroupFootball");
    var ck = document.getElementById("statGroupCricket");

    /* The groups carry an inline `display: grid`, and an inline style
       overrides the browser's [hidden] rule - so the display value
       must be set here too, otherwise both groups stay visible. */
    if (fb) {
      fb.hidden = isCricket;
      fb.style.display = isCricket ? "none" : "grid";
    }
    if (ck) {
      ck.hidden = !isCricket;
      ck.style.display = isCricket ? "grid" : "none";
    }

    var goals = document.getElementById("stat-goals");
    var runs = document.getElementById("stat-runs");
    if (goals) {
      if (isCricket) goals.removeAttribute("required");
      else goals.setAttribute("required", "");
    }
    if (runs) {
      if (isCricket) runs.setAttribute("required", "");
      else runs.removeAttribute("required");
    }
  }

  function renderStatPositions(keepValue) {
    var posSel = document.getElementById("stat-position");
    if (!posSel) return;

    var list = STAT_POSITIONS[currentStatSport()] || STAT_POSITIONS.Football;
    var current = (keepValue !== undefined && keepValue !== null)
      ? String(keepValue)
      : posSel.value;

    var opts = list.map(function (p) {
      return '<option value="' + esc(p[0]) + '">' + esc(p[1]) + "</option>";
    }).join("");

    var known = list.some(function (p) { return p[0] === current; });
    if (current && !known) {
      opts += '<option value="' + esc(current) + '">' + esc(current) + "</option>";
    }

    posSel.innerHTML = opts;
    if (current) posSel.value = current;
    if (!posSel.value && list.length) posSel.value = list[0][0];
  }

  /* Tournament id when the scope select points at a tournament */
  function statScopeTournamentId() {
    var raw = statTournSelect ? (statTournSelect.value || "") : "";
    if (!raw || raw.indexOf("match:") === 0) return null;
    return Number(raw) || null;
  }

  /* Squads of every club registered for one tournament, filled from
     public.tournament_players when that tournament is chosen. */
  var statTournamentSquads = {};   // tournament_id -> { club_id: [player] }
  var statClubNames = {};          // club_id -> name (club select labels)

  function loadSquadsForTournament(tid) {
    var sbc = sb();
    if (!sbc || !tid) return Promise.resolve();
    if (statTournamentSquads[tid]) return Promise.resolve(statTournamentSquads[tid]);

    return sbc.from("tournament_players")
      .select("tournament_id, club_id, player_id, player_name")
      .eq("tournament_id", tid)
      .then(function (res) {
        if (res && res.error) throw res.error;

        var byClub = {};
        ((res && res.data) || []).forEach(function (p) {
          var key = String(p.club_id);
          if (!byClub[key]) byClub[key] = [];
          byClub[key].push({ player_id: p.player_id, player_name: p.player_name });
        });
        statTournamentSquads[tid] = byClub;

        var ids = Object.keys(byClub);
        if (!ids.length) return;
        return sbc.from("clubs").select("id, name").in("id", ids).then(function (cRes) {
          ((cRes && cRes.data) || []).forEach(function (c) {
            statClubNames[c.id] = c.name;
          });
        });
      }).catch(function (err) {
        console.warn("[STAT] tournament squads:", err);
      });
  }

  /* Club selector. A manager's own club is fixed, except when the scope
     is a tournament this club organizes: then every club registered for
     that tournament can be picked and its players' stats edited. */
  function renderStatClubOptions() {
    if (!statClubSelect) return;

    var tid = statScopeTournamentId();
    var prev = statClubSelect.value;

    if (!tid) {
      var mine = currentClub();
      var myName = mine ? firstVal(mine, ["name"], "My club") : "My club";
      statClubSelect.innerHTML = '<option value="' + esc(activeClubId) + '">' + esc(myName) + "</option>";
      statClubSelect.value = String(activeClubId);
      statClubSelect.disabled = true;
      return;
    }

    statClubSelect.disabled = false;
    var squads = statTournamentSquads[tid] || {};
    var ids = Object.keys(squads);

    if (!ids.length) {
      statClubSelect.innerHTML = '<option value="">No club registered for this tournament</option>';
      return;
    }

    ids.sort(function (a, b) {
      return String(statClubNames[a] || ("Club #" + a))
        .localeCompare(String(statClubNames[b] || ("Club #" + b)));
    });

    statClubSelect.innerHTML = '<option value="">Choose club</option>' + ids.map(function (id) {
      return '<option value="' + esc(id) + '">' +
        esc(statClubNames[id] || ("Club #" + id)) + "</option>";
    }).join("");

    if (prev && ids.indexOf(String(prev)) !== -1) {
      statClubSelect.value = prev;
    } else if (ids.indexOf(String(activeClubId)) !== -1) {
      statClubSelect.value = String(activeClubId);
    } else {
      statClubSelect.value = ids[0];
    }
  }

  function playerOption(id, name, position) {
    var label = name || ("Player #" + id);
    return '<option value="' + esc(id) + '" data-name="' + esc(label) + '"' +
      (position ? ' data-pos="' + esc(position) + '"' : "") + ">" +
      esc(label) + (position ? " (" + esc(position) + ")" : "") +
      "</option>";
  }

  /* Player list for the stat form.
       - match scope:      the squad this club registered for that match
       - tournament scope: the squad the selected club registered
       - no scope:         the manager's own roster */
  function renderStatPlayerOptions() {
    if (!statPlayerSelect) return;

    var selVal = statPlayerSelect.value;
    var raw = statTournSelect ? (statTournSelect.value || "") : "";
    var tid = statScopeTournamentId();
    var clubId = statClubSelect && statClubSelect.value
      ? Number(statClubSelect.value)
      : activeClubId;

    var pOpts = "";
    var shown = 0;

    if (raw.indexOf("match:") === 0) {
      var reg = myMatchRegs[raw.slice(6)];
      var squad = {};
      if (reg) reg.players.forEach(function (p) { squad[String(p.player_id)] = true; });

      pOpts = '<option value="">Choose player from roster</option>';
      (lastRoster || []).forEach(function (p) {
        if (!squad[String(p.id)]) return;
        shown++;
        pOpts += playerOption(p.id, p.full_name, p.position);
      });

      if (!shown) {
        pOpts = '<option value="">No squad registered for this match</option>' +
          '<option value="" disabled>Register the squad from the Notice Board first</option>';
      }
    } else if (tid) {
      var list = (statTournamentSquads[tid] || {})[String(clubId)] || [];
      pOpts = '<option value="">Choose player from the tournament squad</option>';
      list.forEach(function (p) {
        shown++;
        pOpts += playerOption(p.player_id, p.player_name, "");
      });

      if (!shown) {
        pOpts = '<option value="">This club has not registered any players</option>' +
          '<option value="" disabled>The club picks its squad from its Notice Board</option>';
      }
    } else {
      pOpts = '<option value="">Choose player from roster</option>';
      (lastRoster || []).forEach(function (p) {
        shown++;
        pOpts += playerOption(p.id, p.full_name, p.position);
      });
    }

    statPlayerSelect.innerHTML = pOpts;
    statPlayerSelect.value = selVal;
    if (selVal && !statPlayerSelect.value) statPlayerSelect.value = "";

    // A match / tournament stat must come from the registered squad,
    // so the free-text "name not in roster" field is hidden there.
    var nameWrap = document.getElementById("stat-player-name-wrap");
    if (nameWrap) {
      nameWrap.hidden = raw.indexOf("match:") === 0 || !!statScopeTournamentId();
    }
  }

  function loadPlayerStats() {
    var sbc = sb();
    if (!sbc || !activeClubId || !cadPlayerStatsBody) return;

    // 1. Scope + match dropdowns (shared helper keeps form and filter sync)
    rebuildStatScopeOptions();

    // 2. A tournament scope needs the squads of every registered club
    var tid = statScopeTournamentId();
    var ready = tid ? loadSquadsForTournament(tid) : Promise.resolve();
    ready.then(function () {
      renderStatClubOptions();
      renderStatPlayerOptions();
    });

    // 3. Rows of this club + rows of every tournament this club organizes
    //    (the organizer records the stats of the other clubs' players).
    cadPlayerStatsBody.innerHTML = '<tr><td colspan="11">Loading player stats…</td></tr>';

    var queries = [sbc.from("player_stats").select("*").eq("club_id", activeClubId)];
    var tournIds = (myTournamentsList || []).map(function (t) { return t.id; });
    if (tournIds.length) {
      queries.push(sbc.from("player_stats").select("*").in("tournament_id", tournIds));
    }

    Promise.all(queries).then(function (results) {
      var merged = {};
      results.forEach(function (res) {
        if (res && res.error) throw res.error;
        ((res && res.data) || []).forEach(function (row) { merged[row.id] = row; });
      });

      clubPlayerStatsList = Object.keys(merged).map(function (id) { return merged[id]; });

      // Sport-aware order, same rule as the public rankings:
      // football by goals, cricket by runs, rating breaks ties.
      clubPlayerStatsList.sort(function (a, b) {
        var pa = a.sport === "Cricket" ? (a.runs || 0) : (a.goals || 0);
        var pb = b.sport === "Cricket" ? (b.runs || 0) : (b.goals || 0);
        if (pb !== pa) return pb - pa;
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      });

      renderPlayerStatsTable();
    }).catch(function (err) {
      console.warn("[PLAYER_STATS] Load error:", err);
      cadPlayerStatsBody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px; color: var(--muted);">' +
        'No player stats recorded yet. Use the form above to add professional stats!' +
        '</td></tr>';
      if (cadPlayerStatsCount) cadPlayerStatsCount.textContent = "0 entries";
    });
  }

  function renderPlayerStatsTable() {
    if (!cadPlayerStatsBody) return;

    var scope = cadStatsScopeFilter ? cadStatsScopeFilter.value : "all";
    var filtered = clubPlayerStatsList;

    if (scope === "lifetime") {
      // Lifetime = not tied to a tournament AND not tied to one match
      filtered = filtered.filter(function (s) { return !s.tournament_id && !s.match_id; });
    } else if (scope.indexOf("match:") === 0) {
      var onlyMatch = scope.slice(6);
      filtered = filtered.filter(function (s) { return String(s.match_id) === String(onlyMatch); });
    } else if (scope !== "all") {
      // A tournament shows every club's players registered for it
      filtered = filtered.filter(function (s) {
        return String(s.tournament_id) === String(scope) && !s.match_id;
      });
    }

    if (cadPlayerStatsCount) {
      cadPlayerStatsCount.textContent = filtered.length + " entr" + (filtered.length === 1 ? "y" : "ies");
    }

    if (!filtered.length) {
      cadPlayerStatsBody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 24px; color: var(--muted);">' +
        'No statistics found for this scope. Add a player stat using the form above.' +
        '</td></tr>';
      return;
    }

    // Map tournament id to title
    var tournMap = {};
    if (myTournamentsList) {
      myTournamentsList.forEach(function (t) { tournMap[t.id] = t.title; });
    }

    cadPlayerStatsBody.innerHTML = filtered.map(function (s) {
      // A row is scoped to one match, one tournament, or lifetime
      var scopeLabel;
      if (s.match_id) {
        var mm = matchFromList(s.match_id);
        scopeLabel = mm
          ? ("🏟️ " + mm.opponent + " — " + (mm.match_date ? String(mm.match_date).slice(0, 10) : "TBD"))
          : ("🏟️ Match #" + s.match_id);
      } else if (s.tournament_id) {
        var tName = tournMap[s.tournament_id] || "Tournament #" + s.tournament_id;
        var clubTag = "";
        if (s.club_id && Number(s.club_id) !== Number(activeClubId)) {
          clubTag = " • " + (statClubNames[s.club_id] || ("Club #" + s.club_id));
        }
        scopeLabel = "🏆 " + tName + clubTag;
      } else {
        scopeLabel = "🌟 Lifetime / Overall";
      }
      var isCricket = s.sport === "Cricket";

      // Same columns, sport-specific meaning: football shows
      // goals/assists/clean sheets/cards, cricket shows
      // runs/wickets/catches/fifties-hundreds.
      var mainStat = isCricket ? (s.runs || 0) : (s.goals || 0);
      var secondStat = isCricket ? (s.wickets || 0) : (s.assists || 0);
      var thirdStat = isCricket ? (s.catches || 0) : (s.clean_sheets || 0);
      var cardsStr;
      if (isCricket) {
        cardsStr = "🏏 " + (s.fifties || 0) + "×50 • " + (s.hundreds || 0) + "×100";
      } else {
        cardsStr = (s.yellow_cards ? '🟨 ' + s.yellow_cards : '') + (s.red_cards ? ' 🟥 ' + s.red_cards : '');
        if (!cardsStr) cardsStr = '—';
      }

      return "<tr>" +
        "<td><b>" + esc(s.player_name || ("Player #" + (s.player_id || s.id))) + "</b></td>" +
        "<td><span class=\"cad-chip\">" + esc(isCricket ? "🏏 " : "⚽ ") + esc(s.sport || "Football") + "</span> <span class=\"cad-chip\">" + esc(s.position || "Forward") + "</span></td>" +
        "<td><small>" + esc(scopeLabel) + "</small></td>" +
        "<td><b>" + esc(s.matches_played || 0) + "</b></td>" +
        "<td><b style=\"color:#16A34A; font-size:15px;\">" + esc(mainStat) + "</b></td>" +
        "<td>" + esc(secondStat) + "</td>" +
        "<td><span class=\"cad-chip cad-chip-green\">⭐ " + esc(s.rating || "7.5") + "</span></td>" +
        "<td>" + esc(thirdStat) + "</td>" +
        "<td>" + cardsStr + "</td>" +
        "<td>" + (s.motm_awards ? ("🏅 " + s.motm_awards) : "0") + "</td>" +
        "<td>" +
          '<div style="display:flex; gap:6px;">' +
            '<button type="button" class="sa-btn" style="padding:4px 8px; font-size:12px;" data-edit-stat="' + esc(s.id) + '">Edit</button>' +
            '<button type="button" class="sa-btn" style="padding:4px 8px; font-size:12px; color:#DC2626;" data-del-stat="' + esc(s.id) + '">Delete</button>' +
          '</div>' +
        "</td>" +
        "</tr>";
    }).join("");

    // Bind Edit and Delete
    Array.prototype.forEach.call(cadPlayerStatsBody.querySelectorAll("button[data-edit-stat]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var id = btn.getAttribute("data-edit-stat");
        editPlayerStat(id);
      });
    });

    Array.prototype.forEach.call(cadPlayerStatsBody.querySelectorAll("button[data-del-stat]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var id = btn.getAttribute("data-del-stat");
        deletePlayerStat(id);
      });
    });
  }

  function editPlayerStat(id) {
    var found = clubPlayerStatsList.find(function (s) { return String(s.id) === String(id); });
    if (!found) return;
    fillStatForm(found);
  }

  /* Fills the whole stats form from one player_stats row. Used both by
     the table's Edit button and by the Running Tournaments section, so
     a host can update a tournament player's numbers in one click. */
  function fillStatForm(found) {
    document.getElementById("stat-edit-id").value = found.id;
    if (statPlayerSelect) statPlayerSelect.value = found.player_id || "";
    document.getElementById("stat-player-name").value = found.player_name || "";
    // Scope can be a tournament ("123") or one match ("match:45")
    if (statTournSelect) {
      statTournSelect.value = found.match_id
        ? ("match:" + found.match_id)
        : (found.tournament_id ? String(found.tournament_id) : "");
    }
    // Restore the saved sport first, then rebuild the position list
    // for that sport and keep the row's stored position selected.
    if (statSportSelect) statSportSelect.value = found.sport || "Football";
    renderStatPositions(found.position || "Forward");
    renderSportGroups();
    document.getElementById("stat-matches").value = found.matches_played || 0;
    document.getElementById("stat-goals").value = found.goals || 0;
    document.getElementById("stat-assists").value = found.assists || 0;
    document.getElementById("stat-minutes").value = found.minutes_played || 0;
    document.getElementById("stat-clean-sheets").value = found.clean_sheets || 0;
    document.getElementById("stat-yellow-cards").value = found.yellow_cards || 0;
    document.getElementById("stat-red-cards").value = found.red_cards || 0;
    document.getElementById("stat-motm").value = found.motm_awards || 0;
    document.getElementById("stat-rating").value = found.rating || 7.5;
    document.getElementById("stat-season").value = found.season || "2026";

    // Cricket side of the row (inputs exist even when hidden)
    document.getElementById("stat-innings").value = found.innings || 0;
    document.getElementById("stat-runs").value = found.runs || 0;
    document.getElementById("stat-wickets").value = found.wickets || 0;
    document.getElementById("stat-catches").value = found.catches || 0;
    document.getElementById("stat-fifties").value = found.fifties || 0;
    document.getElementById("stat-hundreds").value = found.hundreds || 0;

    if (statFormHeading) statFormHeading.textContent = "Edit Statistics for " + found.player_name;
    if (statSubmitBtn) statSubmitBtn.textContent = "Update Player Stats";

    /* Refill the club + player dropdowns for this row's scope. A
       tournament row may belong to ANOTHER club, so its squad must be
       loaded before the selects can show the saved club and player. */
    if (found.tournament_id) {
      loadSquadsForTournament(found.tournament_id).then(function () {
        renderStatClubOptions();
        if (statClubSelect && found.club_id) statClubSelect.value = String(found.club_id);
        renderStatPlayerOptions();
        if (statPlayerSelect && found.player_id) {
          statPlayerSelect.value = String(found.player_id);
          if (!statPlayerSelect.value) statPlayerSelect.value = "";
        }
      });
    } else {
      renderStatClubOptions();
      renderStatPlayerOptions();
      if (statPlayerSelect && found.player_id) {
        statPlayerSelect.value = String(found.player_id);
        if (!statPlayerSelect.value) statPlayerSelect.value = "";
      }
    }

    sayPlayerStat("Editing stats for " + found.player_name + ". Update values and click Save.");
    var card = document.getElementById("cad-player-stats-form-card");
    if (card) card.scrollIntoView({ behavior: "smooth" });
  }

  function deletePlayerStat(id) {
    if (!confirm("Are you sure you want to delete this player statistic entry?")) return;
    var sbc = sb();
    if (!sbc) return;

    sbc.from("player_stats").delete().eq("id", id).then(function (res) {
      if (res && res.error) throw res.error;
      sayPlayerStat("Player stat entry deleted.");
      loadPlayerStats();
    }).catch(function (err) {
      console.error("[PLAYER_STATS] Delete error:", err);
      sayPlayerStat("Could not delete stat: " + errText(err), true);
    });
  }

  // Switching the sport rebuilds the position list and swaps the
  // football-only / cricket-only input groups (separate interfaces)
  if (statSportSelect) {
    statSportSelect.addEventListener("change", function () {
      renderStatPositions();
      renderSportGroups();
    });
  }

  /* Apply the right interface as soon as the page loads: football
     group visible, cricket group hidden, and the `required` marker on
     the visible side's score field. Without this first call the hidden
     cricket group's required Runs field can block submission. */
  renderSportGroups();

  // Handle Player Select Change to auto-fill name & position
  if (statPlayerSelect) {
    statPlayerSelect.addEventListener("change", function () {
      var opt = statPlayerSelect.options[statPlayerSelect.selectedIndex];
      if (opt && opt.value) {
        var nameInput = document.getElementById("stat-player-name");
        if (nameInput) nameInput.value = opt.getAttribute("data-name") || "";
        var pos = opt.getAttribute("data-pos");
        // Rebuild the list for the current sport; an unknown roster
        // position is added as an extra option instead of clearing
        // the select (renderStatPositions keeps it selected).
        if (pos) renderStatPositions(pos);
      }
    });
  }

  // Handle Form Submit
  if (playerStatsForm) {
    playerStatsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var sbc = sb();
      if (!sbc) { sayPlayerStat("Supabase is not connected.", true); return; }
      if (!activeClubId) { sayPlayerStat("You are not assigned to a club yet.", true); return; }

      var editId = document.getElementById("stat-edit-id").value;
      var playerId = statPlayerSelect ? statPlayerSelect.value : null;
      var nameField = document.getElementById("stat-player-name");
      var scopeRawSel = statTournSelect ? (statTournSelect.value || "") : "";
      var squadScope = scopeRawSel.indexOf("match:") === 0 || !!statScopeTournamentId();
      var playerName = squadScope ? "" : ((nameField && nameField.value) || "").trim();

      if (!playerName && statPlayerSelect && statPlayerSelect.selectedIndex > 0) {
        playerName = statPlayerSelect.options[statPlayerSelect.selectedIndex].getAttribute("data-name");
      }

      if (!playerName) {
        sayPlayerStat("Please choose a player or enter a player name.", true);
        return;
      }

      /* Scope select holds one of:
         ""          -> lifetime / overall career
         "123"       -> a tournament id
         "match:45"  -> one specific match                              */
      var scopeRaw = statTournSelect ? (statTournSelect.value || "") : "";
      var matchId = null;
      var tournId = null;
      if (scopeRaw.indexOf("match:") === 0) {
        matchId = Number(scopeRaw.slice(6)) || null;
      } else if (scopeRaw) {
        tournId = Number(scopeRaw) || null;
      }
      var sport = currentStatSport();
      var statClubId = statClubSelect && statClubSelect.value
        ? Number(statClubSelect.value)
        : activeClubId;

      if (statScopeTournamentId() && !statClubId) {
        sayPlayerStat("Choose a club for this tournament stat first.", true);
        return;
      }
      var position = document.getElementById("stat-position").value || "Forward";
      var matches = parseInt(document.getElementById("stat-matches").value, 10) || 0;
      var goals = parseInt(document.getElementById("stat-goals").value, 10) || 0;
      var assists = parseInt(document.getElementById("stat-assists").value, 10) || 0;
      var minutes = parseInt(document.getElementById("stat-minutes").value, 10) || 0;
      var cleanSheets = parseInt(document.getElementById("stat-clean-sheets").value, 10) || 0;
      var yellowCards = parseInt(document.getElementById("stat-yellow-cards").value, 10) || 0;
      var redCards = parseInt(document.getElementById("stat-red-cards").value, 10) || 0;
      var motmAwards = parseInt(document.getElementById("stat-motm").value, 10) || 0;
      var rating = parseFloat(document.getElementById("stat-rating").value) || 7.5;
      var season = (document.getElementById("stat-season").value || "2026").trim();

      // Cricket side (inputs are in the DOM even when their group is hidden)
      var innings = parseInt(document.getElementById("stat-innings").value, 10) || 0;
      var runs = parseInt(document.getElementById("stat-runs").value, 10) || 0;
      var wickets = parseInt(document.getElementById("stat-wickets").value, 10) || 0;
      var catches = parseInt(document.getElementById("stat-catches").value, 10) || 0;
      var fifties = parseInt(document.getElementById("stat-fifties").value, 10) || 0;
      var hundreds = parseInt(document.getElementById("stat-hundreds").value, 10) || 0;

      var record = {
        club_id: statClubId,
        player_id: playerId ? Number(playerId) : null,
        tournament_id: tournId,
        match_id: matchId,
        player_name: playerName,
        sport: sport,
        position: position,
        matches_played: matches,
        // football side
        goals: goals,
        assists: assists,
        minutes_played: minutes,
        clean_sheets: cleanSheets,
        yellow_cards: yellowCards,
        red_cards: redCards,
        // cricket side
        innings: innings,
        runs: runs,
        wickets: wickets,
        catches: catches,
        fifties: fifties,
        hundreds: hundreds,
        // shared
        motm_awards: motmAwards,
        rating: rating,
        season: season,
        updated_at: new Date().toISOString()
      };

      if (statSubmitBtn) statSubmitBtn.disabled = true;
      sayPlayerStat("Saving player stats…");

      var query = editId
        ? sbc.from("player_stats").update(record).eq("id", editId)
        : sbc.from("player_stats").insert([record]);

      query.then(function (res) {
        if (res && res.error) throw res.error;
        sayPlayerStat("Player stats saved successfully! Visible on Welcome page.");
        playerStatsForm.reset();
        document.getElementById("stat-edit-id").value = "";
        renderStatPositions(STAT_POSITIONS.Football[0][0]);
        renderSportGroups();
        if (statFormHeading) statFormHeading.textContent = "Add / Update Player Statistics";
        if (statSubmitBtn) statSubmitBtn.textContent = "Save Player Stats";
        loadPlayerStats();
        loadRunningTournaments();
      }).catch(function (err) {
        console.error("[PLAYER_STATS] Save error:", err);
        sayPlayerStat("Error saving stats: " + errText(err) + " (Make sure player_stats SQL table exists in Supabase)", true);
      }).finally(function () {
        if (statSubmitBtn) statSubmitBtn.disabled = false;
      });
    });

    if (statResetBtn) {
      statResetBtn.addEventListener("click", function () {
        // The button's default form-reset runs AFTER this listener,
        // so wait one tick: that way renderSportGroups() reads the
        // post-reset sport (Football) and does not leave the hidden
        // cricket group - with its required runs field - on screen.
        setTimeout(function () {
          document.getElementById("stat-edit-id").value = "";
          renderStatPositions(STAT_POSITIONS.Football[0][0]);
          renderSportGroups();
          renderStatClubOptions();
          renderStatPlayerOptions();
          if (statFormHeading) statFormHeading.textContent = "Add / Update Player Statistics";
          if (statSubmitBtn) statSubmitBtn.textContent = "Save Player Stats";
        }, 0);
      });
    }
  }

  if (statTournSelect) {
    statTournSelect.addEventListener("change", function () {
      var tid = statScopeTournamentId();
      if (tid) {
        // Fresh read: clubs may have updated their squads
        delete statTournamentSquads[tid];
        loadSquadsForTournament(tid).then(function () {
          renderStatClubOptions();
          renderStatPlayerOptions();
        });
      } else {
        renderStatClubOptions();
        renderStatPlayerOptions();
      }
    });
  }

  if (statClubSelect) {
    statClubSelect.addEventListener("change", function () {
      renderStatPlayerOptions();
    });
  }

  if (cadStatsScopeFilter) {
    cadStatsScopeFilter.addEventListener("change", function () {
      renderPlayerStatsTable();
    });
  }

  /* ---------- notices ---------- */

  /* Registration state of the active club for each match it joined.
     Key = match_id, value = { id, players: [...] }. */
  var myMatchRegs = {};
  var lastNotices = [];

  /* Tournaments shown on notices, and the applications this club has
     already sent (key = tournament_id). Both are public reads. */
  var openTournaments = [];
  var myTournamentApps = {};
  var myTournamentSquads = {};   // tournament_id -> [ { player_id, player_name } ]

  function loadMatchRegState() {
    var sbc = sb();
    myMatchRegs = {};
    if (!sbc || !activeClubId) return Promise.resolve();

    return sbc.from("match_registrations")
      .select("id, match_id, club_id")
      .eq("club_id", activeClubId)
      .then(function (res) {
        if (res && res.error) throw res.error;
        var regs = (res && res.data) || [];
        regs.forEach(function (r) {
          myMatchRegs[r.match_id] = { id: r.id, players: [] };
        });
        if (!regs.length) return;

        var ids = regs.map(function (r) { return r.match_id; });
        return sbc.from("match_players")
          .select("id, match_id, player_id, player_name")
          .eq("club_id", activeClubId)
          .in("match_id", ids)
          .then(function (pRes) {
            if (pRes && pRes.error) throw pRes.error;
            ((pRes && pRes.data) || []).forEach(function (p) {
              if (myMatchRegs[p.match_id]) myMatchRegs[p.match_id].players.push(p);
            });
          });
      }).catch(function (err) {
        console.warn("[MATCH_REG] state:", err);
      });
  }

  function loadNotices() {
    var sbc = sb();
    if (!sbc || !document.getElementById("noticeList")) return;

    sbc.from("notices").select("*").order("created_at", { ascending: false }).limit(20)
      .then(function (res) {
        if (res && res.error) throw res.error;
        lastNotices = (res && res.data) || [];
        return loadMatchRegState()
          .then(function () { return loadTournamentInvites(); })
          .then(function () {
            renderNotices(lastNotices);
            // The stat form's player list depends on the match squad
            renderStatClubOptions();
            renderStatPlayerOptions();
          });
      }).catch(function (err) {
        console.error("[NOTICES] Load error:", err);
        var host = document.getElementById("noticeList");
        if (host) host.innerHTML = '<div class="cad-empty"><h3>Could not load notices.</h3></div>';
      });
  }

  function matchFromList(matchId) {
    for (var i = 0; i < clubMatchesList.length; i++) {
      if (String(clubMatchesList[i].id) === String(matchId)) return clubMatchesList[i];
    }
    return null;
  }

  /* ---------- tournament invitations on the notice board ---------- */

  /* Notice -> tournament. New notices carry tournament_id; older ones
     only carry the title "🏆 <title> (Tournament)", so title match is
     kept as a fallback. */
  function noticeTournament(n) {
    if (n.tournament_id) {
      for (var i = 0; i < openTournaments.length; i++) {
        if (String(openTournaments[i].id) === String(n.tournament_id)) return openTournaments[i];
      }
    }

    var raw = String(n.title || "")
      .replace(/^🏆\s*/, "")
      .replace(/\s*\(Tournament\)\s*$/, "")
      .trim()
      .toLowerCase();
    if (!raw) return null;

    for (var j = 0; j < openTournaments.length; j++) {
      if (String(openTournaments[j].title || "").trim().toLowerCase() === raw) {
        return openTournaments[j];
      }
    }
    return null;
  }

  function loadTournamentInvites() {
    var sbc = sb();
    openTournaments = [];
    myTournamentApps = {};
    myTournamentSquads = {};
    if (!sbc) return Promise.resolve();

    return sbc.from("tournaments").select("*").order("created_at", { ascending: false })
      .then(function (res) {
        if (res && res.error) throw res.error;
        openTournaments = (res && res.data) || [];
        if (!activeClubId) return;

        return sbc.from("tournament_requests")
          .select("*")
          .eq("club_id", activeClubId)
          .then(function (aRes) {
            if (aRes && aRes.error) throw aRes.error;
            ((aRes && aRes.data) || []).forEach(function (r) {
              myTournamentApps[r.tournament_id] = r;
            });

            return sbc.from("tournament_players")
              .select("tournament_id, player_id, player_name")
              .eq("club_id", activeClubId)
              .then(function (pRes) {
                if (pRes && pRes.error) throw pRes.error;
                ((pRes && pRes.data) || []).forEach(function (p) {
                  if (!myTournamentSquads[p.tournament_id]) myTournamentSquads[p.tournament_id] = [];
                  myTournamentSquads[p.tournament_id].push({
                    player_id: p.player_id,
                    player_name: p.player_name
                  });
                });
              });
          });
      }).catch(function (err) {
        console.warn("[TOURN_INVITE] load:", err);
      });
  }

  function tournamentDeadlinePassed(t) {
    if (!t.registration_deadline) return false;
    var raw = String(t.registration_deadline);
    var when = raw.length <= 10 ? raw + "T23:59:59" : raw;
    var d = new Date(when);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  }

  /* Checklist of this club's roster players for the tournament squad.
     Already-registered players stay checked when the panel is reopened. */
  function tournamentSquadRows(t) {
    var existing = myTournamentSquads[t.id] || [];
    var picked = {};
    existing.forEach(function (p) { picked[String(p.player_id)] = true; });

    var rows = (lastRoster || []).map(function (p) {
      var on = picked[String(p.id)] ? " checked" : "";
      var name = firstVal(p, ["full_name", "name", "player_name"], "") || ("Player #" + p.id);
      return '<label style="display:flex; align-items:center; gap:8px; padding:4px 0; font-weight:normal;">' +
        '<input type="checkbox" data-squad-player value="' + esc(p.id) + '" data-name="' + esc(name) + '"' + on + ">" +
        '<span style="flex:1 1 auto; color:var(--text); font-size:13px;">' +
          esc(name) + (p.position ? ' <small style="color:var(--muted);">(' + esc(p.position) + ")</small>" : "") +
        "</span>" +
        "</label>";
    }).join("");

    if (!rows) {
      rows = '<p style="margin:0; color:var(--muted); font-size:13px;">No players in your roster yet. Register players on the Players page first.</p>';
    }

    return '<div style="margin-top:10px;">' +
        '<label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">Players for this Tournament * (' +
          '<span class="tourn-squad-count">' + existing.length + "</span> selected)</label>" +
        '<div class="tourn-squad-list" style="max-height:200px; overflow:auto; border:1px solid var(--border); border-radius:6px; padding:6px 10px;">' +
          rows +
        "</div>" +
      "</div>";
  }

  /* Inline application form shown inside a tournament notice. The club
     name is never free text: it always comes from the managed club, and
     the players come from that club's roster. */
  function tournamentApplyPanel(t, mode) {
    var c = currentClub();
    var clubName = c ? firstVal(c, ["name"], "") : "";
    var district = c ? firstVal(c, ["district"], "") : "";
    var phone = c ? firstVal(c, ["contact_phone", "phone", "contact", "mobile", "phone_number"], "") : "";

    function field(label, name, type, value, extra) {
      return "<div><label style=\"display:block; font-size:12px; margin-bottom:4px;\">" + label + "</label>" +
        "<input type=\"" + type + "\" data-apply-field=\"" + name + "\" value=\"" + esc(value || "") + "\"" +
        (extra || "") + " style=\"width:100%;\"></div>";
    }

    var head = '<p class="cad-note" style="margin:0 0 8px;">' +
      (mode === "edit"
        ? "Update the players your club will send for <b>" + esc(t.title) + "</b>."
        : "Applying as <b>" + esc(clubName) + "</b> for <b>" + esc(t.title) + "</b> — pick the players your club will register.") +
      "</p>";

    var contact = mode === "edit" ? "" :
      '<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px;">' +
        field("Contact Person *", "contact_name", "text", user ? user.name : "") +
        field("Phone *", "contact_phone", "tel", phone) +
        field("Email *", "contact_email", "email", user ? user.email : "") +
        field("District *", "district", "text", district) +
      "</div>" +
      '<div style="margin-top:10px;"><label style="display:block; font-size:12px; margin-bottom:4px;">Message (optional)</label>' +
        '<input type="text" data-apply-field="message" placeholder="Anything the organizer should know" style="width:100%;"></div>';

    return '<div class="tourn-apply-panel" id="tournApply-' + esc(t.id) + '" hidden ' +
        'style="margin-top:10px; padding:12px; border:1px dashed var(--border); border-radius:8px;">' +
        head + contact + tournamentSquadRows(t) +
        '<div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">' +
          '<button type="button" class="sa-btn sa-btn-primary" style="padding:6px 12px; font-size:12px;" data-submit-apply="' + esc(t.id) + '">' +
            (mode === "edit" ? "Update Squad" : "Submit Application") + "</button>" +
          '<button type="button" class="sa-btn" style="padding:6px 12px; font-size:12px;" data-cancel-apply="' + esc(t.id) + '">Cancel</button>' +
        "</div>" +
      "</div>";
  }

  function tournamentNoticeActions(n) {
    var t = noticeTournament(n);

    if (!t) {
      return '<p class="notice-date" style="margin-top:8px;">Tournament details are available in the Tournaments section.</p>';
    }

    if (activeClubId && Number(t.club_id) === Number(activeClubId)) {
      return '<p class="notice-date" style="margin-top:8px;">🏆 Your club organizes this tournament. Applications appear in the Tournaments section.</p>';
    }

    var app = myTournamentApps[t.id];
    if (app) {
      var cls = app.status === "approved" ? "cad-chip-green"
              : (app.status === "rejected" ? "cad-chip-red" : "cad-chip-quiet");
      var count = (myTournamentSquads[t.id] || []).length;
      return '<p class="notice-date" style="margin-top:8px;">✓ Your club has applied — ' +
        '<span class="cad-chip ' + cls + '">' + esc(app.status || "pending") + "</span> • " +
        count + " player" + (count === 1 ? "" : "s") + " registered</p>" +
        '<div style="margin-top:10px;">' +
          '<button type="button" class="sa-btn" style="padding:6px 12px; font-size:12px;" data-toggle-apply="' + esc(t.id) + '">Edit Tournament Squad</button>' +
        "</div>" +
        tournamentApplyPanel(t, "edit");
    }

    if (t.status === "closed" || t.status === "completed" || tournamentDeadlinePassed(t)) {
      return '<p class="notice-date" style="margin-top:8px;">Registration is closed for this tournament.</p>';
    }

    return '<div style="margin-top:10px;">' +
        '<button type="button" class="sa-btn sa-btn-primary" style="padding:6px 12px; font-size:12px;" data-toggle-apply="' + esc(t.id) + '">Apply for this Tournament</button>' +
      "</div>" +
      tournamentApplyPanel(t, "new");
  }

  function submitTournamentApplication(tournId) {
    var sbc = sb();
    if (!sbc || !activeClubId) return;

    var panel = document.getElementById("tournApply-" + tournId);
    if (!panel) return;

    function val(name) {
      var el = panel.querySelector('[data-apply-field="' + name + '"]');
      return el ? String(el.value || "").trim() : "";
    }

    var c = currentClub();
    var clubName = c ? firstVal(c, ["name"], "") : "";
    if (!clubName) {
      say("Your club profile is not loaded yet. Reload the page.", true);
      return;
    }

    // Players picked from THIS club's roster
    var picked = [];
    Array.prototype.forEach.call(panel.querySelectorAll("input[data-squad-player]"), function (b) {
      if (b.checked) {
        picked.push({
          player_id: Number(b.value),
          player_name: b.getAttribute("data-name") || ""
        });
      }
    });

    if (!picked.length) {
      say("Select at least one player from your roster for the tournament squad.", true);
      return;
    }

    var squadRows = picked.map(function (p) {
      return {
        tournament_id: Number(tournId),
        club_id: activeClubId,
        player_id: p.player_id,
        player_name: p.player_name
      };
    });

    function replaceSquad() {
      return sbc.from("tournament_players").delete()
        .eq("tournament_id", tournId)
        .eq("club_id", activeClubId)
        .then(function (res) {
          if (res && res.error) throw res.error;
          return sbc.from("tournament_players").insert(squadRows);
        });
    }

    var isEdit = !!myTournamentApps[tournId];

    if (isEdit) {
      say("Updating tournament squad…");
      replaceSquad().then(function (res) {
        if (res && res.error) throw res.error;
        say("Tournament squad updated (" + picked.length + " players).");
        loadNotices();
      }).catch(function (err) {
        console.error("[TOURN_APPLY] squad update:", err);
        say("Could not update the squad: " + errText(err), true);
      });
      return;
    }

    var contactName = val("contact_name");
    var contactPhone = val("contact_phone");
    var contactEmail = val("contact_email");
    var district = val("district");

    if (!contactName || !contactPhone || !contactEmail || !district) {
      say("Fill in contact person, phone, email and district before applying.", true);
      return;
    }

    say("Submitting tournament application…");

    sbc.from("tournament_requests").insert([{
      tournament_id: Number(tournId),
      club_id: activeClubId,
      applicant_type: "Club",
      team_name: clubName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      district: district,
      player_count: picked.length,
      message: val("message") || null,
      status: "pending",
      created_at: new Date().toISOString()
    }]).then(function (res) {
      if (res && res.error) throw res.error;
      return replaceSquad();
    }).then(function (res) {
      if (res && res.error) throw res.error;
      var t = null;
      for (var i = 0; i < openTournaments.length; i++) {
        if (String(openTournaments[i].id) === String(tournId)) t = openTournaments[i];
      }
      say("Application sent" + (t ? " for " + t.title : "") +
        " with " + picked.length + " players — the organizing club will review it.");
      loadNotices();
    }).catch(function (err) {
      console.error("[TOURN_APPLY] error:", err);
      say("Could not apply: " + errText(err), true);
    });
  }

  /* Squad picker shown inside a match notice. Both clubs in the match
     use it: the host picks the players who played, the invited club
     picks the players who will play. Only roster players are listed. */
  function matchSquadPanel(matchId) {
    var reg = myMatchRegs[matchId];
    var picked = {};
    if (reg) reg.players.forEach(function (p) { picked[String(p.player_id)] = true; });

    var rows = (lastRoster || []).map(function (p) {
      var checked = picked[String(p.id)] ? " checked" : "";
      var name = firstVal(p, ["full_name", "name", "player_name"], "") || ("Player #" + p.id);
      return '<label class="match-reg-player" style="display:flex; align-items:center; gap:8px; padding:4px 0; font-weight:normal;">' +
        '<input type="checkbox" value="' + esc(p.id) + '" data-name="' + esc(name) + '"' + checked + ">" +
        '<span style="flex:1 1 auto; color:var(--text); font-size:13px;">' +
          esc(name) + (p.position ? ' <small style="color:var(--muted);">(' + esc(p.position) + ")</small>" : "") +
        "</span>" +
        "</label>";
    }).join("");

    if (!rows) {
      rows = '<p style="margin:0; color:var(--muted); font-size:13px;">No players in your roster yet. Register players first from the Players page.</p>';
    }

    return '<div class="match-reg-panel" id="matchReg-' + esc(matchId) + '" hidden ' +
        'style="margin-top:10px; padding:12px; border:1px dashed var(--border); border-radius:8px;">' +
        '<p class="cad-note" style="margin:0 0 8px;">Pick the players from your club who will play this match:</p>' +
        '<div class="match-reg-list" style="max-height:220px; overflow:auto;">' + rows + "</div>" +
        '<div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">' +
          '<button type="button" class="sa-btn sa-btn-primary" style="padding:6px 12px; font-size:12px;" data-save-squad="' + esc(matchId) + '">Save Squad</button>' +
          '<button type="button" class="sa-btn" style="padding:6px 12px; font-size:12px;" data-cancel-squad="' + esc(matchId) + '">Cancel</button>' +
        "</div>" +
      "</div>";
  }

  function matchNoticeActions(n) {
    if (!n.match_id) return "";

    var m = matchFromList(n.match_id);

    /* The notice board is shared by every club, but only the two
       clubs in a match may act on it. clubMatchesList holds exactly
       this club's matches; when it has been loaded and this match is
       not in it, another pair of clubs is playing. */
    if (!m) {
      if (clubMatchesList.length) {
        return '<p class="notice-date" style="margin-top:8px;">This match is between other clubs.</p>';
      }
      return "";
    }

    var reg = myMatchRegs[n.match_id];
    var isHost = !!m.is_home;
    var label = reg
      ? "✓ Squad (" + reg.players.length + " player" + (reg.players.length === 1 ? "" : "s") + ") — Edit"
      : (isHost ? "Select Squad for this Match" : "Register Squad for this Match");

    var hint = isHost
      ? '<p class="notice-date" style="margin-top:8px;">🏠 Your club is the host. Pick the players who played, then save the result on the Matches page and their match stats from Player Stats.</p>'
      : '<p class="notice-date" style="margin-top:8px;">Your club is invited to this match. Pick the players who will play.</p>';

    return hint +
      '<div style="margin-top:10px;">' +
        '<button type="button" class="sa-btn sa-btn-primary" style="padding:6px 12px; font-size:12px;" data-toggle-squad="' + esc(n.match_id) + '">' + esc(label) + "</button>" +
      "</div>" +
      matchSquadPanel(n.match_id);
  }

  function renderNotices(notices) {
    var host = document.getElementById("noticeList");
    if (!host) return;

    if (!notices.length) {
      host.innerHTML =
        '<div class="cad-empty">' +
        "<h3>No notices available yet.</h3>" +
        "<p>No announcements have been posted.</p>" +
        "</div>";
      return;
    }

    host.innerHTML = notices.map(function (n) {
      return '<article class="notice-item">' +
        '<div class="notice-head">' +
          "<h3>" + esc(n.title) + "</h3>" +
          (n.category ? '<span class="notice-status">' + esc(n.category) + "</span>" : "") +
        "</div>" +
        '<p class="notice-body">' + esc(n.body) + "</p>" +
        (n.created_at ? '<p class="notice-date">' + esc(formatDateFromISO(n.created_at)) + "</p>" : "") +
        (n.category === "match" ? matchNoticeActions(n) : "") +
        (n.category === "tournament" ? tournamentNoticeActions(n) : "") +
      "</article>";
    }).join("");

    Array.prototype.forEach.call(host.querySelectorAll("button[data-toggle-squad]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var panel = document.getElementById("matchReg-" + btn.getAttribute("data-toggle-squad"));
        if (panel) panel.hidden = !panel.hidden;
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("button[data-cancel-squad]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var panel = document.getElementById("matchReg-" + btn.getAttribute("data-cancel-squad"));
        if (panel) panel.hidden = true;
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("button[data-save-squad]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        saveMatchSquad(btn.getAttribute("data-save-squad"));
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("button[data-toggle-apply]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var panel = document.getElementById("tournApply-" + btn.getAttribute("data-toggle-apply"));
        if (panel) panel.hidden = !panel.hidden;
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("button[data-cancel-apply]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var panel = document.getElementById("tournApply-" + btn.getAttribute("data-cancel-apply"));
        if (panel) panel.hidden = true;
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("button[data-submit-apply]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        submitTournamentApplication(btn.getAttribute("data-submit-apply"));
      });
    });

    Array.prototype.forEach.call(host.querySelectorAll("input[data-squad-player]"), function (box) {
      box.addEventListener("change", function () {
        var panel = box.closest ? box.closest(".tourn-apply-panel") : null;
        if (!panel) return;
        var badge = panel.querySelector(".tourn-squad-count");
        if (badge) {
          badge.textContent = panel.querySelectorAll("input[data-squad-player]:checked").length;
        }
      });
    });
  }

  /* Save the picked players: one registration row per club+match,
     then replace that club's player list for the match. */
  function saveMatchSquad(matchId) {
    var sbc = sb();
    if (!sbc || !activeClubId) return;

    var panel = document.getElementById("matchReg-" + matchId);
    if (!panel) return;

    var picked = [];
    Array.prototype.forEach.call(panel.querySelectorAll('input[type="checkbox"]'), function (b) {
      if (b.checked) {
        picked.push({
          player_id: Number(b.value),
          player_name: b.getAttribute("data-name") || ""
        });
      }
    });

    if (!picked.length) {
      say("Pick at least one player to register your squad.", true);
      return;
    }

    sbc.from("match_registrations")
      .upsert([{ match_id: Number(matchId), club_id: activeClubId, status: "registered" }],
               { onConflict: "match_id,club_id" })
      .then(function (res) {
        if (res && res.error) throw res.error;
        return sbc.from("match_players").delete()
          .eq("match_id", matchId)
          .eq("club_id", activeClubId);
      })
      .then(function (res) {
        if (res && res.error) throw res.error;
        return sbc.from("match_players").insert(picked.map(function (p) {
          return {
            match_id: Number(matchId),
            club_id: activeClubId,
            player_id: p.player_id,
            player_name: p.player_name
          };
        }));
      })
      .then(function (res) {
        if (res && res.error) throw res.error;
        say("Squad registered for the match (" + picked.length + " players).");
        loadNotices();
        loadPlayerStats();
      })
      .catch(function (err) {
        console.error("[MATCH_REG] save:", err);
        say("Could not save the squad: " + errText(err), true);
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
    club: "club", players: "players", stats: "stats", matches: "matches",
    equipment: "equipment", cards: "cards",
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

    /* Reopening a live section should not show stale data */
    if (name === "matches") loadRunningTournaments();
    if (name === "stats") loadPlayerStats();

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
      loadMatches();
      loadTournamentsAndRequests();
      loadPlayerStats();
      loadNotices();   // notices depend on the club (squad registration state)
      loadRunningTournaments();
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
  renderSportGroups();
  loadNotices();

  /* Open whichever view the URL asks for. Deep links and the browser
     Back / Forward buttons therefore land on the right page, and the
     Dashboard is the default when there is nothing to open. */
  var startView = viewFromUrl() || "club";
  showPanel(startView);

  try {
    window.history.pushState({ cadView: startView }, "", "#" + startView);
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
      loadAllClubs();   // for away club dropdown in match form
      loadMatches();    // load matches for current club
      loadTournamentsAndRequests(); // load tournaments and registration requests
      loadPlayerStats();            // load player lifetime & tournament stats
      loadNotices();                // match invitations + squad state for this club
      loadRunningTournaments();     // approved clubs + squads for the host
    });
  }).catch(function (err) {
    // Never leave a rejected promise unhandled: report it in the
    // status line and let the already-rendered cards show the placeholders.
    say("Could not load the club dashboard: " + errText(err), true);
  });

})();
