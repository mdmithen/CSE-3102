# Project Status Report — District Sports

**Repository:** `mdmithen/CSE-3102`  
**Project type:** Academic, browser-based sports club management prototype  
**Status:** Partially implemented; several workflows are connected to Supabase, while substantial public/player UI remains sample content.

## 1–2. Project name, purpose, and goals

**District Sports** aims to help clubs and players across Bangladesh manage club membership and sports activity. The intended product supports club administration, player registration and discovery, matches, tournaments, statistics, and public sports information. The code currently implements selected club/player management flows rather than the full platform described in the README.

## 3. Technologies

- **Frontend:** HTML5, CSS3, browser JavaScript (no framework or build step).
- **Backend/data:** Supabase JavaScript client v2 loaded from jsDelivr; browser code calls Supabase Auth, PostgREST tables, and RPC functions directly.
- **Database/API:** Supabase project is configured in `js/supabase-config.js`. Expected tables and RPCs are listed below; their schemas, migrations, and policies are not included in this repository.
- **Other dependencies:** No application dependencies or scripts are declared. `package-lock.json` is effectively empty; there is no `package.json`, test runner, or bundler configuration.

## 4. Project structure

```text
.
├── .gitignore
├── README.md
├── package-lock.json
├── admin.html
├── index.html
├── login-system.html
├── login.html
├── player-dashboard.html
├── signup.html
├── test-connection.html
├── css/
│   ├── admin.css
│   ├── club-admin.css
│   ├── home.css
│   ├── login.css
│   ├── player-dashboard.css
│   ├── public.css
│   └── style.css
├── images/
│   ├── clubs.png
│   ├── cricket.jpg
│   ├── football.jpg
│   ├── players.png
│   ├── trophy.png
│   └── ucl-starball.webp
├── js/
│   ├── admin.js
│   ├── auth.js
│   ├── club-admin.js
│   ├── home.js
│   ├── login.js
│   ├── player-dashboard.js
│   ├── player-join.js
│   ├── signup.js
│   └── supabase-config.js
└── will/
    ├── admin.jpeg
    └── manager.jpeg
```

`css/style.css` is not referenced by the HTML pages. There are no SQL, migration, server, or deployment files in the repository.

## 5. Existing features and status

| Area | Status | Evidence / functionality |
|---|---|---|
| Public home | **Partially live** | `index.html`, `js/home.js`: loads published notices, tournaments, upcoming matches, and player statistics; offers a public tournament-request form and player-stat detail modal. The Club Rankings region has an empty state but no loader. |
| Authentication | **Implemented, demo-grade** | `login.html`, `js/login.js`, `js/auth.js`: Supabase email/password sign-in, role-based redirects, password visibility toggle, logout, and a browser-side session cache. |
| Player signup | **Partially implemented** | `signup.html`, `js/signup.js`: creates an Auth user, profile/user rows, and a roster record for a selected club. These are sequential writes rather than one transaction. |
| Super Admin | **Partially live** | `admin.html`, `js/admin.js`: reads clubs and users; adds clubs, assigns a manager via RPC, deletes clubs, views roster rows, and navigates a responsive dashboard. |
| Club manager | **Partially live** | Embedded in `login-system.html`, implemented in `js/club-admin.js`: loads managed club(s), registers players, searches roster, reviews join requests, schedules matches, publishes tournaments/notices, reviews tournament requests, and maintains player statistics. Equipment, player-card, and report panels are explicit placeholders. |
| Player dashboard | **Partially live / mostly UI demo** | `player-dashboard.html`, `js/player-dashboard.js`, `js/player-join.js`: reads a player profile, roster, club, and matches; allows a player to submit/view a club join request. Rankings, notices, most performance content, tournaments, and settings are not wired to live data. |
| Public directories/portal | **Static sample** | `login-system.html` contains sample club/player listings, points tables, tournament cards, news, and scouting search UI; these sections are not backed by queries. Its public player-registration form is connected to Supabase. |
| Connection test | **Basic diagnostic** | `test-connection.html` tests client initialization and reads from `clubs` and `districts`. |

## 6. User roles and permissions

- **Super Admin (`super_admin`):** Admin panel access; club/user administration.
- **Club Admin / Manager (`club_admin`):** Embedded manager panel; club roster, join requests, matches, tournaments, notices, and stats.
- **Player (`player`):** Player dashboard and join-request workflow.
- **Public visitor:** Can view the public pages and submit tournament registration requests; some public content is static, and public registration forms create player accounts.

`js/auth.js` uses `profiles.role`, then Auth user metadata, then defaults to `player`. Page guards check the cached browser role; the code itself notes that real authorization must be enforced by Supabase Row Level Security (RLS). Server-side permissions cannot be assessed from this repository.

## 7. Frontend pages and UX

- `index.html` — public landing page and live information board; responsive marketing layout and modal forms.
- `login.html`, `signup.html` — shared sign-in and player registration forms.
- `admin.html` — responsive Super Admin sidebar/dashboard with clubs, users, and add-club panels.
- `login-system.html` — legacy all-in-one public site with static sample sections and the embedded responsive Club Manager dashboard. `js/club-admin.js` switches between manager panels and protects that UI by role.
- `player-dashboard.html` — responsive sidebar dashboard with profile, club, members, performance, rankings, notices, matches, and settings screens; much of the visible content is demo-only.
- `test-connection.html` — unstyled Supabase connectivity check.

