# Mobile App Revision Complete

## Visual Overhaul
- **Theme**: Updated to Charcoal (`#18191a`) to match `stitch_welcome_to_cite`.
- **Typography**: Standardized on Inter (via `FONTS` constants).
- **Icons**: Replaced all emojis with `MaterialIcons` / `MaterialCommunityIcons`.
- **Layouts**: Refactored all major screens to match the specific "clean, bordered" aesthetic of the templates.

## Functional Improvements
- **Authentication**: Fixed the "always signed in" bug with a proper `AuthContext` and loading states.
- **Error Handling**: Added global error handling in `api.ts` and UI error states.
- **Languages**: Full 14-language support in onboarding and settings.

## Screen-by-Screen Updates
- **Home**: New Header, FAB, Post Item design.
- **Explore**: Custom Cards (`DeepDive`, `Person`, `Quote`) matching the HTML reference.
- **Profile**: Centered layout, pill buttons, stats row.
- **Post Detail**: Matches feed style, Markdown rendering.
- **Collections/Keeps**: Consistent styling.
- **Inbox/Messages**: Clean list and chat interface.

The mobile application is now visually polished and functionally robust.
