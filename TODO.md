# 2ndU – TODO

## Now
- [ ] **UI polish** (next up): layout, spacing, mobile, empty/loading states, consistent buttons and forms.

## Needs testing (written, not yet verified end-to-end)
Verified so far: seller verification, chat both directions (with polling backup), pages load, tables exist.
- [ ] Post a listing with photos; edit it (remove one photo, add one, check storage is cleaned)
- [ ] "Being negotiated" banner, seen from a third account
- [ ] Mark sold updates another user's open product page and the home grid
- [ ] Report a listing, then remove it / ban the seller from `/admin`; confirm all their listings disappear and chats close
- [ ] Run migration `0002` and confirm banned users and removed listings are locked
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
- [ ] Save / favourite items (buyers) – in the original plan
- [ ] Email notifications for new messages
- [ ] Spam limits: rate-limit messages, listings per day, and reports
- [ ] Admin: user list, search, unban, view resolved reports
- [ ] Seller profile page / ratings
- [ ] Password reset flow and "change email" polish
- [ ] Image moderation / size cap on upload (client resize exists; no server limit)
- [ ] Pagination or infinite scroll (home page caps at 60 listings)

## Before launch
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
