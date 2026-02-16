# App Refactoring Plan: Scalable Expo Architecture

This document outlines a step-by-step plan to refactor the Expo app (~22k lines) into a professional, scalable structure **without breaking Expo Router**. Routes stay in `app/`; UI, logic, and services move under `src/`.

---

## Target Architecture Overview

```
piggybank/
├── app/                          # ROUTES ONLY (Expo Router)
│   ├── (auth)/                   # ~12–50 lines per file
│   ├── (tabs)/
│   ├── banking/
│   ├── create-event/
│   ├── event-dashboard/
│   ├── event-detail/
│   ├── screens/                  # REMOVE after migration (use src/screens)
│   └── components/               # REMOVE after migration (use src/components)
├── src/
│   ├── components/               # Reusable UI
│   │   ├── common/               # Button, Input, Card, etc.
│   │   ├── auth/                 # Auth-specific (e.g. SocialButton)
│   │   ├── banking/              # Stripe/KYC cards, forms
│   │   └── events/               # event-dashboard + create-event UI
│   ├── screens/                  # Full-screen UI + hooks
│   │   ├── BankingScreen.tsx + useBankingScreen.ts
│   │   ├── EventDetailsScreen.tsx + useEventDetailsScreen.ts
│   │   ├── PersonalInfoScreen.tsx + usePersonalInfoScreen.ts
│   │   └── ...
│   ├── hooks/                    # Shared state / side-effect hooks
│   ├── services/                 # API & external calls
│   │   ├── api/                  # Firebase Functions client (from src/lib/api)
│   │   ├── stripe/               # Stripe SDK wrapper (from src/lib/stripe)
│   │   ├── firebase/             # Auth, Firestore (from src/firebase)
│   │   └── events/               # eventService, userService (from src/lib)
│   ├── utils/                    # Pure helpers (already exists; extend)
│   └── types/                    # Shared types (or keep in /types at root)
```

---

## Principles

1. **`app/` = routing only**  
   Each file in `app/` exports a single default component that:
   - Imports the Screen component from `src/screens/...`
   - Passes router/params (e.g. `useLocalSearchParams()`, `useRouter()`) as props or lets the screen use the same hooks.
   - Stays **under 50–100 lines** (ideally &lt;50).

2. **Screens = View + Hook**  
   - `src/screens/<Name>/ScreenName.tsx` – presentational UI.
   - `src/screens/<Name>/useScreenName.ts` – state, API calls, handlers. The screen uses the hook and renders.

3. **Components by feature**  
   - `src/components/common/` – Button, Input, Card, Modal (used everywhere).
   - `src/components/auth/`, `banking/`, `events/` – feature-specific.

4. **Services own all external I/O**  
   - Stripe, Firebase, Gemini/API calls live in `src/services/` (or `src/lib/` if you prefer to rename gradually). No raw `getAccountStatus()` or `firebase.auth()` inside screen files; call `services.banking.getAccountStatus()` or similar.

5. **Navigation unchanged**  
   - Expo Router continues to use the same `app/` file paths. Only the *content* of each route file changes (from “whole screen” to “import Screen from src/screens/…”).

---

## Phase 0: Foundation (Do First) ✅ Done

Do this once so the rest of the refactor has a clear place to live.

| Step | Action | Notes |
|------|--------|--------|
| 0.1 | Create folder structure under `src/` | Add `src/screens/`, `src/components/common/`, `src/components/auth/`, `src/components/banking/`, `src/components/events/`, `src/hooks/`. Keep existing `src/lib/`, `src/utils/`, `src/firebase/`. |
| 0.2 | Add path alias for `@/src` (if not already) | Your `@/*` already maps to project root, so `@/src/...` works. Prefer `@/src/screens/...` in `app/` for clarity. |
| 0.3 | Create `src/services/` and move API surface | Option A: Create `src/services/api/` and re-export from `src/lib/api.ts` (e.g. `src/services/api/index.ts` imports from `../../lib/api` and re-exports). Option B: Move `src/lib/api.ts` → `src/services/api.ts` and update all imports. Prefer B long-term; A for minimal first step. |
| 0.4 | Centralize utils | Move shared helpers (`parseDobString`, `formatDate`, `normalizeUSZip`, etc.) into `src/utils/` (e.g. `src/utils/date.ts`, `src/utils/validation.ts`). Search codebase for duplicates and point them to one place. |
| 0.5 | Move `app/components/event-dashboard/*` → `src/components/events/` | Update imports to `@/src/components/events/...` or relative from new location. Leave `app/components/event-dashboard/index.ts` as re-export from `src/components/events` temporarily, then remove when all consumers use `src`. |

