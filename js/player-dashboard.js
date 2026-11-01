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
let myNotices = [];     /* notices for my club */

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

/* ---------- load & render notices ---------- */

function getReadNoticeIds() {
  try {
    return JSON.parse(localStorage.getItem("ds_read_notices") || "[]");
  } catch (e) {
    return [];
  }
}

function markNoticeAsRead(id) {
  const ids = getReadNoticeIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem("ds_read_notices", JSON.stringify(ids));
  }
}

function updateNoticeCount() {
  const readIds = getReadNoticeIds();
  const unreadCount = myNotices.filter(n => !readIds.includes(n.id)).length;
  fill($("#noticeCount"), String(unreadCount || myNotices.length || 0));
}

function loadNotices() {
  const sbc = sb();
  if (!sbc) return Promise.resolve();

  let query = sbc.from("notices").select("*").order("created_at", { ascending: false }).limit(30);

  if (myClubId) {
    query = query.or(`club_id.eq.${myClubId},club_id.is.null`);
  } else {
    query = query.is("club_id", null);
  }

  return query.then(function (res) {
    if (res && res.error) throw res.error;
    myNotices = (res && res.data) || [];
    renderNoticesList();
    renderNoticeSnapshot();
    updateNoticeCount();
  }).catch(function (err) {
    console.warn("loadNotices error:", err);
  });
}

function renderNoticesList(filter) {
  const host = $("#noticeList");
  const empty = $("#noticeEmpty");
  if (!host) return;

  filter = filter !== undefined ? filter : ($("#noticeFilter") ? $("#noticeFilter").value : "");
  const readIds = getReadNoticeIds();

  let items = myNotices.slice();
  if (filter === "unread") {
    items = items.filter(n => !readIds.includes(n.id));
  } else if (filter === "read") {
    items = items.filter(n => readIds.includes(n.id));
  } else if (filter === "high") {
    items = items.filter(n => {
      const cat = String(n.category || "").toLowerCase();
      return cat === "important" || cat === "urgent" || cat === "high";
    });
  }

  if (!items.length) {
    host.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  host.innerHTML = items.map(n => {
    const isRead = readIds.includes(n.id);
    const cat = n.category || "General";
    const isImportant = /important|urgent|high/i.test(cat);
    const priorityClass = isImportant ? "pd-priority-high" : "pd-priority-normal";
    const unreadClass = !isRead ? "is-unread" : "";
    const dateStr = n.created_at ? formatDate(n.created_at.slice(0, 10)) : "";
    const scopeLabel = n.club_id ? (myClub && myClub.name ? myClub.name : "Your Club Notice") : "General Notice";

    return (
      '<li class="pd-notice ' + unreadClass + '" data-notice-id="' + esc(n.id) + ' style="margin-bottom:10px;">' +
        '<span class="pd-notice-icon" aria-hidden="true" style="font-size:20px; line-height:1;">📢</span>' +
        '<div style="flex:1; min-width:0;">' +
          '<div class="pd-notice-head">' +
            '<h4>' + esc(n.title) + '</h4>' +
            '<span class="pd-priority ' + priorityClass + '">' + esc(cat) + '</span>' +
            '<span class="pd-chip" style="font-size:11px;">' + esc(scopeLabel) + '</span>' +
            (!isRead ? '<span class="pd-unread-dot" title="Unread"></span>' : '') +
          '</div>' +
          '<p style="white-space:pre-line; margin:6px 0; font-size:13px; line-height:1.5;">' + esc(n.body) + '</p>' +
          (dateStr ? '<span class="pd-notice-meta">Posted on ' + esc(dateStr) + '</span>' : '') +
        '</div>' +
        '<div class="pd-notice-actions">' +
          (!isRead ? '<button type="button" class="pd-notice-action" data-mark-read="' + esc(n.id) + '">Mark read</button>' : '') +
        '</div>' +
      '</li>'
    );
  }).join("");

  Array.from(host.querySelectorAll("button[data-mark-read]")).forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const id = Number(btn.getAttribute("data-mark-read"));
      markNoticeAsRead(id);
      renderNoticesList();
      renderNoticeSnapshot();
      updateNoticeCount();
    });
  });
}

