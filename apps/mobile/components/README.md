# Mobile Components

Reusable UI components for the Citewalk mobile app (Expo/React Native). Presentational and list-item components are memoized with `React.memo` using a React 19–compatible pattern.

## Memoization pattern

Components use an inner function + memo + type cast:

```ts
function MyComponentInner(props: MyComponentProps) { ... }

export const MyComponent = memo(MyComponentInner as React.FunctionComponent<MyComponentProps>) as (props: MyComponentProps) => React.ReactElement | null;
```

Import by name: `import { MyComponent } from '../components/MyComponent'`.

## Memoized components

| Component | Purpose |
|-----------|---------|
| **Avatar** | User avatar (image or initial) |
| **UserCard** | User row with avatar, follow button |
| **PostItem** | Post row with actions |
| **PostContent** | Post body (author, image, markdown, sources) |
| **PostArticleBlock** | Article-style post block (reading, composer) |
| **PostPreviewRow** | Compact post row (e.g. collections) |
| **CollectionCard** | Collection card |
| **TopicCard**, **PersonCard** (ExploreCards) | Topic and person cards on explore |
| **EmptyState**, **ErrorState** | Empty and error states |
| **ListFooterLoader** | Loading spinner for list footers |
| **SectionHeader** | Section title in lists |
| **InlineLoader** | Small spinner (buttons, modals) |
| **ScreenHeader** | App screen header (back, title, right) |
| **TopicCollectionHeader** | Topic/collection hero header |
| **MarkdownText** | Renders markdown with links/mentions |
| **WhyLabel** | Small “why” reason label |
| **Skeleton** | Animated skeleton block |
| **ProfileHeaderSection** | Profile cover and action bar |

## List performance & empty states

- Use **FLATLIST_DEFAULTS** from `../constants/theme` for `FlatList` (e.g. `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`).
- Use **ListFooterLoader** as `ListFooterComponent` when loading more.
- Use **SectionHeader** for section titles in section lists.
- Use **EmptyState** for all list/sheet empty states (feeds, profile, explore, search, collections, AddToCollectionSheet, messages, offline-storage, post quotes/reading) so copy and layout stay consistent.

## Non-memoized exports

- **PostSkeleton**, **ProfileSkeleton** – no-props components; exported as plain functions.
- **OfflineBanner** – uses hooks; exported as plain function.
- Modals (ConfirmModal, ReportModal, IntroModal, etc.) and sheets – stateful; not memoized.
