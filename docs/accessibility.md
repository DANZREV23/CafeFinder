# Accessibility Guidelines

This application is designed and tested toward **WCAG 2.2 AA** standards.

## Primary Features

### Keyboard Navigation
- All interactive elements are reachable via Tab.
- Active elements have visible focus indicators.
- Modals and drawers manage focus (trapping focus when open, restoring when closed).
- "Skip to main content" link is available for keyboard users.

### Screen Reader Support
- Semantic HTML landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`) are used.
- Heading hierarchy (H1-H6) is logical and consistent.
- Meaningful images have descriptive `alt` text. Decorative icons are hidden from screen readers using `aria-hidden="true"`.
- Interactive components use appropriate ARIA roles (e.g., `role="dialog"`, `role="combobox"`, `role="listbox"`).
- Dynamic content updates (like search results count) use `aria-live="polite"`.

### Forms and Validation
- Every input has an associated `<label>`.
- Error messages are programmatically connected to inputs using `aria-describedby`.
- Invalid fields are marked with `aria-invalid="true"`.
- Loading states are indicated via `aria-busy="true"`.

### Visual and Motion
- Color contrast meets WCAG AA standards.
- Important information is never communicated through color alone.
- Respects `prefers-reduced-motion` media queries for animations.

## Testing Approach
- Manual testing using keyboard only.
- Automated audits using standard tools.
- Screen reader testing (VoiceOver/NVDA) on major workflows.

## Known Limitations
- Map accessibility: While the map has an accessible label, the core information is also provided in a list format as an alternative.
- Third-party widgets: Some external integrations may have limited accessibility.

## Future Improvements
- Ongoing audits for newly added features.
- User testing with people with disabilities.
