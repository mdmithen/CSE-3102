// ==========================================
// PLAYER - Join a club (player-dashboard.html)
// Uses js/auth.js for the role guard and
// js/supabase-config.js for the Supabase client.
//
// A player can
//  - see the list of clubs   -> public.clubs (RLS: signed in)
//  - send a join request     -> public.join_requests
//  - see their own request status
//
// The club manager approves the request
// (see js/club-admin.js); approving also
// adds the player to the club roster.
// ==========================================

(function () {

  if (!window.AUTH) return;

  // Only a signed-in Player may use this panel
  if (!AUTH.requireRole(AUTH.ROLES.PLAYER)) return;

  var selectEl = document.getElementById("joinClub");
  var noteEl = document.getElementById("joinNote");
  var form = document.getElementById("joinClubForm");
  var statusEl = document.getElementById("joinStatus");

  function sb() {
    return window.SB || null;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function setStatus(text, isError) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.style.color = isError ? "#e5534b" : "";
  }

  function errText(err) {
    return (err && err.message) ? err.message : "Unknown error";
  }

  var myId = null;
  var clubNames = {};

  /* ---------- who am I (Supabase user id) ---------- */

  function me() {
    if (!sb()) return Promise.resolve(null);

    return sb().auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      myId = session && session.user ? session.user.id : null;
      return myId;
    }).catch(function () {
      return null;
    });
  }

  /* ---------- clubs ---------- */

  function loadClubs() {
    if (!selectEl || !sb()) return Promise.resolve();

    return sb().from("clubs")
      .select("id, name")
      .order("name")
      .then(function (res) {
        var rows = (res && res.data) || [];
        selectEl.innerHTML = '<option value="">Select a club</option>';

        if (!rows.length) {
          selectEl.innerHTML = '<option value="">No clubs registered yet</option>';
          return;
        }

        rows.forEach(function (club) {
          clubNames[club.id] = club.name;
          var opt = document.createElement("option");
          opt.value = club.id;
          opt.textContent = club.name;
          selectEl.appendChild(opt);
        });
      })
      .catch(function () {
        selectEl.innerHTML = '<option value="">Could not load clubs</option>';
      });
  }

  /* ---------- my request ---------- */

  function loadMyRequest() {
    if (!sb() || !myId) return Promise.resolve();

    return sb().from("join_requests")
      .select("id, club_id, status, created_at")
      .eq("player_id", myId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(function (res) {
        var row = res && res.data && res.data.length ? res.data[0] : null;

        if (!row) {
          setStatus("Pick a club and send a request — the club manager approves it.");
          return;
        }

        var club = clubNames[row.club_id] || ("club #" + row.club_id);

        if (row.status === "pending") {
          setStatus("Request sent to " + club + " — waiting for the manager's approval.");
        } else if (row.status === "approved") {
          setStatus("You are a member of " + club + ".");
        } else {
          setStatus("Your request to " + club + " was rejected. You can try another club.");
        }
      })
      .catch(function () { /* keep the default text */ });
  }

  /* ---------- send a request ---------- */

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!sb()) { setStatus("Supabase is not connected.", true); return; }
      if (!myId) { setStatus("Please log out and log in again.", true); return; }

      var clubId = selectEl ? selectEl.value : "";
      var note = noteEl ? noteEl.value.trim() : "";

      if (!clubId) { setStatus("Please select a club first.", true); return; }

      setStatus("Sending request…");

      sb().from("join_requests").insert([{
        player_id: myId,
        club_id: Number(clubId),
        note: note,
        status: "pending"
      }]).then(function (res) {
        if (res && res.error) {
          var message = errText(res.error);
          if (/duplicate|unique/i.test(message)) {
            message = "You already sent a request for this club.";
          }
          setStatus(message, true);
          return;
        }
        if (noteEl) noteEl.value = "";
        loadMyRequest();
      }).catch(function (err) {
        setStatus(errText(err), true);
      });
    });
  }

  /* ---------- start ---------- */

  me().then(function () {
    return loadClubs();
  }).then(function () {
    return loadMyRequest();
  });

})();
