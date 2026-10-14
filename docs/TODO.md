# 2ndU – TODO

## Now
- [ ] **UI polish** (next up): layout, spacing, mobile, empty/loading states, consistent buttons and forms.

## Needs testing (written, not yet verified end-to-end)
- [ ] Signup as "Buy and sell" with a school email + student ID → confirm link → lands as a seller on `/sell/new`; signup as "Just buying" still works
- [ ] Auth emails: sign up → confirm link lands logged in; "Forgot password?" → link → `/reset-password` → log in with new password; unconfirmed login shows "Resend confirmation email"
- [ ] Message emails: set up the webhook (see ARCHITECTURE "Auth emails and notifications"), send a chat message, check the other account gets one email per burst
Verified so far: seller verification, chat both directions (with polling backup), pages load, tables exist.
- [ ] Post a listing with photos; edit it (remove one photo, add one, check storage is cleaned)
- [ ] "Being negotiated" banner, seen from a third account
- [ ] Mark sold updates another user's open product page and the home grid
- [ ] Report a listing, then remove it / ban the seller from `/admin`; confirm all their listings disappear and chats close
- [ ] Run migration `0002` and confirm banned users and removed listings are locked
- [ ] Run migration `0003_favorites.sql` in Supabase, then test: heart on card and product page, `/favorites`, `/seller/[id]` (also logged out)
- [ ] Row-level security spot checks: non-seller can't insert listings, non-admin gets 404 on `/admin`, banned user can't chat
- [ ] Seller can chat on other sellers' listings (one account, both roles)
- [ ] Test on a phone-sized screen

## Known gaps
- [ ] Find the real cause of the buyer not receiving live chat pushes (polling hides it). Check the console for `[2ndU chat] realtime unavailable`, then Supabase Realtime settings. `ChatsLink` still has no polling backup.
- [ ] Unbanning doesn't restore listings (can't tell ban-removed from admin-removed). Consider a `removed_reason` column.
- [ ] Banned users can still log in and browse (they can't post or chat).
- [ ] "Being negotiated" banner only clears on the next re-render after 24 h.
- [ ] Sellers can't choose which buyer an item was sold to ("sold to" picker).

## Features not built yet
- [ ] Spam limits: rate-limit messages, listings per day, and reports
- [ ] Admin: user list, search, unban, view resolved reports
- [ ] Seller ratings (profile page exists at `/seller/[id]`; ratings need the "sold to" picker first)
- [ ] Image moderation / size cap on upload (client resize exists; no server limit)

## Before launch
- [ ] Set up email (code is written, config is not): add the `/auth/confirm` redirect URLs in Supabase; create a Resend account and fill the env vars from `.env.example` on Vercel; create the Supabase Database Webhook on `messages` INSERT → `<site>/api/notify-message` with the `x-webhook-secret` header. Details in ARCHITECTURE "Auth emails and notifications".
- [ ] Deploy (Vercel) and set env vars; set Supabase Site URL and redirect URLs to the real domain
- [ ] Custom SMTP in Supabase (default email sender is heavily rate-limited)
- [ ] Add a privacy / terms page; state clearly that student IDs are only format-checked
- [ ] Make the first admin account in production
- [ ] Back up the database; decide who monitors reports
- [ ] Add a minimal e2e test for the main flow (post → chat → sold)
- [ ] Commit our work (the repo only has the scaffold's initial commit; `.env*` is already git-ignored, so keys won't be committed). Add a remote before deploying.

## Housekeeping
- [ ] Move the school domain / ID pattern to one source of truth (currently in `validation.ts`, `become_seller` SQL, and an env var)
- [ ] Add more unit tests (`isNegotiating`, listing query)

## Privacy
- [ ] `profiles` is readable by everyone (policy `profiles readable`), so `student_id` and `school_email` can be fetched through the API even though no page shows them. Fix: make a `public_profiles` view (id, display_name, is_seller, created_at) for public reads and restrict the table to the owner/admin; then update the queries that read other users' profiles (`listing/[id]/page.tsx`, `seller/[id]/page.tsx`, inbox).

## Performance
- [ ] `become-seller/page.tsx` still calls `supabase.auth.getUser()` on purpose: it needs `email_confirmed_at` and `new_email`, which are not in the JWT claims. Leave unless those checks move server-side.
- [ ] Source images in `public/` are large (`classic-wardrobe.png` 2.1 MB, `auth-bg.jpg` 2.1 MB, `parrot.png` 1 MB); `next/image` serves optimized copies, but compressing the originals speeds the first (uncached) hit.
