/* ==========================================
   PLAYER DASHBOARD - JavaScript
   Part 1 demo build. No database, no Supabase.
   All content comes from the DEMO_* objects
   below, so the whole page stays consistent.
   ========================================== */

/* ---------- DEMO DATA (no backend yet) ---------- */
const DEMO_PLAYER = {
  playerId: "PLY-001",
  name: "Rahim Ahmed",
  email: "player@gmail.com",
  profileEmail: "rahim@example.com",
  phone: "01800000001",
  dob: "2004-03-15",
  age: 21,
  gender: "Male",
  district: "Rajshahi",
  clubId: "DSC-001",
  club: "Rajshahi Sports Club",
  sport: "Football",
  position: "Midfielder",
  jersey: "10",
  foot: "Left",
  status: "Active",
  joined: "2023",
  bio: "Attacking midfielder focusing on set pieces and pressing."
};

const DEMO_CLUB = {
  id: "DSC-001",
  name: "Rajshahi Sports Club",
  established: "2011",
  type: "Football, Cricket, Athletics",
  district: "Rajshahi",
  manager: "Ahmed Rahman",
  managerPhone: "01700000001",
  managerEmail: "manager@rajshahi-sc.com",
  address: "Station Road, Rajshahi Sadar, Rajshahi",
  contact: "01700000001",
  email: "info@rajshahi-sc.com",
  status: "Active",
  clubs: 12,
  players: 145
};

/* Roster data matches the club table already in login-system.html */
const DEMO_MEMBERS = [
  { id: "PLY-001", name: "Rahim Ahmed",    sport: "Football", position: "Midfielder",  district: "Rajshahi", status: "Active",  me: true },
  { id: "PLY-002", name: "Sakib Hasan",    sport: "Cricket",  position: "Batsman",     district: "Dhaka",    status: "Active" },
  { id: "PLY-003", name: "Nayeem Islam",   sport: "Football", position: "Goalkeeper",  district: "Chattogram", status: "Active" },
  { id: "PLY-004", name: "Arif Hossain",   sport: "Badminton", position: "Singles",    district: "Sylhet",    status: "Pending" },
  { id: "PLY-005", name: "Tanvir Hasan",   sport: "Football", position: "Defender",    district: "Rajshahi",  status: "Active" },
  { id: "PLY-006", name: "Imran Kabir",    sport: "Football", position: "Striker",     district: "Rajshahi",  status: "Active" },
  { id: "PLY-007", name: "Sadia Akter",    sport: "Football", position: "Winger",      district: "Sylhet",    status: "Active" },
  { id: "PLY-008", name: "Mehedi Hasan",   sport: "Athletics", position: "Sprinter",   district: "Rajshahi",  status: "Active" }
];

const DEMO_PERFORMANCE = {
  played: 12,
  wins: 7,
  draws: 3,
  losses: 2,
  goals: 7,
  assists: 5,
  yellow: 1,
  red: 0,
  minutes: 980,
  cleanSheets: 0,
  rating: 8.1,
  rank: 3,
  competitions: [
    { name: "District Football Championship 2026", p: 8,  g: 5, a: 3, pts: 21 },
    { name: "Rajshahi Divisional League",          p: 4,  g: 2, a: 2, pts: 9  },
    { name: "National Youth Cup (Qualifiers)",     p: 1,  g: 0, a: 0, pts: 0  }
  ],
  awards: [
    { title: "District Champion 2025",        meta: "Rajshahi Sports Club · Football" },
    { title: "Best Midfielder 2025",          meta: "District Football Championship" },
    { title: "Man of the Match × 3",          meta: "District Football Championship 2026" },
    { title: "Young Player of the Year",      meta: "Rajshahi District Sports Council" }
  ]
};

const DEMO_RANKINGS = [
  { rank: 1, name: "Imran Kabir",  played: 12, goals: 9, points: 28 },
  { rank: 2, name: "Sadia Akter",  played: 12, goals: 8, points: 26 },
  { rank: 3, name: "Rahim Ahmed",  played: 12, goals: 7, points: 24, me: true },
  { rank: 4, name: "Tanvir Hasan", played: 11, goals: 5, points: 20 },
  { rank: 5, name: "Arif Hossain", played: 10, goals: 4, points: 17 }
];

