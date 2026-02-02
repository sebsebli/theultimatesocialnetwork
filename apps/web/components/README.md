# Web Components

Reusable UI components for the Citewalk web app. Most presentational and list-item components are memoized with `React.memo` for performance.

## Memoized components

These components use `memo(Inner)` and are exported as named constants (e.g. `export const PostItem = memo(PostItemInner)`). Use them with named imports: `import { PostItem } from './post-item'`.

| Component | Purpose |
|-----------|---------|
| **Avatar** | User avatar (image or initial) |
| **UserCard** | User row with avatar, name, handle, follow button |
| **PostItem** | Post row (feed, explore, search) |
| **TopicCard** | Topic card with hero image and follow |
| **SavedByItem** | “Saved by X to Y” + embedded PostItem |
| **WhyLabel** | Small “why” reason badge |
| **Skeleton**, **PostSkeleton**, **ExploreSkeleton**, **ProfileSkeleton** | Loading placeholders |
| **FeedList** | Feed with load more and suggestions |
| **ReferencedBySection** | “Referenced by” block on post detail |
| **SourcesSection** | Sources list on post detail |
| **ReplySection** | Comments and reply form |
| **PostDetail** | Full post view with actions |
| **ExploreContent** | Explore tabs and content |
| **TopicPage** | Topic page with posts and follow |
| **ComposeContent** | Compose editor (quote/reply/new post) |
| **ReadingMode** | Reading-mode post layout |
| **PublicSignInBar** | “Sign in” bar for public views |
| **DesktopSidebar** | Main app sidebar (nav, logo) |
| **DesktopRightSidebar** | Right sidebar (topics, people) |
| **InviteNudge** | Invite friends CTA |
| **OverflowMenu** | Post/reply/user overflow menu |
| **ImageUploader** | Compose image upload |
| **AutocompleteDropdown** | Compose @ / topic / post autocomplete |

## Usage

- Import by name: `import { PostItem, Avatar } from '@/components/post-item'`.
- Props interfaces are exported where needed (e.g. `PostItemProps`, `AvatarProps`).
- Modals, providers, and pages that own a lot of state are generally not memoized (e.g. `AuthProvider`, `AddToCollectionModal`).
