# E2E Tests (Playwright)

Real end-to-end guarantee that **demo reload never wipes user input**.
Runs against the local Vite dev server + real Lovable Cloud (test user).

## Setup (one time)

1. Install browser binaries:
   ```bash
   bun run test:e2e:install
   ```
2. Pick a dedicated test user email + password (>= 12 chars), then create
   `.env.e2e.local` (gitignored) in the project root:
   ```bash
   cp .env.e2e.example .env.e2e.local
   # edit values
   ```
3. **Disable email confirmation** for that account or use an already-confirmed
   one — the helper signs in via password.

## Run

```bash
bun run test:e2e          # headless
bun run test:e2e:headed   # watch it click through
```

The test:
1. Creates (or reuses) the E2E user via Supabase.
2. Seeds `user_tool_data` for every pipeline step that has a user input
   point (Steps 2, 6, 8, 9, 10, 12, 14, Training).
3. Logs in via `/auth`, navigates to `/context`, clicks
   **Demo-Daten laden (DE)**, waits for the success toast.
4. Re-reads every `tool_key` and asserts every user-set field survived.

## What it protects

The merge contract enforced by `mergeDemoWithUser` in
`src/data/demoSeed/cloudSync.ts`. If anyone changes that logic and breaks
preservation for any input point, this test fails fast.
