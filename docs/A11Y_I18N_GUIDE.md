# CafeFinder Accessibility & Internationalization Guide

## Accessibility (a11y)

CafeFinder aims for **WCAG 2.2 AA** compliance. We use accessible primitives from `@radix-ui` to ensure consistent keyboard navigation and screen reader support.

### Key Principles

1.  **Semantic HTML**: Always use correct tags (`<header>`, `<nav>`, `<main>`, `<footer>`, `<button>`, `<a>`).
2.  **Keyboard Navigation**: Every interactive element must be reachable via `Tab` and activatable via `Enter` or `Space`.
3.  **Focus Management**: Focus is managed automatically by our `Dialog`, `DropdownMenu`, and `Tabs` components.
4.  **ARIA Labels**: Use `aria-label` or `aria-labelledby` when the visible text doesn't provide enough context for screen readers.
5.  **Reduced Motion**: Use the `useReducedMotion` hook to disable or simplify animations for users who prefer reduced motion.

### Accessible Components

-   `Dialog`: Accessible modal with focus trapping and escape key support.
-   `DropdownMenu`: Accessible menu with keyboard navigation.
-   `Tabs`: Accessible tabbed interface.
-   `Checkbox`: Accessible custom checkbox.
-   `Select`: Accessible dropdown selector.
-   `Label`: Accessible form label associated with inputs.

---

## Internationalization (i18n) & Localization (l10n)

We use a custom lightweight i18n system based on React Context and resource files.

### Locale Resource Files

Locales are stored in `client/src/i18n/locales/`. 
The default locale is `en-PH` (English - Philippines).

To add a new language:
1. Create a new file (e.g., `es-ES.ts`) in the locales directory.
2. Define the translations object following the `Translations` type.
3. Update `I18nProvider` in `i18nContext.tsx` to include the new locale.

### Usage in Components

```tsx
import { useI18n } from "@/i18n";

export function MyComponent() {
  const { t, formatDate, formatCurrency } = useI18n();

  return (
    <div>
      <h1>{t("common.appName")}</h1>
      <p>{t("cafe.ratingLabel", { rating: 4.5 })}</p>
      <span>{formatDate(new Date())}</span>
      <span>{formatCurrency(150)}</span>
    </div>
  );
}
```

### Timezone Support

The application timezone can be configured via the `useI18n` hook. Users can change their preference in the Profile page. This affects `formatDate` and `formatTime` outputs.

---

## Regional Settings

Regional settings (Language and Timezone) are persistent per session in the `I18nProvider`. For authenticated users, these settings should ideally be saved to their profile in the database (Future implementation).
