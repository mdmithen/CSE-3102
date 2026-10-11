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
  logo: "images/clubs.png",
  established: "2011",
  sports: "Football, Cricket, Athletics",
  mainSport: "Football",
  district: "Rajshahi",
  division: "Rajshahi Division",
  manager: "Ahmed Rahman",
  captainId: "PLY-005",
  managerPhone: "01700000001",
  managerEmail: "manager@rajshahi-sc.com",
  address: "Station Road, Rajshahi Sadar, Rajshahi",
  contact: "01700000001",
  email: "info@rajshahi-sc.com",
  status: "Active",
  districtClubs: 12,
  districtRank: "3rd"
};

/* Club roster — sample data.
   `me` marks the signed-in player, `captain` marks the club captain. */
const DEMO_MEMBERS = [
  { id: "PLY-001", name: "Rahim Ahmed",    sport: "Football",  position: "Midfielder",  jersey: "10", district: "Rajshahi",   status: "Active",  me: true,  age: 21, joined: "2023", phone: "01800000001", stats: { apps: 12, goals: 7, assists: 5, rating: 7.3 } },
  { id: "PLY-002", name: "Sakib Hasan",    sport: "Cricket",   position: "Batsman",     jersey: "07", district: "Dhaka",      status: "Active",           age: 23, joined: "2022", phone: "01800000002", stats: { matches: 8, runs: 412, wickets: 3, avg: 51.5 } },
  { id: "PLY-003", name: "Nayeem Islam",   sport: "Football",  position: "Goalkeeper",  jersey: "01", district: "Chattogram", status: "Active",           age: 22, joined: "2021", phone: "01800000003", stats: { apps: 12, cleanSheets: 6, goals: 0, assists: 0, rating: 7.1 } },
  { id: "PLY-004", name: "Arif Hossain",   sport: "Badminton", position: "Singles",     jersey: "—",  district: "Sylhet",     status: "Pending",          age: 19, joined: "2025", phone: "01800000004", stats: { events: 6, titles: 2, wins: 9 } },
  { id: "PLY-005", name: "Tanvir Hasan",   sport: "Football",  position: "Defender",    jersey: "04", district: "Rajshahi",   status: "Active",  captain: true, age: 25, joined: "2019", phone: "01800000005", stats: { apps: 11, goals: 5, assists: 1, rating: 7.0 } },
  { id: "PLY-006", name: "Imran Kabir",    sport: "Football",  position: "Striker",     jersey: "09", district: "Rajshahi",   status: "Active",           age: 21, joined: "2023", phone: "01800000006", stats: { apps: 12, goals: 9, assists: 4, rating: 7.9 } },
  { id: "PLY-007", name: "Sadia Akter",    sport: "Football",  position: "Winger",      jersey: "11", district: "Sylhet",     status: "Active",           age: 20, joined: "2024", phone: "01800000007", stats: { apps: 11, goals: 8, assists: 5, rating: 7.8 } },
  { id: "PLY-008", name: "Mehedi Hasan",   sport: "Athletics", position: "Sprinter",    jersey: "03", district: "Rajshahi",   status: "Active",           age: 22, joined: "2022", phone: "01800000008", stats: { races: 24, medals: 6, best: "10.82s" } },
  { id: "PLY-009", name: "Rafiqul Hasan",  sport: "Football",  position: "Defender",    jersey: "05", district: "Rajshahi",   status: "Active",           age: 24, joined: "2020", phone: "01800000009", stats: { apps: 10, goals: 4, assists: 1, rating: 6.9 } }
];

/* ---------- DEMO MATCH HISTORY ----------
   The single source of truth for every performance total on the
   page. Season summary, chart, competition table and match history
   are all derived from this array, so they can never disagree. */
