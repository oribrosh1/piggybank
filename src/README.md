# Source (`src/`)

App logic, UI, and services live here. The `app/` directory is for Expo Router (routes only).

| Folder | Purpose |
|--------|--------|
| **screens/** | Full-screen UI; each screen has `ScreenName.tsx` + `useScreenName.ts` hook. Screens are presentational; API/Firebase live in hooks and `lib/`. |
| **components/** | Reusable UI: `common/` (Button, Card, Input, Modal), `auth/`, `banking/`, `events/`. |
| **services/** | API client (re-exports from `lib/api`). All Stripe/Firebase/API calls go through `lib/` or hooks—never directly in screen `.tsx` files. |
| **hooks/** | Shared hooks (e.g. `useAccountStatus`). Screen-specific logic stays in `screens/*/use*Screen.ts`. |
| **utils/** | Pure helpers (e.g. `date.ts`, auth). |
| **lib/** | API, Stripe, Firebase, event/user services. |
| **firebase/** | Firebase auth and config. |

**Imports:** Prefer `@/src/...` for anything under `src/` and `@/types/...` for root `types/`. Use barrel files (e.g. `src/screens/index.ts`, `src/components/common/index.ts`) for cleaner imports where available.

See `docs/APP_REFACTORING_PLAN.md` for the full migration plan.
