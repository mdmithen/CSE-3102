/* ==========================================
   PLAYER DASHBOARD - Live Supabase data
   Replaces all DEMO_* objects with live queries.
   ========================================== */

/* ---------- helpers ---------- */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function fill(el, value) {
  if (el) el.textContent = value;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d + " " + MONTHS[Number(m) - 1] + " " + y;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2)
             .map(part => part[0].toUpperCase()).join("");
}

function avatarHue(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return hash % 360;
}

function toast(message) {
  const box = $("#pdToast");
  if (!box) return;
  box.textContent = message;
  box.hidden = false;
  clearTimeout(box._timer);
  box._timer = setTimeout(() => { box.hidden = true; }, 2600);
}

function setStatus(text, isError) {
  const el = $("#pdStatus");
  if (!el) return;
  el.textContent = text || "";
  el.style.color = isError ? "#e5534b" : "";
}

function errText(err) {
  return (err && err.message) ? err.message : "Unknown error";
}

/* ---------- supabase client ---------- */

function sb() {
  return window.SB || null;
}

/* ---------- live state ---------- */

let myProfile = null;   /* from public.profiles */
let myPlayer = null;    /* from public.players */
let myClub = null;      /* from public.clubs */
let myClubId = null;
let myRoster = [];      /* players at my club */

/* ---------- load player data ---------- */

function loadMyData() {
  const sbc = sb();
  if (!sbc) { setStatus("Supabase not connected.", true); return; }

  return sbc.auth.getSession().then(function (res) {
    const session = res && res.data ? res.data.session : null;
    if (!session || !session.user) {
      setStatus("Not signed in.", true);
      return;
    }
    const authId = session.user.id;

    /* 1. profiles */
    return sbc.from("profiles").select("*").eq("id", authId).maybeSingle()
      .then(function (pres) {
        if (pres && pres.error) throw pres.error;
        myProfile = pres && pres.data ? pres.data : null;
        if (!myProfile) {
          setStatus("No player profile found.", true);
          return;
        }

        /* 2. players (by profile_id) */
        return sbc.from("players").select("*").eq("profile_id", myProfile.id).maybeSingle()
          .then(function (plres) {
            if (plres && plres.error) throw plres.error;
            myPlayer = plres && plres.data ? plres.data : null;
            if (!myPlayer) {
              setStatus("No player record found.", true);
              return;
            }
            myClubId = myPlayer.club_id;

            /* 3. club */
            if (myClubId) {
              return sbc.from("clubs").select("*").eq("id", myClubId).maybeSingle()
                .then(function (cres) {
                  if (cres && cres.error) throw cres.error;
                  myClub = cres && cres.data ? cres.data : null;
                });
            }
          });
      });
  }).catch(function (err) {
    console.error("loadMyData error:", err);
    setStatus(errText(err), true);
  });
}

/* ---------- load club roster ---------- */

function loadRoster() {
  const sbc = sb();
  if (!sbc || !myClubId) return;

  sbc.from("players").select("*").eq("club_id", myClubId).order("full_name")
    .then(function (res) {
      if (res && res.error) throw res.error;
      myRoster = res && res.data ? res.data : [];
      renderRoster();
      renderMembers();
    }).catch(function (err) {
      console.error("loadRoster error:", err);
    });
}

/* ---------- load matches ---------- */

function loadMatches() {
  const sbc = sb();
  if (!sbc || !myClubId) return;

  sbc.from("matches").select("*")
    .or(`home_club_id.eq.${myClubId},away_club_id.eq.${myClubId}`)
    .order("match_date", { ascending: false })
    .then(function (res) {
      if (res && res.error) throw res.error;
      const matches = res && res.data ? res.data : [];
      renderMatches(matches);
      renderRecentResults(matches);
    }).catch(function (err) {
      console.error("loadMatches error:", err);
    });
}

/* ---------- UI rendering ---------- */

