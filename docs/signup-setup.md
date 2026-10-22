# Signup Setup — Player Registration

Adds a public player signup page (`signup.html` + `js/signup.js`) that
creates a Supabase Auth account and stores the profile in your existing
`public.profiles` and `public.players` tables.

## Step 1 — Table requirements

Your schema already has these tables, no new table is needed:

| Table | Columns used by signup |
|-------|------------------------|
| `auth.users` | id (uuid), email, password (via Supabase Auth) |
| `public.profiles` | id (uuid, PK → auth.users), full_name, phone |
| `public.clubs` | id (integer, PK), name |
| `public.players` | profile_id (uuid), club_id (integer), full_name, status |

## Step 2 — Email confirmation

By default Supabase sends a confirmation email. The signup page tells
the user to check their inbox before logging in.

To allow instant login without confirmation, go to
**Authentication → Settings** and disable **"Enable email confirmations"**.

## Step 3 — Test

1. Open `signup.html` (with Live Server).
2. Fill in name, email, password, phone, address and pick a club from the dropdown (clubs load live from your `clubs` table).
3. Submit — the auth account is created, a row is inserted into `public.profiles`, and the player is added to `public.players` linked to the chosen club.
4. The user is redirected to `login.html`.

## Files added

- `signup.html` — Player signup form
- `js/signup.js` — Supabase signUp + profiles + players inserts
- `login.html` — Added "Sign up as Player" link
