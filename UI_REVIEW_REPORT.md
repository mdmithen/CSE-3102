# UI and Frontend Quality Review

**Review date:** 2026-10-31  
**Scope:** `index.html`, `login.html`, `signup.html`, `admin.html`, `login-system.html`, `player-dashboard.html`, and the styles/scripts loaded by those pages.

## Summary

Found **2 medium-priority issues** and **3 low-priority issues**. No application files were changed. Supabase, authentication, database, RPC, RLS, and other backend behavior were not reviewed or modified. No demo data was added.

## Findings

### 1. Player dashboard shortcut links do not switch panels — Medium

**Affected:** `player-dashboard.html:140, 264, 565`; `js/player-dashboard.js:403–459`  
The “View all,” “View all members,” and “Open My Performance” links have `data-view` attributes, but the click handler is attached only to `.pd-nav`. Clicking these shortcuts changes the URL fragment without calling `showPanel()`, so the requested dashboard view remains hidden.

**Suggested fix:** Route these existing `[data-view]` shortcuts through the same panel-switching behavior as sidebar links, preserving their current markup and hooks.  
**Risk:** Low if the current `showPanel()` behavior is reused; avoid changing panel IDs or data attributes.

### 2. Olive theme and accent contrast vary between pages — Medium

**Affected:** `css/public.css:23–28`; `css/admin.css:31, 363–370, 1010–1017, 1389–1492`; `css/club-admin.css:403, 644, 678–707, 1160–1167, 1257`; `css/player-dashboard.css:12–29, 1239`  
The public portal and some admin controls still use emerald accents (`#16A34A` / `#15803D`), while the requested palette is olive (`#556B2F`, `#6B8E23`, `#E6EBCF`). White text on `#16A34A` has about **3.30:1** contrast, and white text on `#6B8E23` about **3.81:1**—below the 4.5:1 WCAG AA target for normal-size text. The primary olive `#556B2F` is about 5.95:1 against white.

**Suggested fix:** Consolidate accent usage around the requested palette and verify foreground/background contrast for text and buttons, retaining distinct semantic colors for errors and statuses.  
**Risk:** Color-token changes can affect multiple controls within a stylesheet; verify all affected pages and states rather than globally replacing semantic status colors.

### 3. Several visible links are placeholders — Low

**Affected:** `login.html:46`; `login-system.html:1258–1331, 1405–1419`  
“Forgot Password?”, tournament “View Details” / “Register,” and news “Read More” links use `href="#"` and have no corresponding handler in the page UI code. They therefore do not complete the action their labels promise. The Club Admin logout links also use `#`, but have JavaScript handlers and are not included in this finding.

**Suggested fix:** Connect these links only to existing supported actions, or render them as non-interactive/unavailable until a real destination or behavior exists.  
**Risk:** Adding new destinations or handlers would expand functionality; keep any future change limited to an approved behavior.

### 4. Player avatar’s alternative text is not updated — Low

**Affected:** `js/player-dashboard.js:171`; `player-dashboard.html:83`  
`renderIdentity()` passes the image’s `alt` string to `fill()`, which expects an element and assigns `textContent`. This does not update the image attribute, leaving the static “Player avatar (demo)” alternative text after the player name is populated.

**Suggested fix:** Update the existing image element’s `alt` attribute directly when rendering the player identity.  
**Risk:** Accessibility-only; no data or account behavior should change.

### 5. Player dashboard starts with sample identity and mixed demo/live copy — Low / informational

**Affected:** `player-dashboard.html:41, 59, 83, 86, 91, 103–165, 514, 540–550, 585`  
The page includes a sample name/avatar and year as initial markup, as well as multiple explicitly demo-labeled sections. The page does disclose “LIVE + DEMO DATA,” and the footer describes the mixed sources, but the sample identity can be visible before live data replaces it or if loading does not complete.

**Suggested fix:** If this fallback is not intentional, use a neutral loading/empty presentation for identity fields and retain explicit labels for existing demo-only sections. Do not seed or add sample records.  
**Risk:** Keep this to presentation/fallback copy; do not change data loading or backend behavior.

## Checks and limitations

- **Navigation:** Admin and Club Admin sidebar/drawer code paths and panel hooks are present; the Player Dashboard shortcut issue above is the identified exception.
- **Responsive CSS:** Desktop/tablet/mobile breakpoints are present across the reviewed page stylesheets, and dashboard tables have horizontal-scroll wrappers. Actual rendered layouts at specific viewport sizes were not browser-tested.
- **Assets:** The local image references found (`images/ucl-starball.webp`, `images/players.png`) exist in the repository.
- **Console/runtime:** IDE diagnostics returned no issues and all seven page UI scripts passed Node syntax checks. No browser runtime was available, so browser-console errors, external CDN behavior, and live responsive rendering could not be confirmed.
