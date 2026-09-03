# @joelbarron/expo-dev-kit

## 0.1.20

### Patch Changes

- 20c7762: feat(subscriptions): ocultar entitlements del paywall por plataforma

  `JBPaywallScreen` ya no anuncia todos los entitlements del plan: filtra los que
  el backend marca con `flags.hiddenInPaywall` para la plataforma actual.

  Un mismo plan puede vender un feature en un cliente y no en otro — por ejemplo,
  algo que solo existe en la versión web no debe anunciarse dentro de la app. El
  flag vive en `PlanEntitlement.flags` (jb-drf-billing ya lo expone en el catálogo),
  así que se controla desde datos y sin recompilar:

  ```json
  { "hiddenInPaywall": ["ios", "android"] }
  ```

  Acepta también `true` (todas las plataformas) y `"mobile"` (ios + android).

  Se exportan `isEntitlementHiddenInPaywall` y `visiblePaywallEntitlements` desde
  `@joelbarron/expo-dev-kit/subscriptions`.

## 0.1.19

### Patch Changes

- 3c0a7fe: fixes

## 0.1.18

### Patch Changes

- 7be59a7: fixes

## 0.1.17

### Patch Changes

- fa4bb85: fix

## 0.1.16

### Patch Changes

- 01dbfb0: fixes

## 0.1.15

### Patch Changes

- 0745bb1: fixes

## 0.1.14

### Patch Changes

- ad514fa: fixes

## 0.1.13

### Patch Changes

- 491be61: fixes

## 0.1.12

### Patch Changes

- ab022c6: fixes and new feats
- b2603bb: fixes

## 0.1.11

### Patch Changes

- 01c630c: fixes
- 488a9d1: fixes and new features
- 4d725fb: fixes in gh actions

## 0.1.10

### Patch Changes

- f5aa86d: fixes

## 0.1.9

### Patch Changes

- 938eb50: fixes

## 0.1.8

### Patch Changes

- c862af6: fixes

## 0.1.7

### Patch Changes

- f6ab17b: new features

## 0.1.6

### Patch Changes

- 43ad0f8: test