const DEMO_DISTRICTS = [
  { rank: 1, district: "Rajshahi",   points: 265, clubs: 12 },
  { rank: 2, district: "Dhaka",      points: 260, clubs: 18 },
  { rank: 3, district: "Chattogram", points: 250, clubs: 14 },
  { rank: 4, district: "Sylhet",     points: 230, clubs: 10 }
];

const DEMO_RESULTS = [
  { date: "08 Oct 2026", tournament: "District Football Championship", opponent: "Dhaka United Club",  result: "win",  score: "2 - 1" },
  { date: "01 Oct 2026", tournament: "District Football Championship", opponent: "Chattogram Warriors", result: "win", score: "3 - 0" },
  { date: "24 Sep 2026", tournament: "Rajshahi Divisional League",     opponent: "Uttara Sports Club",  result: "draw", score: "1 - 1" },
  { date: "17 Sep 2026", tournament: "District Football Championship", opponent: "Sylhet Sports Academy", result: "loss", score: "0 - 2" },
  { date: "10 Sep 2026", tournament: "District Football Championship", opponent: "Gulshan Tigers",     result: "win",  score: "4 - 1" }
];

const DEMO_FIXTURES = [
  { date: "15 Oct 2026", time: "15:30", tournament: "District Football Championship 2026",
    opponent: "Uttara Sports Club", venue: "Rajshahi Stadium", img: "images/football.jpg" },
  { date: "22 Oct 2026", time: "17:00", tournament: "Rajshahi Divisional League",
    opponent: "Mohammadpur SC", venue: "Divisional Ground", img: "images/football.jpg" }
];

const DEMO_TOURNAMENTS = [
  { icon: "⚽", name: "District Football Championship 2026", meta: "15 Oct 2026 · Rajshahi · 24 clubs", status: "Registered" },
  { icon: "🏏", name: "Inter-District Cricket Tournament",   meta: "28 Oct 2026 · Dhaka · 16 clubs",    status: "Open" },
  { icon: "🏸", name: "National Badminton Championship",    meta: "12 Nov 2026 · Chattogram · 32 players", status: "Open" }
];

const DEMO_NOTICES = [
  { icon: "📅", title: "Training session moved to 4:00 PM",
    body: "Due to the district tournament, Friday training now starts at 4:00 PM on the main field.",
    meta: "Club Manager · 10 Oct 2026", unread: true },
  { icon: "🏆", title: "District Championship squad announced",
    body: "You have been selected in the starting XI. Jersey collection is open at the club office from 2 PM.",
    meta: "Rajshahi Sports Club · 09 Oct 2026", unread: true },
  { icon: "📋", title: "Player ID card renewal",
    body: "Please submit your national ID at the club office before 20 October to keep your digital player card active.",
    meta: "District Council · 05 Oct 2026", unread: true },
  { icon: "⭐", title: "September player of the month",
    body: "Congratulations on being shortlisted for the district player of the month award.",
    meta: "District Council · 30 Sep 2026", unread: false },
  { icon: "⚽", title: "Friendly match against Bogura XI",
    body: "A practice friendly is scheduled. Full squad attendance is expected.",
    meta: "Club Manager · 26 Sep 2026", unread: false }
];

/* ---------- VIEW METADATA ---------- */
const VIEW_META = {
  dashboard:   { title: "Dashboard",              subtitle: "Overview of your season at a glance." },
  profile:     { title: "My Profile",             subtitle: "Your registered player information." },
  club:        { title: "My Club",                subtitle: "Club details, management and contact." },
  members:     { title: "Club Members",           subtitle: "Everyone registered at your club." },
  performance: { title: "My Performance",         subtitle: "Statistics from the current season." },
  rankings:    { title: "My Rankings",            subtitle: "Where you stand in club and district tables." },
  notices:     { title: "Notices",                subtitle: "Announcements from your club and council." },
  matches:     { title: "Matches & Tournaments",  subtitle: "Fixtures, tournaments and match history." },
  settings:    { title: "Settings",               subtitle: "Update your demo profile and preferences." }
};

/* ==========================================
   1. SESSION GUARD
   Uses the shared AUTH module, so the player
   dashboard is opened by the single login
   page and blocked if nobody is signed in.
   ========================================== */
function playerSession() {
  if (!window.AUTH) return null;
  return AUTH.currentUser();
}

/* ---------- helpers ---------- */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

/* Attach data safely — used for every demo string */
function fill(el, value) {
  if (el) el.textContent = value;
}