function renderIdentity() {
  const user = playerSession();
  fill($("#sideName"), (user && user.name) || (myProfile && myProfile.full_name) || "Player");
  fill($("#sideMeta"), (myPlayer && myPlayer.club_id ? "Club ID: " + myPlayer.club_id : "—"));

  fill($("#welcomeName"), (myProfile && myProfile.full_name) || "Player");
  fill($("#welcomeLine"), (myClub && myClub.name ? myClub.name : "No club") + " · " + (myPlayer && myPlayer.position ? myPlayer.position : "Player"));
  fill($("#welcomeStatus"), (myPlayer && myPlayer.status ? myPlayer.status : "Active"));
  fill($("#avatar").alt, ((myProfile && myProfile.full_name) || "Player") + " avatar");

  const chips = [];
  if (myClub && myClub.name) chips.push("Club: " + esc(myClub.name));
  if (myPlayer && myPlayer.position) chips.push("Position: " + esc(myPlayer.position));
  if (myProfile && myProfile.full_name) chips.push("Player: " + esc(myProfile.full_name));
  $("#welcomeChips").innerHTML = chips.map(t => '<span class="pd-chip">' + esc(t) + "</span>").join("");

  fill($("#cardName"), (myProfile && myProfile.full_name) || "Player");
  fill($("#cardId"), (myPlayer && myPlayer.id ? "PLY-" + String(myPlayer.id).padStart(3, "0") : "—"));
  fill($("#cardStatus"), (myPlayer && myPlayer.status ? myPlayer.status : "Active"));
  const cardAvatar = $("#cardAvatar");
  if (cardAvatar) {
    cardAvatar.textContent = initials((myProfile && myProfile.full_name) || "P");
    cardAvatar.style.setProperty("--h", avatarHue((myProfile && myProfile.full_name) || "P"));
  }
  fill($("#cardClub"), (myClub && myClub.name) || "—");
  fill($("#cardSport"), (myPlayer && myPlayer.position ? myPlayer.position : "—"));
  fill($("#cardPosition"), (myPlayer && myPlayer.position ? myPlayer.position : "—"));
  fill($("#cardJerseyNo"), (myPlayer && myPlayer.jersey_no ? myPlayer.jersey_no : "—"));
}

function playerSession() {
  if (!window.AUTH) return null;
  return AUTH.currentUser();
}

function renderStatCards() {
  const wins = myRoster.filter(p => p.status === "Active").length;
  const total = myRoster.length;

  const cards = [
    { value: total, label: "Club Members", foot: "Total roster" },
    { value: wins, label: "Active Players", foot: "Active status" },
    { value: myClub ? 1 : 0, label: "My Club", foot: myClub ? myClub.name : "None" },
    { value: myClub && myClub.district_id ? 1 : 0, label: "District", foot: "Club district" }
  ];

  $("#statCards").innerHTML = cards.map(c => (
    '<div class="pd-stat">' +
      '<span class="pd-stat-icon" aria-hidden="true"></span>' +
      "<b>" + esc(c.value) + "</b>" +
      "<small>" + esc(c.label) + "</small>" +
      '<span class="pd-stat-foot">' + esc(c.foot) + "</span>" +
    "</div>"
  )).join("");
}

function renderRoster() {
  const host = $("#clubMemberStrip");
  if (!host) return;

  if (!myRoster.length) {
    host.innerHTML = '<div class="pd-empty-inline"><b>No members yet</b></div>';
    return;
  }

  host.innerHTML = myRoster.map(p => (
    '<button type="button" class="pd-strip-member" data-member="' + esc(p.id) + '">' +
      '<span class="pd-avatar" style="--h:' + avatarHue(String(p.id)) + '">' + esc(initials(p.full_name || "P")) + "</span>" +
      "<b>" + esc(p.full_name) + "</b>" +
      "<small>" + esc(p.position || "—") + "</small>" +
      (p.status === "Active" ? '<span class="pd-you-tag">Active</span>' : "") +
    "</button>"
  )).join("");
}

function renderMembers() {
  const host = $("#memberGrid");
  if (!host) return;

  const total = myRoster.length;
  fill($("#memberCount"), total + " members");
  fill($("#memberCountText"), "All " + total + " club members");

  if (!myRoster.length) {
    host.innerHTML = '<div class="pd-empty-inline"><b>No members</b></div>';
    return;
  }

  host.innerHTML = myRoster.map(p => {
    const badge = p.status === "Active"
      ? '<span class="pd-badge pd-badge-green">Active</span>'
      : '<span class="pd-badge pd-badge-yellow">' + esc(p.status || "—") + "</span>";
    return (
      '<article class="pd-member-card" data-member="' + esc(p.id) + '" tabindex="0" role="button">' +
        '<div class="pd-member-top">' +
          '<span class="pd-avatar" style="--h:' + avatarHue(String(p.id)) + '">' + esc(initials(p.full_name || "P")) + "</span>" +
          "<div>" +
            "<h4>" + esc(p.full_name) + "</h4>" +
            "<small>ID: " + esc(p.id) + "</small>" +
          "</div>" +
          '<span class="pd-member-jersey">' + esc(p.jersey_no || "—") + "</span>" +
        "</div>" +
        '<div class="pd-member-tags">' +
          '<span class="pd-chip">' + esc(p.position || "—") + "</span>" +
          '<span class="pd-chip">District: ' + esc(myClub && myClub.district_id ? myClub.district_id : "—") + "</span>" +
        "</div>" +
        '<div class="pd-member-foot">' + badge +
          '<button type="button" class="pd-member-view" data-member="' + esc(p.id) + '">View profile →</button>' +
        "</div>" +
      "</article>"
    );
  }).join("");
}

