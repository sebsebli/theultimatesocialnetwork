# Frontend Coverage Report

## 📊 Coverage Summary

**Total Endpoints**: 65  
**Both Apps**: 41 (63%)  
**Mobile Only**: 5  
**Web Only**: 16  
**Missing**: 3  

- **Mobile Coverage**: 46/65 (70%)
- **Web Coverage**: 57/65 (87%)

## ✅ Fully Covered (Both Apps) - 41 endpoints

### Auth
- ✅ POST /auth/login
- ✅ POST /auth/verify
- ✅ GET /users/me
- ✅ PATCH /users/me
- ✅ DELETE /users/me

### Users
- ✅ GET /users/:handle
- ✅ POST /users/:id/follow
- ✅ DELETE /users/:id/follow

### Posts
- ✅ POST /posts
- ✅ GET /posts/:id
- ✅ DELETE /posts/:id
- ✅ POST /posts/:id/quote
- ✅ GET /posts/:id/referenced-by
- ✅ GET /posts/:id/replies
- ✅ POST /posts/:postId/replies
- ✅ DELETE /posts/:postId/replies/:id

### Feed & Explore
- ✅ GET /feed
- ✅ GET /explore/topics
- ✅ GET /explore/people

### Topics
- ✅ GET /topics/:slug
- ✅ POST /topics/:slug/follow
- ✅ DELETE /topics/:slug/follow

### Search
- ✅ GET /search/posts
- ✅ GET /search/users

### Collections
- ✅ POST /collections
- ✅ GET /collections
- ✅ GET /collections/:id
- ✅ PATCH /collections/:id
- ✅ POST /collections/:id/items
- ✅ DELETE /collections/:id/items/:itemId

### Keeps
- ✅ GET /keeps

### Messages
- ✅ GET /messages/threads
- ✅ POST /messages/threads
- ✅ GET /messages/threads/:threadId/messages
- ✅ POST /messages/threads/:threadId/messages

### Notifications
- ✅ GET /notifications
- ✅ POST /notifications/:id/read
- ✅ POST /notifications/read-all

### Safety
- ✅ POST /safety/report

### Invites
- ✅ GET /invites/my
- ✅ POST /invites/generate

## ⚠️ Missing in Mobile App - 16 endpoints

### User Features
- ⚠️ GET /users/me/export - Data export
- ⚠️ GET /users/suggested - Suggested users
- ⚠️ GET /users/:id/replies - User replies
- ⚠️ GET /users/:id/quotes - User quotes

### Post Features
- ⚠️ GET /posts/:id/sources - Post sources

### Explore Algorithms
- ⚠️ GET /explore/quoted-now - Quote velocity algorithm
- ⚠️ GET /explore/deep-dives - Link chain algorithm
- ⚠️ GET /explore/newsroom - Posts with sources

### Safety Features
- ⚠️ POST /safety/block/:userId - Block user
- ⚠️ DELETE /safety/block/:userId - Unblock user
- ⚠️ POST /safety/mute/:userId - Mute user
- ⚠️ DELETE /safety/mute/:userId - Unmute user
- ⚠️ GET /safety/blocked - List blocked users
- ⚠️ GET /safety/muted - List muted users

### Other
- ⚠️ POST /waiting-list - Join waiting list

## ⚠️ Missing in Web App - 5 endpoints

### Post Interactions
- ⚠️ POST /posts/:id/like - Like post
- ⚠️ POST /posts/:id/keep - Keep post
- ⚠️ POST /posts/:id/view - Record view
- ⚠️ POST /posts/:id/read-time - Record read time

### Auth
- ⚠️ GET /auth/me - Get current auth (may be using /users/me instead)

## ❌ Missing in Both Apps - 3 endpoints

### Admin Features
- ❌ POST /admin/invites/system - Generate system invite (admin only)
- ❌ POST /admin/beta-mode - Toggle beta mode (admin only)

### Health
- ❌ GET /health - Health check (not needed in frontend)

## 📋 Implementation Priority

### High Priority (User-Facing Features)

#### Mobile App
1. **Explore Algorithms** - Add quoted-now, deep-dives, newsroom tabs
2. **Safety Features** - Add block/mute functionality
3. **User Features** - Add suggested users, user replies/quotes
4. **Post Sources** - Show sources on post detail

#### Web App
1. **Post Interactions** - Add like/keep buttons and view tracking
2. **Read Time Tracking** - Track reading time

### Medium Priority

#### Mobile App
1. **Data Export** - Add export functionality in settings
2. **Waiting List** - Add waiting list signup

### Low Priority (Admin Features)

1. **Admin Endpoints** - These are admin-only and may not need frontend UI
2. **Health Check** - Not needed in frontend

## 🎯 Recommendations

1. **Add missing explore algorithms to mobile** - These are key features
2. **Add safety features to mobile** - Important for user experience
3. **Add post interactions to web** - Core functionality
4. **Consider admin panel** - For admin endpoints (optional)

## ✅ Status

**Overall Coverage**: Good (70% mobile, 87% web)

Most critical user-facing features are covered. The missing features are mostly:
- Advanced explore algorithms (mobile)
- Safety features (mobile)
- Post interactions (web)
- Admin features (both - optional)