function toast(message) {
  const box = $("#pdToast");
  if (!box) return;
  box.textContent = message;
  box.hidden = false;
  clearTimeout(box._timer);
  box._timer = setTimeout(() => { box.hidden = true; }, 2600);
}

/* ==========================================
   2. STATIC HEADER + WELCOME CONTENT
   ========================================== */
function renderIdentity() {
  const p = DEMO_PLAYER;
  // Name shown in the sidebar comes from the demo session when available
  const user = playerSession();

  // Sidebar
  fill($("#sideName"), (user && user.name) || p.name);
  fill($("#sideMeta"), p.playerId + " · " + p.district);

  // Top bar
  fill($("#topStatus"), p.status);

  // Welcome
  fill($("#welcomeName"), p.name);
  fill($("#welcomeLine"), p.playerId + " · " + p.club);
  fill($("#welcomeStatus"), p.status);
  fill($("#welcomeSince"), p.joined);
  fill($("#avatar").alt, p.name + " avatar (demo)");

  // Welcome chips: club, district, sport, position, jersey, status
  const chips = [
    "🏟️ " + p.club,
    "📍 " + p.district + " District",
    "⚽ " + p.sport,
    "🎽 " + p.position,
    "🔢 Jersey " + p.jersey,
    "📧 " + p.email
  ];
  $("#welcomeChips").innerHTML = chips
    .map(t => '<span class="pd-chip">' + esc(t) + "</span>")
    .join("");

  // Footer club name reference
  $$(".pd-inline-club").forEach(el => { el.textContent = p.club; });
}

/* ==========================================
   3. DASHBOARD — SUMMARY CARDS
   ========================================== */
function renderStatCards() {
  const perf = DEMO_PERFORMANCE;

  const cards = [
    { icon: "📅", value: perf.played,  label: "Matches Played", foot: perf.minutes + " minutes" },
    { icon: "🥇", value: perf.wins,    label: "Wins",           foot: perf.draws + " draws · " + perf.losses + " losses" },
    { icon: "⚽", value: perf.goals,   label: "Goals",          foot: perf.assists + " assists" },
    { icon: "🎯", value: perf.rating, label: "Avg. Rating",    foot: "Out of 10" },
    { icon: "🏅", value: "#" + perf.rank, label: "Player Ranking", foot: "In club top scorers" }
  ];

  $("#statCards").innerHTML = cards.map(c => (
    '<div class="pd-stat">' +
      '<span class="pd-stat-icon">' + c.icon + "</span>" +
      "<b>" + esc(c.value) + "</b>" +
      "<small>" + esc(c.label) + "</small>" +
      '<span class="pd-stat-foot">' + esc(c.foot) + "</span>" +
    "</div>"
  )).join("");
}

/* ==========================================
   4. DASHBOARD — NEXT MATCH + RECENT
   ========================================== */
const RESULT_LABEL = { win: "Win", loss: "Loss", draw: "Draw", upcoming: "Upcoming" };

function renderNextMatch() {
  const f = DEMO_FIXTURES[0];
  $("#nextMatch").innerHTML = (
    '<div class="pd-match">' +
      '<img src="' + f.img + '" alt="" loading="lazy" onerror="this.style.display=\'none\';">' +
      "<div>" +
        "<h4>" + esc(DEMO_PLAYER.club) + " vs " + esc(f.opponent) + "</h4>" +
        "<small>" + esc(f.tournament) + "</small>" +
        '<small>📅 ' + esc(f.date) + " · 🕒 " + esc(f.time) + "</small>" +
        "<small>📍 " + esc(f.venue) + "</small>" +
      "</div>" +
      '<div class="pd-match-vs">' +
        '<span class="pd-match-result pd-result-upcoming">Upcoming</span>' +
      "</div>" +
    "</div>"
  );
}

function renderRecentResults() {
  $("#recentResults").innerHTML = DEMO_RESULTS.map(r => (
    '<div class="pd-match">' +
      "<div>" +
        "<h4>vs " + esc(r.opponent) + "</h4>" +
        "<small>" + esc(r.tournament) + "</small>" +
        '<span class="pd-match-result pd-result-' + r.result + '">' +
          RESULT_LABEL[r.result] + " · " + esc(r.score) +
        "</span>" +
      "</div>" +
      '<div class="pd-match-vs"><small>' + esc(r.date) + "</small></div>" +
    "</div>"
  )).join("");
}

