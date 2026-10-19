/* ==========================================
   PLAYER DASHBOARD - JavaScript
   UI demo build (frontend only).

   Everything on this page is driven by the DEMO_*
   objects below, so the tiles, charts, tables and
   badges always agree with each other. The only
   feature that talks to the database is the
   "Join a Club" panel (js/player-join.js), which is
   a separate file and is not touched here.
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

/* Club top-scorer list, DERIVED from DEMO_MEMBERS.
   Keeping one source means the ranking page can never disagree
   with the roster shown a few clicks away.
   Player points = goals x 3 + assists. */
function computeClubStandings() {
  const rows = DEMO_MEMBERS
    .filter(m => m.stats && m.stats.apps !== undefined)
    .map(m => {
      const goals = m.stats.goals || 0;
      const assists = m.stats.assists || 0;
      return {
        id: m.id,
        name: m.name,
        position: m.position,
        played: m.stats.apps,
        goals,
        assists,
        rating: m.stats.rating || 0,
        points: goals * 3 + assists,
        me: !!m.me
      };
    })
    .sort((a, b) =>
      b.points - a.points || b.goals - a.goals || a.played - b.played);

  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

const DEMO_STANDINGS = computeClubStandings();
const MY_STANDING = DEMO_STANDINGS.find(r => r.me) || DEMO_STANDINGS[0] || null;

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
    /* Points earned in competitions (W x 3 + D per competition).
       This is a TEAM-style total and is deliberately kept apart
       from playerPoints below, which is the top-scorer formula. */
    competitionPoints: competitions.reduce((t, c) => t + c.pts, 0),
    /* From the derived club standings, so rank 3 is never hardcoded */
    rank: MY_STANDING ? MY_STANDING.rank : 1,
    playerPoints: MY_STANDING ? MY_STANDING.points : 0,
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

const DEMO_DISTRICTS = [
  { rank: 1, district: "Rajshahi",   points: 265, clubs: 12 },
  { rank: 2, district: "Dhaka",      points: 260, clubs: 18 },
  { rank: 3, district: "Chattogram", points: 250, clubs: 14 },
  { rank: 4, district: "Sylhet",     points: 230, clubs: 10 }
];

/* National top-scorer list (sample data).
   The signed-in player is placed by rank so his numbers
   match DEMO_PERFORMANCE exactly - see myNationalRow(). */
const DEMO_NATIONAL = [
  { rank: 1,  name: "Javed Hasan",      club: "Dhaka United",        played: 14, goals: 11 },
  { rank: 2,  name: "Arif Hossain",     club: "Chattogram Warriors", played: 13, goals: 10 },
  { rank: 3,  name: "Rakib Hossain",    club: "Sylhet Sports Academy", played: 13, goals: 9 },
  { rank: 4,  name: "Nayeem Islam",     club: "Chattogram Warriors", played: 12, goals: 8 },
  { rank: 5,  name: "Sadia Akter",      club: "Sylhet Sports Academy", played: 11, goals: 8 }
];

/* My national row is derived, not hand-typed, so the goals and
   matches can never drift away from DEMO_PERFORMANCE. */
function myNationalRow() {
  const nextRank = (DEMO_NATIONAL[DEMO_NATIONAL.length - 1].rank || 0) + 1;
  return {
    rank: nextRank,
    name: DEMO_PLAYER.name,
    club: DEMO_CLUB.name,
    played: DEMO_PERFORMANCE.played,
    goals: DEMO_PERFORMANCE.goals,
    me: true
  };
}

/* Upcoming fixtures. `iso` is what the countdown math reads;
   `date` is the label shown on screen. */
const DEMO_FIXTURES = [
  { iso: "2026-10-24", date: "24 Oct 2026", time: "15:30", tournament: "District Football Championship 2026",
    opponent: "Uttara Sports Club", venue: "Rajshahi Stadium", img: "images/football.jpg" },
  { iso: "2026-10-31", date: "31 Oct 2026", time: "17:00", tournament: "Rajshahi Divisional League",
    opponent: "Mohammadpur SC", venue: "Divisional Ground", img: "images/football.jpg" }
];

const DEMO_TOURNAMENTS = [
  { icon: "⚽", name: "District Football Championship 2026", meta: "15 Oct 2026 · Rajshahi · 24 clubs", status: "Registered", statusKey: "registered" },
  { icon: "🏏", name: "Inter-District Cricket Tournament",   meta: "28 Oct 2026 · Dhaka · 16 clubs",    status: "Open", statusKey: "open" },
  { icon: "⚽", name: "National Youth Cup (Qualifiers)",      meta: "05 Nov 2026 · Dhaka · 32 clubs",    status: "Closing Soon", statusKey: "closing" }
];

const DEMO_NOTICES = [
  { icon: "📅", title: "Training session moved to 4:00 PM",
    body: "Due to the district tournament, Friday training now starts at 4:00 PM on the main field.",
    meta: "Club Manager · 10 Oct 2026", priority: "high", unread: true },
  { icon: "🏆", title: "District Championship squad announced",
    body: "You have been selected in the starting XI. Jersey collection is open at the club office from 2 PM.",
    meta: "Rajshahi Sports Club · 09 Oct 2026", priority: "high", unread: true },
  { icon: "📋", title: "Player ID card renewal",
    body: "Please submit your national ID at the club office before 20 October to keep your digital player card active.",
    meta: "District Council · 05 Oct 2026", priority: "medium", unread: true },
  { icon: "⭐", title: "September player of the month",
    body: "Congratulations on being shortlisted for the district player of the month award.",
    meta: "District Council · 30 Sep 2026", priority: "normal", unread: false },
  { icon: "⚽", title: "Friendly match against Bogura XI",
    body: "A practice friendly is scheduled. Full squad attendance is expected.",
    meta: "Club Manager · 26 Sep 2026", priority: "normal", unread: false }
];

const PRIORITY_LABEL = { high: "High", medium: "Medium", normal: "Normal" };

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

/* ---------- shared helpers for the UI ----------

/* One empty-state markup for every list on the page, so
   "nothing to show" always looks and reads the same. */
function emptyState(icon, title, hint) {
  return '<div class="pd-empty-inline">' +
    "<span>" + icon + "</span>" +
    "<b>" + esc(title) + "</b>" +
    (hint ? '<small class="muted">' + esc(hint) + "</small>" : "") +
  "</div>";
}

/* Swap a list for its empty state without deleting the host element. */
function toggleEmptyState(listEl, emptyEl, isEmpty) {
  if (listEl) listEl.hidden = isEmpty;
  if (emptyEl) emptyEl.hidden = !isEmpty;
}

/* Days between today and an ISO date. Returns "Today",
   "Tomorrow", "in N days" or "N days ago". */
function countdownLabel(iso) {
  const today = new Date();
  const target = new Date(iso + "T00:00:00");
  if (isNaN(target.getTime())) return "";

  const days = Math.round(
    (target - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000
  );

  if (days === 0) return { text: "📍 Today", cls: "is-today" };
  if (days === 1) return { text: "⏱ Tomorrow", cls: "" };
  if (days > 1)   return { text: "⏱ In " + days + " days", cls: "" };
  return { text: "⏱ " + Math.abs(days) + " days ago", cls: "is-past" };
}

/* ==========================================
   2. STATIC HEADER + WELCOME CONTENT
   ========================================== */
function renderIdentity() {
  const p = player();
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
  const host = $("#nextMatch");
  if (!host) return;

  const f = DEMO_FIXTURES[0];
  if (!f) {
    host.innerHTML = emptyState("📅", "No fixture scheduled", "Your club has no upcoming match right now.");
    return;
  }

  const cd = countdownLabel(f.iso);

  host.innerHTML = (
    '<div class="pd-match">' +
      '<img src="' + f.img + '" alt="" loading="lazy" onerror="this.style.display=\'none\';">' +
      '<div class="pd-match-body">' +
        "<h4>" + esc(DEMO_PLAYER.club) + " vs " + esc(f.opponent) + "</h4>" +
        "<small>" + esc(f.tournament) + "</small>" +
        '<small>📅 ' + esc(f.date) + " · 🕒 " + esc(f.time) + "</small>" +
        "<small>📍 " + esc(f.venue) + "</small>" +
        '<span class="pd-countdown ' + cd.cls + '">' + esc(cd.text) + "</span>" +
      "</div>" +
      '<div class="pd-match-vs">' +
        '<span class="pd-match-result pd-result-upcoming">Upcoming</span>' +
      "</div>" +
    "</div>"
  );
}

function renderRecentResults() {
  // Five most recent matches, newest first, from the one match dataset
  const host = $("#recentResults");
  if (!host) return;

  const recent = DEMO_MATCHES.slice().sort(byDateDesc).slice(0, 5);

  if (!recent.length) {
    host.innerHTML = emptyState("📊", "No results yet", "Matches you play will appear here.");
    return;
  }

  host.innerHTML = recent.map(r => (
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
  const host = $("#rankSnapshot");
  if (!host) return;

  const rows = DEMO_STANDINGS.slice(0, 5);

  if (!rows.length) {
    host.innerHTML = emptyState("🏅", "No standings yet", "The club table appears once the season starts.");
    return;
  }

  host.innerHTML =
    '<div class="pd-table-wrap"><table><thead><tr>' +
      "<th>Rank</th><th>Player</th><th>P</th><th>Goals</th><th>Points</th>" +
    "</tr></thead><tbody>" +
    rows.map(r => (
      "<tr" + (r.me ? ' class="is-me"' : "") + ">" +
        "<td>" + r.rank + "</td>" +
        "<td>" + esc(r.name) + "</td>" +
        "<td>" + r.played + "</td>" +
        "<td>" + r.goals + "</td>" +
        "<td>" + r.points + "</td>" +
      "</tr>"
    )).join("") +
    "</tbody></table></div>" +
    '<p class="pd-muted pd-note">Top scorers · points = goals × 3 + assists</p>';
}

function renderNoticeSnapshot() {
  const host = $("#noticeSnapshot");
  if (!host) return;

  const items = DEMO_NOTICES.slice(0, 3);

  if (!items.length) {
    host.innerHTML = emptyState("📢", "No notices", "Club announcements will appear here.");
    return;
  }

  host.innerHTML = items.map(n => (
    '<div class="pd-notice is-' + n.priority + (n.unread ? " is-unread" : "") + '">' +
      '<span class="pd-notice-icon">' + n.icon + "</span>" +
      "<div>" +
        '<div class="pd-notice-head">' +
          (n.unread ? '<i class="pd-unread-dot"></i>' : "") +
          '<span class="pd-priority pd-priority-' + n.priority + '">' +
            esc(PRIORITY_LABEL[n.priority]) + "</span>" +
          "<h4>" + esc(n.title) + "</h4>" +
        "</div>" +
        '<span class="pd-notice-meta">' + esc(n.meta) + "</span>" +
      "</div>" +
    "</div>"
  )).join("");
}

/* ==========================================
   6. MY PROFILE
   ========================================== */
function renderProfile() {
  const p = player();

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

  // Digital player card
  fill($("#cardName"), p.name);
  fill($("#cardId"), p.playerId);
  fill($("#cardJersey"), p.jersey);
  fill($("#cardStatus"), p.status);

  const cardAvatar = $("#cardAvatar");
  if (cardAvatar) {
    cardAvatar.textContent = initials(p.name);
    cardAvatar.style.setProperty("--h", avatarHue(p.playerId));
  }

  // The four headline facts on the front of the card
  fill($("#cardClub"), p.club);
  fill($("#cardSport"), p.sport);
  fill($("#cardPosition"), p.position);
  fill($("#cardJerseyNo"), p.jersey);

  $("#cardBody").innerHTML = [
    ["District", p.district],
    ["Age", p.age + " yrs"],
    ["Preferred Foot", p.foot],
    ["Member Since", p.joined]
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
  renderClubKpi();
}

/* Club snapshot: counts derived from the same roster list,
   so the member count can never drift from the cards below. */
function renderClubKpi() {
  const c = DEMO_CLUB;
  const active = DEMO_MEMBERS.filter(m => m.status === "Active").length;
  const avgAge = DEMO_MEMBERS.length
    ? Math.round(DEMO_MEMBERS.reduce((t, m) => t + (m.age || 0), 0) / DEMO_MEMBERS.length)
    : 0;
  const perf = DEMO_PERFORMANCE;

  const kpis = [
    { icon: "👥", value: DEMO_MEMBERS.length, label: "Registered members" },
    { icon: "✅", value: active,              label: "Active players" },
    { icon: "🎂", value: avgAge + " yrs",     label: "Average age" },
    { icon: "📈", value: perf.winRate + "%",  label: "Season win rate" },
    { icon: "🥇", value: "#" + perf.rank,     label: "My club rank" },
    { icon: "🗺️", value: c.districtRank,      label: "Club district rank" }
  ];

  const host = $("#clubKpi");
  if (host) {
    host.innerHTML = kpis.map(k =>
      '<div class="pd-kpi">' +
        "<span>" + k.icon + "</span>" +
        "<b>" + esc(k.value) + "</b>" +
        "<small>" + esc(k.label) + "</small>" +
      "</div>"
    ).join("");
  }

  // Club form = the same last five matches the dashboard shows
  const formHost = $("#clubForm");
  if (!formHost) return;

  const recent = DEMO_MATCHES.slice().sort(byDateDesc).slice(0, 5);
  if (!recent.length) {
    formHost.innerHTML = emptyState("📈", "No form yet", "Results appear after the first match.");
    return;
  }
  formHost.innerHTML = recent.map(m => formChip(m)).join("");
}

/* One "W / opponent" chip, reused by both form strips */
function formChip(m) {
  return '<span class="pd-form-chip pd-form-' + m.result + '" title="' +
    esc(m.opponent) + " · " + esc(formatDate(m.date)) + '">' +
    RESULT_LABEL[m.result] +
    '<small>' + esc(m.opponent.split(" ")[0]) + "</small>" +
  "</span>";
}

/* Small avatar preview on the club page */
function renderClubMemberStrip() {
  const host = $("#clubMemberStrip");
  if (!host) return;

  if (!DEMO_MEMBERS.length) {
    host.innerHTML = emptyState("👥", "No members yet", "Players appear here once they join the club.");
    return;
  }

  host.innerHTML = DEMO_MEMBERS.map(m => (
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
      ? '<span class="pd-badge pd-badge-green">Active</span>'
      : '<span class="pd-badge pd-badge-yellow">Pending</span>';

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
  renderRatingChart();
  renderFormBar();
  renderFormStrip();
  renderHistory();
}

/* ---------- Win / draw / loss bar + win rate ---------- */
function renderFormBar() {
  const perf = DEMO_PERFORMANCE;
  const total = perf.played || 1;

  const segs = [
    { key: "win",  label: "Wins",   n: perf.wins },
    { key: "draw", label: "Draws",  n: perf.draws },
    { key: "loss", label: "Losses", n: perf.losses }
  ];

  const bar = $("#perfFormBar");
  if (bar) {
    bar.innerHTML = segs.map(s =>
      '<i class="seg-' + s.key + '" style="width:' + ((s.n / total) * 100).toFixed(2) + '%" ' +
         'title="' + s.label + ": " + s.n + '"></i>'
    ).join("");
  }

  const legend = $("#perfFormLegend");
  if (legend) {
    legend.innerHTML = segs.map(s =>
      '<span><i class="lg-' + s.key + '"></i>' + s.label +
      " <b>" + s.n + "</b> (" + Math.round((s.n / total) * 100) + "%)</span>"
    ).join("");
  }

  fill($("#perfWinRate"), perf.winRate + "% win rate");
  fill($("#perfBalanceMeta"),
    perf.wins + "W · " + perf.draws + "D · " + perf.losses + "L from " + perf.played + " matches");
}

/* ---------- Rating trend chart (same matches, second metric) ---------- */
function renderRatingChart() {
  const box = $("#ratingChart");
  if (!box) return;

  const games = DEMO_MATCHES.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!games.length) {
    box.innerHTML = emptyState("📈", "No chart data", "Ratings appear once matches are played.");
    return;
  }

  const ratings = games.map(m => m.rating);
  fill($("#ratingAvg"), String(DEMO_PERFORMANCE.rating));

  const W = 760, H = 220, padL = 34, padR = 16, padT = 14, padB = 30;
  const innerW = W - padL - padR, innerH = H - padT - padB;

  /* The scale is centred on 6.0 so a good and a poor match
     are visibly different, rather than hugging the top. */
  const low = Math.max(0, Math.min(...ratings) - 1);
  const high = Math.min(10, Math.max(...ratings) + 1);
  const span = Math.max(1, high - low);

  const x = i => padL + (games.length === 1 ? innerW / 2 : (i / (games.length - 1)) * innerW);
  const y = v => padT + innerH - ((v - low) / span) * innerH;

  let grid = "";
  for (let v = Math.ceil(low); v <= high; v++) {
    grid += '<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (W - padR) + '" y2="' + y(v) +
            '" class="pd-grid-line" />' +
            '<text x="' + (padL - 8) + '" y="' + (y(v) + 4) +
            '" class="pd-axis-text" text-anchor="end">' + v + "</text>";
  }

  let xLabels = "";
  games.forEach((m, i) => {
    if (i % 2 !== 0 && i !== games.length - 1) return;
    xLabels += '<text x="' + x(i) + '" y="' + (H - 10) +
               '" class="pd-axis-text" text-anchor="middle">' +
               esc(m.date.slice(5)) + "</text>";
  });

  /* Season average, drawn as a dashed reference line */
  const avgY = y(DEMO_PERFORMANCE.rating);
  const avgLine = '<line x1="' + padL + '" y1="' + avgY + '" x2="' + (W - padR) + '" y2="' + avgY +
                  '" class="pd-avg-line" />';

  const path = ratings.map((v, i) => (i ? "L" : "M") + x(i) + " " + y(v)).join(" ");
  const dots = ratings.map((v, i) =>
    '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4" class="pd-dot pd-dot-rating">' +
      "<title>" + esc(games[i].opponent) + ": " + v + " / 10</title>" +
    "</circle>"
  ).join("");

  box.innerHTML =
    '<svg viewBox="0 0 ' + W + " " + H + '" class="pd-chart-svg" ' +
         'preserveAspectRatio="xMidYMid meet" role="img" ' +
         'aria-label="Match rating over ' + games.length + ' matches">' +
      grid + xLabels + avgLine +
      '<path d="' + path + '" class="pd-line pd-line-rating" fill="none" />' +
      dots +
    "</svg>";
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
  const host = $("#perfForm");
  if (!host) return;

  const recent = DEMO_MATCHES.slice().sort(byDateDesc).slice(0, 5);
  if (!recent.length) {
    host.innerHTML = emptyState("📈", "No recent form", "Your last five results appear here.");
    return;
  }
  host.innerHTML = recent.map(m => formChip(m)).join("");
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
   Club / District / National, switched by tabs.
   Club rows are derived from the roster (DEMO_STANDINGS),
   the national row is derived from DEMO_PERFORMANCE.
   ========================================== */
let activeRankTab = "club";

const RANK_VIEWS = {
  club: {
    title: "🏅 Club Standings",
    meta: "Top scorers at " + DEMO_CLUB.name + " — derived from the club roster",
    note: "Points = goals × 3 + assists. The same numbers appear on the Club Members page.",
    columns: ["Rank", "Player", "Played", "Goals", "Assists", "Points"]
  },
  district: {
    title: "🗺️ District Points Table",
    meta: "All districts (demo data)",
    note: "District totals are sample data for the class project.",
    columns: ["Rank", "District", "Points", "Clubs", "Players", ""]
  },
  national: {
    title: "🇧🇩 National Top Scorers",
    meta: "Bangladesh national league (demo data)",
    note: "Your row is calculated from the same season statistics used elsewhere on this page.",
    columns: ["Rank", "Player", "Club", "Played", "Goals", ""]
  }
};

function renderRankings() {
  const perf = DEMO_PERFORMANCE;

  const cards = [
    { icon: "🏆", value: "#" + perf.rank,       label: "Club Ranking",  foot: "Top scorers list" },
    { icon: "📈", value: perf.playerPoints,     label: "Player Points", foot: "Goals × 3 + assists" },
    { icon: "⚽", value: perf.goals,             label: "Goals",         foot: "Season total" },
    { icon: "🎯", value: perf.rating,           label: "Avg. Rating",   foot: "Out of 10" },
    { icon: "🗺️", value: districtRankLabel(),   label: "District Rank", foot: DEMO_PLAYER.district + " (demo)" }
  ];
  const stats = $("#rankStats");
  if (stats) {
    stats.innerHTML = cards.map(c => (
      '<div class="pd-stat">' +
        '<span class="pd-stat-icon">' + c.icon + "</span>" +
        "<b>" + esc(c.value) + "</b>" +
        "<small>" + esc(c.label) + "</small>" +
        '<span class="pd-stat-foot">' + esc(c.foot) + "</span>" +
      "</div>"
    )).join("");
  }

  drawRankTab();
}

function districtRankLabel() {
  const d = DEMO_DISTRICTS.find(x => x.district === DEMO_PLAYER.district);
  return d ? "#" + d.rank : "—";
}

/* Renders the header row and the body for whichever tab is open */
function drawRankTab() {
  const view = RANK_VIEWS[activeRankTab] || RANK_VIEWS.club;

  fill($("#rankTitle"), view.title);
  fill($("#rankMeta"), view.meta);
  fill($("#rankNote"), view.note);

  const head = $("#rankHead");
  const body = $("#rankTable");
  if (!head || !body) return;

  // Last column is a spacer, so it gets no label
  head.innerHTML = "<tr>" + view.columns
    .map((c, i) => '<th scope="col"' + (i === view.columns.length - 1 ? ' class="pd-col-empty"' : "") + ">" + esc(c) + "</th>")
    .join("") + "</tr>";

  let rows = [];   // { cells: [...], me: bool }

  if (activeRankTab === "club") {
    rows = DEMO_STANDINGS.map(r => ({
      me: r.me,
      cells: [r.rank, esc(r.name), r.played, r.goals, r.assists, r.points, ""]
    }));
  } else if (activeRankTab === "district") {
    rows = DEMO_DISTRICTS.map(d => ({
      me: d.district === DEMO_PLAYER.district,
      cells: [d.rank, esc(d.district), d.points, d.clubs, d.points * 2, ""]
    }));
  } else {
    rows = DEMO_NATIONAL.concat([myNationalRow()]).map(n => ({
      me: !!n.me,
      cells: [n.rank, esc(n.name), esc(n.club), n.played, n.goals, ""]
    }));
  }

  body.innerHTML = rows.map(r =>
    "<tr" + (r.me ? ' class="is-me"' : "") + ">" +
    r.cells.map(c => "<td>" + c + "</td>").join("") + "</tr>"
  ).join("");

  toggleEmptyState($(".pd-table-wrap", $("#view-rankings")) || $("#rankTable").closest(".pd-table-wrap"),
                  $("#rankEmpty"), rows.length === 0);
}

/* Tab clicks */
function bindRankTabs() {
  const tabs = $("#rankTabs");
  if (!tabs) return;

  tabs.addEventListener("click", e => {
    const btn = e.target.closest("[data-rank]");
    if (!btn) return;

    activeRankTab = btn.dataset.rank;

    $$(".pd-tab", tabs).forEach(t => {
      const on = t === btn;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });

    drawRankTab();
  });
}

/* ==========================================
   11. NOTICES (priority + unread handling)
   ========================================== */
let noticeFilter = "";

function visibleNotices() {
  if (noticeFilter === "unread") return DEMO_NOTICES.filter(n => n.unread);
  if (noticeFilter === "read")   return DEMO_NOTICES.filter(n => !n.unread);
  if (noticeFilter === "high")   return DEMO_NOTICES.filter(n => n.priority === "high");
  return DEMO_NOTICES;
}

function renderNotices() {
  const host = $("#noticeList");
  if (!host) return;

  const list = visibleNotices();

  if (!list.length) {
    host.hidden = true;
    toggleEmptyState(host, $("#noticeEmpty"), true);
    updateNoticeCount();
    return;
  }

  toggleEmptyState(host, $("#noticeEmpty"), false);

  host.innerHTML = list.map(n => {
    const original = DEMO_NOTICES.indexOf(n);
    return (
      '<li class="pd-notice is-' + n.priority + (n.unread ? " is-unread" : "") + '" data-index="' + original + '">' +
        '<span class="pd-notice-icon">' + n.icon + "</span>" +
        "<div>" +
          '<div class="pd-notice-head">' +
            (n.unread ? '<i class="pd-unread-dot" title="Unread"></i>' : "") +
            '<span class="pd-priority pd-priority-' + n.priority + '">' +
              esc(PRIORITY_LABEL[n.priority]) + "</span>" +
            "<h4>" + esc(n.title) + "</h4>" +
          "</div>" +
          "<p>" + esc(n.body) + "</p>" +
          '<span class="pd-notice-meta">' + esc(n.meta) +
            (n.unread ? " · Unread" : " · Read") + "</span>" +
        "</div>" +
        '<div class="pd-notice-actions">' +
          (n.unread
            ? '<button type="button" class="pd-notice-action" data-read="' + original + '">Mark read</button>'
            : '<button type="button" class="pd-notice-action" data-unread="' + original + '">Mark unread</button>') +
        "</div>" +
      "</li>"
    );
  }).join("");

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
  const fixtures = DEMO_FIXTURES;
  const fixtureHost = $("#fixtureList");

  if (fixtureHost) {
    if (!fixtures.length) {
      fixtureHost.innerHTML = "";
      toggleEmptyState(fixtureHost, $("#fixtureEmpty"), true);
    } else {
      toggleEmptyState(fixtureHost, $("#fixtureEmpty"), false);
      fixtureHost.innerHTML = fixtures.map(f => {
        const cd = countdownLabel(f.iso);
        return (
          '<div class="pd-match">' +
            '<img src="' + f.img + '" alt="" loading="lazy" onerror="this.style.display=\'none\';">' +
            '<div class="pd-match-body">' +
              "<h4>vs " + esc(f.opponent) + "</h4>" +
              "<small>" + esc(f.tournament) + "</small>" +
              '<small>📅 ' + esc(f.date) + " · 🕒 " + esc(f.time) + "</small>" +
              "<small>📍 " + esc(f.venue) + "</small>" +
              '<span class="pd-countdown ' + cd.cls + '">' + esc(cd.text) + "</span>" +
            "</div>" +
            '<div class="pd-match-vs">' +
              '<span class="pd-match-result pd-result-upcoming">Upcoming</span>' +
            "</div>" +
          "</div>"
        );
      }).join("");
    }
  }

  const tourneyHost = $("#tournamentList");
  if (tourneyHost) {
    if (!DEMO_TOURNAMENTS.length) {
      tourneyHost.innerHTML = "";
      toggleEmptyState(tourneyHost, $("#tournamentEmpty"), true);
    } else {
      toggleEmptyState(tourneyHost, $("#tournamentEmpty"), false);
      tourneyHost.innerHTML = DEMO_TOURNAMENTS.map(t => (
        '<div class="pd-tournament">' +
          '<span class="pd-tournament-icon">' + t.icon + "</span>" +
          '<div class="pd-match-body">' +
            "<h4>" + esc(t.name) + "</h4><small>" + esc(t.meta) + "</small>" +
          "</div>" +
          '<div class="pd-match-vs">' +
            '<span class="pd-tournament-status pd-status-' + esc(t.statusKey) + '">' +
              esc(t.status) + "</span>" +
          "</div>" +
        "</div>"
      )).join("");
    }
  }
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
        "<p class='pd-muted'>" + esc(m.id) + " · " + esc(m.position) +
          (captain ? ' <span class="pd-captain-tag">Captain</span>' : "") + "</p>" +
        (m.status === "Active"
          ? '<span class="pd-badge pd-badge-green">Active</span>'
          : '<span class="pd-badge pd-badge-yellow">Pending</span>') +
      "</div>" +
    "</div>" +
    '<h4 class="pd-subhead">' + esc(m.sport) + " statistics</h4>" +
    '<dl class="pd-details">' + statRows + "</dl>" +
    '<h4 class="pd-subhead">Profile details</h4>' +
    '<dl class="pd-details">' + details + "</dl>" +
    '<p class="pd-muted pd-note">Sample data for the class project — no database is connected yet.</p>'
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
    '<p class="pd-muted pd-note">' + esc(m.note) + "</p>" +
    '<p class="pd-muted pd-note">Sample result — no database is connected yet.</p>'
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
   Frontend only. Edits live in this browser's
   localStorage and never touch the database.
   ========================================== */
const SETTINGS_KEY = "ds_player_demo_settings";

/* Values the player has changed in the demo Settings form */
let localEdits = readSettings();

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(localEdits));
  } catch (e) { /* private mode - the demo still works in memory */ }
}

function clearSettings() {
  try { localStorage.removeItem(SETTINGS_KEY); } catch (e) {}
  localEdits = {};
  toast("Saved demo data cleared");
  fillSettingsForm();
  renderIdentity();
  renderProfile();
}

/* DEMO_PLAYER with the player's own edits layered on top */
function player() {
  return Object.assign({}, DEMO_PLAYER, localEdits);
}

function fillSettingsForm() {
  const p = player();

  $("#setName").value = p.name;
  $("#setPhone").value = p.phone;
  $("#setEmail").value = p.email;
  $("#setJersey").value = p.jersey;
  $("#setPosition").value = p.position;
  $("#setDistrict").value = p.district;
  $("#setBio").value = p.bio || "";

  updateAvatarPreview(p);
}

/* The avatar preview follows whatever name is typed */
function updateAvatarPreview(p) {
  const box = $("#setAvatar");
  if (box) {
    box.textContent = initials(p.name);
    box.style.setProperty("--h", avatarHue(p.name));
  }
  fill($("#setAvatarName"), p.name);
  fill($("#setAvatarMeta"), p.playerId + " · " + p.sport);
}

/* Restore the notification checkboxes from the saved demo settings */
function loadPrefs() {
  const saved = readSettings().prefs || {};
  $$("[data-pref]").forEach(input => {
    const key = input.dataset.pref;
    input.checked = saved[key] === undefined ? input.defaultChecked : !!saved[key];
  });
}

function bindSettings() {
  // Live avatar preview as the name is typed
  const nameInput = $("#setName");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      updateAvatarPreview(player());
    });
  }

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

    // Frontend only: keep the change in this browser
    localEdits = Object.assign({}, localEdits, {
      name,
      email,
      phone: $("#setPhone").value.trim(),
      jersey: $("#setJersey").value.trim(),
      position: $("#setPosition").value.trim(),
      district: $("#setDistrict").value || DEMO_PLAYER.district,
      bio: $("#setBio").value.trim()
    });
    saveSettings();

    msg.textContent = "✅ Saved in this browser only. Nothing was sent to a server, so this demo change resets when local storage is cleared.";
    msg.className = "muted pd-full pd-form-msg-ok";
    toast("Profile saved (browser only)");

    // Reflect the new details across the dashboard
    renderIdentity();
    renderProfile();
  });

  $("#profileForm").addEventListener("reset", () => {
    const msg = $("#profileFormMsg");
    msg.textContent = "";
    setTimeout(fillSettingsForm, 0);
  });

  const clearBtn = $("#clearStorage");
  if (clearBtn) clearBtn.addEventListener("click", clearSettings);

  // Notification preferences
  $$("[data-pref]").forEach(input => {
    input.addEventListener("change", () => {
      const prefs = readSettings().prefs || {};
      prefs[input.dataset.pref] = input.checked;
      localEdits = Object.assign({}, localEdits, { prefs });
      saveSettings();
      toast(input.checked ? "Preference saved" : "Preference turned off");
    });
  });

  loadPrefs();

  $("#passForm").addEventListener("submit", e => {
    e.preventDefault();
    const cur = $("#curPass").value;
    const nw  = $("#newPass").value;
    const con = $("#conPass").value;
    const msg = $("#passFormMsg");

    if (cur !== "123456") {
      msg.textContent = "❌ Demo check failed. Type 123456 to preview this screen.";
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

    msg.textContent = "✅ This is a visual mock only — your real password was not changed.";
    msg.className = "muted pd-form-msg-ok";
    e.target.reset();
    toast("Preview only — password unchanged");
  });
}

/* ==========================================
   14. NAVIGATION (sidebar + mobile drawer)
   ========================================== */
function showView(name) {
  const view = $("#view-" + name);
  if (!view) return;

  $$(".pd-panel").forEach(v => v.classList.remove("is-active"));
  view.classList.add("is-active");

  $$(".pd-nav a").forEach(a => {
    const active = a.dataset.view === name;
    a.classList.toggle("is-active", active);
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

  // Escape closes the mobile drawer, like the detail popup
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const sidebar = $("#pdSidebar");
    if (sidebar && sidebar.classList.contains("is-open")) closeDrawer();
  });

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
  const list = $("#noticeList");

  // Mark one notice as read / unread again
  if (list) {
    list.addEventListener("click", e => {
      const read = e.target.closest("[data-read]");
      if (read) {
        DEMO_NOTICES[Number(read.dataset.read)].unread = false;
        renderNotices();
        renderNoticeSnapshot();
        toast("Notice marked as read");
        return;
      }

      const unread = e.target.closest("[data-unread]");
      if (unread) {
        DEMO_NOTICES[Number(unread.dataset.unread)].unread = true;
        renderNotices();
        renderNoticeSnapshot();
        toast("Notice marked as unread");
      }
    });
  }

  // Mark all read
  const all = $("#readAllBtn");
  if (all) {
    all.addEventListener("click", () => {
      DEMO_NOTICES.forEach(n => { n.unread = false; });
      renderNotices();
      renderNoticeSnapshot();
      toast("All notices marked as read");
    });
  }

  // Priority / read filters
  const filter = $("#noticeFilter");
  if (filter) {
    filter.addEventListener("change", e => {
      noticeFilter = e.target.value;
      renderNotices();
    });
  }

  const clear = $("#noticeEmptyClear");
  if (clear) {
    clear.addEventListener("click", () => {
      noticeFilter = "";
      if (filter) filter.value = "";
      renderNotices();
    });
  }
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
  bindRankTabs();
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
