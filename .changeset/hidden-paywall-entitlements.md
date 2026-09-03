---
"@joelbarron/expo-dev-kit": minor
---

feat(subscriptions): ocultar entitlements del paywall por plataforma

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