/* ==========================================
   5. DASHBOARD — RANK + NOTICE SNAPSHOT
   ========================================== */
function renderRankSnapshot() {
  const rows = DEMO_RANKINGS.slice(0, 5).map(r => (
    "<tr" + (r.me ? ' class="is-me"' : "") + ">" +
      "<td>" + r.rank + "</td>" +
      "<td>" + esc(r.name) + "</td>" +
      "<td>" + r.played + "</td>" +
      "<td>" + r.goals + "</td>" +
      "<td>" + r.points + "</td>" +
    "</tr>"
  )).join("");

  $("#rankSnapshot").innerHTML =
    '<table class="table"><thead><tr>' +
      "<th>Rank</th><th>Player</th><th>P</th><th>Goals</th><th>Points</th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table>";
}

function renderNoticeSnapshot() {
  const items = DEMO_NOTICES.slice(0, 3).map(n => (
    '<div class="pd-notice' + (n.unread ? " is-unread" : "") + '">' +
      '<span class="pd-notice-icon">' + n.icon + "</span>" +
      "<div>" +
        "<h4>" + esc(n.title) + "</h4>" +
        '<span class="pd-notice-meta">' + esc(n.meta) + "</span>" +
      "</div>" +
    "</div>"
  )).join("");

  $("#noticeSnapshot").innerHTML = items;
}

/* ==========================================
   6. MY PROFILE
   ========================================== */
function renderProfile() {
  const p = DEMO_PLAYER;

  const rows = [
    ["Player Name", p.name],
    ["Player ID", p.playerId],
    ["Login Email", p.email],
    ["Profile Email", p.profileEmail],
    ["Contact Number", p.phone],
    ["Date of Birth", p.dob + " (Age " + p.age + ")"],
    ["Gender", p.gender],
    ["District", p.district + " District"],
    ["Club", p.club],
    ["Club ID", p.clubId],
    ["Sport", p.sport],
    ["Position", p.position],
    ["Jersey Number", p.jersey],
    ["Preferred Foot", p.foot],
    ["Status", p.status],
    ["Member Since", p.joined]
  ];

  $("#profileDetails").innerHTML = rows.map(([k, v]) =>
    "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>"
  ).join("");

  // Digital card
  fill($("#cardName"), p.name);
  fill($("#cardId"), p.playerId);
  $("#cardBody").innerHTML = [
    ["Club", p.club],
    ["District", p.district],
    ["Sport", p.sport],
    ["Position", p.position],
    ["Jersey", p.jersey],
    ["Status", p.status]
  ].map(([k, v]) => "<div><small>" + esc(k) + "</small><b>" + esc(v) + "</b></div>").join("");
}

/* ==========================================
   7. MY CLUB
   ========================================== */
function renderClub() {
  const c = DEMO_CLUB;

  fill($("#clubName"), c.name);
  fill($("#clubMeta"), c.id + " · Established " + c.established);

  $("#clubChips").innerHTML = [
    "📍 " + c.district,
    "🏅 " + c.type,
    "✅ " + c.status
  ].map(t => '<span class="pd-chip">' + esc(t) + "</span>").join("");

  $("#clubStats").innerHTML = [
    [c.players, "Players"],
    [c.clubs, "District clubs"],
    ["12", "Tournaments"],
    ["3rd", "District rank"]
  ].map(([v, l]) => "<div><b>" + esc(v) + "</b><small>" + esc(l) + "</small></div>").join("");

  const mgmt = [
    ["Club Manager", c.manager],
    ["Manager Email", c.managerEmail],
    ["Manager Contact", c.managerPhone],
    ["My Role", DEMO_PLAYER.position + " · Jersey " + DEMO_PLAYER.jersey],
    ["Playing Since", DEMO_PLAYER.joined]
  ];
  $("#clubManagement").innerHTML = mgmt.map(([k, v]) =>
    "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>"
  ).join("");

  const contact = [
    ["Club ID", c.id],
    ["Address", c.address],
    ["District", c.district],
    ["Contact", c.contact],
    ["Email", c.email]
  ];
  $("#clubContact").innerHTML = contact.map(([k, v]) =>
    "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>"
  ).join("");
}

/* ==========================================
   8. CLUB MEMBERS (+ live search)
   ========================================== */
