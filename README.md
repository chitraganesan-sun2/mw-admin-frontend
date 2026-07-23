# melody-wings-admin-frontend

Next.js (App Router) internal staff console for **Melody Wings** — approvals, content moderation, donations, hiring, broadcast email, and a safety dashboard. Talks exclusively to the admin routes of [melody-wings-backend](../melody-wings-backend).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Data fetching / cache | `@tanstack/react-query` v5 |
| State | `zustand`, `nuqs` |
| UI | `antd`, `@mui/material`, `lucide-react` |
| Forms/content | `zod`, `@tiptap/react` (rich text for broadcast email), `react-quill-new` |
| Charts | `apexcharts` / `react-apexcharts` (dashboard — currently mock data) |
| Auth | Username/password (bcrypt) against the backend's admin auth routes; `jwt-decode` + `js-cookie` client-side |
| Deploy | Vercel |

## Architecture

```mermaid
flowchart TB
    Staff["Staff browser"]

    subgraph CICD["Deploy pipeline"]
        GitPush["git push main<br/>(origin = prod)"] --> Vercel["Vercel build & deploy"] --> Live["Live admin console"]
    end

    subgraph AdminApp["melody-wings-admin-frontend — Next.js App Router"]
        direction TB
        LoginPage["/ — login page"]
        Middleware["middleware.ts<br/>checks JWT validity only<br/>(no role/claim check)"]

        subgraph PrivateGroup["(private) route group -&gt; MainLayout"]
            VolunteerLearner["/volunteer, /learner<br/>approval queues"]
            ListOfValues["/list-of-values"]
            TutorialLinks["/tutorial-links"]
            Reports["/reports — moderation queue"]
            Resources["/resources"]
            Community["/community — feed moderation"]
            Donations["/donations — view-only"]
            Hiring["/hiring — view-only"]
            Broadcast["/broadcast — bulk email"]
            Safety["/safety — iframe"]
            Dashboard["/dashboard — mock data,<br/>unlinked from sidebar"]
        end

        subgraph DevGroup["development/* — no layout, no extra gating"]
            DevLearner["/development/learner<br/>raw JSON dump"]
            DevVolunteer["/development/volunteer<br/>raw JSON dump"]
        end

        APIClient["api/api-client.ts<br/>axios, cookie(token) auth,<br/>401 -&gt; clear cookies -&gt; redirect to /"]
        QueryProvider["providers/QueryWrapper<br/>the real QueryClient"]
        StrayQC["api/query-client.ts<br/>disconnected QueryClient<br/>used by resources/DetailModal"]
    end

    subgraph Backend["melody-wings-backend"]
        AdminAPI["/api/v1/admin/*<br/>Depends(require_admin)<br/>— any valid admin token, no finer roles"]
    end

    ExternalSafety["External safety/transcript-analysis<br/>dashboard (separately hosted)<br/>NEXT_PUBLIC_SAFETY_DASHBOARD_URL"]

    Live -.->|serves| AdminApp
    Staff --> Middleware
    Middleware --> LoginPage
    Middleware --> PrivateGroup
    Middleware --> DevGroup
    PrivateGroup --> APIClient
    DevGroup --> APIClient
    APIClient --> AdminAPI
    Safety --> ExternalSafety
    QueryProvider --> PrivateGroup
    StrayQC -.->|"invalidateQueries no-op —<br/>cache bug"| Resources
```

**Auth gating**: `middleware.ts` only checks whether the `token` cookie decodes to a non-expired JWT — there is no role/claim inspection anywhere in this app or the backend's `require_admin` dependency it calls into. Any authenticated admin account has identical access to every page, including the `development/*` raw-data-dump pages (they sit outside the `(private)` route group's layout but are still behind the same all-or-nothing middleware check).

## End-to-end flow

A full approval cycle — staff login through a learner/volunteer seeing the result — showing how this app, the backend, and the matching/notification pipeline connect:

```mermaid
sequenceDiagram
    autonumber
    participant S as Staff
    participant Gate as middleware.ts
    participant API as api-client.ts
    participant BE as backend /api/v1/admin/*
    participant Match as skills_matcher.py
    participant Mail as send_email.py
    participant EndUser as Learner/Volunteer app

    S->>Gate: open admin console, log in (username/password)
    Gate->>API: POST /api/v1/admin/auth/sign_in
    API->>BE: verify bcrypt password (legacy SHA-256 auto-migrates)
    BE-->>API: JWT (role=admin)
    API-->>S: set token cookie, redirect to /volunteer

    S->>API: open pending learner/volunteer queue
    API->>BE: GET /api/v1/admin/learner?onboarded_status=verification_pending
    BE-->>API: decrypted profile list
    API-->>S: render approval table

    alt approve
        S->>API: approve learner/volunteer
        API->>BE: PATCH /api/v1/admin/learner/{id}/approve
        BE->>Match: trigger skills_matcher on approval
        Match-->>BE: matched volunteer(s)
        BE->>Mail: send approval/match email
    else reject
        S->>API: reject with optional custom reason
        API->>BE: PATCH /api/v1/admin/learner/{id}/reject
        BE->>Mail: send rejection email (staff-provided reason, HTML-escaped)
    end
    BE-->>API: 200 OK
    API-->>S: table refreshes via React Query invalidation

    EndUser->>BE: learner/volunteer app polls/fetches status
    BE-->>EndUser: updated onboarded_status + in-app notification
```

## Directory structure

```
src/app/
  page.tsx                 # "/" — login page
  (private)/                # MainLayout-wrapped staff console
    layout.tsx
    volunteer/, learner/     # approval lists
    reports/, community/     # moderation
    resources/, tutorial-links/, list-of-values/
    donations/, hiring/      # view-only
    broadcast/               # bulk email compose/send
    safety/                  # iframe to external dashboard
    dashboard/                # mock data, not linked in Sidebar
  development/               # NOT in (private) group — raw JSON dumps, same auth gate only
    learner/, volunteer/

src/api/
  api-client.ts             # axios instance, cookie auth, 401 handling
  query-client.ts           # a second, disconnected QueryClient (see Known gaps)
  reports/, resources/       # domain-specific API helpers

src/providers/QueryWrapper/  # the actual QueryClientProvider used by the app
src/components/Sidebar/      # nav (Dashboard link is commented out here)
```

## Known gaps

- **No role-based access control.** Every admin account can reach every page and every admin API route — including account deletion, admin-account creation, and the unpaginated `development/*` data dumps. This mirrors the backend's current authorization model (`require_admin` is a single boolean, not a tiered role).
- **Stray `QueryClient` cache bug**: `src/api/query-client.ts` exports its own `QueryClient`, separate from the one the app's `QueryWrapper` provider actually uses. `src/components/resources/DetailModal/index.tsx` imports the stray instance and calls `invalidateQueries` on it — a silent no-op, so the resources list doesn't refresh after an edit from that modal. (List-of-values and tutorial-links pages correctly use `useQueryClient()` from context.)
- **`/dashboard`** is fully mock data (every metric card hardcodes the same placeholder number, no endpoint wired) and isn't linked from the sidebar — reachable only by direct URL.

See `AUDIT-REPORT.md` and `PERFORMANCE-AUDIT-REPORT.md` in the workspace root for the fuller audit history and what's already been remediated elsewhere in the platform.

## Running locally

```bash
npm install
npm run dev   # http://localhost:3000 (or configured port)
```

Set `NEXT_PUBLIC_API_URL` to point at a running [melody-wings-backend](../melody-wings-backend), and `NEXT_PUBLIC_SAFETY_DASHBOARD_URL` for the `/safety` iframe to render anything other than its "not configured" fallback state.