const DEMO_MATCHES = [
  { id: "M01", date: "2026-07-12", opponent: "Bogura XI",            tournament: "District Football Championship 2026", venue: "Rajshahi Stadium",    score: "3 - 1", us: 3, them: 1, result: "win",  goals: 1, assists: 1, rating: 7.8, minutes: 90, yellow: 0, red: 0, note: "Set-piece free kick and a corner assist." },
  { id: "M02", date: "2026-07-26", opponent: "Khulna Rangers",       tournament: "District Football Championship 2026", venue: "Bogura District Ground", score: "1 - 1", us: 1, them: 1, result: "draw", goals: 0, assists: 0, rating: 6.9, minutes: 90, yellow: 0, red: 0, note: "Tight midfield battle; chance in the first half." },
  { id: "M03", date: "2026-08-09", opponent: "Sylhet Sports Academy", tournament: "District Football Championship 2026", venue: "Rajshahi Stadium",    score: "2 - 0", us: 2, them: 0, result: "win",  goals: 1, assists: 0, rating: 7.5, minutes: 90, yellow: 0, red: 0, note: "Opened the scoring in the 22nd minute." },
  { id: "M04", date: "2026-08-23", opponent: "Uttara Sports Club",   tournament: "District Football Championship 2026", venue: "Uttara Complex",      score: "1 - 3", us: 1, them: 3, result: "loss", goals: 0, assists: 0, rating: 5.9, minutes: 90, yellow: 1, red: 0, note: "Caught on the counter twice; booked for a late challenge." },
  { id: "M05", date: "2026-08-28", opponent: "Dhaka Young Stars",    tournament: "National Youth Cup (Qualifiers)",      venue: "Bangabandhu Stadium", score: "3 - 1", us: 3, them: 1, result: "win",  goals: 0, assists: 0, rating: 7.4, minutes: 75, yellow: 0, red: 0, note: "Pulled off with 15 minutes to play." },
  { id: "M06", date: "2026-08-15", opponent: "Mohammadpur SC",       tournament: "Rajshahi Divisional League",           venue: "Divisional Ground",    score: "2 - 2", us: 2, them: 2, result: "draw", goals: 0, assists: 0, rating: 6.9, minutes: 90, yellow: 0, red: 0, note: "Late equaliser cancelled in stoppage time." },
  { id: "M07", date: "2026-09-05", opponent: "Naogaon United",       tournament: "Rajshahi Divisional League",           venue: "Divisional Ground",    score: "2 - 1", us: 2, them: 1, result: "win",  goals: 1, assists: 1, rating: 7.6, minutes: 90, yellow: 0, red: 0, note: "Goal and assist in a strong first half." },
  { id: "M08", date: "2026-09-06", opponent: "Gulshan Tigers",       tournament: "District Football Championship 2026", venue: "Rajshahi Stadium",    score: "4 - 1", us: 4, them: 1, result: "win",  goals: 2, assists: 1, rating: 8.3, minutes: 90, yellow: 0, red: 0, note: "Man of the match — brace plus an assist." },
  { id: "M09", date: "2026-09-17", opponent: "Sylhet Sports Academy", tournament: "District Football Championship 2026", venue: "Sylhet Stadium",     score: "0 - 2", us: 0, them: 2, result: "loss", goals: 0, assists: 0, rating: 6.1, minutes: 90, yellow: 1, red: 0, note: "Beaten on the counter; booked for dissent." },
  { id: "M10", date: "2026-09-24", opponent: "Uttara Sports Club",   tournament: "Rajshahi Divisional League",           venue: "Divisional Ground",    score: "1 - 1", us: 1, them: 1, result: "draw", goals: 0, assists: 0, rating: 6.8, minutes: 90, yellow: 0, red: 0, note: "Duel with the same midfielder as in August." },
  { id: "M11", date: "2026-10-01", opponent: "Chattogram Warriors",  tournament: "District Football Championship 2026", venue: "Rajshahi Stadium",    score: "3 - 0", us: 3, them: 0, result: "win",  goals: 1, assists: 1, rating: 8.0, minutes: 90, yellow: 0, red: 0, note: "Controlled the game from midfield." },
  { id: "M12", date: "2026-10-08", opponent: "Dhaka United Club",    tournament: "District Football Championship 2026", venue: "Rajshahi Stadium",    score: "2 - 1", us: 2, them: 1, result: "win",  goals: 1, assists: 1, rating: 8.2, minutes: 90, yellow: 0, red: 0, note: "Winning goal in the 78th minute." }
];

/* Sport-appropriate stat labels.
   Only the stats that make sense for the player's sport are shown. */
const SPORT_STATS = {
  Football: [
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
    { key: "yellow", label: "Yellow Cards" },
    { key: "red", label: "Red Cards" }
  ],
  Cricket: [
    { key: "runs", label: "Runs" },
    { key: "wickets", label: "Wickets" },
    { key: "avg", label: "Average" }
  ],
  Badminton: [
    { key: "events", label: "Events" },
    { key: "wins", label: "Wins" },
    { key: "titles", label: "Titles" }
  ],
  Athletics: [
    { key: "races", label: "Races" },
    { key: "medals", label: "Medals" },
    { key: "best", label: "Best Time" }
  ]
};

