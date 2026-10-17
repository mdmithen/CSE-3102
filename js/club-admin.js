// ==========================================
// CLUB ADMIN (Club Manager) - login-system.html
// Uses js/auth.js for the role guard and
// js/supabase-config.js for the Supabase client.
//
// What a club manager can do
// -------------------------
//  - see which club they manage          -> RPC my_club_id
//  - register a player into that club    -> public.players
//  - see the club roster                 -> public.players
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

  // Only a signed-in Club Admin may use this page section
  if (!AUTH.requireRole(AUTH.ROLES.CLUB_ADMIN)) return;

  var user = AUTH.currentUser();
  var msgEl = document.getElementById("clubMsg");
  var rosterBody = document.getElementById("roster-body");
  var requestsBody = document.getElementById("join-requests-body");

  function sb() {
    return window.SB || null;
  }

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

  function errText(err) {
    return (err && err.message) ? err.message : "Unknown error";
  }

  var myClubId = null;

  /* ---------- load my club ---------- */

  function loadMyClub() {
    if (!sb()) return Promise.resolve(null);

    return sb().rpc("my_club_id").then(function (res) {
      myClubId = (res && res.data != null) ? Number(res.data) : null;

      if (!myClubId) {
        say("No club is assigned to you yet. Ask the super admin to make you a club manager.", true);
        if (rosterBody) rosterBody.innerHTML = '<tr><td colspan="8">No club assigned.</td></tr>';
        if (requestsBody) requestsBody.innerHTML = '<tr><td colspan="6">No club assigned.</td></tr>';
        return null;
      }

      say("Managing club DSC-" + ("00" + myClubId).slice(-3));
      return myClubId;
    }).catch(function (err) {
      say(errText(err), true);
      return null;
    });
  }

  /* ---------- roster ---------- */

  function loadRoster() {
    if (!rosterBody || !sb() || !myClubId) return;

    sb().from("players")
      .select("id, full_name, position, status")
      .eq("club_id", myClubId)
      .order("id")
      .then(function (res) {
        var rows = (res && res.data) || [];

        if (!rows.length) {
          rosterBody.innerHTML = '<tr><td colspan="8">No players in this club yet.</td></tr>';
          return;
        }

        rosterBody.innerHTML = "";
        rows.forEach(function (p) {
          var tr = document.createElement("tr");
          tr.innerHTML =
            "<td>PLY-" + ("00" + p.id).slice(-3) + "</td>" +
            "<td>" + esc(p.full_name) + "</td>" +
            "<td>—</td>" +
            "<td>" + esc(p.position || "—") + "</td>" +
            "<td>—</td>" +
            "<td>—</td>" +
            "<td>" + esc(p.status || "Active") + "</td>" +
            "<td></td>";
          rosterBody.appendChild(tr);
        });
      })
      .catch(function (err) {
        rosterBody.innerHTML = '<tr><td colspan="8">Could not load the roster.</td></tr>';
        say(errText(err), true);
      });
  }

  /* ---------- join requests ---------- */

  function loadRequests() {
    if (!requestsBody || !sb() || !myClubId) return;

    sb().from("join_requests")
      .select("id, player_id, note, created_at, status")
      .eq("club_id", myClubId)
      .order("created_at", { ascending: false })
      .then(function (res) {
        var rows = (res && res.data) || [];

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

      tr.innerHTML =
        "<td>—</td>" +
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
      if (!myClubId) { say("You are not assigned to a club yet.", true); return; }

      var name = (document.getElementById("player-name").value || "").trim();
      var position = (document.getElementById("player-position").value || "").trim();

      if (!name) { say("Please enter the player name.", true); return; }

      say("Saving player…");

      sb().from("players").insert([{
        full_name: name,
        position: position || "Player",
        status: "Active",
        club_id: myClubId
      }]).then(function (res) {
        if (res && res.error) {
          say(errText(res.error), true);
          return;
        }
        say("Player registered.");
        form.reset();
        loadRoster();
      }).catch(function (err) {
        say(errText(err), true);
      });
    });
  }

  /* ---------- start ---------- */

  loadMyClub().then(function (clubId) {
    if (!clubId) return;
    loadRoster();
    loadRequests();
  });

})();