function renderNoticeSnapshot() {
  const host = $("#noticeSnapshot");
  if (!host) return;

  if (!myNotices.length) {
    host.innerHTML = '<div class="pd-empty-inline"><b>No notices yet</b><p style="font-size:12px; color:var(--pd-muted); margin-top:4px;">Announcements from your club manager will appear here.</p></div>';
    return;
  }

  const topItems = myNotices.slice(0, 3);
  const readIds = getReadNoticeIds();

  host.innerHTML = '<div style="display:grid; gap:8px;">' + topItems.map(n => {
    const isRead = readIds.includes(n.id);
    const dateStr = n.created_at ? formatDate(n.created_at.slice(0, 10)) : "";
    const cat = n.category || "General";
    const isImportant = /important|urgent|high/i.test(cat);
    const priorityClass = isImportant ? "pd-priority-high" : "pd-priority-normal";

    return (
      '<div class="pd-notice ' + (!isRead ? 'is-unread' : '') + '" style="padding:10px 12px; margin:0;">' +
        '<span class="pd-notice-icon" style="font-size:16px;">📢</span>' +
        '<div style="flex:1; min-width:0;">' +
          '<div class="pd-notice-head" style="margin-bottom:2px;">' +
            '<h4 style="font-size:12px;">' + esc(n.title) + '</h4>' +
            '<span class="pd-priority ' + priorityClass + '" style="font-size:9px;">' + esc(cat) + '</span>' +
          '</div>' +
          '<p style="font-size:12px; margin:2px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + esc(n.body) + '</p>' +
          (dateStr ? '<small class="pd-notice-meta" style="font-size:10px;">' + esc(dateStr) + '</small>' : '') +
        '</div>' +
      '</div>'
    );
  }).join("") + '</div>';
}

/* ---------- load & render player equipment ---------- */

function loadPlayerEquipment() {
  const sbc = sb();
  const host = $("#playerEquipList");
  const countBadge = $("#playerEquipCount");
  const empty = $("#playerEquipEmpty");
  if (!sbc || !host) return Promise.resolve();

  if (!myClubId) {
    host.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--pd-muted); padding:20px;">No club assigned yet.</td></tr>';
    return Promise.resolve();
  }

  return sbc.from("equipment")
    .select("*")
    .eq("club_id", myClubId)
    .order("name")
    .then(function (res) {
      if (res && res.error) throw res.error;
      const items = (res && res.data) || [];

      if (countBadge) countBadge.textContent = items.length + (items.length === 1 ? " item" : " items");

      if (!items.length) {
        host.innerHTML = "";
        if (empty) empty.hidden = false;
        return;
      }

      if (empty) empty.hidden = true;

      host.innerHTML = items.map(function (eq) {
        const conditionClass = /good|brand new/i.test(eq.condition) ? "pd-badge-green" : /needs repair|damaged/i.test(eq.condition) ? "pd-badge-red" : "pd-badge-yellow";
        return (
          "<tr>" +
            "<td><b>" + esc(eq.name) + "</b></td>" +
            "<td><span class=\"pd-chip\" style=\"font-size:11px;\">" + esc(eq.category || "General") + "</span></td>" +
            "<td><b>" + esc(eq.quantity || 1) + "</b></td>" +
            "<td><span class=\"pd-badge " + conditionClass + "\">" + esc(eq.condition || "Good") + "</span></td>" +
            "<td>" + esc(eq.notes || "—") + "</td>" +
          "</tr>"
        );
      }).join("");
    })
    .catch(function (err) {
      console.warn("[EQUIPMENT] Player load error:", err);
      host.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--pd-muted); padding:20px;">Could not load equipment.</td></tr>';
    });
}


/* ---------- load & render player stats (from club manager) ---------- */