function renderRoster(filter) {
  const term = (filter || "").toLowerCase().trim();

  const list = DEMO_MEMBERS.filter(m =>
    !term ||
    m.name.toLowerCase().includes(term) ||
    m.id.toLowerCase().includes(term) ||
    m.position.toLowerCase().includes(term) ||
    m.sport.toLowerCase().includes(term)
  );

  $("#rosterBody").innerHTML = list.map(m => (
    "<tr" + (m.me ? ' class="is-me"' : "") + ">" +
      "<td>" + esc(m.id) + "</td>" +
      "<td>" + esc(m.name) + (m.me ? " (you)" : "") + "</td>" +
      "<td>" + esc(m.sport) + "</td>" +
      "<td>" + esc(m.position) + "</td>" +
      "<td>" + esc(m.district) + "</td>" +
      "<td>" + (
        m.status === "Active"
          ? '<span class="badge green">Active</span>'
          : '<span class="badge yellow">Pending</span>'
      ) + "</td>" +
    "</tr>"
  )).join("");

  $("#rosterEmpty").hidden = list.length > 0;
}

/* ==========================================
   9. MY PERFORMANCE
   ========================================== */
function renderPerformance() {
  const perf = DEMO_PERFORMANCE;

  const grid = [
    [perf.played, "Played"],
    [perf.wins, "Wins"],
    [perf.goals, "Goals"],
    [perf.assists, "Assists"],
    [perf.yellow, "Yellow Cards"],
    [perf.red, "Red Cards"]
  ];
  $("#perfGrid").innerHTML = grid.map(([v, l]) =>
    '<div class="pd-perf"><b>' + esc(v) + "</b><small>" + esc(l) + "</small></div>"
  ).join("");

  $("#perfTable").innerHTML = perf.competitions.map(c => (
    "<tr><td>" + esc(c.name) + "</td><td>" + c.p + "</td><td>" + c.g +
    "</td><td>" + c.a + "</td><td>" + c.pts + "</td></tr>"
  )).join("");

  $("#awardsList").innerHTML = perf.awards.map(a => (
    "<li>🏅 " + esc(a.title) + "<small>" + esc(a.meta) + "</small></li>"
  )).join("");
}

/* ==========================================
   10. MY RANKINGS
   ========================================== */
function renderRankings() {
  const perf = DEMO_PERFORMANCE;

  const cards = [
    { icon: "🏆", value: "#" + perf.rank,  label: "Club Ranking",   foot: "Top scorers list" },
    { icon: "📈", value: perf.points || 24, label: "Points",         foot: "This season" },
    { icon: "⚽", value: perf.goals,        label: "Goals",          foot: "2nd best in club" },
    { icon: "🎯", value: perf.rating,      label: "Avg. Rating",    foot: "Out of 10" },
    { icon: "📊", value: "3rd",             label: "District Rank",  foot: DEMO_PLAYER.district + " (demo)" }
  ];
  $("#rankStats").innerHTML = cards.map(c => (
    '<div class="pd-stat">' +
      '<span class="pd-stat-icon">' + c.icon + "</span>" +
      "<b>" + esc(c.value) + "</b>" +
      "<small>" + esc(c.label) + "</small>" +
      '<span class="pd-stat-foot">' + esc(c.foot) + "</span>" +
    "</div>"
  )).join("");

  $("#rankTable").innerHTML = DEMO_RANKINGS.map(r => (
    "<tr" + (r.me ? ' class="is-me"' : "") + ">" +
      "<td>" + r.rank + "</td>" +
      "<td>" + esc(r.name) + "</td>" +
      "<td>" + r.played + "</td>" +
      "<td>" + r.goals + "</td>" +
      "<td>" + r.points + "</td>" +
    "</tr>"
  )).join("");

  $("#districtTable").innerHTML = DEMO_DISTRICTS.map(d => (
    "<tr" + (d.district === DEMO_PLAYER.district ? ' class="is-me"' : "") + ">" +
      "<td>" + d.rank + "</td>" +
      "<td>" + esc(d.district) + "</td>" +
      "<td>" + d.points + "</td>" +
      "<td>" + d.clubs + "</td>" +
    "</tr>"
  )).join("");
}

/* ==========================================
   11. NOTICES (+ unread handling)
   ========================================== */
