# Pothole Detects CMMS

Production-style Next.js 14 App Router frontend for a pothole detection + CMMS hackathon MVP. It includes:

- Public landing page and public pothole map
- Role-based login flow with Supabase auth support and local demo fallback
- Admin dashboard with inbox table, map, analytics, CSV export, and create-work-order flow
- Dedicated work-order detail page with video evidence and editable form

## Stack

- Next.js 14 App Router + TypeScript
- TailwindCSS
- shadcn-style UI components
- React Hook Form + Zod
- Supabase JS client
- Google Maps via `@react-google-maps/api` with placeholder fallback if the API key is missing

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Demo fallback behavior

If Supabase env vars are absent:

- Login uses local demo sessions
- Data reads and writes use mock pothole events persisted in `localStorage`
- The app still compiles and runs without external backend dependencies

If the Google Maps API key is absent:

- The map panels render a polished placeholder list with selectable event coordinates

## Project structure

```text
app/
  admin/
    dashboard/
    work-orders/[id]/
  account/
  login/
  map/
components/
  auth/
  layout/
  maps/
  providers/
  ui/
  work-orders/
hooks/
lib/
  api/
  mock/
  supabase/
```

## Notes for backend integration

- `lib/api/pothole-events.ts` is the swap point for moving from mock/Supabase reads to FastAPI endpoints.
- `lib/auth.ts` and `lib/supabase/client.ts` isolate auth/session bootstrapping.
- `profiles.role` is used for UI-level access control.