function loadPlayerStats() {
  const sbc = sb();
  if (!sbc) return Promise.resolve();

  const perfGrid    = $("#perfGrid");
  const perfTable   = $("#perfTable");
  const awardsList  = $("#awardsList");
  const seasonLabel = $("#perfSeasonLabel");

  if (!perfGrid && !perfTable) return Promise.resolve();

  // Try by numeric player_id first, fallback by name+club
  const playerId = myPlayer && myPlayer.id;
  const clubId   = myClubId;

  let query = sbc.from("player_stats").select("*");

  if (playerId) {
    query = query.eq("player_id", playerId);
  } else if (clubId && myProfile && myProfile.full_name) {
    query = query.eq("club_id", clubId).eq("player_name", myProfile.full_name);
  } else {
    renderNoStats();
    return Promise.resolve();
  }

  return query.order("season", { ascending: false })
    .then(function (res) {
      if (res && res.error) throw res.error;
      const rows = (res && res.data) || [];
      if (!rows.length) {
        renderNoStats();
        return;
      }
      renderStatsData(rows);
    })
    .catch(function (err) {
      console.warn("[STATS] load error:", err);
      renderNoStats();
    });
}

function renderNoStats() {
  const perfGrid   = $("#perfGrid");
  const perfTable  = $("#perfTable");
  const awardsList = $("#awardsList");
  const seasonLabel = $("#perfSeasonLabel");

  if (seasonLabel) seasonLabel.textContent = "No stats recorded yet by club manager.";

  if (perfGrid) perfGrid.innerHTML =
    '<p style="color:var(--pd-muted);padding:20px;grid-column:1/-1;text-align:center;">' +
    'No performance stats have been added by your club manager yet.</p>';

  if (perfTable) perfTable.innerHTML =
    '<tr><td colspan="7" style="text-align:center;color:var(--pd-muted);padding:16px;">' +
    'No stats recorded yet.</td></tr>';

  if (awardsList) awardsList.innerHTML =
    '<li style="color:var(--pd-muted);">No achievements recorded yet.</li>';
}