function sportStatLabels(sport) {
  return SPORT_STATS[sport] || SPORT_STATS.Football;
}

/* ==========================================
   DERIVED PERFORMANCE
   Every total below is calculated from
   DEMO_MATCHES so the numbers always agree.
   ========================================== */
function computePerformance() {
  const matches = DEMO_MATCHES;

  const count = r => matches.filter(m => m.result === r).length;
  const sum = k => matches.reduce((t, m) => t + (m[k] || 0), 0);

  // Per-competition breakdown, also derived
  const competitions = [];
  matches.forEach(m => {
    let row = competitions.find(c => c.name === m.tournament);
    if (!row) { row = { name: m.tournament, p: 0, w: 0, d: 0, l: 0, g: 0, a: 0 }; competitions.push(row); }
    row.p++;
    row[grow(m.result)]++;                 // w / d / l
    row.g += m.goals;
    row.a += m.assists;
  });
  competitions.forEach(c => { c.pts = c.w * 3 + c.d; });

  const played = matches.length;

  return {
    played,
    wins: count("win"),
    draws: count("draw"),
    losses: count("loss"),
    goals: sum("goals"),
    assists: sum("assists"),
    yellow: sum("yellow"),
    red: sum("red"),
    minutes: sum("minutes"),
    rating: Math.round((sum("rating") / played) * 10) / 10,
    winRate: Math.round((count("win") / played) * 100),
    points: competitions.reduce((t, c) => t + c.pts, 0),
    rank: 3,                       // position in the club top-scorers list
    competitions,
    awards: [
      { title: "District Champion 2025",   meta: "Rajshahi Sports Club · Football" },
      { title: "Best Midfielder 2025",     meta: "District Football Championship" },
      { title: "Man of the Match × 3",     meta: "District Football Championship 2026" },
      { title: "Young Player of the Year", meta: "Rajshahi District Sports Council" }
    ]
  };
}

function grow(result) {
  return result === "win" ? "w" : result === "draw" ? "d" : "l";
}

/* Live object used across the page */
const DEMO_PERFORMANCE = computePerformance();

const DEMO_RANKINGS = [
  { rank: 1, name: "Imran Kabir",  played: 12, goals: 9, points: 28 },
  { rank: 2, name: "Sadia Akter",  played: 11, goals: 8, points: 25 },
  { rank: 3, name: "Rahim Ahmed",  played: 12, goals: 7, points: 24, me: true },
  { rank: 4, name: "Tanvir Hasan", played: 11, goals: 5, points: 20 },
  { rank: 5, name: "Rafiqul Hasan", played: 10, goals: 4, points: 18 }
];

const DEMO_DISTRICTS = [
  { rank: 1, district: "Rajshahi",   points: 265, clubs: 12 },
  { rank: 2, district: "Dhaka",      points: 260, clubs: 18 },
  { rank: 3, district: "Chattogram", points: 250, clubs: 14 },
  { rank: 4, district: "Sylhet",     points: 230, clubs: 10 }
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

/* ---------- date + label helpers ---------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* "2026-10-08" -> "08 Oct 2026" */
function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return d + " " + MONTHS[Number(m) - 1] + " " + y;
}

/* "2026-10" -> "Oct 2026" (used by the period filter) */
function formatMonth(iso) {
  const [y, m] = iso.split("-");
  return MONTHS[Number(m) - 1] + " " + y;
}

function byDateDesc(a, b) { return a.date < b.date ? 1 : -1; }

/* Initials for the generated avatars: "Rahim Ahmed" -> "RA" */
function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2)
              .map(part => part[0].toUpperCase()).join("");
}

