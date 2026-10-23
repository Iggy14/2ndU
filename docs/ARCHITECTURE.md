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
    page.tsx                Home: hero + category tiles, "Just listed" preview, how it works, sell band (old /?q= links redirect to /browse)
    browse/page.tsx         Browse: live grid with search/category filter/pagination (?q= / ?cat= / ?sort= / ?min= / ?max= / ?page=; parsed by `parseFilters`, built by `browseHref` in listingsQuery.ts)
    login/, signup/         AuthForm (email + password)
    become-seller/          Seller verification (school email, then student ID)
    listing/[id]/           Product page (ListingDetail: live status, chat button, report)
    sell/new/, sell/[id]/edit/, sell/mine/    Post, edit, manage (mark sold / relist / delete)
    inbox/, inbox/[conversationId]/           Two-pane chat: layout.tsx fetches the list (ConversationList, left, dark green);
                            the page is the chat room (right). On mobile only one pane shows at a time. The list does
                            not refetch on navigation, so the active chat's unread badge is hidden client-side.
    favorites/              Saved listings (logged-in)
    seller/[id]/            Public seller profile + their listings (no student ID / email shown)
    admin/                  Report queue
  components/               Nav, MobileNav (hamburger drawer, shadcn Sheet), SearchSheet (nav search button → top panel with search box + category chips),  browse/ (search bar, filter sidebar + mobile drawer, sort, active-filter chips for /browse), ui/ (shadcn), ChatsLink (unread badge), ListingCard, ListingGrid, ListingForm, ...
  lib/
    supabase/client.ts      Browser client
    supabase/server.ts      Server client (cookies) + getUserId() (local JWT check; use instead of auth.getUser() unless you need fresh account fields)
    validation.ts           Student ID regex, school email domain, price/image limits (+ .test.ts)
    listingsQuery.ts        Home query shared by server render and the grid's refresh
    types.ts                Types, categories, isNegotiating()
    images.ts               Client-side photo resize before upload
supabase/migrations/        0001_init.sql, 0002_ban_cleanup_and_edit_lock.sql, 0003_favorites.sql, 0004_listing_categories.sql, 0005_original_price.sql  (run in order)
```

Pages are server components that fetch data and pass it to a client component, which keeps it live.

**No back button** (except chat). Pages have no in-app back button; users go back with the browser/OS back gesture, which Next restores from its client router cache (no reload, scroll position kept). The one exception is the chat room on mobile (`ChatRoom` header, `md:hidden`), which links to `/inbox` because the list and chat are separate screens there.

## Data model (Postgres)

- `profiles`: one per auth user (created by trigger). `role`, `is_seller`, `student_id`, `school_email`, `banned`.
- `listings`: `seller_id`, title, description, price (1–100,000), `original_price` (optional, > price; shown struck through via `components/Price.tsx`, use it wherever a price is displayed), `images[]` (1–8), `categories text[]` (one or more, combinable; `all` is a tag for items that fit no category. The home "All" pill shows every listing; a category pill shows only listings tagged with it, see `listingsQuery.ts`), `location_text`, `fulfillment` (delivery / pickup / both), `status` (available / sold / removed), `sold_at`, `last_negotiated_at`, `last_negotiated_by`.
- `conversations`: one per (listing, buyer). `messages`: belong to a conversation, with `read_at`.
- `reports`: listing reports, reviewed in `/admin`.
- `favorites`: (user_id, listing_id) saved listings; RLS lets users see and change only their own. `FavoriteButton` toggles optimistically and is used on `ListingCard` and the product page.
- Storage bucket `listing-images` (public read; sellers write only inside their own `<userId>/` folder).

## Key flows

**Seller verification.** Two routes. (a) Sign up with "Buy and sell": school email + student ID on the signup form; the ID is stored in `user_metadata.student_id`, and after the confirmation link `/become-seller` calls the RPC automatically. (b) Existing buyers: User clicks "Become a seller", changes their account email to an `@rsu.ac.th` address (Supabase sends a confirmation link), then enters a student ID matching `^6\d{6}$`. The browser calls the `become_seller(p_student_id)` RPC, a `security definer` function that checks the confirmed email domain and ID pattern, then sets `is_seller`. The ID is only format-checked; there is no student database. Users cannot set `is_seller`, `role`, `banned`, `student_id` or `school_email` themselves (`protect_profile_columns` trigger).

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

## Auth emails and notifications

- `/auth/confirm` (route handler) is where every Supabase email link lands: signup confirmation, password reset, email change. It handles `?code=` (default templates) and `?token_hash=&type=` (custom templates, works across devices). Reset links go on to `/reset-password`; a bad link goes to `/login?error=`.
- `/forgot-password` and `/reset-password` share `PasswordForm`. Login shows "Resend confirmation email" when the account is unconfirmed.
- New-message email: a Supabase Database Webhook (INSERT on `messages`, POST to `/api/notify-message`, header `x-webhook-secret` = `NOTIFY_WEBHOOK_SECRET`) makes the route email the other participant through Gmail SMTP (nodemailer + app password; ~500 emails/day cap, fine for a portfolio demo). It sends one email per burst (skipped if the sender already has an earlier unread message in that chat) and never to banned users. Needs `SUPABASE_SERVICE_ROLE_KEY` (server only), `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NEXT_PUBLIC_SITE_URL`. Supabase dashboard: add `<site>/auth/confirm` to Auth → Redirect URLs.

## Dev seed data

`scripts/seed.mjs` creates 3 fake sellers (`*@seed.2ndu.test`) and 24 listings with generated photos, using the service-role key. Run `node --env-file=.env.local scripts/seed.mjs`; add `--clean` to delete everything it made (matched by the email domain). It writes to the live Supabase project.

## Visual theme

Site-wide look (set by the home hero and nav; apply it to every new or restyled page):
- Dark green `#0f3d2e` for the nav and hero, white content area, white text on green.
- Small labels (nav links, buttons, pills, card titles): `text-[11px] font-bold uppercase tracking-widest`.
- Headings `font-black uppercase`; prices bold dark green sans; square corners (no `rounded-*` on cards/buttons).
- Primary button: solid white on green (or solid green on white); secondary: outlined.
- No ghost-text bands below the hero.