**Checkpoint:** App still runs; existing screens in `app/` unchanged except for any import path updates from 0.3–0.5.

---

## Phase 1: Largest Screens First

Refactor in this order to get the biggest wins and establish the Screen + Hook pattern.

### 1.1 `(tabs)/banking.tsx` (2,081 lines)

| Step | Action |
|------|--------|
| 1.1.1 | Create `src/screens/BankingScreen/useBankingScreen.ts`: move all `useState`, `useEffect`, `useRef`, and handlers (`fetchAccountData`, `handleRefresh`, `handleRequestPayout`, card visibility, KYC state, etc.). Return one object, e.g. `{ accountData, balanceData, issuingBalance, loading, kycStatus, cardVisible, handlers, ... }`. |
| 1.1.2 | Create `src/screens/BankingScreen/BankingScreen.tsx`: move the entire JSX tree from `app/(tabs)/banking.tsx`. Use `useBankingScreen()` for all state and callbacks. No direct `getAccountStatus()` or `firebase` calls; those stay in the hook, which uses `src/lib/api` (or `src/services/api`). |
| 1.1.3 | Extract sub-components into `src/components/banking/`: e.g. `BankingHeader`, `KycBanner`, `BalanceCard`, `TransactionList`, `PayoutSection`, `VirtualCardSection`, `LoadingState`. Each takes props only; no API calls. |
| 1.1.4 | Thin `app/(tabs)/banking.tsx` to: `import BankingScreen from '@/src/screens/BankingScreen/BankingScreen'; export default function BankingRoute() { return <BankingScreen />; }` (or pass `router` if needed). |
| 1.1.5 | Fix imports in the new screen/hook (use `@/src/...` or relative to `src/`). Run app and test Banking tab end-to-end. |

**Checkpoint:** Banking tab behaves the same; file is &lt;100 lines.

### 1.2 `create-event/event-details.tsx` (1,776 lines)

| Step | Action |
|------|--------|
| 1.2.1 | Create `src/screens/EventDetailsScreen/useEventDetailsScreen.ts`: move form state (`formData`, `errors`, `focusedField`), picker state (`showDatePicker`, `showTimePicker`, `selectedDate`, `selectedTime`), validation (`validateForm`), and `handleContinue` / navigation. Use `useLocalSearchParams` and `useRouter` inside the hook if you want the screen to stay presentational. |
| 1.2.2 | Create `src/screens/EventDetailsScreen/EventDetailsScreen.tsx`: move JSX; use `useEventDetailsScreen()`. |
| 1.2.3 | Extract sections into `src/components/events/`: e.g. `EventDetailsForm`, `EventLocationSection`, `DateTimeSection`, `EventTypeSpecificFields` (birthday age, etc.). |
| 1.2.4 | Thin `app/create-event/event-details.tsx` to only import and export `EventDetailsScreen` (and pass `eventType` from params if not read inside the hook). |
| 1.2.5 | Test create-event flow. |

**Checkpoint:** Event details step unchanged; file &lt;100 lines.

### 1.3 `banking/setup/personal-info.tsx` (1,625 lines)

| Step | Action |
|------|--------|
| 1.3.1 | Create `src/screens/PersonalInfoScreen/usePersonalInfoScreen.ts`: move step state, form state, errors, loading, API calls (`createCustomConnectAccount`, `getAccountDetails`), bank account and TOS state, DOB picker state. Return one object for the view. |
| 1.3.2 | Create `src/screens/PersonalInfoScreen/PersonalInfoScreen.tsx`: move JSX; use `usePersonalInfoScreen()`. |
| 1.3.3 | Extract into `src/components/banking/`: e.g. `PersonalInfoStep1`, `PersonalInfoStep2` (address), `PersonalInfoStep3` (ID type), `PersonalInfoStep4` (bank/TOS), `DobPickerModal`, shared form inputs. |
| 1.3.4 | Thin `app/banking/setup/personal-info.tsx` to import and export `PersonalInfoScreen`. |
| 1.3.5 | Test banking setup flow. |