function renderNotices() {
  $("#noticeList").innerHTML = DEMO_NOTICES.map((n, i) => (
    '<li class="pd-notice' + (n.unread ? " is-unread" : "") + '" data-index="' + i + '">' +
      '<span class="pd-notice-icon">' + n.icon + "</span>" +
      "<div>" +
        "<h4>" + esc(n.title) + "</h4>" +
        "<p>" + esc(n.body) + "</p>" +
        '<span class="pd-notice-meta">' + esc(n.meta) + "</span>" +
      "</div>" +
      (n.unread
        ? '<button type="button" class="pd-notice-action" data-read="' + i + '">Mark read</button>'
        : "") +
    "</li>"
  )).join("");

  updateNoticeCount();
}

function updateNoticeCount() {
  const unread = DEMO_NOTICES.filter(n => n.unread).length;
  const badge = $("#noticeCount");
  if (badge) {
    badge.textContent = unread;
    badge.hidden = unread === 0;
  }
}

/* ==========================================
   12. MATCHES & TOURNAMENTS
   ========================================== */
function renderMatches() {
  $("#fixtureList").innerHTML = DEMO_FIXTURES.map(f => (
    '<div class="pd-match">' +
      '<img src="' + f.img + '" alt="" loading="lazy" onerror="this.style.display=\'none\';">' +
      "<div>" +
        "<h4>vs " + esc(f.opponent) + "</h4>" +
        "<small>" + esc(f.tournament) + "</small>" +
        "<small>📅 " + esc(f.date) + " · 🕒 " + esc(f.time) + "</small>" +
        "<small>📍 " + esc(f.venue) + "</small>" +
      "</div>" +
      '<div class="pd-match-vs"><span class="pd-match-result pd-result-upcoming">Upcoming</span></div>' +
    "</div>"
  )).join("");

  $("#tournamentList").innerHTML = DEMO_TOURNAMENTS.map(t => (
    '<div class="pd-tournament">' +
      '<span class="pd-tournament-icon">' + t.icon + "</span>" +
      "<div><h4>" + esc(t.name) + "</h4><small>" + esc(t.meta) + "</small></div>" +
      '<div class="pd-match-vs"><span class="pd-match-result pd-result-upcoming">' +
        esc(t.status) + "</span></div>" +
    "</div>"
  )).join("");

  $("#historyBody").innerHTML = DEMO_RESULTS.map(r => (
    "<tr>" +
      "<td>" + esc(r.date) + "</td>" +
      "<td>" + esc(r.tournament) + "</td>" +
      "<td>" + esc(r.opponent) + "</td>" +
      "<td><span class=\"pd-match-result pd-result-" + r.result + "\">" +
        RESULT_LABEL[r.result] + "</span></td>" +
      "<td>" + esc(r.score) + "</td>" +
    "</tr>"
  )).join("");
}

/* ==========================================
   13. SETTINGS
   ========================================== */
function fillSettingsForm() {
  const p = DEMO_PLAYER;
  $("#setName").value = p.name;
  $("#setPhone").value = p.phone;
  $("#setEmail").value = p.email;
  $("#setJersey").value = p.jersey;
  $("#setBio").value = p.bio || "";
}

function bindSettings() {
  $("#profileForm").addEventListener("submit", e => {
    e.preventDefault();
    const name  = $("#setName").value.trim();
    const email = $("#setEmail").value.trim();
    const msg   = $("#profileFormMsg");

    if (name.length < 3) {
      msg.textContent = "❌ Name must be at least 3 characters.";
      msg.className = "muted pd-full pd-form-msg-err";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = "❌ Please enter a valid email address.";
      msg.className = "muted pd-full pd-form-msg-err";
      return;
    }

    // Demo only: nothing is sent anywhere.
    msg.textContent = "✅ Saved locally for this demo. A database is not connected yet, so changes reset on refresh.";
    msg.className = "muted pd-full pd-form-msg-ok";
    toast("Profile saved (demo only)");
  });

  $("#profileForm").addEventListener("reset", () => {
    const msg = $("#profileFormMsg");
    msg.textContent = "";
    setTimeout(fillSettingsForm, 0);
  });

  $("#passForm").addEventListener("submit", e => {
    e.preventDefault();
    const cur = $("#curPass").value;
    const nw  = $("#newPass").value;
    const con = $("#conPass").value;
    const msg = $("#passFormMsg");

    if (cur !== "123456") {
      msg.textContent = "❌ Current password is wrong. (Demo password is 123456)";
      msg.className = "muted pd-form-msg-err";
      return;
    }
    if (nw.length < 6) {
      msg.textContent = "❌ New password must be at least 6 characters.";
      msg.className = "muted pd-form-msg-err";
      return;
    }
    if (nw !== con) {
      msg.textContent = "❌ New passwords do not match.";
      msg.className = "muted pd-form-msg-err";
      return;
    }

    msg.textContent = "✅ Password updated (demo only — not stored anywhere).";
    msg.className = "muted pd-form-msg-ok";
    e.target.reset();
    toast("Password updated (demo only)");
  });
}

