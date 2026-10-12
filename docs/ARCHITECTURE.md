# 2ndU – Architecture

Second-hand marketplace for Rangsit University students. Sellers post items, buyers chat with them, the seller marks items sold by hand. Payment and handover happen off-site.

## Stack

| Layer | Choice |
| --- | --- |
| Web app | Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS 4 |
| Backend | Supabase: Postgres, Auth (email + password only), Storage, Realtime |
| Tests | Vitest (unit tests for validation rules only) |

There is **no custom backend server**. Next.js serves pages and talks to Supabase directly. Authorization is enforced in the database (Row Level Security, triggers, one RPC), not in app code, so the browser cannot bypass it.

Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before changing framework-level code. Notable here: middleware is now `src/proxy.ts`; `PageProps<"/route">` and `LayoutProps` are global types; `cacheComponents` is **off** in `next.config.ts` (it forces every dynamic page into Suspense, which doesn't suit per-user pages).

## One site, role-based

Not three apps. What a person sees depends on who they are:

| Who | Can do |
| --- | --- |
| Logged out | Browse, view product pages |
| Any account (buyer) | Chat, report listings |
| Seller (`profiles.is_seller`) | Everything a buyer can, plus post, edit, mark sold, delete own listings |
| Admin (`profiles.role = 'admin'`) | `/admin`: review reports, remove listings, ban users |

One account does both buying and selling. There are no separate buyer and seller accounts.

## Directory layout

```
src/
  proxy.ts                  Refreshes the Supabase session cookie; redirects logged-out users away from
                            /sell, /inbox, /become-seller, /admin (optimistic only, not security)
  app/
    page.tsx                Home: hero + live grid (filtered by ?q= / ?cat=)
    login/, signup/         AuthForm (email + password)
    become-seller/          Seller verification (school email, then student ID)
    listing/[id]/           Product page (ListingDetail: live status, chat button, report)
    sell/new/, sell/[id]/edit/, sell/mine/    Post, edit, manage (mark sold / relist / delete)
    inbox/, inbox/[conversationId]/           Chat list (Buying/Selling tabs) and chat room
    admin/                  Report queue
  components/               Nav, MobileNav (hamburger drawer, shadcn Sheet), SearchSheet (nav search button → top panel with search box + category chips),  CategoryFilter (category pills above the grid), ui/ (shadcn), ChatsLink (unread badge), ListingCard, ListingGrid, ListingForm, ...
  lib/
    supabase/client.ts      Browser client
    supabase/server.ts      Server client (cookies)
    validation.ts           Student ID regex, school email domain, price/image limits (+ .test.ts)
    listingsQuery.ts        Home query shared by server render and the grid's refresh
    types.ts                Types, categories, isNegotiating()
    images.ts               Client-side photo resize before upload
supabase/migrations/        0001_init.sql, 0002_ban_cleanup_and_edit_lock.sql  (run in order)
```

Pages are server components that fetch data and pass it to a client component, which keeps it live.

**No back button.** Pages have no in-app back button; users go back with the browser/OS back gesture, which Next restores from its client router cache (no reload, scroll position kept).

## Data model (Postgres)

- `profiles`: one per auth user (created by trigger). `role`, `is_seller`, `student_id`, `school_email`, `banned`.
- `listings`: `seller_id`, title, description, price (1–100,000), `images[]` (1–8), `location_text`, `fulfillment` (delivery / pickup / both), `status` (available / sold / removed), `sold_at`, `last_negotiated_at`, `last_negotiated_by`.
- `conversations`: one per (listing, buyer). `messages`: belong to a conversation, with `read_at`.
- `reports`: listing reports, reviewed in `/admin`.
- Storage bucket `listing-images` (public read; sellers write only inside their own `<userId>/` folder).

## Key flows

**Seller verification.** User clicks "Become a seller", changes their account email to an `@rsu.ac.th` address (Supabase sends a confirmation link), then enters a student ID matching `^6\d{6}$`. The browser calls the `become_seller(p_student_id)` RPC, a `security definer` function that checks the confirmed email domain and ID pattern, then sets `is_seller`. The ID is only format-checked; there is no student database. Users cannot set `is_seller`, `role`, `banned`, `student_id` or `school_email` themselves (`protect_profile_columns` trigger).

**Posting and editing.** `ListingForm` resizes photos in the browser, uploads to storage, then inserts or updates the row. RLS requires an active (unbanned) seller. Photos removed during an edit are deleted from storage; photos uploaded in a failed save are cleaned up.

**Chat.** "Chat with seller" creates a conversation (RLS: available listing, not your own). Messages can only be sent while the listing is `available`, so marking it sold closes the chat.

**"Being negotiated" banner.** When a buyer sends a message, the `on_message_insert` trigger writes `last_negotiated_at` / `last_negotiated_by` on the listing. The listing row is public, so everyone can see it without reading private chats. The UI (`isNegotiating`) shows the banner for 24 hours after the last buyer message, hidden from the buyer who is negotiating.

**Mark sold.** Seller sets `status = 'sold'`; `sold_at` is set by trigger. Open pages update through live updates (and the polling backup below).

**Bans.** Setting `profiles.banned = true` (admin only) fires `on_profile_banned`, which sets all of that seller's listings to `removed`. Banned users can still log in and browse but cannot post or chat (RLS), and see a suspended bar. Unbanning does **not** restore listings.

## Security model

- RLS is on every table. Helper functions: `is_admin()`, `is_active_seller()`, `is_active_user()`.
- Protected-column triggers (`protect_profile_columns`, `protect_listing_columns`) stop owners from escalating privileges, removing their own listing, touching negotiation fields, or editing an admin-removed listing.
- Our own `security definer` functions set a transaction-local flag `app.bypass = '1'` so they can write protected columns. Users cannot set it for their own updates to take effect.
- The anon key is public by design; the rules above are what protect data. Never ship the service-role key to the browser.
- `src/proxy.ts` redirects are a convenience only. Real checks are RLS plus server-side role checks in `admin/page.tsx` and the `sell/*` pages.

## Live updates

Pages use Supabase Realtime (`postgres_changes`) for fast pushes, **plus a polling backup** (every 4–5 s and on tab focus) in the chat room, product page and home grid. The backup exists because the buyer side of a chat did not receive live pushes during testing and the cause wasn't found. Each mount uses a unique channel name. `ChatsLink` (nav unread badge) has no polling backup yet.

## Visual theme

Site-wide look (set by the home hero and nav; apply it to every new or restyled page):
- Dark green `#0f3d2e` for the nav and hero, white content area, white text on green.
- Small labels (nav links, buttons, pills, card titles): `text-[11px] font-bold uppercase tracking-widest`.
- Headings `font-black uppercase`; prices bold dark green sans; square corners (no `rounded-*` on cards/buttons).
- Primary button: solid white on green (or solid green on white); secondary: outlined.
- No ghost-text bands below the hero.

## Configuration

`.env.local` (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN` (`rsu.ac.th`).

The school domain and ID pattern are **duplicated in three places** and must be changed together: `src/lib/validation.ts`, the `become_seller` function in SQL, and the env var.

Supabase dashboard: Email provider on (others off); Site URL = the app URL (needed for the school-email confirmation link); keep email confirmation on for the seller step.

## Commands

`npm run dev` · `npm run build` · `npm run lint` · `npm test` · `npx tsc --noEmit`

Make an admin: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');`
