# App & source structure

**`app/` = routes only.** **`src/` = screens, components, services, hooks, utils.**

---

## App directory (`app/`) – routes only

Route files are thin: they import the screen from `@/src/screens/...` and export a default component (target &lt;50–100 lines per route).

| File | Purpose |
|------|--------|
| `(auth)/_layout.tsx` | Auth stack layout |
| `(auth)/login.tsx` | → `LoginScreen` |
| `(auth)/email-signin.tsx` | Email sign-in (inline) |
| `(auth)/signup.tsx` | Sign-up (inline) |
| `(tabs)/_layout.tsx` | Tab layout (auth, routes) |
| `(tabs)/banking.tsx` | → `BankingScreen` |
| `(tabs)/home.tsx` | → `HomeScreen` |
| `(tabs)/my-events.tsx` | My events (inline) |
| `(tabs)/profile.tsx` | Profile (inline) |
| `(tabs)/create-event.tsx` | Create event entry (inline) |
| `+not-found.tsx` | → `NotFoundScreen` |
| `_layout.tsx` | Root layout |
| `index.tsx` | Index redirect, child deep link |
| `child.tsx` | Child dashboard (inline) |
| `banking/_layout.tsx` | Banking stack |
| `banking/setup/_layout.tsx` | Setup stack |
| `banking/setup/index.tsx` | Setup entry |
| `banking/setup/personal-info.tsx` | → `PersonalInfoScreen` |
| `banking/setup/identity-verification.tsx` | → `IdentityVerificationScreen` |
| `banking/setup/success.tsx` | → `BankingSuccessScreen` |
| `banking/setup/issuing-card.tsx` | Issuing card (inline) |
| `banking/setup/stripe-connection.tsx` | Stripe connection (inline) |
| `banking/setup/apple-pay-setup.tsx` | Apple Pay setup (inline) |
| `create-event/_layout.tsx` | Create-event stack |
| `create-event/event-type.tsx` | Event type (inline) |
| `create-event/event-details.tsx` | → `EventDetailsScreen` |
| `create-event/select-guests.tsx` | → `SelectGuestsScreen` |
| `event-dashboard/_layout.tsx` | Event dashboard stack |
| `event-dashboard/[id].tsx` | Event dashboard (inline; uses `@/src/components/events`) |
| `event-dashboard/edit/`, `add-guests/` | Edit event, add guests |
| `event-detail/_layout.tsx`, `event-detail/[id].tsx` | Event detail (guest view) |
| `screens/*.tsx` | Legacy screens (used by `navigation/AppNavigator.tsx`) |

**Imports:** Use `@/src/...` for `src/` and `@/types/...` for root `types/`.

---

## Source directory (`src/`)

| Folder | Contents |
|--------|----------|
| **screens/** | One folder per screen: `ScreenName.tsx` + `useScreenName.ts`. Barrel: `screens/index.ts`. |
| **components/common/** | Button, Card, Input, Modal; barrel: `components/common/index.ts`. |
| **components/events/** | Event dashboard UI (EventHeader, GuestListCard, etc.); consumed by `app/event-dashboard/[id].tsx`. |
| **components/auth/**, **components/banking/** | Feature-specific UI. |
| **hooks/** | Shared hooks (e.g. `useAccountStatus`); barrel: `hooks/index.ts`. |
| **services/** | `api.ts` re-exports `lib/api`. |
| **lib/** | API client, Stripe, eventService, userService, familyService, config. |
| **utils/** | Helpers (date, auth, useUser, etc.). |
| **firebase/** | Firebase auth and app config. |

Screens in `src/screens/` are presentational; state and API/Firebase live in the co-located hook or in `lib/`.

---

## Refactored screens (hook + screen in `src/screens/`)

BankingScreen, BankingSuccessScreen, EventDetailsScreen, SelectGuestsScreen, HomeScreen, LoginScreen, NotFoundScreen, IdentityVerificationScreen, PersonalInfoScreen.

Other routes (event-type, issuing-card, my-events, profile, etc.) still contain inline logic and can be moved to `src/screens/` later.

---

## Notes

- **Layout files** (`_layout.tsx`) define stack/tab structure.
- **Legacy** `app/screens/` is still used by `navigation/AppNavigator.tsx`; can be removed once those flows use Expo Router and `src/screens/`.
- **Event dashboard components** live in `src/components/events/`. The old `app/components/event-dashboard/` was removed (it re-exported from `src`).

See `docs/APP_REFACTORING_PLAN.md` and `src/README.md` for the full plan and conventions.