/* Stable colour per player so each avatar keeps the same colour */
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
  // Five most recent matches, newest first, from the one match dataset
  const recent = DEMO_MATCHES.slice().sort(byDateDesc).slice(0, 5);

  $("#recentResults").innerHTML = recent.map(r => (
    '<div class="pd-match">' +
      "<div>" +
        "<h4>vs " + esc(r.opponent) + "</h4>" +
        "<small>" + esc(r.tournament) + "</small>" +
        '<span class="pd-match-result pd-result-' + r.result + '">' +
          RESULT_LABEL[r.result] + " · " + esc(r.score) +
        "</span>" +
      "</div>" +
      '<div class="pd-match-vs"><small>' + esc(formatDate(r.date)) + "</small></div>" +
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
  const captain = DEMO_MEMBERS.find(m => m.id === c.captainId);

  fill($("#clubName"), c.name);
  fill($("#clubMeta"), c.id + " · Established " + c.established);

  const logo = $("#clubLogo");
  if (logo) logo.src = c.logo;

  $("#clubChips").innerHTML = [
    "📍 " + c.district,
    "🗺️ " + c.division,
    "⚽ " + c.mainSport,
    "✅ " + c.status
  ].map(t => '<span class="pd-chip">' + esc(t) + "</span>").join("");

  // Total members always comes from the roster list, so it matches
  $("#clubStats").innerHTML = [
    [DEMO_MEMBERS.length, "Club members"],
    [DEMO_MEMBERS.filter(m => m.status === "Active").length, "Active"],
    [c.districtClubs, "District clubs"],
    [c.districtRank, "District rank"]
  ].map(([v, l]) => "<div><b>" + esc(v) + "</b><small>" + esc(l) + "</small></div>").join("");

  const mgmt = [
    ["Club Manager", c.manager],
    ["Manager Email", c.managerEmail],
    ["Manager Contact", c.managerPhone],
    ["Club Captain", captain ? captain.name + " (" + captain.position + ")" : "—"],
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
    ["Division", c.division],
    ["Main Sport", c.mainSport],
    ["Sports Offered", c.sports],
    ["Contact", c.contact],
    ["Email", c.email],
    ["Total Members", DEMO_MEMBERS.length + " registered"]
  ];
  $("#clubContact").innerHTML = contact.map(([k, v]) =>
    "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>"
  ).join("");

  renderClubMemberStrip();
}

/* Small avatar preview on the club page */
function renderClubMemberStrip() {
  $("#clubMemberStrip").innerHTML = DEMO_MEMBERS.map(m => (
    '<button type="button" class="pd-strip-member" data-member="' + esc(m.id) + '">' +
      '<span class="pd-avatar" style="--h:' + avatarHue(m.id) + '">' + esc(initials(m.name)) + "</span>" +
      "<b>" + esc(m.name) + "</b>" +
      "<small>" + esc(m.position) + "</small>" +
      (m.captain ? '<span class="pd-captain-tag">C</span>' : "") +
      (m.me ? '<span class="pd-you-tag">You</span>' : "") +
    "</button>"
  )).join("");
}

/* ==========================================
   8. CLUB MEMBERS
   Search + position / sport / status filters
   ========================================== */
const memberFilters = { q: "", position: "", sport: "", status: "" };

/* Build the filter dropdowns from the data itself */
function buildMemberFilterOptions() {
  const uniq = key => [...new Set(DEMO_MEMBERS.map(m => m[key]))].sort();

  const pos = $("#memberPosition");
  uniq("position").forEach(v => pos.insertAdjacentHTML("beforeend",
    '<option value="' + esc(v) + '">' + esc(v) + "</option>"));

  const sport = $("#memberSport");
  uniq("sport").forEach(v => sport.insertAdjacentHTML("beforeend",
    '<option value="' + esc(v) + '">' + esc(v) + "</option>"));
}

function filteredMembers() {
  const f = memberFilters;
  const q = f.q.toLowerCase().trim();

  return DEMO_MEMBERS.filter(m =>
    (!q ||
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.position.toLowerCase().includes(q) ||
      (m.jersey || "").toLowerCase().includes(q)) &&
    (!f.position || m.position === f.position) &&
    (!f.sport || m.sport === f.sport) &&
    (!f.status || m.status === f.status)
  );
}

function renderMembers() {
  const list = filteredMembers();
  const total = DEMO_MEMBERS.length;

  // Result counter, so an empty list always explains itself
  const filtering = memberFilters.q || memberFilters.position ||
                    memberFilters.sport || memberFilters.status;
  fill($("#memberCountText"),
    filtering
      ? "Showing " + list.length + " of " + total + " club members"
      : "All " + total + " club members");

  fill($("#memberCount"), total + " members");

  $("#memberGrid").innerHTML = list.map(m => {
    const badge = m.status === "Active"
      ? '<span class="badge green">Active</span>'
      : '<span class="badge yellow">Pending</span>';

    return (
      '<article class="pd-member-card' + (m.me ? " is-me" : "") + '" data-member="' + esc(m.id) + '"' +
        ' tabindex="0" role="button" aria-label="View profile of ' + esc(m.name) + '">' +
        '<div class="pd-member-top">' +
          '<span class="pd-avatar" style="--h:' + avatarHue(m.id) + '">' + esc(initials(m.name)) + "</span>" +
          "<div>" +
            "<h4>" + esc(m.name) + "</h4>" +
            "<small>" + esc(m.id) + "</small>" +
          "</div>" +
          '<span class="pd-member-jersey">' + esc(m.jersey) + "</span>" +
        "</div>" +
        '<div class="pd-member-tags">' +
          '<span class="pd-chip">' + esc(m.position) + "</span>" +
          '<span class="pd-chip">' + esc(m.sport) + "</span>" +
          '<span class="pd-chip">📍 ' + esc(m.district) + "</span>" +
        "</div>" +
        '<div class="pd-member-foot">' + badge +
          (m.captain ? '<span class="pd-captain-tag">Captain</span>' : "") +
          (m.me ? '<span class="pd-you-tag">You</span>' : "") +
          '<button type="button" class="pd-member-view" data-member="' + esc(m.id) + '">View profile →</button>' +
        "</div>" +
      "</article>"
    );
  }).join("");

  // Empty state
  $("#memberGrid").hidden = list.length === 0;
  $("#memberEmpty").hidden = list.length > 0;
}

function clearMemberFilters() {
  memberFilters.q = memberFilters.position = memberFilters.sport = memberFilters.status = "";
  $("#memberSearch").value = "";
  $("#memberPosition").value = "";
  $("#memberSport").value = "";
  $("#memberStatus").value = "";
  renderMembers();
}

/* ==========================================
   9. MY PERFORMANCE
   All totals are derived from DEMO_MATCHES
   ========================================== */
function renderPerformance() {
  const perf = DEMO_PERFORMANCE;
  const labels = sportStatLabels(DEMO_PLAYER.sport);

  // Season label built from the actual data range
  const dates = DEMO_MATCHES.map(m => m.date).sort();
  fill($("#perfSeasonLabel"),
    formatDate(dates[0]) + " — " + formatDate(dates[dates.length - 1]) + " · sample data");

  // Results first, then only the stats that suit this sport
  const tiles = [
    ["📅", perf.played,  "Matches played"],
    ["🥇", perf.wins,    "Wins"],
    ["🤝", perf.draws,   "Draws"],
    ["❌", perf.losses,  "Losses"]
  ].concat(
    labels.map(l => [null, l.key === "red" ? perf.red : perf[l.key], l.label])
  );

  $("#perfGrid").innerHTML = tiles.map(([icon, value, label]) =>
    '<div class="pd-perf">' +
      (icon ? '<span class="pd-perf-icon">' + icon + "</span>" : "") +
      "<b>" + esc(value) + "</b><small>" + esc(label) + "</small>" +
    "</div>"
  ).join("");

  // Competition breakdown (derived)
  $("#perfTable").innerHTML = perf.competitions.map(c => (
    "<tr><td>" + esc(c.name) + "</td><td>" + c.p + "</td><td>" + c.w + "</td><td>" +
    c.d + "</td><td>" + c.l + "</td><td>" + c.g + "</td><td>" + c.a + "</td></tr>"
  )).join("");

  $("#awardsList").innerHTML = perf.awards.map(a => (
    "<li>🏅 " + esc(a.title) + "<small>" + esc(a.meta) + "</small></li>"
  )).join("");

  renderChart();
  renderFormStrip();
  renderHistory();
}

/* ---------- Progress chart (hand-built SVG, no libraries) ---------- */
function renderChart() {
  const box = $("#perfChart");
  if (!box) return;

  // Oldest -> newest, cumulative totals
  const games = DEMO_MATCHES.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  let cg = 0, ca = 0;
  const goals = [], assists = [];
  games.forEach(m => { cg += m.goals; ca += m.assists; goals.push(cg); assists.push(ca); });

  const W = 760, H = 260, padL = 44, padR = 16, padT = 16, padB = 34;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxY = Math.max(...goals, ...assists, 3);
  const stepY = Math.max(1, Math.ceil(maxY / 4));
  const top = Math.ceil(maxY / stepY) * stepY;

  const x = i => padL + (games.length === 1 ? innerW / 2 : (i / (games.length - 1)) * innerW);
  const y = v => padT + innerH - (v / top) * innerH;

  // Horizontal gridlines + Y labels
  let grid = "";
  for (let v = 0; v <= top; v += stepY) {
    grid += '<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (W - padR) + '" y2="' + y(v) +
            '" class="pd-grid-line" />' +
            '<text x="' + (padL - 10) + '" y="' + (y(v) + 4) +
            '" class="pd-axis-text" text-anchor="end">' + v + "</text>";
  }

  // X labels: show every other match so they never collide
  let xLabels = "";
  games.forEach((m, i) => {
    if (i % 2 !== 0 && i !== games.length - 1) return;
    xLabels += '<text x="' + x(i) + '" y="' + (H - 12) +
               '" class="pd-axis-text" text-anchor="middle">' +
               esc(m.date.slice(5)) + "</text>";
  });

  const line = arr => arr.map((v, i) => (i ? "L" : "M") + x(i) + " " + y(v)).join(" ");

  const dots = (arr, cls) => arr.map((v, i) =>
    '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4" class="' + cls + '">' +
      "<title>Match " + (i + 1) + " (" + esc(games[i].opponent) + "): " + v + " total</title>" +
    "</circle>"
  ).join("");

  box.innerHTML =
    '<svg viewBox="0 0 ' + W + " " + H + '" class="pd-chart-svg" ' +
         'preserveAspectRatio="xMidYMid meet" role="img" ' +
         'aria-label="Cumulative goals and assists over ' + games.length + ' matches">' +
      grid + xLabels +
      '<path d="' + line(goals) + '" class="pd-line pd-line-goals" fill="none" />' +
      '<path d="' + line(assists) + '" class="pd-line pd-line-assists" fill="none" />' +
      dots(goals, "pd-dot pd-dot-goals") +
      dots(assists, "pd-dot pd-dot-assists") +
    "</svg>";
}

/* ---------- Last 5 results strip ---------- */
function renderFormStrip() {
  const recent = DEMO_MATCHES.slice().sort(byDateDesc).slice(0, 5);
  $("#perfForm").innerHTML = recent.map(m => (
    '<span class="pd-form-chip pd-form-' + m.result + '" title="' +
      esc(m.opponent) + " · " + esc(formatDate(m.date)) + '">' +
      RESULT_LABEL[m.result] +
      '<small>' + esc(m.opponent.split(" ")[0]) + "</small>" +
    "</span>"
  )).join("");
}

/* ---------- Match history: filters + table ---------- */
const historyFilters = { period: "", tournament: "", result: "" };

function buildHistoryFilterOptions() {
  const months = [...new Set(DEMO_MATCHES.map(m => formatMonth(m.date)))];
  months.forEach(label => {
    const value = DEMO_MATCHES.find(m => formatMonth(m.date) === label).date.slice(0, 7);
    $("#histPeriod").insertAdjacentHTML("beforeend",
      '<option value="' + value + '">' + esc(label) + "</option>");
  });

  const tourneys = [...new Set(DEMO_MATCHES.map(m => m.tournament))];
  tourneys.forEach(t => $("#histTournament").insertAdjacentHTML("beforeend",
    '<option value="' + esc(t) + '">' + esc(t) + "</option>"));
}

function filteredMatches() {
  const f = historyFilters;
  return DEMO_MATCHES.filter(m =>
    (!f.period || m.date.slice(0, 7) === f.period) &&
    (!f.tournament || m.tournament === f.tournament) &&
    (!f.result || m.result === f.result)
  ).sort(byDateDesc);
}

function renderHistory() {
  const list = filteredMatches();
  const perf = DEMO_PERFORMANCE;
  const f = historyFilters;
  const filtering = f.period || f.tournament || f.result;

  // The filter summary re-adds up, so it can never contradict the tiles
  const w = list.filter(m => m.result === "win").length;
  const d = list.filter(m => m.result === "draw").length;
  const l = list.filter(m => m.result === "loss").length;
  const g = list.reduce((t, m) => t + m.goals, 0);
  const a = list.reduce((t, m) => t + m.assists, 0);

  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

  fill($("#perfHistoryMeta"), filtering
    ? "Filtered: " + plural(list.length, "match") +
      " · " + w + "W " + d + "D " + l + "L · " +
      plural(g, "goal") + ", " + plural(a, "assist")
    : "All " + plural(list.length, "match") +
      " · " + perf.wins + "W " + perf.draws + "D " + perf.losses + "L · " +
      plural(perf.goals, "goal") + ", " + plural(perf.assists, "assist"));

  fill($("#histCountText"), filtering
    ? "Showing " + list.length + " of " + DEMO_MATCHES.length + " matches"
    : "Showing all " + DEMO_MATCHES.length + " matches");

  $("#historyBody").innerHTML = list.map(m => {
    const mine = m.goals + m.assists;
    const perfBits = [];
    if (m.goals) perfBits.push(m.goals + (m.goals === 1 ? " goal" : " goals"));
    if (m.assists) perfBits.push(m.assists + (m.assists === 1 ? " assist" : " assists"));
    if (!perfBits.length) perfBits.push("No goal or assist");

    return (
      "<tr>" +
        "<td>" + esc(m.id.replace("M", "")) + "</td>" +
        "<td>" + esc(formatDate(m.date)) + "</td>" +
        "<td>" + esc(m.opponent) + "</td>" +
        "<td>" + esc(m.tournament) + "</td>" +
        '<td><span class="pd-match-result pd-result-' + m.result + '">' +
          RESULT_LABEL[m.result] + "</span></td>" +
        "<td>" + esc(m.score) + "</td>" +
        "<td>" + esc(perfBits.join(", ")) + ' <span class="muted">· ' + m.rating + "</span></td>" +
        '<td><button type="button" class="pd-link-btn" data-match="' + esc(m.id) + '">View</button></td>' +
      "</tr>"
    );
  }).join("");

  $("#histEmpty").hidden = list.length > 0;
}

function clearHistoryFilters() {
  historyFilters.period = historyFilters.tournament = historyFilters.result = "";
  $("#histPeriod").value = "";
  $("#histTournament").value = "";
  $("#histResult").value = "";
  renderHistory();
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
}

/* ==========================================
   12b. DETAIL POPUP (member + match)
   ========================================== */
let lastFocused = null;

function openModal(title, bodyHtml) {
  const modal = $("#pdModal");
  if (!modal) return;
  fill($("#pdModalTitle"), title);
  $("#pdModalBody").innerHTML = bodyHtml;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  lastFocused = document.activeElement;
  $("#pdModalClose").focus();
}

function closeModal() {
  const modal = $("#pdModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = "";
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

/* Member profile popup */
function showMember(id) {
  const m = DEMO_MEMBERS.find(x => x.id === id);
  if (!m) return;

  const captain = DEMO_CLUB.captainId === m.id;
  const labels = sportStatLabels(m.sport);

  const statRows = labels
    .filter(l => m.stats[l.key] !== undefined)
    .map(l => "<dt>" + esc(l.label) + "</dt><dd>" + esc(m.stats[l.key]) + "</dd>")
    .join("");

  const details = [
    ["Player ID", m.id],
    ["Sport", m.sport],
    ["Position", m.position],
    ["Jersey Number", m.jersey],
    ["District", m.district],
    ["Age", m.age + " years"],
    ["Contact", m.phone],
    ["Member Since", m.joined],
    ["Club", DEMO_CLUB.name]
  ].map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("");

  openModal(m.name, (
    '<div class="pd-modal-person">' +
      '<span class="pd-avatar pd-avatar-xl" style="--h:' + avatarHue(m.id) + '">' +
        esc(initials(m.name)) + "</span>" +
      "<div>" +
        "<h4>" + esc(m.name) + (m.me ? ' <span class="pd-you-tag">You</span>' : "") + "</h4>" +
        "<p class='muted'>" + esc(m.id) + " · " + esc(m.position) +
          (captain ? ' <span class="pd-captain-tag">Captain</span>' : "") + "</p>" +
        (m.status === "Active"
          ? '<span class="badge green">Active</span>'
          : '<span class="badge yellow">Pending</span>') +
      "</div>" +
    "</div>" +
    '<h4 class="pd-subhead">' + esc(m.sport) + " statistics</h4>" +
    '<dl class="pd-details">' + statRows + "</dl>" +
    '<h4 class="pd-subhead">Profile details</h4>' +
    '<dl class="pd-details">' + details + "</dl>" +
    '<p class="muted pd-note">Sample data for the class project — no database is connected yet.</p>'
  ));
}

/* Match detail popup */
function showMatch(id) {
  const m = DEMO_MATCHES.find(x => x.id === id);
  if (!m) return;

  const events = [];
  if (m.goals) events.push(["⚽ Goals scored", String(m.goals)]);
  if (m.assists) events.push(["🎯 Assists", String(m.assists)]);
  if (m.yellow) events.push(["🟨 Yellow cards", String(m.yellow)]);
  if (m.red) events.push(["🟥 Red cards", String(m.red)]);
  if (!events.length) events.push(["⚽ Goals scored", "0"]);

  const details = [
    ["Match ID", m.id],
    ["Date", formatDate(m.date)],
    ["Competition", m.tournament],
    ["Venue", m.venue],
    ["Opponent", m.opponent],
    ["Final score", DEMO_PLAYER.club + " " + m.score + " " + m.opponent],
    ["Result", RESULT_LABEL[m.result]],
    ["Minutes played", m.minutes],
    ["Player rating", m.rating + " / 10"]
  ].map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("");

  const evRows = events.map(([k, v]) =>
    "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("");

  openModal(m.opponent + " (" + RESULT_LABEL[m.result] + ")", (
    '<div class="pd-modal-score">' +
      '<span class="pd-score-side">' + esc(DEMO_PLAYER.club) + "</span>" +
      '<b class="pd-score-value">' + esc(m.score) + "</b>" +
      '<span class="pd-score-side">' + esc(m.opponent) + "</span>" +
    "</div>" +
    '<h4 class="pd-subhead">My performance</h4>' +
    '<dl class="pd-details">' + evRows + "</dl>" +
    '<h4 class="pd-subhead">Match details</h4>' +
    '<dl class="pd-details">' + details + "</dl>" +
    '<p class="muted pd-note">' + esc(m.note) + "</p>" +
    '<p class="muted pd-note">Sample result — no database is connected yet.</p>'
  ));
}

function bindModals() {
  // One delegated listener covers cards, strip buttons and table links
  document.addEventListener("click", e => {
    const memberBtn = e.target.closest("[data-member]");
    if (memberBtn) { showMember(memberBtn.dataset.member); return; }

    const matchBtn = e.target.closest("[data-match]");
    if (matchBtn) { showMatch(matchBtn.dataset.match); return; }

    if (e.target.closest("[data-modal-close]")) closeModal();
  });

  $("#pdModalClose").addEventListener("click", closeModal);

  // Enter/Space on a member card (it is role="button")
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); return; }
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".pd-member-card[data-member]");
    if (card) { e.preventDefault(); showMember(card.dataset.member); }
  });
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
function bindMemberFilters() {
  $("#memberSearch").addEventListener("input", e => {
    memberFilters.q = e.target.value;
    renderMembers();
  });
  $("#memberPosition").addEventListener("change", e => {
    memberFilters.position = e.target.value;
    renderMembers();
  });
  $("#memberSport").addEventListener("change", e => {
    memberFilters.sport = e.target.value;
    renderMembers();
  });
  $("#memberStatus").addEventListener("change", e => {
    memberFilters.status = e.target.value;
    renderMembers();
  });
  $("#memberClear").addEventListener("click", clearMemberFilters);
  $("#memberEmptyClear").addEventListener("click", clearMemberFilters);
}

function bindHistoryFilters() {
  $("#histPeriod").addEventListener("change", e => {
    historyFilters.period = e.target.value;
    renderHistory();
  });
  $("#histTournament").addEventListener("change", e => {
    historyFilters.tournament = e.target.value;
    renderHistory();
  });
  $("#histResult").addEventListener("change", e => {
    historyFilters.result = e.target.value;
    renderHistory();
  });
  $("#histClear").addEventListener("click", clearHistoryFilters);
  $("#histEmptyClear").addEventListener("click", clearHistoryFilters);
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
  buildMemberFilterOptions();
  buildHistoryFilterOptions();

  renderClub();
  renderMembers();
  renderPerformance();
  renderRankings();
  renderNotices();
  renderMatches();

  fillSettingsForm();
  bindSettings();
  bindNavigation();
  bindLogout();
  bindMemberFilters();
  bindHistoryFilters();
  bindModals();
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