function renderStatsData(rows) {
  const perfGrid    = $("#perfGrid");
  const perfTable   = $("#perfTable");
  const awardsList  = $("#awardsList");
  const seasonLabel = $("#perfSeasonLabel");

  // Aggregate totals across all rows
  let totalMatches = 0, totalGoals = 0, totalAssists = 0;
  let totalMinutes = 0, totalCleanSheets = 0, totalYellow = 0;
  let totalRed = 0, totalMOTM = 0, bestRating = 0;
  let totalRuns = 0, totalWickets = 0;
  let latestSeason = "";

  rows.forEach(function (r) {
    totalMatches     += r.matches_played  || 0;
    totalGoals       += r.goals           || 0;
    totalAssists     += r.assists         || 0;
    totalMinutes     += r.minutes_played  || 0;
    totalCleanSheets += r.clean_sheets    || 0;
    totalYellow      += r.yellow_cards    || 0;
    totalRed         += r.red_cards       || 0;
    totalMOTM        += r.motm_awards     || 0;
    totalRuns        += r.runs            || 0;
    totalWickets     += r.wickets         || 0;
    if (r.rating && r.rating > bestRating) bestRating = r.rating;
    if (!latestSeason && r.season) latestSeason = r.season;
  });

  if (seasonLabel) {
    seasonLabel.textContent = latestSeason
      ? "Season " + latestSeason + " · " + rows.length + " record(s)"
      : rows.length + " record(s) from club manager";
  }

  /* ── Season Summary grid ── */
  if (perfGrid) {
    const sport = (rows[0] && rows[0].sport) ? rows[0].sport.toLowerCase() : "";
    const isCricket = /cricket/i.test(sport);

    const statCards = isCricket
      ? [
          { label: "Matches", value: totalMatches, icon: "🏏" },
          { label: "Runs",    value: totalRuns,    icon: "🏃" },
          { label: "Wickets", value: totalWickets, icon: "🎯" },
          { label: "MOTM",    value: totalMOTM,    icon: "🏆" },
          { label: "Rating",  value: bestRating ? bestRating.toFixed(1) : "—", icon: "⭐" },
        ]
      : [
          { label: "Matches",      value: totalMatches,     icon: "⚽" },
          { label: "Goals",        value: totalGoals,        icon: "🥅" },
          { label: "Assists",      value: totalAssists,      icon: "🅰️" },
          { label: "Minutes",      value: totalMinutes,      icon: "⏱️" },
          { label: "Clean Sheets", value: totalCleanSheets,  icon: "🧤" },
          { label: "Yellow Cards", value: totalYellow,       icon: "🟨" },
          { label: "Red Cards",    value: totalRed,          icon: "🟥" },
          { label: "MOTM Awards",  value: totalMOTM,         icon: "🏆" },
          { label: "Best Rating",  value: bestRating ? bestRating.toFixed(1) : "—", icon: "⭐" },
        ];

    perfGrid.innerHTML = statCards.map(function (c) {
      return (
        '<div class="pd-stat-card">' +
          '<div class="pd-stat-icon">' + c.icon + '</div>' +
          '<div class="pd-stat-val">' + c.value + '</div>' +
          '<div class="pd-stat-lbl">' + c.label + '</div>' +
        '</div>'
      );
    }).join("");
  }

  /* ── Performance by Competition table ── */
  if (perfTable) {
    perfTable.innerHTML = rows.map(function (r) {
      const comp = r.tournament_id ? ("Tournament #" + r.tournament_id) : (r.season ? "Season " + r.season : "Overall");
      return (
        "<tr>" +
          "<td><b>" + esc(comp) + "</b></td>" +
          "<td>" + (r.matches_played || 0) + "</td>" +
          "<td>—</td>" +
          "<td>—</td>" +
          "<td>—</td>" +
          "<td><b>" + (r.goals    || 0) + "</b></td>" +
          "<td>"     + (r.assists  || 0) + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  /* ── Achievements list ── */
  if (awardsList) {
    const items = [];
    if (totalMOTM > 0)        items.push("🏆 Man of the Match × " + totalMOTM);
    if (totalGoals >= 10)     items.push("⚽ 10+ Goals in a season");
    if (totalAssists >= 5)    items.push("🅰️ 5+ Assists");
    if (totalCleanSheets >= 5) items.push("🧤 5+ Clean Sheets");
    if (bestRating >= 8)      items.push("⭐ High Rated (≥ 8.0)");
    if (totalRuns >= 100)     items.push("🏏 100+ Runs");
    if (totalWickets >= 10)   items.push("🎯 10+ Wickets");

    awardsList.innerHTML = items.length
      ? items.map(function (i) { return '<li>' + i + '</li>'; }).join("")
      : '<li style="color:var(--pd-muted);">Keep playing to earn achievements!</li>';
  }
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
    equipment:   ["Club Equipment", "Equipment and sports gear available at your club."],
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

  /* nav and shortcut links */
  document.addEventListener("click", function (e) {
    const link = e.target.closest("a[data-view]");
    if (!link) return;
    e.preventDefault();
    showPanel(link.getAttribute("data-view"));
  });

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

  /* notice filter and mark all read controls */
  const filterSelect = $("#noticeFilter");
  if (filterSelect) {
    filterSelect.addEventListener("change", function (e) {
      renderNoticesList(e.target.value);
    });
  }
  const readAllBtn = $("#readAllBtn");
  if (readAllBtn) {
    readAllBtn.addEventListener("click", function () {
      myNotices.forEach(n => markNoticeAsRead(n.id));
      renderNoticesList();
      renderNoticeSnapshot();
      updateNoticeCount();
      toast("All notices marked as read.");
    });
  }
  const emptyClearBtn = $("#noticeEmptyClear");
  if (emptyClearBtn) {
    emptyClearBtn.addEventListener("click", function () {
      if (filterSelect) filterSelect.value = "";
      renderNoticesList("");
    });
  }

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
    return loadNotices();
  }).then(function () {
    return loadPlayerEquipment();
  }).then(function () {
    return loadPlayerStats();
  }).then(function () {
    setStatus("Data loaded from database.");
  }).catch(function (err) {
    console.error("init error:", err);
    setStatus(errText(err), true);
  });

  /* default panel */
  showPanel("dashboard");

})();