function renderClubInfo() {
  fill($("#clubName"), (myClub && myClub.name) || "No club assigned");
  fill($("#clubMeta"), (myPlayer && myPlayer.club_id ? "Club ID: " + myPlayer.club_id : "—") + " · Status: " + esc(myClub && myClub.status ? myClub.status : "—"));

  const chips = [];
  if (myClub && myClub.status) chips.push("Status: " + esc(myClub.status));
  if (myClub && myClub.address) chips.push("Address: " + esc(myClub.address));
  if (myClub && myClub.phone) chips.push("Phone: " + esc(myClub.phone));
  if (myClub && myClub.email) chips.push("Email: " + esc(myClub.email));
  $("#clubChips").innerHTML = chips.map(t => '<span class="pd-chip">' + esc(t) + "</span>").join("");

  const stats = [];
  stats.push([myRoster.length, "Club members"]);
  stats.push([myRoster.filter(p => p.status === "Active").length, "Active"]);
  if (myClub && myClub.phone) stats.push([myClub.phone, "Contact"]);
  if (myClub && myClub.email) stats.push([myClub.email, "Email"]);
  $("#clubStats").innerHTML = stats.map(([v, l]) => "<div><b>" + esc(v) + "</b><small>" + esc(l) + "</small></div>").join("");

  const mgmt = [
    ["Club Name", myClub && myClub.name ? myClub.name : "—"],
    ["Club ID", myClub ? "DSC-" + String(myClub.id).padStart(3, "0") : "—"],
    ["Manager", myClub && myClub.manager_id ? "Assigned" : "—"],
    ["Contact", myClub && myClub.phone ? myClub.phone : "—"],
    ["Email", myClub && myClub.email ? myClub.email : "—"],
    ["Address", myClub && myClub.address ? myClub.address : "—"],
    ["Status", myClub && myClub.status ? myClub.status : "—"]
  ];
  $("#clubManagement").innerHTML = mgmt.map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("");

  const contact = [
    ["Club ID", myClub ? "DSC-" + String(myClub.id).padStart(3, "0") : "—"],
    ["Address", myClub && myClub.address ? myClub.address : "—"],
    ["Contact", myClub && myClub.phone ? myClub.phone : "—"],
    ["Email", myClub && myClub.email ? myClub.email : "—"],
    ["Status", myClub && myClub.status ? myClub.status : "—"],
    ["Members", myRoster.length + " registered"]
  ];
  $("#clubContact").innerHTML = contact.map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("");
}

function renderProfileDetails() {
  const rows = [
    ["Player Name", myProfile && myProfile.full_name ? myProfile.full_name : "—"],
    ["Player ID", myPlayer ? "PLY-" + String(myPlayer.id).padStart(3, "0") : "—"],
    ["Email", myProfile && myProfile.full_name ? "Check profiles table" : "—"],
    ["Contact Number", myProfile && myProfile.phone ? myProfile.phone : "—"],
    ["Date of Birth", myPlayer && myPlayer.dob ? formatDate(myPlayer.dob) : "—"],
    ["Gender", myPlayer && myPlayer.gender ? myPlayer.gender : "—"],
    ["Position", myPlayer && myPlayer.position ? myPlayer.position : "—"],
    ["Jersey Number", myPlayer && myPlayer.jersey_no ? myPlayer.jersey_no : "—"],
    ["Club", myClub && myClub.name ? myClub.name : "—"],
    ["District", myClub && myClub.district_id ? myClub.district_id : "—"],
    ["Status", myPlayer && myPlayer.status ? myPlayer.status : "—"]
  ];
  $("#profileDetails").innerHTML = rows.map(([k, v]) =>
    "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>"
  ).join("");
}

function renderMatches(matches) {
  const host = $("#fixtureList");
  if (!host) return;

  const upcoming = matches.filter(m => m.status === "scheduled" || m.status === "upcoming").slice(0, 5);

  if (!upcoming.length) {
    host.innerHTML = '<div class="pd-empty-inline"><b>No fixtures scheduled</b></div>';
    return;
  }

  host.innerHTML = upcoming.map(m => {
    const oppClubId = m.home_club_id === myClubId ? m.away_club_id : m.home_club_id;
    return (
      '<div class="pd-match">' +
        "<div>" +
          "<h4>vs Club #" + esc(oppClubId) + "</h4>" +
          '<small>' + esc(formatDate(m.match_date)) + "</small>" +
        "</div>" +
        '<div class="pd-match-vs"><span class="pd-match-result pd-result-upcoming">Upcoming</span></div>' +
      "</div>"
    );
  }).join("");
}