## Motion

- `src/app/template.tsx` fades every top-level route in on navigation (opacity only).
- `components/Reveal.tsx` fades/slides content up when it scrolls into view; wrap sections or cards in it (`delay` in ms to stagger).
- One-off entrances use `tw-animate-css` classes (`animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-300`), as in `Hero`.
- Product page: gallery and details fade/slide in, and the gallery photo cross-fades when changed (`key` on the `Image`). Chat messages fade in as they arrive. Interactive rows/buttons use `transition-colors`. All CSS-only; no animation library, no layout-affecting animations.
- `globals.css` disables animations under `prefers-reduced-motion`; `Reveal` has its own `motion-reduce:` fallbacks. Smooth scroll is on `<html>` via `data-scroll-behavior`.

## Configuration

`.env.local` (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN` (`rsu.ac.th`).

The school domain and ID pattern are **duplicated in three places** and must be changed together: `src/lib/validation.ts`, the `become_seller` function in SQL, and the env var.

Supabase dashboard: Email provider on (others off); Site URL = the app URL (needed for the school-email confirmation link); keep email confirmation on for the seller step.

## Caching and rendering (Cache Components)

`cacheComponents: true` is on in `next.config.ts`. Anything that reads cookies, `searchParams` or `params` (the `Nav`, every page) must render under a `<Suspense>`; the root layout wraps `Nav` and `{children}` in one, so pages stream in. Data that is the same for every visitor is cached with `"use cache"` + `cacheLife`: `getHomeData()` in `lib/homeData.ts` (home "Just listed" + category counts, ~1 min). Cached functions cannot read cookies, so they use `createPublicClient()` (`lib/supabase/public.ts`, anon, no session); keep per-user data (favourites, signed-in state) outside them. Listings are written straight from the browser, so there is no server action to call `updateTag` from; changes appear after the revalidate window. Code that calls `Date.now()` (e.g. `isNegotiating`) cannot be prerendered; render it only inside request-time (Suspense) parts. Legacy `/?q=` links are redirected to `/browse` in `proxy.ts`.

## Commands

`npm run dev` · `npm run build` · `npm run lint` · `npm test` · `npx tsc --noEmit`

Make an admin: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');`