The CSS is page/module-specific, with responsive layouts, sidebar drawers, dialogs, status messages, and some accessibility support (labels, skip links, live status regions). The old `login-system.html` mixes public and administrative UI and duplicates some registration/sample content.

## 8. Backend and database status

The app has **no application server**. Browser code uses Supabase directly and expects these tables: `profiles`, `users`, `districts`, `clubs`, `players`, `join_requests`, `matches`, `tournaments`, `tournament_requests`, `player_stats`, and `notices`.

Expected RPCs include `admin_set_manager`, `admin_list_users`, `my_club_id`, `club_approve_request`, and `club_reject_request`. The SQL definitions, constraints, triggers, grants, and RLS policies are absent, so table compatibility and data protection must be verified in the Supabase project. Many features depend on those external objects.

## 9. Authentication and authorization

Supabase Auth verifies passwords. `js/auth.js` caches role/name/email in browser storage (not the password), redirects by role, and asynchronously rechecks an existing session/profile against Supabase. `admin.js` and `player-dashboard.js` use `requireRole`; the Club Manager panel is hidden for other roles on the public page. These are client-side controls, not a substitute for RLS/RPC authorization. The project includes demo-account autofill and automatic manager-account provisioning using a fixed weak default password; this is unsuitable for production.

## 10. Completed work evidenced in code

- Shared Supabase client/configuration and common Auth helper.
- Separate login, player signup, Super Admin, Club Manager, and Player UI flows.
- Live club/player/join-request/match/tournament/stat/notices queries in selected workflows.
- Manager approval/rejection actions and public tournament registration submission.
- Responsive layouts and explicit empty states in several live panels.

No changelog or task tracker is present, so this is a code-based status rather than a verified history of completed tasks.

## 11. Known issues and risks

- **Credentials / provisioning:** The UI and client code expose demo credentials and use a fixed default manager password. Remove demo shortcuts and use a secure, privileged account-provisioning flow before deployment. No credential values are reproduced in this report.
- **Authorization not verifiable:** No SQL or RLS policies are supplied. Browser role checks and user metadata must not be treated as trusted authorization.
- **Partial writes:** Signup and manager/player provisioning touch multiple tables in separate requests. A failure can leave an Auth user, profile, user row, or roster record only partially created.
- **Status casing differs:** Some registration paths write `active`, while dashboard rendering compares against `Active`; active-player counts/badges may therefore be wrong for those records.
- **Admin status mismatch:** `admin.html` says newly added clubs are Pending, but `js/admin.js` inserts them with status `Active`.
- **Player dashboard display defects:** `js/player-dashboard.js` does not populate the email field with the signed-in email and attempts to set image alt text through a helper that writes `textContent`. The dashboard’s “upcoming” match rendering also selects matches from a descending date query without excluding past dates.
- **Stale/misleading copy:** Some page footers/comments describe screens as demo-only or empty even where current scripts load live data; README folder/features do not match the implementation.
- **Direct browser writes:** Public and client-side forms write to Supabase; safe operation depends on strict RLS, validation, and rate limits configured outside this repository.

## 12–13. Incomplete features and pending work

- Create and version the Supabase schema, constraints, RPCs, triggers, and RLS policies in the repository; verify them against every client query.
- Replace fixed-password manager provisioning with a secure server-side/administrative invitation and reset flow.
- Complete live player rankings, notices, tournament views, performance history, profile editing, password changes, notification preferences, and any advertised filters.
- Add the missing public club rankings loader and replace static public directories, search, points tables, tournament/news cards with validated live data (or clearly label/remove them).
- Implement or remove the Club Manager equipment, digital-card, and reports placeholders.
- Reconcile status values and align the admin add-club UI with actual persisted status.
- Make multi-table registration/provisioning reliable (server-side transaction or compensating recovery), and handle partial failures consistently.
- Clarify which public player-registration path is canonical; currently both `signup.html` and a form in `login-system.html` create records with different write behavior.

## 14. Recommendations

Prioritize database/RLS verification and removal of weak demo provisioning before exposing the app publicly. Then document schema/API contracts, standardize role/status fields and validation, make account workflows recoverable, and replace or label all static/demo content. Add focused tests for Auth redirects, provisioning failures, role isolation, and core Supabase workflows; the repository currently has no automated test setup.

## 15. Technical notes for future AI assistance

- Keep changes consistent with the existing vanilla HTML/CSS/JavaScript structure unless a migration to a framework is explicitly approved.
- Script load order matters: Supabase CDN → `js/supabase-config.js` → `js/auth.js` (where used) → page-specific script.
- Club Admin navigation is embedded in `login-system.html`; its return route is `login-system.html#clubs` and URL hashes select dashboard panels.
- The README is aspirational and out of sync. Inspect the actual HTML/JS and confirm the external Supabase schema/RLS before assuming a listed feature or RPC exists.
- Configuration lives in `js/supabase-config.js`; do not copy project keys into reports, issues, or generated documentation.
- There are no Node scripts, migrations, or test commands to rely on. The standalone JavaScript files currently pass `node --check`.
