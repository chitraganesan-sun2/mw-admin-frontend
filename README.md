# melody-wings-admin-frontend

Next.js (App Router) internal staff console for **Melody Wings**: application approvals, content moderation, donations, hiring, broadcast email, WingTime review, profile-change review, matching, and Safety Monitoring (AI detection of unsafe language in session recordings and transcripts). It talks only to the admin routes of [melody-wings-backend](../melody-wings-backend).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 18, TypeScript |
| Data fetching / cache | `@tanstack/react-query` v5 |
| State | `zustand` (page header options), `nuqs` (URL query state) |
| UI | `antd`, Tailwind CSS, `react-icons`, `react-hot-toast` |
| Rich text | `react-quill-new` (broadcast email body) |
| Charts | `apexcharts` / `react-apexcharts` (Safety analytics) |
| Auth | Username/password against the backend's admin auth routes; the JWT is kept in a client-set cookie (`js-cookie`), `jwt-decode` is used only by the edge middleware to route |
| Errors | `@sentry/react` |
| Deploy | Vercel (a `Dockerfile` exists for running the whole stack locally) |

## How access works

- **Edge middleware** (`src/middleware.ts`) only decodes the `token` cookie to decide where to send the browser (login page vs. the role's home page). The cookie is readable and editable in the browser, so this is routing, not security.
- **Roles and permissions** come from the server: `GET /admin/auth/me` returns the account's role (`admin` or `support`) and the list of permissions switched on for it. `MainLayout` uses that to decide which pages open (`src/constants/access.ts`, `PAGE_PERMISSIONS`; anything not listed is admin-only) and the sidebar and Ctrl+K palette only show those pages (`src/config/nav.ts`).
- **Controls inside a page** follow the finer permissions (`useCan("...")` in `src/hooks/useStaff.ts`): Accept/Reject on applications needs `applications.review`; deleting a member and the CSV export need `members.manage`.
- **The backend enforces all of it again** on every request (`utils/rbac.py`, `AuthHandler.require_permission`). A hidden button or a tampered cookie gets a 401/403 from the API.
- `/wingtime` and `/audit-log` are admin-only on purpose (their backend routes use `require_admin`).

## Pages (`src/app/(private)`)

| Area | Routes |
|---|---|
| Home | `/dashboard` (real numbers from `admin/dashboard/summary`), `/support` |
| People | `/volunteer`, `/learner` (approval queues, text search, CSV export), `/matching`, `/profile-changes`, `/hiring`, `/accounts` |
| Safety and review | `/safety` (+ `analytics`, `compare`, `upload`, `google-drive`, `report/[id]`), `/wingtime`, `/reports`, `/session-feedback` |
| Content | `/community`, `/resources`, `/tutorial-links` |
| Outreach and money | `/donations`, `/broadcast`, `/notifications` |
| Settings | `/list-of-values` (incl. Skills), `/audit-log` |

## Conventions worth knowing

- **Writes are double-click safe.** Use `useGuardedMutation` instead of `useMutation`, or `useInFlight` / `createInFlightGuard` (`src/utils/inflight.ts`) around a handler. `api-client.ts` additionally shares one network call between identical state-changing requests that are in flight together.
- **A failed load must not look empty.** Show `ErrorMsg` with a message and `onRetry` (`src/components/common/Messages/ErrorMsg`).
- **Query strings** are built with `buildQuery` / `withQuery` (`src/utils/query.ts`) so user text is encoded.
- **URLs from API data** go through `safeHref` before becoming an `href`; admin-typed URLs are checked with `isHttpUrl`.
- **Cookies**: `src/utils/session.ts` owns the cookie names and flags (`sameSite=strict`, `secure` in production). The token cookie cannot be HttpOnly while the browser sets it; that needs the backend to set it on sign-in.

## Configuration

| Variable | When | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | build and dev (**required**) | Backend origin, e.g. `https://api.example.org`. The build/dev server stops with a clear message if it is missing. |
| `NEXT_PUBLIC_MEDIA_ORIGINS` | build (optional) | Comma-separated extra origins that serve uploaded images/videos (for example a custom R2 domain). Added to the CSP `img-src`/`media-src` and `next/image` allow-list. Cloudinary and `*.r2.dev` are always allowed. |
| `NEXT_PUBLIC_CURRENT_VERSION` | build (optional) | Release tag reported to Sentry. |

Docker: `docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.org .` (there is deliberately no default).

## Development

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
npm run test:unit            # node --test over tests/unit (pure logic: access map, nav, helpers)
NEXT_PUBLIC_API_URL=http://localhost:8080 npx next build   # type-checks; this is the CI gate
```

`npm run lint` does not work yet: the repo has no ESLint config or dependency. CI therefore gates on the unit tests and `next build`.

## Known gaps

- The token cookie is JS-readable (see above); a CSP with `'unsafe-inline'`/`'unsafe-eval'` in `script-src` limits how much that is worth.
- Staff are not scoped by country: lists, exports and broadcast recipients are cross-country for everyone who may open them.
- Several files are large and near copy-paste (`safety/page.tsx`, `volunteer/ProfileDetails.tsx`, `constants/tablecolumn.tsx`); the volunteer and learner pages mirror each other.
- Not covered by automated UI tests: the permission matrix in the browser, login, approve/reject, broadcast. Only pure logic has unit tests.
