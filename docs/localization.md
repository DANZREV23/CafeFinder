# Localization and Internationalization

The application uses a lightweight localization infrastructure to support multiple locales and regional settings.

## Configuration

### Default Settings
- **Locale**: `en-PH`
- **Currency**: `PHP`
- **Timezone**: `Asia/Manila`

### Environment Variables
```env
DEFAULT_LOCALE=en-PH
SUPPORTED_LOCALES=en-PH
DEFAULT_CURRENCY=PHP
APP_TIMEZONE=Asia/Manila
```

## Infrastructure

### Translation Resource
UI strings are centralized in `client/src/i18n/locales/en-PH.ts`. To add a new language, create a new file in this directory and update `i18nContext.tsx`.

### useI18n Hook
Use the `useI18n` hook in React components to access translation and formatting utilities:

```tsx
const { t, formatDate, formatCurrency, formatNumber, formatTime, formatRelativeTime } = useI18n();

// Translation
t("common.save")

// Formatting
formatCurrency(250) // ₱250.00
formatDate(new Date()) // 09/27/2026
formatRelativeTime(pastDate) // 2 days ago
```

## Best Practices

### Adding New Strings
1. Add the key and value to `client/src/i18n/locales/en-PH.ts`.
2. Use a hierarchical structure (e.g., `cafe.status.published`).
3. Use the `t` function in components.

### Formatting
Always use the centralized formatters from `useI18n` instead of manual string manipulation or browser-default `toLocaleDateString`. This ensures consistency with the application-level locale and timezone settings.

### Timezones
All timestamps are stored in UTC in the database. The `formatDate` and `formatTime` utilities automatically apply the `APP_TIMEZONE` (default `Asia/Manila`) for display.

## Future Localization
The architecture is designed to support:
- Multiple simultaneous locales.
- Dynamic locale switching.
- Lazy-loading of translation bundles.
