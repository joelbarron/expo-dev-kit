# Finzenio extraction map

Reviewed base projects:

- `/Users/joel_barron/Developer/usbix/finzenio/finzenio-app`
- `/Users/joel_barron/Developer/personal/my-libs/npm/jb-react-web-dev-kit`
- `/Users/joel_barron/Developer/usbix/mentalysis/mentalysis-frontend`

## Direct candidates for the library

- `store/appConfigStore.ts`
  - Move to `core/app-status` (already started in this library).
- `utils/custom-axios.ts`
  - Move to `auth/client` and `query` (already started in this library).
- `services/auth/auth.ts`
  - Move to `auth/client` (already started in this library).
- `components/forms/CustomForm*.tsx`
  - Extract generic components first (`Input`, `Select`, `Switch`, `Checkbox`, `DateTime`, `TextArea`).
  - Leave highly domain-specific ones out (`ExpenseCategoryPicker`, etc.).

## Must stay in the app (domain-specific)

- Finance widgets and dashboards.
- Catalog/transaction/loan screens.
- App-specific theme/branding configuration.

## Routing

- `app/**` files remain in each Expo Router app.
- The library provides components/hooks to render inside those routes.

## Next suggested block

1. Align RN auth with real flows from `mentalysis-frontend` + `jb-react-web-dev-kit` for functional parity.
2. Extract reusable base forms and standardize `JB*` naming.
3. Integrate real `versionChecker` in Finzenio root provider.
4. Add `core/network` (offline) and `core/permissions`.
