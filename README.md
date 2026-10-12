# 2ndU

Second-hand marketplace for Rangsit University students. Next.js 16 (React + Node) + Supabase.

## Setup

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` (tables, Row Level Security, storage bucket, realtime).
3. Authentication → Providers: keep **Email** on, leave Google etc. off. Authentication → URL Configuration: add `http://localhost:3000` as Site URL.
4. `cp .env.example .env.local` and fill in the project URL and anon/publishable key.
5. `npm install && npm run dev`, then open http://localhost:3000.

## Make yourself an admin

Sign up, then run in the SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Seller verification

"Become a seller" → the user changes their account email to a school email (confirmation link) → enters a 7-digit student ID.
The check is enforced in the database function `become_seller`. To change the school domain or ID pattern, edit that function
(`'^6\d{6}$'`, `'%@rsu.ac.th'`), `src/lib/validation.ts`, and `NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN`.

## Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npm test`