**Checkpoint:** Personal info step unchanged; file &lt;100 lines.

---

## Phase 2: Remaining Large / Medium Screens

Apply the same pattern: **hook (logic + state) + screen (UI)**; thin route file.

| Screen (current location) | New location | Notes |
|---------------------------|--------------|--------|
| `(auth)/login.tsx` (1,206) | `src/screens/LoginScreen/` | useLoginScreen + LoginScreen; consider `src/components/auth/` for social buttons, email form. |
| `(tabs)/home.tsx` (1,326) | `src/screens/HomeScreen/` | useHomeScreen + HomeScreen. |
| `banking/setup/identity-verification.tsx` (716) | `src/screens/IdentityVerificationScreen/` | Hook + screen; shared components in `src/components/banking/`. |
| `create-event/select-guests.tsx` (797) | `src/screens/SelectGuestsScreen/` | Hook + screen. |
| `+not-found.tsx` (379) | `src/screens/NotFoundScreen/` | Optional; can stay in app if you prefer. |
| Other banking setup screens | `src/screens/...` | Same pattern; reuse `src/components/banking/` where possible. |
| Event dashboard/edit and add-guests | `src/screens/EditEventScreen/`, `AddGuestsScreen/` | Hook + screen; use `src/components/events/`. |

For each:

1. Add `src/screens/<Name>/use<Name>.ts` and `src/screens/<Name>/<Name>.tsx`.
2. Move state and handlers into the hook; move JSX into the screen.
3. Extract repeated UI into `src/components/...`.
4. Replace `app/...` content with: import Screen from `@/src/screens/...`; export default () => &lt;Screen /&gt;.

---

## Phase 3: Consolidate Components and Services

| Step | Action |
|------|--------|
| 3.1 | **Common components** – Add `src/components/common/Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx` (or similar) and refactor screens to use them. You can extract from existing screens incrementally. |
| 3.2 | **Services** – Ensure all Stripe/Firebase/Gemini calls go through `src/services/` (or `src/lib/`). No direct `firebase.auth()` or `getAccountStatus()` in screens; only in hooks or services. |
| 3.3 | **Shared hooks** – Move reusable logic (e.g. “fetch on mount”, “form with validation”) to `src/hooks/` (e.g. `useAccountStatus.ts`, `useForm.ts`). |
| 3.4 | **Remove duplicates** – Delete `app/screens/` and `app/components/` once every route uses `src/screens` and `src/components`. Update any remaining imports. |

---

## Phase 4: Cleanup and Conventions

| Step | Action |
|------|--------|
| 4.1 | Standardize imports: prefer `@/src/...` for anything under `src/`. |
| 4.2 | Add a short README in `src/` describing `screens/`, `components/`, `services/`, `hooks/`, `utils/`. |
| 4.3 | Optionally add barrel files (e.g. `src/screens/index.ts`) for cleaner imports. |
| 4.4 | Update `APP_FILES_REFERENCE.md` to reflect the new structure. |

---

## Risk Mitigation

- **One route at a time** – Refactor one screen (e.g. Banking) fully, verify, then move to the next. Avoid changing many routes in one commit.
- **Keep Expo Router contract** – Each `app/**/*.tsx` file must still export a default component. Only the implementation (thin wrapper) changes.
- **Imports** – Use Find & Replace or a codemod when moving files (e.g. replace `../../src/lib/api` with `@/src/services/api` after moving).
- **Tests** – If you add tests later, put them next to screens/hooks (e.g. `useBankingScreen.test.ts`) or in a `__tests__` folder; no change to routing.

---

## Suggested Order Summary

1. **Phase 0** – Foundation (folders, services/utils, move event-dashboard components).
2. **Phase 1.1** – Banking screen (biggest; sets the pattern).
3. **Phase 1.2** – Event details screen.
4. **Phase 1.3** – Personal info screen.
5. **Phase 2** – Login, Home, then remaining screens.
6. **Phase 3** – Common components, services consolidation, remove `app/screens` and `app/components`.
7. **Phase 4** – Docs and cleanup.

This keeps navigation intact at every step and gives you a clear, scalable layout: **app = routes**, **src = screens, components, services, hooks, utils**.
