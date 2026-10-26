# Tournament & Registration Setup (Supabase)

This feature enables:
1. **Club Managers** to post tournaments from the **Matches** section in `login-system.html`.
2. Tournaments to automatically appear as notices on the **Welcome Page** (`index.html`) under Public Notices.
3. Any club or normal user/team to **register for the tournament** directly from the Welcome Page via a registration modal.
4. The organizing **Club Manager** to view all clubs/teams that applied and approve or reject them directly from their dashboard.

---

## Supabase SQL Script

Run this SQL in your **Supabase Dashboard → SQL Editor → New query → Run**:

```sql
-- 1. Safely add missing columns to tournaments table
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS club_id BIGINT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'Football';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS registration_deadline DATE;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS entry_fee TEXT DEFAULT 'Free';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS max_teams INT DEFAULT 16;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());

-- 2. Create Tournament Registration Requests Table
CREATE TABLE IF NOT EXISTS public.tournament_requests (
  id BIGSERIAL PRIMARY KEY,
  tournament_id BIGINT,
  applicant_type TEXT DEFAULT 'Club',
  team_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  district TEXT,
  player_count INT DEFAULT 11,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Ensure Notices Table exists
CREATE TABLE IF NOT EXISTS public.notices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_published BOOLEAN DEFAULT true,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Tournaments
DROP POLICY IF EXISTS "Public can view tournaments" ON public.tournaments;
CREATE POLICY "Public can view tournaments" ON public.tournaments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert tournaments" ON public.tournaments;
CREATE POLICY "Allow insert tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update tournaments" ON public.tournaments;
CREATE POLICY "Allow update tournaments" ON public.tournaments
  FOR UPDATE USING (true);

-- 6. Policies for Tournament Registration Requests
DROP POLICY IF EXISTS "Allow viewing tournament requests" ON public.tournament_requests;
CREATE POLICY "Allow viewing tournament requests" ON public.tournament_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can submit tournament request" ON public.tournament_requests;
CREATE POLICY "Anyone can submit tournament request" ON public.tournament_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow updating tournament requests" ON public.tournament_requests;
CREATE POLICY "Allow updating tournament requests" ON public.tournament_requests
  FOR UPDATE USING (true);

-- 7. Policies for Notices
DROP POLICY IF EXISTS "Public can view notices" ON public.notices;
CREATE POLICY "Public can view notices" ON public.notices
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert notices" ON public.notices;
CREATE POLICY "Allow insert notices" ON public.notices
  FOR INSERT WITH CHECK (true);

-- 8. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
```