function renderRecentResults(matches) {
  const host = $("#recentResults");
  if (!host) return;

  const played = matches.filter(m => m.status === "completed" || m.status === "finished").slice(0, 5);

  if (!played.length) {
    host.innerHTML = '<div class="pd-empty-inline"><b>No results yet</b></div>';
    return;
  }

  host.innerHTML = played.map(m => {
    const oppClubId = m.home_club_id === myClubId ? m.away_club_id : m.home_club_id;
    const myScore = m.home_club_id === myClubId ? m.home_score : m.away_score;
    const oppScore = m.home_club_id === myClubId ? m.away_score : m.home_score;
    const result = myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw";
    return (
      '<div class="pd-match">' +
        "<div>" +
          "<h4>vs Club #" + esc(oppClubId) + "</h4>" +
          '<small>' + esc(myScore + " - " + oppScore) + "</small>" +
          '<span class="pd-match-result pd-result-' + result + '">' +
            (result === "win" ? "Win" : result === "loss" ? "Loss" : "Draw") +
          "</span>" +
        "</div>" +
        '<div class="pd-match-vs"><small>' + esc(formatDate(m.match_date)) + "</small></div>" +
      "</div>"
    );
  }).join("");
}

/* ---------- session guard ---------- */

function playerSession() {
  if (!window.AUTH) return null;
  return AUTH.currentUser();
}

/* ---------- panel switching (existing HTML structure) ---------- */

const $pdPanels = $("#pdPanels");

function showPanel(name) {
  const panels = document.querySelectorAll("#pdPanels section[id^='view-']");
  panels.forEach(function (p) {
    const on = p.id === "view-" + name;
    p.classList.toggle("is-active", on);
    p.hidden = !on;
  });
  const links = document.querySelectorAll(".pd-nav a");
  links.forEach(function (a) {
    a.classList.toggle("is-active", a.getAttribute("data-view") === name);
  });
  const titleEl = $("#viewTitle");
  const subEl = $("#viewSubtitle");
  const titles = {
    dashboard:   ["Dashboard", "Overview of your season at a glance."],
    profile:     ["My Profile", "Your registered player information."],
    club:        ["My Club", "Club details and roster."],
    members:     ["Club Members", "Everyone registered at your club."],
    performance: ["My Performance", "Statistics from current data."],
    rankings:    ["My Rankings", "Your standing in the club."],
    notices:     ["Notices", "Announcements from your club."],
    matches:     ["Matches & Tournaments", "Fixtures and results."],
    settings:    ["Settings", "Update your preferences."]
  };
  const t = titles[name] || titles.dashboard;
  if (titleEl) titleEl.textContent = t[0];
  if (subEl) subEl.textContent = t[1];
}

/* ---------- init ---------- */

(function () {
  if (!window.AUTH) return;
  if (!AUTH.requireRole(AUTH.ROLES.PLAYER)) return;

  const user = AUTH.currentUser();
  if (user) {
    fill($("#sideName"), user.name || "Player");
    fill($("#sideMeta"), "PLY · " + (myClubId ? myClubId : "—"));
  }

  /* logout buttons */
  $$("#logoutBtn, #logoutBtn2").forEach(function (btn) {
    if (btn) btn.addEventListener("click", function (e) {
      e.preventDefault();
      AUTH.logout();
    });
  });

  /* nav switching */
  const nav = $(".pd-nav");
  if (nav) {
    nav.addEventListener("click", function (e) {
      const link = e.target.closest("a[data-view]");
      if (!link) return;
      e.preventDefault();
      showPanel(link.getAttribute("data-view"));
    });
  }

  /* burger menu */
  const burger = $("#pdBurger");
  const sidebar = $("#pdSidebar");
  const overlay = $("#pdOverlay");
  if (burger && sidebar) {
    burger.addEventListener("click", function () {
      const open = sidebar.classList.contains("is-open");
      sidebar.classList.toggle("is-open");
      if (overlay) overlay.hidden = open;
      burger.setAttribute("aria-expanded", String(!open));
    });
  }
  if (overlay) overlay.addEventListener("click", function () {
    if (sidebar) sidebar.classList.remove("is-open");
    overlay.hidden = true;
    if (burger) burger.setAttribute("aria-expanded", "false");
  });

  /* load data then render */
  loadMyData().then(function () {
    renderIdentity();
    renderStatCards();
    renderClubInfo();
    renderProfileDetails();
    return loadRoster();
  }).then(function () {
    return loadMatches();
  }).then(function () {
    setStatus("Data loaded from database.");
  }).catch(function (err) {
    console.error("init error:", err);
    setStatus(errText(err), true);
  });

  /* default panel */
  showPanel("dashboard");

})();
