# Supabase setup (one time, ~5 minutes)

The app syncs your tasks across devices using Supabase (Postgres + auth). Here's
how to wire up your own free project.

## 1. Create a project

1. Go to <https://supabase.com/dashboard> and sign in.
2. **New project** → pick a name and a strong database password → **Create**.
3. Wait ~1 minute for it to provision.

## 2. Create the tables

1. In the left sidebar, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy its contents into the editor.
3. Click **Run**. You should see "Success". (It's safe to run more than once.)

## 3. Configure email magic links

Magic-link sign-in works out of the box on Supabase's built-in email for low
volume. For reliability you can later add your own SMTP under
**Authentication → Emails**, but it isn't required to start.

Make sure your app URL is allowed:

1. **Authentication → URL Configuration**.
2. Set **Site URL** to where the app runs:
   - Local dev: `http://localhost:5173`
   - Production: your deployed URL (e.g. your Vercel domain).
3. Add both to **Redirect URLs** as well.

## 4. Add your keys to the app

1. **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
2. In the repo, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Paste your values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart the dev server (`npm run dev`). The setup screen disappears and you'll
   get the sign-in screen.

## 5. Deploying (optional)

When you deploy (e.g. Vercel), set the same two `VITE_SUPABASE_*` variables as
environment variables in your host's project settings, and add the production
URL to Supabase's Site URL / Redirect URLs (step 3).

## Notes

- The `anon` key is meant to be public. Your data is protected by **Row-Level
  Security** (in `schema.sql`): every row is tied to your user id and only you
  can read or write it.
- The app keeps a local cache, so it opens instantly and still works offline —
  changes queue up and sync the next time you're online.
