# Missing Features from GEMINI.md

## Critical Missing Features

### 1. Direct Messages (DM)
- ✅ Entities exist (DmThread, DmMessage)
- ❌ No service/controller
- ❌ No UI (Messages tab in Inbox)
- ❌ No message sending/receiving
- ❌ No thread creation logic

### 2. Header Photo Upload
- ✅ DTO accepts `headerImageKey`
- ❌ No upload endpoint
- ❌ No image compression (WEBP/JPEG)
- ❌ No MinIO integration
- ❌ No EXIF stripping
- ❌ No safety checks (NSFW/violence)
- ❌ No UI for image picker/crop

### 3. Mentions
- ✅ Entity exists
- ❌ Not parsed during post/reply creation
- ❌ No notifications created
- ❌ No @ autocomplete in compose

### 4. Topic Following
- ❌ No follow topic functionality
- ❌ No topic follow entity/table
- ❌ No "Follow topic" button implementation

### 5. Explore Tabs
- ✅ Tabs exist (Deep dives, Newsroom)
- ❌ Deep dives algorithm not implemented
- ❌ Newsroom algorithm not implemented
- ❌ Language filter pills ("My languages" / "All")
- ❌ Sort pills ("Recommended" / "Newest" / "Most cited")
- ❌ "Why" labels for recommendations

### 6. Push Notification Worker
- ✅ Token registration exists
- ✅ Push service exists
- ❌ No BullMQ worker to send notifications
- ❌ No APNs sender implementation
- ❌ No FCM sender implementation
- ❌ No push_outbox processing

### 7. Keeps Library
- ✅ Keep entity exists
- ❌ No dedicated "Keeps library" page
- ❌ No search/filter functionality
- ❌ No "Add to collection" quick action

### 8. Saved by X Timeline Items
- ❌ No timeline item type for "Saved by @user to Collection"
- ❌ No feed integration
- ❌ No "Show saves from people I follow" toggle in settings

### 9. Overflow Menus
- ❌ No overflow menu on post detail
- ❌ No Report dialog
- ❌ No Mute user functionality
- ❌ No Block user functionality
- ❌ No Copy link action

### 10. Profile Features
- ❌ No "Message" button (DM initiation)
- ❌ No follow request approval/rejection UI
- ❌ No "Pinned Keeps" tab

### 11. Explore Relevance Controls
- ❌ No Settings → Explore relevance page
- ❌ No sliders (0-100) for:
  - Topics you follow
  - Language match
  - Citations/quotes
  - Replies/discussion
  - Likes (optional)
  - Network proximity (optional)
- ❌ No "Show why I'm seeing this" toggle
- ❌ No "Reset defaults" button

### 12. Collections Enhancements
- ❌ No "Share saves" toggle on collections
- ❌ No collection privacy toggle UI
- ❌ No collection editing UI

### 13. Settings Enhancements
- ❌ No notification preferences UI (per-type toggles, quiet hours)
- ❌ No blocked/muted lists UI
- ❌ No data export (GDPR)
- ❌ No account deletion (GDPR)
- ❌ No Privacy/Terms/Imprint pages

### 14. Image Processing
- ❌ No external URL title fetching
- ❌ No image compression service
- ❌ No MinIO client integration

### 15. Background Workers
- ❌ No BullMQ worker for Neo4j updates
- ❌ No queue processing for graph updates
- ❌ No push notification worker

### 16. Compose Editor Enhancements
- ❌ No inline [[ autocomplete dropdown
- ❌ No @ autocomplete dropdown
- ❌ No header photo picker/crop UI
- ❌ No preview mode
- ❌ No link dialog (Topic/Post/URL picker)

### 17. Multi-target Links
- ✅ MultiTargetSheet component exists
- ❌ Not integrated into markdown renderer
- ❌ Not parsed during post creation

### 18. Legal Pages
- ❌ No Privacy Policy page
- ❌ No Terms of Service page
- ❌ No Imprint page

## Implementation Priority

### High Priority (Core Features)
1. Mentions parsing and notifications
2. Topic following
3. Direct Messages (basic)
4. Header photo upload (basic, without safety checks)
5. Overflow menus (Report, Mute, Block)

### Medium Priority (UX Enhancements)
6. Explore tabs (Deep dives, Newsroom)
7. Explore relevance controls
8. Keeps library page
9. Saved by X timeline items
10. Compose editor enhancements

### Low Priority (Nice to Have)
11. Push notification worker (APNs/FCM)
12. Background workers (Neo4j queue)
13. Image processing (compression, EXIF stripping)
14. Legal pages
15. GDPR compliance (export, deletion)
