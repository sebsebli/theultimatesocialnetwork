# Design Tokens (Web)

The web app shares design tokens with the mobile app via `@citewalk/design-tokens`. Tailwind is extended with these tokens so components stay consistent across platforms.

## Token → Tailwind usage

- **Colors**: `bg-ink`, `text-paper`, `text-primary`, `text-secondary`, `text-tertiary`, `border-divider`, `bg-primary`, `text-error`, `text-like`, `hover:bg-hover`, etc.
- **Spacing**: `p-s`, `px-l`, `py-m`, `gap-xxl`, `mb-xxxl` (values: `xs` 4px, `s` 8px, `m` 12px, `l` 16px, `xl` 20px, `xxl` 24px, `xxxl` 32px).
- **Border radius**: `rounded-xl` (8px from tokens), `rounded-pill` (16px).
- **Max width**: `max-w-4xl` (896px), `max-w-5xl` (1024px).

## Layout constants (reference)

When matching mobile layout, prefer token-derived values:

- Content padding: `px-l` / `py-m` (from `LAYOUT.contentPaddingHorizontal/Vertical`).
- Header bar: icon 24px, title 17px; horizontal padding `px-l`.
- Modals/sheets: min button height 44px, padding `p-l`, border radius `rounded-xl`.

## Where tokens live

- **Package**: `packages/design-tokens/index.js` — single source of truth.
- **Tailwind**: `apps/web/tailwind.config.js` uses `toTailwind()` to extend `theme.extend`.
- **CSS variables**: `apps/web/app/globals.css` sets `:root` vars (colors) for non-Tailwind use.

Prefer Tailwind classes that map to tokens (e.g. `px-l` instead of `px-4`) so future token changes apply everywhere.