/* ==========================================
   14. NAVIGATION (sidebar + mobile drawer)
   ========================================== */
function showView(name) {
  const view = $("#view-" + name);
  if (!view) return;

  $$(".pd-view").forEach(v => v.classList.remove("is-active"));
  view.classList.add("is-active");

  $$(".pd-nav a").forEach(a => {
    const active = a.dataset.view === name;
    a.classList.toggle("active", active);
    if (active) { a.setAttribute("aria-current", "page"); }
    else { a.removeAttribute("aria-current"); }
  });

  const meta = VIEW_META[name] || { title: "Dashboard", subtitle: "" };
  fill($("#viewTitle"), meta.title);
  fill($("#viewSubtitle"), meta.subtitle);
  document.title = meta.title + " — District Sports (Player)";

  closeDrawer();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openDrawer() {
  $("#pdSidebar").classList.add("is-open");
  $("#pdOverlay").hidden = false;
  $("#pdBurger").setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  $("#pdSidebar").classList.remove("is-open");
  $("#pdOverlay").hidden = true;
  $("#pdBurger").setAttribute("aria-expanded", "false");
}

function bindNavigation() {
  // Sidebar links + in-page "jump" links
  $$('[data-view]').forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      showView(link.dataset.view);
    });
  });

  $("#pdBurger").addEventListener("click", () => {
    if ($("#pdSidebar").classList.contains("is-open")) closeDrawer();
    else openDrawer();
  });

  $("#pdOverlay").addEventListener("click", closeDrawer);

  // Open the right view when arriving with a #hash
  const initial = (window.location.hash || "#dashboard").slice(1);
  showView(initial);

  // Keep the browser back button working between views
  window.addEventListener("hashchange", () => {
    const name = window.location.hash.slice(1);
    if (name && $("#view-" + name)) showView(name);
  });
}

/* ==========================================
   15. LOGOUT
   ========================================== */
function doLogout() {
  if (!window.confirm("Log out of the Player Dashboard?")) return;
  // Clears the demo session and returns to the shared login page
  AUTH.logout();
}

function bindLogout() {
  $("#logoutBtn").addEventListener("click", e => { e.preventDefault(); doLogout(); });
  $("#logoutBtn2").addEventListener("click", doLogout);
}

/* ==========================================
   16. MISC EVENT LISTENERS
   ========================================== */
function bindRosterSearch() {
  $("#rosterSearch").addEventListener("input", e => renderRoster(e.target.value));
}

function bindNotices() {
  // Mark one notice as read
  $("#noticeList").addEventListener("click", e => {
    const btn = e.target.closest("[data-read]");
    if (!btn) return;
    const i = Number(btn.dataset.read);
    DEMO_NOTICES[i].unread = false;
    renderNotices();
    toast("Notice marked as read");
  });

  // Mark all read
  $("#readAllBtn").addEventListener("click", () => {
    DEMO_NOTICES.forEach(n => { n.unread = false; });
    renderNotices();
    renderNoticeSnapshot();
    toast("All notices marked as read");
  });
}

/* ==========================================
   17. INIT
   ========================================== */
function boot() {
  renderIdentity();
  renderStatCards();
  renderNextMatch();
  renderRecentResults();
  renderRankSnapshot();
  renderNoticeSnapshot();

  renderProfile();
  renderClub();
  renderRoster();
  renderPerformance();
  renderRankings();
  renderNotices();
  renderMatches();

  fillSettingsForm();
  bindSettings();
  bindNavigation();
  bindLogout();
  bindRosterSearch();
  bindNotices();

  // Close the drawer when resizing up to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) closeDrawer();
  });
}

/* Build the page only for a signed-in player.
   Otherwise AUTH.requireRole sends the visitor
   to the shared login page. */
if (window.AUTH && AUTH.requireRole(AUTH.ROLES.PLAYER)) {
  boot();
}