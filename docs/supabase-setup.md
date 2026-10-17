# Supabase Setup — Login (Step by Step)

`login.html` verifies email + password with **Supabase
Auth** and reads the role from the **profiles** table.

> **Already done (no action needed):**
> - Tables were built in the Supabase dashboard:
>   `profiles`, `clubs`, `players`, `tournaments`,
>   `districts`, `matches`, `news`
> - The login policies + new-user trigger were run in the
>   SQL Editor. SQL lives in the team chat, **not** in
>   this repo — ask the developer if you ever need to
>   re-run it.

Only the two steps below are left.

---

## Step 1 — Create the 3 demo users

There is no sign-up page in the project, so the users are
added directly:

1. Dashboard → **Authentication** → **Users** → **Add user**
2. Fill in the form and tick **Auto Confirm**
3. Repeat for all three:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@districtsports.com` | `123456` |
| Club Admin | `clubadmin@districtsports.com` | `123456` |
| Player | `player@gmail.com` | `123456` |

> **Note:** `admin@gmail.com` was rejected by the
> Supabase dashboard, so the super admin uses the same
> domain as the club admin. If you ever change it, update
> two places:
> - `js/auth.js` → `DEMO_ACCOUNTS`
> - `login.html` → the `data-email` + text of the
>   Super Admin demo button

---

## Step 2 — Give each user a role

Roles live in the `profiles` table, not in the password.
The `profiles` table has **no email column**, so the role
seed matches users through `auth.users`.

1. Ask for the **role seed SQL** (it is kept in the team
   chat, not in this repo)
2. Dashboard → **SQL Editor** → **New query** → paste → **Run**
3. The last query must return **3 rows** showing
   `super_admin`, `club_admin`, `player`

> Run this **after** Step 1. Users created before the
> trigger existed, or a re-run after adding users, always
> needs this seed again.

---

## Step 3 — Test

Open `login.html` (with Live Server) and use the demo
buttons, or type the credentials by hand:

- `admin@districtsports.com` / `123456` → `admin.html`
- `clubadmin@districtsports.com` / `123456` → `login-system.html#clubs`
- `player@gmail.com` / `123456` → `player-dashboard.html`

Wrong password → red error message, no redirect.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Supabase is not connected" | The CDN `<script>` tag or `js/supabase-config.js` is missing from that page |
| "Invalid email or password" for a user you just created | Wait a few seconds, then retry; check the email is typed exactly |
| Admin lands on the player dashboard | Step 2 not run — the `profiles` row has no `super_admin` role yet |
| "Your email is not confirmed" | Add the user again with **Auto Confirm** ticked |
| Console warning about `profiles` | The login policy/trigger SQL was not run — ask for it in the chat |
| New user has no `profiles` row | Run the trigger SQL, then run the role seed again |
| `over_email_send_rate_limit` | Only affects sign-ups sent from a page; dashboard "Add user" is unlimited |

---

## What is safe / not safe

- ✅ **Project URL + anon key** in `js/supabase-config.js`
  are public on purpose — every frontend has them.
- ⛔ Never commit the **service_role** key anywhere.
- 🔒 RLS on `profiles` means users only read **their own**
  role. Add write policies later when you start saving
  clubs, players and tournament data.
- 🚫 SQL scripts are intentionally **not** stored in this
  repository — they live in the team chat.
