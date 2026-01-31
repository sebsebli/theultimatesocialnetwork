Build a production-ready fullstack social network matching these specs:

# Citewalk System Implementation Instructions

## Document Structure

This document is organized into four parts with no duplication:
- **PART 1**: Product & UI/UX specification (complete feature requirements)
- **PART 2**: Technical implementation requirements (architecture, schemas, APIs)
- **PART 3**: Push notification architecture (EU-only mobile notifications)
- **PART 4**: Design & agency brief (visual identity, interaction design, component specifications)

Each section is authoritative and precise. Cross-references use section numbers.

⸻

PART 1 — PRODUCT & UI/UX SPEC (EXHAUSTIVE)

1. Product definition

Citewalk is a text-first social network that merges:
	•	social posting (status/opinions/discussion),
	•	Wikipedia-style clickable inline links ([[topic]], [[post:uuid]], multi-target links),
	•	citation-based recognition (quotes/backlinks as durable authority),
	•	and optionally photo-only header images for article-like posts.

Core principles
	•	Home feed is follow-only and chronological.
	•	Likes exist but are private to the author (no public like counts; no competition).
	•	Quotes/Citations are public and become the prestige/authority signal.
	•	Explore uses a transparent relevance system (not an opaque addictive FYP) with user controls.

⸻

2. Content model & interaction rules

2.1 Post body, title, and “article mode”

Title is derived from markdown — no separate title input.
	•	If the first non-empty line is # Title here, that is the post title.
	•	The title line is stored in the post body, but also extracted into posts.title for indexing/search/rendering.
	•	If no #  heading exists at the top, the post is “status-like”.

Article mode
	•	A post is considered an “article” if it has:
	•	a top # Title, or
	•	exceeds a length threshold (e.g., > 600 chars), or
	•	includes a “Sources” section (extracted links)
	•	Article posts open in Reading Mode by default when tapped.

2.2 Inline linking (Wikipedia-style) — must be clickable in text

Supported syntaxes:
	1.	Topic links

	•	[[Urban loneliness]]
	•	Optional alias: [[Urban loneliness|third places]]
	•	Multi-target with alias: [[Urban loneliness, City design|why this matters]]

	2.	Post links

	•	[[post:550e8400-e29b-41d4-a716-446655440000]]
	•	Alias: [[post:…|this earlier argument]]
	•	Multi-post: [[post:uuid1, post:uuid2|supporting posts]]

	3.	External links

	•	Markdown: [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
	•	Bare URLs auto-link.

Rendering rules
	•	Single target opens directly.
	•	Multi-target opens a Targets Sheet listing each linked item (topic/post/url) with title/excerpt.
	•	External links open an in-app browser (mobile) or new tab (web) and also appear in Sources.

2.3 Sources list behavior (your question: “Do they come immediately?”)

Yes. On publish:
	•	The server extracts all external URLs from the post body.
	•	The post detail / reading mode shows a Sources section automatically.
	•	If the user used [anchor](url), the Sources item shows the anchor text + domain.
	•	If bare URL, the server fetches the HTML title (best-effort) and stores it.

2.4 Quote/Citation mechanic (prestige)

Quote creates a new post that cites another post.
	•	Requires commentary (min 1 char).
	•	Creates a QUOTE edge in SQL + Neo4j.
	•	Increases quote_count on the cited post.
	•	Shows up in “Referenced by / Quoted by”.

2.5 Likes (private to author)
	•	Anyone can like a post.
	•	Only the author sees total likes (private metric).
	•	Likes never affect feed ordering.
	•	Likes may affect Explore relevance (optional, transparent; user can disable).

2.6 Keeps & curated profile collections

Two related concepts:

Keep (private bookmark)
	•	Save a post to your private library.

Collection (public curated reposts / “articles I collect”)
	•	Users can create Collections (public or private):
	•	e.g., “Urbanism”, “Best essays”, “Family recipes”
	•	A collection contains kept posts plus an optional curator note.
	•	Collections are shown on profiles and act like “curated reposts” without re-amplifying into Home.

Saved by X discovery
	•	If a user you follow has public collections, you may see a lightweight timeline item:
	•	“Saved by `@alex` to Collection: Urbanism”
	•	This is opt-in in Settings:
	•	toggle: “Show saves from people I follow”
	•	The saved item links to the original post + the collection.

2.7 Optional photo-only header images (carefully constrained)

You can allow one photo per post as a header image, with strict limits:
	•	Only JPG/WEBP
	•	Max upload size (client): e.g. 6–10MB
	•	Server recompresses to WEBP/JPEG at aggressive settings
	•	Max rendered dimensions: e.g. 1600px wide
	•	Strips EXIF metadata (privacy)
	•	AI/ML safety check (NSFW/violence) before publish
	•	No galleries; no inline images; no video.

This supports “proper articles” without becoming Instagram.

⸻

3. Navigation & IA

Primary tabs (mobile bottom / web left rail)
	1.	Home
	2.	Explore
	3.	Compose
	4.	Inbox
	5.	Profile

⸻

4. Screen-by-screen UI spec (every button)

4.1 Welcome
	•	Logo wordmark
	•	Button: Continue
	•	Links: Privacy, Terms, Imprint

4.2 Sign-in
	•	Input: email
	•	Button: Send magic link
	•	Link: “Resend”
	•	Link: “Change email”
	•	Optional later: passkey

4.3 Onboarding (Profile)
	•	Field: display name
	•	Field: handle
	•	Field: bio
	•	Toggle: Open / Protected
	•	Button: Continue

4.4 Onboarding (Languages)
	•	Multi-select: languages you read (1–3 recommended)
	•	Toggle: “Show only my languages in Explore” (default on)
	•	Button: Continue

4.5 Onboarding (Starter packs)
	•	Lists of suggested accounts (curated)
	•	Button per account: Follow / Following
	•	Button: Finish
	•	Link: Skip

⸻

4.6 Home (Timeline)

Top bar:
	•	Logo
	•	Button: Search
	•	Button: Settings quick icon (optional)

Feed items:
	•	Post item:
	•	Tap author → Profile
	•	Tap body → Post detail / Reading mode
	•	Buttons:
	•	Like (toggles state; author-only count)
	•	Reply (opens post detail and reply box focused)
	•	Quote (opens quote composer)
	•	Keep (private bookmark)
	•	Add to Collection (opens “choose collection” sheet)
	•	Share (copy link / system share)
	•	“Saved by X” item (if enabled):
	•	text line + tap-through to collection/post
	•	button: “Hide saves from `@x`” (muted) in overflow

Composer entry:
	•	Floating “+” compose button

⸻

4.7 Compose (Outstanding editor; not nerdy)

Editor has both typing shortcuts and buttons.
No one is forced to learn syntax.

Top bar:
	•	Cancel
	•	Publish

Editor area:
	•	Multiline text
	•	If first line begins with # , it’s styled as title live.

Toolbar row (icons + labels):
	•	Title (inserts #  at beginning if absent)
	•	Bold (** **)
	•	Italic (_ _)
	•	Quote (> )
	•	Bullets
	•	Numbered list
	•	Link
	•	opens dialog:
	•	Display text
	•	Link target: Topic / Post / URL
	•	Topic
	•	opens picker, inserts [[Topic]] or [[Topic|Text]]
	•	Citewalk post
	•	opens post search; inserts [[post:uuid|Text]]
	•	Mention
	•	opens user search; inserts `@handle`
	•	Photo header (optional)
	•	opens image picker; shows crop/preview
	•	Visibility toggle: Followers / Public
	•	Preview button (optional)
	•	Publish button

Auto-suggestions:
	•	Typing [[ opens dropdown
	•	Typing @ opens dropdown

⸻

4.8 Post detail
	•	Full post
	•	Buttons: Like, Reply, Quote, Keep, Add to collection, Share
	•	Sections:
	•	Replies (chronological)
	•	Sources (external links)
	•	Referenced by (backlinks)
	•	Reply composer:
	•	field
	•	button: Reply

Overflow menu:
	•	Report
	•	Mute author
	•	Block author
	•	Copy link

⸻

4.9 Reading Mode
	•	Optimized typography
	•	Sticky mini header with back + title
	•	Bottom sections: Sources, Referenced by, Quoted by

⸻

4.10 Explore (transparent relevance)

Tabs:
	•	Topics
	•	People
	•	Quoted now
	•	Deep dives
	•	Newsroom

Each tab has:
	•	Language filter pill: “My languages” / “All”
	•	Sort pill: “Recommended” / “Newest” / “Most cited”

Explore Settings link (top-right):
	•	Opens “Relevance Controls” (see below)

⸻

4.11 Topic page

Header:
	•	Topic title
	•	Follow topic button (yes: topics are followable)
	•	Optional description
Sections:
	•	Start here (most cited)
	•	New (recent)
	•	People (most cited in topic)
	•	Sources (frequent URLs)

⸻

4.12 Profile

Header:
	•	Name, handle, bio
	•	Counts: followers, following, quotes received
Buttons:
	•	Follow / Requested / Following
	•	Message (only if allowed)
Tabs:
	•	Posts
	•	Replies
	•	Quotes received (posts that quoted them)
	•	Collections (curated reposts)
	•	Pinned Keeps (optional)

Self-profile adds:
	•	Edit profile
	•	Manage collections
	•	Settings

⸻

4.13 Collections

Collection list:
	•	Create collection button
	•	Each collection shows:
	•	title
	•	description
	•	privacy icon (public/private)
Collection page:
	•	curated items list
	•	each item shows:
	•	original author + excerpt
	•	curator note
Buttons:
	•	Add item
	•	Remove item
	•	Edit collection
	•	Toggle privacy
	•	Share collection

⸻

4.14 Inbox

Tabs:
	•	Notifications
	•	Messages

Notification types:
	•	Follow
	•	Follow request
	•	Reply
	•	Quote
	•	Like (private; shown to author only)
	•	“Saved your post to a public collection” (optional notification)

⸻

4.15 Settings
	•	Account: email, sign out
	•	Privacy: Open/Protected, follow approvals
	•	Languages: manage
	•	Feed options:
	•	toggle “Show saves from people I follow”
	•	Explore relevance:
	•	transparent controls (below)
	•	Safety:
	•	blocked list
	•	muted list
	•	Data:
	•	export archive
	•	delete account

⸻

5. Transparent relevance system (your request #5)

We keep Home chronological and clean.
We apply relevance primarily to Explore, plus optional “suggested follows” surfaces.

Relevance Controls UI (Settings → Explore relevance)
	•	Toggle: Enable recommendations (default ON)
	•	Sliders (0–100):
	•	Topics you follow
	•	Language match
	•	Citations/quotes
	•	Replies/discussion
	•	Likes (private signal; optional)
	•	Network proximity (2nd-degree follows; optional)
	•	Toggle: “Show why I’m seeing this”
	•	Button: Reset defaults

Every recommended item shows:
	•	“Why”: e.g., “Because you follow Topic X and read Finnish + this post is frequently cited.”

⸻

PART 2 — TECHNICAL REQUIREMENTS DOCUMENT (IMPLEMENTATION)

6. Hosting constraints (Hetzner EU only)

Hetzner operates data centers in Germany and Finland; avoid non-EU locations.  ￼
Production requirement:
	•	Provision Hetzner resources only in Falkenstein/Nuremberg/Helsinki.
	•	Enforce region constraints in IaC and deployment docs.

⸻

7. Open-source stack (self-hosted)
	•	Web: Next.js + TS
	•	Mobile: Expo React Native (latest) + TS
	•	API: NestJS + TS (single business logic layer)
	•	Auth + Postgres: Supabase self-host
	•	Graph DB: Neo4j Community
	•	Search: Meilisearch
	•	Cache/Queue/Rate limits: Redis
	•	Object storage: MinIO (for photo headers + exports)
	•	Reverse proxy/TLS: Caddy
	•	Observability: Prometheus + Grafana + Loki (optional, recommended)

All components run via Docker locally and on Hetzner.

⸻

8. Architecture overview

Postgres (Supabase) is the source of truth.
Neo4j is a derived graph projection for:
	•	backlinks
	•	topic relationships
	•	deep dive path generation
	•	quote velocity queries

Write path (post creation)
	1.	Client sends post body (+ optional header photo) to API.
	2.	API:
	•	validates session JWT
	•	parses body: title, mentions, wikilinks, post links, external URLs
	•	language detection
	•	writes post + extracted edges to Postgres
	•	pushes graph update job to queue
	•	indexes in Meilisearch
	3.	Worker:
	•	updates Neo4j nodes and edges
	•	recomputes topic metrics and quote velocity snapshots

⸻

9. Parsing rules (authoritative)

Title extraction
	•	Trim leading whitespace and blank lines.
	•	If first line matches ^#\s+(.+)$ then:
	•	title = capture group
	•	store in posts.title
	•	Otherwise null.

Wikilink grammar

[[ TARGETS (| ALIAS)? ]]
	•	TARGETS = one or more items separated by commas
	•	item formats:
	•	post:UUID
	•	Topic Name
	•	https://... (optional, but recommended to keep external links in markdown instead)
	•	ALIAS is display text

Storage
	•	Store raw body text
	•	Store a parsed token stream (optional) or store extracted edges only.

⸻

10. Database schemas (Postgres) — canonical

Below is the minimum complete schema (add columns as needed for auditing). Use UUIDs throughout.

users
	•	id (uuid, pk) — same as Supabase auth user id
	•	handle (text, unique)
	•	display_name (text)
	•	bio (text)
	•	is_protected (bool)
	•	created_at, updated_at, deleted_at
	•	follower_count, following_count
	•	quote_received_count

follows
	•	follower_id, followee_id, created_at (pk follower_id+followee_id)

follow_requests
	•	id uuid pk
	•	requester_id, target_id
	•	status enum PENDING/APPROVED/REJECTED
	•	created_at

posts
	•	id uuid pk
	•	author_id uuid fk
	•	visibility enum FOLLOWERS/PUBLIC
	•	body text
	•	title text null
	•	header_image_key text null (MinIO object key)
	•	header_image_blurhash text null (optional)
	•	lang text, lang_confidence float
	•	created_at, updated_at, deleted_at
	•	reply_count int
	•	quote_count int
	•	private_like_count int

replies
	•	id uuid pk
	•	post_id uuid fk
	•	author_id uuid fk
	•	parent_reply_id uuid null (max depth 2)
	•	body text
	•	lang, lang_confidence
	•	created_at, deleted_at

likes (private)
	•	user_id, post_id, created_at (pk user_id+post_id)

topics
	•	id uuid pk
	•	slug unique text
	•	title text
	•	created_at
	•	created_by uuid null

post_topics
	•	post_id, topic_id (pk)

post_edges
	•	id uuid pk
	•	from_post_id uuid
	•	to_post_id uuid
	•	edge_type enum LINK/QUOTE
	•	anchor_text text null
	•	created_at

external_sources
	•	id uuid pk
	•	post_id uuid
	•	url text
	•	canonical_url text
	•	title text null
	•	created_at

mentions
	•	id uuid pk
	•	post_id uuid null
	•	reply_id uuid null
	•	mentioned_user_id uuid
	•	created_at

keeps (private)
	•	user_id, post_id, created_at (pk user_id+post_id)

collections
	•	id uuid pk
	•	owner_id uuid fk users
	•	title text
	•	description text
	•	is_public bool
	•	created_at, updated_at

collection_items
	•	id uuid pk
	•	collection_id uuid fk
	•	post_id uuid fk
	•	curator_note text null
	•	added_at timestamptz
	•	sort_order int

notifications
	•	id uuid pk
	•	user_id uuid (recipient)
	•	type enum FOLLOW/FOLLOW_REQUEST/REPLY/QUOTE/LIKE/MENTION/COLLECTION_ADD/DM
	•	actor_user_id uuid null
	•	post_id uuid null
	•	reply_id uuid null
	•	collection_id uuid null
	•	created_at
	•	read_at

dm_threads / dm_messages
	•	threads: id, user_a, user_b, created_at
	•	messages: id, thread_id, sender_id, body, created_at, deleted_at

reports
	•	id uuid pk
	•	reporter_id uuid
	•	target_type enum POST/REPLY/USER/DM
	•	target_id uuid
	•	reason text
	•	created_at
	•	status enum OPEN/REVIEWED/ACTIONED/DISMISSED

billing prep (inactive at launch)
	•	plans
	•	subscriptions
	•	entitlements

⸻

11. Neo4j model (mandatory)

Nodes:
	•	User(id, handle)
	•	Post(id, author_id, created_at, deleted)
	•	Topic(id, slug, title)
	•	Url(hash, url)

Edges:
	•	(User)-[:FOLLOWS]->(User)
	•	(User)-[:AUTHORED]->(Post)
	•	(Post)-[:IN_TOPIC]->(Topic)
	•	(Post)-[:LINKS_TO]->(Post)
	•	(Post)-[:QUOTES]->(Post)
	•	(Post)-[:CITES_URL]->(Url)
	•	(Post)-[:MENTIONS]->(User)

Constraints:
	•	unique on User.id, Post.id, Topic.slug, Url.hash

⸻

12. Algorithms (explicit, implementable)

12.1 Language detection
	•	Use CLD3 or fastText (server-side).
	•	Store lang + confidence.
	•	In Explore queries: filter by user_languages unless override.

12.2 Quote velocity (“Quoted now”)

Compute over sliding window:
	•	quote edges created in last 6h/12h.
Score = quotes_last_6h * 1.0 + quotes_last_24h * 0.3 (example).

12.3 Topic “Start here”

Rank posts within topic by:
	•	total quote_count (lifetime) weighted by recency
	•	plus backlinks count

Example:
score = quote_count * 1.0 + backlinks * 0.2 + replies * 0.1

12.4 People recommendations (transparent)

Candidate sets:
	•	authors frequently quoted in topics you follow
	•	authors whose posts you kept/quoted
	•	optional 2nd-degree follows (toggle)

Score components (weights are user-adjustable):
	•	language match
	•	topic overlap
	•	quote authority
	•	discussion activity

12.5 “Saved by X” eligibility

Only emit to followers if:
	•	saver’s collection is public
	•	saver has enabled “share saves”
	•	viewer has enabled “see saves”
	•	rate limit: max N “save events” per day to prevent spammy curation

⸻

13. API spec (high-level endpoints)

All clients talk to your API. Supabase is used for auth and DB access behind the scenes.

Key endpoints:
	•	POST /posts
	•	GET /posts/:id
	•	DELETE /posts/:id (soft delete)
	•	POST /posts/:id/like (private)
	•	POST /posts/:id/quote
	•	POST /posts/:id/keep
	•	POST /collections
	•	POST /collections/:id/items
	•	GET /topics/:slug
	•	GET /explore/quoted-now
	•	GET /explore/topics
	•	GET /explore/people
	•	GET /notifications
	•	POST /reports

(For a build agent, generate full OpenAPI 3.0 from this.)

⸻

14. Local development (must work)

Requirements
	•	Docker + docker compose
	•	Node 20+
	•	pnpm/npm

Local run flow
	1.	cp infra/docker/.env.example infra/docker/.env
	2.	docker compose up -d
	3.	pnpm install
	4.	pnpm dev (web + api) OR run both in containers

Mobile:
	•	cd apps/mobile
	•	npx expo start
	•	set API base URL to local network IP (for physical phone)

⸻

15. Hetzner deployment (EU-only)
	•	Use a Hetzner VM located in Germany or Finland.  ￼
	•	Install Docker and docker compose.
	•	Copy repo + .env.
	•	Run docker compose up -d.
	•	Configure firewall: expose only 80/443; keep Neo4j browser closed to public.
	•	Backups:
	•	Postgres dump nightly
	•	Neo4j dump nightly
	•	MinIO bucket replication or backup

⸻

16. Docker compose (production + local)

You will run:
	•	Supabase self-host bundle (official)
	•	api
	•	web
	•	neo4j
	•	redis
	•	meilisearch
	•	minio
	•	caddy

Because Supabase’s official compose is large, the implementation requirement is:
	•	Vendor Supabase’s official self-host docker compose into infra/docker/supabase/ and join network.  ￼
	•	Provide a single top-level compose that includes your services plus Supabase.

⸻

17. Expo React Native (latest) build instructions

Core packages:
	•	expo
	•	expo-secure-store
	•	expo-linking
	•	react-navigation
	•	i18next + expo-localization

Auth:
	•	Supabase magic link with deep link callback:
	•	citewalk://auth/callback
	•	On callback, store session in secure store.
	•	API calls include bearer token.

Renderer:
	•	Custom markdown-lite renderer that:
	•	styles # heading at top as title
	•	converts [[...]] to tappable links
	•	converts [text](url) to tappable links
	•	Multi-target link opens action sheet with targets.

⸻

18. Compliance (GDPR/DSA/AI Act) requirements

You will need:
	•	Privacy policy explaining what you store and why (GDPR principles).  ￼
	•	DSA-compliant reporting/notice-and-action flow and transparency reporting (scaled to your size).  ￼
	•	AI Act transparency if you use AI systems in moderation or media classification (disclosure requirements depend on use).  ￼

Practical product requirements:
	•	A “Report” function on posts/replies/users
	•	An appeals mechanism for moderation decisions
	•	A transparency page (even if minimal at first)
	•	Data export and deletion (GDPR)


⸻

PART 3 — PUSH NOTIFICATION ARCHITECTURE (EU-ONLY)

1. End-to-end EU-only push architecture

Components
	•	Mobile app (Expo RN) obtains native device tokens (APNs token on iOS, FCM registration token on Android).  ￼
	•	API (NestJS) stores tokens and user notification preferences.
	•	Worker (NestJS/BullMQ) dequeues push jobs and sends:
	•	iOS → APNs HTTP/2 with token-based auth (.p8)  ￼
	•	Android → FCM HTTP v1 with OAuth2 service account  ￼
	•	Redis provides queue + rate limits.
	•	Postgres stores tokens, prefs, outbox, delivery audit.

Flow (authoritative)
	1.	User enables notifications (consent prompt).
	2.	App calls getDevicePushTokenAsync() and registers token with your API.  ￼
	3.	Any event (reply/quote/mention/DM/etc.) creates an in-app notification row + a push_outbox row (if allowed).
	4.	Worker reads push_outbox, sends to APNs or FCM, updates status (sent/failed), disables bad tokens.

⸻

2. Mobile app requirements (Expo RN latest)

Mandatory: physical device testing

Push tokens generally won’t behave properly on simulators/emulators; plan to test on real devices.

Permissions + Android channels (required)

On Android 13+, you must create a channel before requesting tokens (Expo explicitly notes channel setup before token retrieval).  ￼

Token acquisition (native)

Use Expo Notifications “custom server” approach:
	•	Notifications.getDevicePushTokenAsync() for native tokens (APNs/FCM).  ￼

Minimal registration code (app side)

Implement a registerForPush() function that:
	•	creates Android channel
	•	requests permissions
	•	obtains device token
	•	calls POST /me/push-tokens

Token payload you send:
	•	provider: APNS or FCM
	•	token: string
	•	platform: ios|android
	•	device_id: random install UUID (not hardware)
	•	app_version, locale

Deep links from push

Push payload data includes:
	•	deepLink: "citewalk://post/<uuid>" etc.
App routes accordingly.

⸻

3. Backend: data model (Postgres)

Add/keep these tables (as previously outlined):

push_tokens
	•	provider: APNS or FCM
	•	token
	•	platform
	•	device_id (random install id)
	•	disabled_at, last_seen_at
	•	optional: apns_environment (sandbox|production) if you send both during dev

notification_prefs
	•	per-type toggles (replies/quotes/mentions/dms/follows/saves)
	•	quiet hours
	•	global enable

push_outbox
	•	queued payload + retry count + status + last_error
	•	supports auditability and re-drive

Retention:
	•	delete disabled tokens after N days
	•	delete push_outbox rows after 30–90 days (configurable)

⸻

4). Backend: required endpoints

Register token

POST /api/v1/me/push-tokens
	•	Validates JWT
	•	Upserts token (unique by provider+token)
	•	Updates last_seen_at, device_id, platform, app_version, locale
	•	If user revoked permissions: DELETE /me/push-tokens/:id or mark disabled

Preferences

GET /me/notification-prefs
PATCH /me/notification-prefs

Event → outbox creation (internal)

Whenever you create a row in notifications, also evaluate:
	•	user prefs
	•	blocked/muted relationships
	•	quiet hours
	•	daily caps
Then insert push_outbox row(s).

⸻

5). Sending to APNs (iOS) from Hetzner (EU)

Authentication

Use token-based auth with Apple .p8 key (Key ID + Team ID).  ￼

Endpoint and environment
	•	Production: https://api.push.apple.com/3/device/<deviceToken>
	•	Sandbox: https://api.sandbox.push.apple.com/3/device/<deviceToken>
Use correct environment depending on build type. Apple’s APNs provider API uses HTTP/2 semantics.  ￼

Recommended Node library
	•	apns2 or node-apn with token-based auth
	•	Keep .p8 as a Docker secret/volume, not in env vars.

Payload:
	•	aps.alert.title, aps.alert.body
	•	aps.sound optional
	•	data.deepLink custom field

⸻

6). Sending to FCM HTTP v1 (Android) from Hetzner (EU)

Authentication

Use OAuth2 access token derived from a Google service account (JSON) for your Firebase project.  ￼

Endpoint

POST https://fcm.googleapis.com/v1/projects/<project-id>/messages:send  ￼

Recommended Node approach
	•	Use google-auth-library to mint an access token
	•	Or use firebase-admin (open source) as sender SDK (still calls FCM v1)

Payload:
	•	message.token = FCM registration token
	•	message.notification.title/body
	•	message.data.deepLink etc.

⸻

7). Worker design (queue, retries, token invalidation)

Queue
	•	BullMQ (Redis)
	•	Job types:
	•	push.send with push_outbox_id

Retry policy
	•	Retry transient network errors with exponential backoff (e.g., 30s, 2m, 10m, 1h)
	•	If APNs/FCM responds “invalid token / not registered”:
	•	set push_tokens.disabled_at = now()
	•	mark outbox as failed with error code

Rate limiting (anti-annoyance)
	•	per-user daily push cap
	•	per-thread DM cap (avoid spam)
	•	digest option for high-volume events

⸻

8). Docker Compose additions (local + Hetzner)

Add a dedicated worker container:
	•	worker uses same image as api but runs node dist/worker.js
	•	Mount secrets:
	•	/run/secrets/apns_key.p8
	•	/run/secrets/fcm_service_account.json

In compose (illustrative):
	•	secrets: (compose secrets or bind mounts)
	•	worker depends on redis, db

Operationally:
	•	Firewall: keep Neo4j ports private
	•	Outbound HTTPS must be allowed to Apple/Google endpoints

⸻

9). “EU-only” clarification you should state publicly

You can legitimately claim:
	•	“All our application infrastructure and data storage are hosted in the EU (Hetzner).”
But you should also disclose:
	•	“Push notifications are delivered via Apple/Google notification services required by your device OS.”

This is the accurate, defensible statement.



1). Mobile (Expo RN) — obtain native tokens (APNs/FCM) and register them

Expo explicitly supports obtaining the native device push token (APNs/FCM) via getDevicePushTokenAsync() when you send notifications yourself (not Expo relay).  ￼

1.1 Expo code: register device token and call your API

// push/registerPush.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Localization from "expo-localization";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL!;

export async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6E7A8A",
    });
  }
}
// Android channels are a first-class requirement; Expo supports creating them.  [oai_citation:2‡Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/?utm_source=chatgpt.com)

export async function registerForPush(jwt: string) {
  if (!Device.isDevice) return; // real device recommended for push

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return;

  // Native token (APNs on iOS, FCM on Android)
  const deviceToken = await Notifications.getDevicePushTokenAsync(); //  [oai_citation:3‡Expo Documentation](https://docs.expo.dev/push-notifications/sending-notifications-custom/?utm_source=chatgpt.com)

  const platform = Platform.OS; // 'ios' | 'android'
  const provider = platform === "ios" ? "APNS" : "FCM";

  // install-scoped random device id (not hardware fingerprint)
  let deviceId = await SecureStore.getItemAsync("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await SecureStore.setItemAsync("device_id", deviceId);
  }

  const payload = {
    provider,
    token: deviceToken.data,
    platform,
    device_id: deviceId,
    app_version: "1.0.0",
    locale: Localization.locale,
    apns_environment: platform === "ios" ? "sandbox_or_production" : null,
  };

  await fetch(`${API_BASE}/me/push-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });
}

1.2 Deep links for push routing

Push payload should include data.deepLink such as:
	•	citewalk://post/<uuid>
	•	citewalk://topic/<slug>
	•	citewalk://user/<handle>
	•	citewalk://collection/<uuid>

Handle them with expo-linking and navigation.

⸻

2). Postgres schema additions (drop-in SQL migration)

do $$ begin
  create type push_provider_t as enum ('APNS','FCM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type push_status_t as enum ('pending','sent','failed','suppressed');
exception when duplicate_object then null; end $$;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  provider push_provider_t not null,
  token text not null,

  platform text not null check (platform in ('ios','android')),
  device_id text null, -- install-scoped random uuid, not a fingerprint
  app_version text null,
  locale text null,

  -- iOS only: keep track of environment for dev/test
  apns_environment text null check (apns_environment in ('sandbox','production')),

  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz null,

  unique (provider, token)
);

create index if not exists idx_push_tokens_user on public.push_tokens(user_id);
create index if not exists idx_push_tokens_active on public.push_tokens(user_id) where disabled_at is null;

create table if not exists public.notification_prefs (
  user_id uuid primary key references public.users(id) on delete cascade,
  push_enabled boolean not null default true,

  replies boolean not null default true,
  quotes boolean not null default true,
  mentions boolean not null default true,
  dms boolean not null default true,
  follows boolean not null default true,
  saves boolean not null default false,

  quiet_hours_start smallint null, -- minutes since midnight local
  quiet_hours_end smallint null
);

create table if not exists public.push_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  notif_type text not null, -- mirror notifications.type
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb, -- deepLink, ids

  priority text not null default 'normal' check (priority in ('normal','high')),
  status push_status_t not null default 'pending',

  attempt_count int not null default 0,
  last_error text null,

  created_at timestamptz not null default now(),
  sent_at timestamptz null
);

create index if not exists idx_push_outbox_status on public.push_outbox(status, created_at);


⸻

3). API endpoints (NestJS)

3.1 POST /me/push-tokens (register/update token)
	•	Auth: Bearer JWT (Supabase JWT)
	•	Upsert token
	•	Set last_seen_at = now()
	•	If token was disabled, re-enable on re-register

3.2 PATCH /me/notification-prefs
	•	Toggle push per type + quiet hours

3.3 Event → enqueue outbox (internal)

Whenever you create an in-app notifications row, evaluate:
	•	prefs (push_enabled + type toggle)
	•	quiet hours
	•	daily caps
	•	blocked/muted checks
Then insert a push_outbox row.

⸻

4). NestJS implementation (TypeScript)

4.1 DTOs

// api/src/push/dto/register-push-token.dto.ts
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class RegisterPushTokenDto {
  @IsIn(["APNS", "FCM"])
  provider!: "APNS" | "FCM";

  @IsString()
  token!: string;

  @IsIn(["ios", "android"])
  platform!: "ios" | "android";

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsString()
  app_version?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsIn(["sandbox", "production"])
  apns_environment?: "sandbox" | "production";
}

4.2 Controller

// api/src/push/push.controller.ts
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { RegisterPushTokenDto } from "./dto/register-push-token.dto";
import { PushTokensService } from "./push-tokens.service";
import { AuthGuard } from "../shared/auth.guard";
import { CurrentUser } from "../shared/current-user.decorator";

@Controller("me/push-tokens")
@UseGuards(AuthGuard)
export class PushController {
  constructor(private readonly pushTokens: PushTokensService) {}

  @Post()
  async register(@CurrentUser() user: { id: string }, @Body() dto: RegisterPushTokenDto) {
    await this.pushTokens.upsert(user.id, dto);
    return { ok: true };
  }
}

4.3 Push token service (SQL upsert)

// api/src/push/push-tokens.service.ts
import { Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { RegisterPushTokenDto } from "./dto/register-push-token.dto";

@Injectable()
export class PushTokensService {
  constructor(private readonly db: Pool) {}

  async upsert(userId: string, dto: RegisterPushTokenDto): Promise<void> {
    const q = `
      insert into public.push_tokens
        (user_id, provider, token, platform, device_id, app_version, locale, apns_environment, last_seen_at)
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, now())
      on conflict (provider, token)
      do update set
        user_id = excluded.user_id,
        platform = excluded.platform,
        device_id = excluded.device_id,
        app_version = excluded.app_version,
        locale = excluded.locale,
        apns_environment = excluded.apns_environment,
        last_seen_at = now(),
        disabled_at = null
    `;
    await this.db.query(q, [
      userId,
      dto.provider,
      dto.token,
      dto.platform,
      dto.device_id ?? null,
      dto.app_version ?? null,
      dto.locale ?? null,
      dto.apns_environment ?? null,
    ]);
  }
}


⸻

5). Worker: send pending pushes via APNs/FCM (BullMQ)

5.1 Queue processor (BullMQ)
	•	Poll push_outbox where status='pending'
	•	For each user, fetch active tokens
	•	Send per token
	•	Update outbox row: sent or failed
	•	On “invalid token” response: disable token

5.2 Sender implementations

APNs (HTTP/2 token-based .p8)
Apple’s token-based connection uses a signing key (.p8) plus Key ID + Team ID.  ￼

Use a Node library that supports JWT-based provider tokens (e.g., apns2 / node-apn with token auth). Your code should:
	•	load .p8 from mounted secret file
	•	generate JWT
	•	call APNs endpoint (sandbox/production based on token record)

Pseudo-implementation skeleton:

// api/src/push/apns.sender.ts
import { Injectable } from "@nestjs/common";
import fs from "fs";

@Injectable()
export class ApnsSender {
  private authKey: string;

  constructor() {
    this.authKey = fs.readFileSync(process.env.APNS_P8_PATH!, "utf8");
  }

  async send(args: {
    deviceToken: string;
    title: string;
    body: string;
    data: Record<string, string>;
    environment: "sandbox" | "production";
  }): Promise<{ ok: boolean; invalidToken?: boolean; error?: string }> {
    // Implement via a proven APNs HTTP/2 library with token-based auth (.p8).
    // Return invalidToken=true for APNs “BadDeviceToken” / “Unregistered”.
    return { ok: true };
  }
}

FCM HTTP v1
FCM v1 requires OAuth2 and sends messages via fcm.googleapis.com/v1/projects/.../messages:send.  ￼

Skeleton:

// api/src/push/fcm.sender.ts
import { Injectable } from "@nestjs/common";
import { GoogleAuth } from "google-auth-library";
import fs from "fs";

@Injectable()
export class FcmSender {
  private auth: GoogleAuth;
  private projectId: string;

  constructor() {
    const jsonPath = process.env.FCM_SERVICE_ACCOUNT_JSON!;
    const creds = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    this.projectId = creds.project_id;
    this.auth = new GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
  }

  async send(args: {
    token: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<{ ok: boolean; invalidToken?: boolean; error?: string }> {
    const client = await this.auth.getClient();
    const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;

    const res = await client.request({
      url,
      method: "POST",
      data: {
        message: {
          token: args.token,
          notification: { title: args.title, body: args.body },
          data: args.data,
        },
      },
    });

    // For invalid tokens, Google returns specific errors; map them to invalidToken=true.
    return { ok: res.status === 200 };
  }
}


⸻

6). Docker Compose: add worker + mount secrets (Hetzner + local)

You will store:
	•	AuthKey_XXXXX.p8 as a Docker secret (or bind-mount on Hetzner)
	•	fcm-service-account.json as a Docker secret (or bind-mount)

Example:

services:
  worker:
    build: ../apps/api
    command: ["node", "dist/worker.js"]
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-postgres}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      APNS_KEY_ID: ${APNS_KEY_ID}
      APNS_TEAM_ID: ${APNS_TEAM_ID}
      APNS_BUNDLE_ID: ${APNS_BUNDLE_ID}
      APNS_P8_PATH: /run/secrets/apns_key_p8
      FCM_SERVICE_ACCOUNT_JSON: /run/secrets/fcm_service_account_json
    depends_on: [db, redis]
    secrets:
      - apns_key_p8
      - fcm_service_account_json

secrets:
  apns_key_p8:
    file: ./secrets/AuthKey_XXXXXX.p8
  fcm_service_account_json:
    file: ./secrets/fcm-service-account.json

Operational hardening:
	•	Do not expose Neo4j ports publicly.
	•	Outbound HTTPS must be allowed to Apple/Google.

⸻

PART 4 — DESIGN & AGENCY BRIEF (VISUAL IDENTITY, INTERACTION DESIGN, COMPONENT SPECIFICATIONS)

# 0) Agency brief and product introduction

## Product in one sentence

Citewalk is a text-first social network where posts link like Wikipedia and credibility comes from being cited—not from public like counts.

## Why it exists (the human problem)

Modern social feeds optimize for attention and comparison. Citewalk is for people who want:
*   to write and think without "performing"
*   to explore ideas through connected posts (Wikipedia-style deep dives)
*   to build identity through what they write and what they curate
*   to discover meaningful voices without getting trapped in algorithmic sludge

## Audience (primary)
1.  Millennials & Gen X exhausted by current social platforms
2.  Writers, thinkers, creators who prefer text and context
3.  Knowledge workers (tech, research, journalism, policy, design)
4.  Curators who collect/organize reading and want to share "best of" lists
5.  High-signal communities: urbanism, philosophy, startups, fitness science, arts, culture

## Audience (secondary)
*   Students and "Wikipedia deep divers"
*   News followers who want context and sourcing

## Brand personality
*   Calm, literate, high-integrity, European sensibility
*   No meme UI, no neon, no loud gamification
*   Feels like: premium reading app + early web community + modern product polish

## Core differentiator to reflect in design
1.  Inline links inside text ([[topic]]) that feel as natural as Wikipedia
2.  "Being quoted" is the prestige signal
3.  Likes exist but are private (author-only)

---

# 1) Visual identity requirements

## 1.1 Logo system (must be distinct and simple)

Deliver 3 logo lockups:
1.  Wordmark: "Citewalk" (primary)
2.  Icon: a single-character mark suitable for app icon
3.  Monogram: "C" or "Ci" (fallback)

### Icon concepts (choose one direction)

A) Footnote mark: superscript "¹" inside a rounded square
B) Bracket mark: [] simplified into a single glyph
C) Node-link mark: one dot connected to two smaller dots (knowledge graph)

### Constraints:
*   Must work at 16px (favicon) and 1024px (marketing)
*   Must work in 1 color (white on black)
*   No gradients, no 3D, no thin hairlines that disappear

## 1.2 Color palette (two-color maximum, dark-first)

This app is intentionally restrained.

### Core palette (fixed)
*   Ink (background): #0B0B0C
*   Paper (primary text): #F2F2F2

### Supporting neutrals (not "colors", just grayscale)
*   Text secondary: #A8A8AA
*   Text tertiary: #6E6E73
*   Divider / hairline: #1A1A1D
*   Surface hover: #121215 (subtle)
*   Surface pressed: #17171B

### Single accent (choose one and lock it)

Pick ONE:
*   Steel: #6E7A8A (recommended)
or
*   Sage: #6F8A78

Use accent for:
*   links
*   active tab indicator
*   primary action text (Publish, Follow)
*   selection highlights

Never use accent as large fills. Mostly text + underline.

## 1.3 Typography (must feel editorial)

Primary typeface:
*   Inter (UI) and Inter (body) for simplicity and performance
Optional "premium" variant:
*   IBM Plex Sans for UI + Source Serif 4 for reading mode only
If you do serif in reading mode, keep UI sans to avoid confusion.

### Font weights
*   Regular 400
*   Medium 500
*   Semibold 600 (titles, key actions)

### Type scale (mobile + web)

**Mobile**
*   App title/section header: 22px / 28 line-height / 600
*   Post title (from #): 20px / 28 / 600
*   Body text: 17px / 26 / 400
*   Metadata (handle, timestamp): 13px / 18 / 400
*   Button label: 15px / 20 / 600
*   Small helper text: 12px / 16 / 400

**Web**
*   Page header: 26px / 34 / 600
*   Post title: 22px / 32 / 600
*   Body: 18px / 28 / 400
*   Meta: 13px / 18 / 400

### Link styling
*   Link color = Accent
*   Underline style = 1px solid accent, offset 2px
*   On hover: increase underline opacity only (no color change)

## 1.4 Layout grid, margins, paddings

**Mobile**
*   Base spacing unit: 8px
*   Screen padding: 16px (left/right)
*   Max content width: full width minus padding
*   Tap targets: minimum 44x44px

**Web**
*   Center column max width: 680px (reading)
*   Outer gutters: 24–32px
*   Left rail (nav): 240px fixed (desktop)
*   Content column aligns to a baseline grid (8px increments)

**Dividers**
*   1px hairline using divider color
*   12px vertical spacing above and below dividers

---

# 2) Interaction and motion (must feel "crazily good")

## Motion principles
*   Subtle, fast, never playful
*   Duration: 120–180ms
*   Easing: standard ease-out
*   Only animate opacity + translateY (2–6px)

## Feedback
*   Every tap changes state immediately (optimistic UI)
*   Use subtle haptic (mobile) for:
    *   Like
    *   Keep
    *   Publish
    *   Follow

## Accessibility
*   Contrast meets WCAG AA (white on black does)
*   Dynamic Type support on mobile
*   All icons have labels (no unlabeled icon-only actions)

---

# 3) Copywriting voice and microcopy

## Voice
*   Calm, direct, intelligent
*   Avoid slang and gamer language
*   Avoid preachy "anti-algorithm manifesto"
*   Emphasize curiosity, sourcing, exploration

## Examples
*   "Link ideas like Wikipedia."
*   "Follow people. Explore topics."
*   "Recognition comes from being cited."
*   "Likes are private."

---

# 4) Core object definitions (for designers)

**User profile**
*   Display name
*   Handle `@handle`
*   Bio
*   Counts:
    *   Followers
    *   Following
    *   Quotes received
*   Tabs:
    *   Posts
    *   Replies
    *   Quotes
    *   Collections

**Post**
*   Author + timestamp
*   Body text
*   Optional # Title at top (rendered as title)
*   Optional header photo (one only)
*   Actions:
    *   Like (private)
    *   Reply
    *   Quote
    *   Keep
    *   Add to Collection
    *   Share
*   Sections:
    *   Sources (auto)
    *   Referenced by (backlinks)
    *   Replies

**Topic**
*   Title (slug)
*   Follow topic
*   Sections: Start here, New, People, Sources

**Collection**
*   Curated list of posts with optional curator notes
*   Public or private
*   Optional "share saves" toggle that produces timeline save-events

---

# 5) Page-by-page UX specification (each page, each button, each feature)

I'm specifying:
*   layout
*   components
*   button set
*   states
*   microcopy
*   edge cases

## 5.1 Welcome / Splash

**Layout**
*   Centered icon mark (64px)
*   Wordmark below (28px)
*   Tagline (secondary text): "Social posts, linked like Wikipedia."
*   Primary button (text button with accent): "Continue"
*   Footer: "Privacy" "Terms" "Imprint" (small text)

**Buttons**
*   Continue (accent text)
*   Privacy/Terms/Imprint (secondary)

**States**
*   None

---

## 5.2 Sign-in (Magic link)

**Layout**
*   Header: "Sign in"
*   Input: Email (full-width)
*   Primary button: "Send magic link"
*   Secondary line: "No password. We'll email you a link."

**Buttons**
*   Send magic link (accent)
*   Resend (only on success screen)
*   Change email (link)

**Error states**
*   invalid email
*   rate limited (show: "Try again in a few minutes.")

---

## 5.3 Onboarding: Profile

**Layout**
*   Header: "Create your profile"
*   Fields:
    *   Display name
    *   Handle (with availability indicator)
    *   Bio
*   Privacy selector:
    *   Open (default)
    *   Protected (requires follow approval)
*   CTA: "Continue"

**Buttons**
*   Continue
*   Back (top-left)

**Copy**
*   Under privacy: "Protected accounts approve followers."

---

## 5.4 Onboarding: Languages

**Layout**
*   Header: "Languages you read"
*   Search input + selectable chips
*   Helper: "This shapes Explore and recommendations."
*   CTA: Continue

**Buttons**
*   Continue
*   Skip (top-right)

---

## 5.5 Onboarding: Starter packs

**Layout**
*   Header: "Follow a few voices"r
*   4 categories, each with 6–10 suggested accounts
*   Each account row:
    *   avatar circle (monochrome placeholder allowed)
    *   name + handle
    *   1-line bio
    *   Follow button (accent outline)

**Buttons**
*   Follow/Following toggle
*   Finish
*   Skip

---

## 5.6 Home (Timeline)

**Top bar**
*   Left: small icon mark
*   Center: "Home"
*   Right: Search icon, Overflow icon

**Feed item types**
A) Post item
B) Saved-by event item (optional, if enabled)

**A) Post item layout (no card)**
*   Row 1: Name (semibold) • `@handle` (secondary) • time (tertiary)
*   Row 2: (optional) Title derived from # (20px, 600)
*   Row 3: Body preview (max 10 lines) then "Read more"
*   Row 4: Header image (if present): 16:9 crop, rounded 12px, edge-to-edge within padding
*   Row 5: Action row (icons + labels):
    *   Like
    *   Reply (count)
    *   Quote (count)
    *   Keep
    *   Add
    *   Share
*   Divider below

**Like rule**
*   No public counts anywhere.
*   On the author's own post, show a small meta line: "Liked by 24 people" (secondary).

**Buttons**
*   Like (toggle)
*   Reply (opens post detail with keyboard focus)
*   Quote (opens quote composer)
*   Keep (toggle)
*   Add to collection (opens bottom sheet)
*   Share (system share or copy link)

**B) Saved-by event item layout**
*   One line: "Saved by `@alex` to Urbanism"
*   Small excerpt of the post (3 lines)
*   Buttons:
    *   "Open" (accent)
    *   Overflow: "Hide saves from `@alex`" / "Turn off saves"

**Empty state**
*   Headline: "Your timeline is quiet."
*   Buttons:
    *   "Explore topics"
    *   "Find people"

---

## 5.7 Search (global)

**Layout**
*   Search input top
*   Tabs: People, Topics, Posts
*   Results list minimalist

**Buttons**
*   Follow for people
*   Open for topics/posts

---

## 5.8 Compose (Editor) — flagship UX

**Top bar**
*   Cancel (left)
*   Draft status (center: "New post")
*   Publish (right, accent)

**Editor area**
*   First line title behavior:
    *   If user taps "Title" button: inserts #  at top and cursor after space.
    *   If user starts with # : render as title automatically.

**Toolbar (sticky above keyboard on mobile)**
*   Title
*   Bold
*   Italic
*   Quote
*   Bullets
*   Numbered
*   Link
*   Topic
*   Post link
*   Mention
*   Header photo
*   Visibility pill (Followers/Public)
*   Preview

**Dialogs**
*   Link dialog:
    *   Display text
    *   Choose target: Topic / Post / URL
    *   If Topic: search topics + create new
    *   If Post: search posts
    *   If URL: paste URL + optional fetch title

**Inline suggestions**
*   typing [[ opens dropdown: Topics + Posts + "Create topic"
*   typing @ opens people list

**Publish checks**
*   If header photo attached: show compression progress microcopy: "Optimizing image…"
*   If external links exist: sources list will appear automatically (no user action).

---

## 5.9 Post detail (Thread view)

**Header**
*   Back
*   Author row
*   Overflow menu

**Body**
*   Full text, inline links active
*   Header photo full width (within padding) with rounded 16px
*   Meta row:
    *   Replies count
    *   Quotes count
    *   (Author-only) Likes count

**Sections**
*   Replies (chronological)
*   Sources (numbered)
*   Referenced by (posts that link/quote this post)

**Actions**
*   Like, Reply, Quote, Keep, Add, Share

**Overflow actions**
*   Report
*   Mute user
*   Block user
*   Copy link

---

## 5.10 Quote composer
*   Shows embedded referenced post excerpt with title
*   Text box above: "Add your commentary"
*   Publish (accent)
*   Cancel

**Rules:**
*   Must type at least 1 character

---

## 5.11 Reading mode (Article view)

**Layout**
*   Center column, larger type
*   Title (28px web / 24px mobile)
*   Author line + date
*   Body at 18px web / 17px mobile
*   Links are prominent and tappable
*   Bottom sections:
    *   Sources
    *   Referenced by
    *   Quoted by

---

## 5.12 Explore (transparent discovery)

**Top**
*   Search bar
*   Settings icon "Relevance"

**Tabs**
*   Topics
*   People
*   Quoted now
*   Deep dives
*   Newsroom

**Common controls**
*   Language filter pill: "My languages / All"
*   Sort pill: Recommended / Newest / Most cited

**"Why" label**
For recommended items show: "Why: Topic overlap + cited today"

---

## 5.13 Topic page (Wikipedia vibe)

**Header:**
*   Topic title
*   Follow topic button
*   Optional description block (future editable; now can be system-generated summary)
**Sections:**
*   Start here (most cited)
*   New
*   People (top authors)
*   Sources (frequent URLs)

Each post row shows quote count and excerpt.

---

## 5.14 Profile (public)

**Header:**
*   Avatar placeholder (circle) — minimal
*   Display name + handle
*   Bio
*   Verification badge (if any)
*   Buttons:
    *   Follow / Requested / Following
    *   Message (if allowed)
**Counts row:**
*   Followers
*   Following
*   Quotes received
**Tabs:**
*   Posts
*   Replies
*   Quotes
*   Collections

---

## 5.15 Collections (profile)

**Collections list**
*   Each item:
    *   title
    *   short description
    *   privacy icon
    *   count of items
    *   Create collection button (self only)

**Collection detail**
*   Header: title, description, public/private toggle (self only)
*   Toggle: "Share saves" (self only)
*   List of saved posts:
    *   original author + excerpt
    *   curator note (if any)
    *   remove button (self)
    *   Share button (public collections only)

---

## 5.16 Keeps library (self)
*   Search
*   Filters: All / Unsorted / In collections
*   Keep rows with quick "Add to collection" button

---

## 5.17 Inbox

**Tabs:**
*   Notifications
*   Messages

**Notification item UI**
*   Icon + text + timestamp
*   Tap opens destination
*   "Mark all read" (overflow)

**Messages**
*   Threads list
*   Compose message allowed only if rules allow (mutual follow or prior interaction)

---

## 5.18 Settings (must be clean and powerful)

**Sections:**
1.  Account: email, sign out
2.  Privacy: Open/Protected, follow approvals
3.  Notifications:
    *   Push on/off
    *   toggles per type
    *   quiet hours
4.  Feed:
    *   toggle "Show saves from people I follow"
5.  Explore relevance controls:
    *   toggles + sliders
    *   "Show why"
6.  Languages
7.  Safety: blocked/muted lists
8.  Data: export archive, delete account
9.  Legal: Terms, Privacy, Imprint

---

# 6) UI components inventory (for design system + dev)

Designers must deliver components with states (default/hover/pressed/disabled).

**Buttons**
*   Primary action text button (accent text)
*   Secondary text button (white/gray)
*   Outline pill button (follow)
*   Icon button (44px)

**Inputs**
*   Text field
*   Search field with clear button
*   Multi-select chips

**Post modules**
*   Author header row
*   Post body renderer (with link styling)
*   Action bar
*   Embedded quote card
*   Sources list component
*   Backlinks list component

**Sheets/modals**
*   Targets Sheet (multi-link)
*   Add to collection sheet
*   Link dialog
*   Report dialog

---

# 7) Brand and marketing screens (agency deliverables)

**Required:**
*   App icon in light/dark
*   Wordmark and icon usage guidelines
*   Landing page hero concept (dark editorial)
*   App Store screenshots: 6–8 frames focusing on:
    1.  Linked text like Wikipedia
    2.  Topics
    3.  Reading mode
    4.  Quotes as recognition
    5.  Collections
    6.  Transparent relevance controls

---

# 8) Non-negotiable "must feel amazing" details
1.  Link tapping is instant: single target opens immediately; multi-target uses sheet with previews.
2.  Editor feels supportive, not nerdy: toolbar does 90% of the work.
3.  Reading mode is gorgeous: type spacing and rhythm matter.
4.  Explore is transparent: "Why" labels, user controls.
5.  Collections make profiles valuable: curated identity, not just self-posts.

---

# 9) Deliverables checklist for the agency
1.  Logo system: wordmark + icon + usage rules
2.  Color + type system and tokens
3.  Mobile screens (iOS + Android) for all pages above
4.  Web screens (responsive) for all pages above
5.  Component library (Figma) with states
6.  Prototype flows:
    *   onboarding
    *   create post with topic link and sources
    *   quote a post
    *   follow topic and explore deep dive
    *   create collection and "saved by" event
7.  Copywriting kit:
    *   onboarding text
    *   empty states
    *   error states
8.  Accessibility pass: contrast + tap targets

⸻

PART 4 — DESIGN & AGENCY BRIEF

0. Agency brief and product introduction

Product in one sentence

Citewalk is a text-first social network where posts link like Wikipedia and credibility comes from being cited—not from public like counts.

Why it exists (the human problem)

Modern social feeds optimize for attention and comparison. Citewalk is for people who want:
	•	to write and think without "performing"
	•	to explore ideas through connected posts (Wikipedia-style deep dives)
	•	to build identity through what they write and what they curate
	•	to discover meaningful voices without getting trapped in algorithmic sludge

Audience (primary)
	1.	Millennials & Gen X exhausted by current social platforms
	2.	Writers, thinkers, creators who prefer text and context
	3.	Knowledge workers (tech, research, journalism, policy, design)
	4.	Curators who collect/organize reading and want to share "best of" lists
	5.	High-signal communities: urbanism, philosophy, startups, fitness science, arts, culture

Audience (secondary)
	•	Students and "Wikipedia deep divers"
	•	News followers who want context and sourcing

Brand personality
	•	Calm, literate, high-integrity, European sensibility
	•	No meme UI, no neon, no loud gamification
	•	Feels like: premium reading app + early web community + modern product polish

Core differentiator to reflect in design
	1.	Inline links inside text ([[topic]]) that feel as natural as Wikipedia
	2.	"Being quoted" is the prestige signal
	3.	Likes exist but are private (author-only)

⸻

1. Visual identity requirements

1.1 Logo system (must be distinct and simple)

Deliver 3 logo lockups:
	1.	Wordmark: "Citewalk" (primary)
	2.	Icon: a single-character mark suitable for app icon
	3.	Monogram: "C" or "Ci" (fallback)

Icon concepts (choose one direction)

A) Footnote mark: superscript "¹" inside a rounded square
B) Bracket mark: [] simplified into a single glyph
C) Node-link mark: one dot connected to two smaller dots (knowledge graph)

Constraints:
	•	Must work at 16px (favicon) and 1024px (marketing)
	•	Must work in 1 color (white on black)
	•	No gradients, no 3D, no thin hairlines that disappear

1.2 Color palette (two-color maximum, dark-first)

This app is intentionally restrained.

Core palette (fixed)
	•	Ink (background): #0B0B0C
	•	Paper (primary text): #F2F2F2

Supporting neutrals (not "colors", just grayscale)
	•	Text secondary: #A8A8AA
	•	Text tertiary: #6E6E73
	•	Divider / hairline: #1A1A1D
	•	Surface hover: #121215 (subtle)
	•	Surface pressed: #17171B

Single accent (choose one and lock it)

Pick ONE:
	•	Steel: #6E7A8A (recommended)
or
	•	Sage: #6F8A78

Use accent for:
	•	links
	•	active tab indicator
	•	primary action text (Publish, Follow)
	•	selection highlights

Never use accent as large fills. Mostly text + underline.

1.3 Typography (must feel editorial)

Primary typeface:
	•	Inter (UI) and Inter (body) for simplicity and performance
Optional "premium" variant:
	•	IBM Plex Sans for UI + Source Serif 4 for reading mode only
If you do serif in reading mode, keep UI sans to avoid confusion.

Font weights
	•	Regular 400
	•	Medium 500
	•	Semibold 600 (titles, key actions)

Type scale (mobile + web)

Mobile
	•	App title/section header: 22px / 28 line-height / 600
	•	Post title (from #): 20px / 28 / 600
	•	Body text: 17px / 26 / 400
	•	Metadata (handle, timestamp): 13px / 18 / 400
	•	Button label: 15px / 20 / 600
	•	Small helper text: 12px / 16 / 400

Web
	•	Page header: 26px / 34 / 600
	•	Post title: 22px / 32 / 600
	•	Body: 18px / 28 / 400
	•	Meta: 13px / 18 / 400

Link styling
	•	Link color = Accent
	•	Underline style = 1px solid accent, offset 2px
	•	On hover: increase underline opacity only (no color change)

1.4 Layout grid, margins, paddings

Mobile
	•	Base spacing unit: 8px
	•	Screen padding: 16px (left/right)
	•	Max content width: full width minus padding
	•	Tap targets: minimum 44x44px

Web
	•	Center column max width: 680px (reading)
	•	Outer gutters: 24–32px
	•	Left rail (nav): 240px fixed (desktop)
	•	Content column aligns to a baseline grid (8px increments)

Dividers
	•	1px hairline using divider color
	•	12px vertical spacing above and below dividers

⸻

2. Interaction and motion (must feel "crazily good")

Motion principles
	•	Subtle, fast, never playful
	•	Duration: 120–180ms
	•	Easing: standard ease-out
	•	Only animate opacity + translateY (2–6px)

Feedback
	•	Every tap changes state immediately (optimistic UI)
	•	Use subtle haptic (mobile) for:
	•	Like
	•	Keep
	•	Publish
	•	Follow

Accessibility
	•	Contrast meets WCAG AA (white on black does)
	•	Dynamic Type support on mobile
	•	All icons have labels (no unlabeled icon-only actions)

⸻

3. Copywriting voice and microcopy

Voice
	•	Calm, direct, intelligent
	•	Avoid slang and gamer language
	•	Avoid preachy "anti-algorithm manifesto"
	•	Emphasize curiosity, sourcing, exploration

Examples
	•	"Link ideas like Wikipedia."
	•	"Follow people. Explore topics."
	•	"Recognition comes from being cited."
	•	"Likes are private."

⸻

4. Core object definitions (for designers)

User profile
	•	Display name
	•	Handle `@handle`
	•	Bio
	•	Counts:
	•	Followers
	•	Following
	•	Quotes received
	•	Tabs:
	•	Posts
	•	Replies
	•	Quotes
	•	Collections

Post
	•	Author + timestamp
	•	Body text
	•	Optional # Title at top (rendered as title)
	•	Optional header photo (one only)
	•	Actions:
	•	Like (private)
	•	Reply
	•	Quote
	•	Keep
	•	Add to Collection
	•	Share
	•	Sections:
	•	Sources (auto)
	•	Referenced by (backlinks)
	•	Replies

Topic
	•	Title (slug)
	•	Follow topic
	•	Sections: Start here, New, People, Sources

Collection
	•	Curated list of posts with optional curator notes
	•	Public or private
	•	Optional "share saves" toggle that produces timeline save-events

⸻

5. Page-by-page UX specification (each page, each button, each feature)

I'm specifying:
	•	layout
	•	components
	•	button set
	•	states
	•	microcopy
	•	edge cases

5.1 Welcome / Splash

Layout
	•	Centered icon mark (64px)
	•	Wordmark below (28px)
	•	Tagline (secondary text): "Social posts, linked like Wikipedia."
	•	Primary button (text button with accent): "Continue"
	•	Footer: "Privacy" "Terms" "Imprint" (small text)

Buttons
	•	Continue (accent text)
	•	Privacy/Terms/Imprint (secondary)

States
	•	None

⸻

5.2 Sign-in (Magic link)

Layout
	•	Header: "Sign in"
	•	Input: Email (full-width)
	•	Primary button: "Send magic link"
	•	Secondary line: "No password. We'll email you a link."

Buttons
	•	Send magic link (accent)
	•	Resend (only on success screen)
	•	Change email (link)

Error states
	•	invalid email
	•	rate limited (show: "Try again in a few minutes.")

⸻

5.3 Onboarding: Profile

Layout
	•	Header: "Create your profile"
	•	Fields:
	•	Display name
	•	Handle (with availability indicator)
	•	Bio
	•	Privacy selector:
	•	Open (default)
	•	Protected (requires follow approval)
	•	CTA: "Continue"

Buttons
	•	Continue
	•	Back (top-left)

Copy
	•	Under privacy: "Protected accounts approve followers."

⸻

5.4 Onboarding: Languages

Layout
	•	Header: "Languages you read"
	•	Search input + selectable chips
	•	Helper: "This shapes Explore and recommendations."
	•	CTA: Continue

Buttons
	•	Continue
	•	Skip (top-right)

⸻

5.5 Onboarding: Starter packs

Layout
	•	Header: "Follow a few voices"
	•	4 categories, each with 6–10 suggested accounts
	•	Each account row:
	•	avatar circle (monochrome placeholder allowed)
	•	name + handle
	•	1-line bio
	•	Follow button (accent outline)

Buttons
	•	Follow/Following toggle
	•	Finish
	•	Skip

⸻

5.6 Home (Timeline)

Top bar
	•	Left: small icon mark
	•	Center: "Home"
	•	Right: Search icon, Overflow icon

Feed item types
A) Post item
B) Saved-by event item (optional, if enabled)

A) Post item layout (no card)
	•	Row 1: Name (semibold) • `@handle` (secondary) • time (tertiary)
	•	Row 2: (optional) Title derived from # (20px, 600)
	•	Row 3: Body preview (max 10 lines) then "Read more"
	•	Row 4: Header image (if present): 16:9 crop, rounded 12px, edge-to-edge within padding
	•	Row 5: Action row (icons + labels):
	•	Like
	•	Reply (count)
	•	Quote (count)
	•	Keep
	•	Add
	•	Share
	•	Divider below

Like rule
	•	No public counts anywhere.
	•	On the author's own post, show a small meta line: "Liked by 24 people" (secondary).

Buttons
	•	Like (toggle)
	•	Reply (opens post detail with keyboard focus)
	•	Quote (opens quote composer)
	•	Keep (toggle)
	•	Add to collection (opens bottom sheet)
	•	Share (system share or copy link)

B) Saved-by event item layout
	•	One line: "Saved by `@alex` to Urbanism"
	•	Small excerpt of the post (3 lines)
	•	Buttons:
	•	"Open" (accent)
	•	Overflow: "Hide saves from `@alex`" / "Turn off saves"

Empty state
	•	Headline: "Your timeline is quiet."
	•	Buttons:
	•	"Explore topics"
	•	"Find people"

⸻

5.7 Search (global)

Layout
	•	Search input top
	•	Tabs: People, Topics, Posts
	•	Results list minimalist

Buttons
	•	Follow for people
	•	Open for topics/posts

⸻

5.8 Compose (Editor) — flagship UX

Top bar
	•	Cancel (left)
	•	Draft status (center: "New post")
	•	Publish (right, accent)

Editor area
	•	First line title behavior:
	•	If user taps "Title" button: inserts #  at top and cursor after space.
	•	If user starts with # : render as title automatically.

Toolbar (sticky above keyboard on mobile)
	•	Title
	•	Bold
	•	Italic
	•	Quote
	•	Bullets
	•	Numbered
	•	Link
	•	Topic
	•	Post link
	•	Mention
	•	Header photo
	•	Visibility pill (Followers/Public)
	•	Preview

Dialogs
	•	Link dialog:
	•	Display text
	•	Choose target: Topic / Post / URL
	•	If Topic: search topics + create new
	•	If Post: search posts
	•	If URL: paste URL + optional fetch title

Inline suggestions
	•	typing [[ opens dropdown: Topics + Posts + "Create topic"
	•	typing @ opens people list

Publish checks
	•	If header photo attached: show compression progress microcopy: "Optimizing image…"
	•	If external links exist: sources list will appear automatically (no user action).

⸻

5.9 Post detail (Thread view)

Header
	•	Back
	•	Author row
	•	Overflow menu

Body
	•	Full text, inline links active
	•	Header photo full width (within padding) with rounded 16px
	•	Meta row:
	•	Replies count
	•	Quotes count
	•	(Author-only) Likes count

Sections
	•	Replies (chronological)
	•	Sources (numbered)
	•	Referenced by (posts that link/quote this post)

Actions
	•	Like, Reply, Quote, Keep, Add, Share

Overflow actions
	•	Report
	•	Mute user
	•	Block user
	•	Copy link

⸻

5.10 Quote composer
	•	Shows embedded referenced post excerpt with title
	•	Text box above: "Add your commentary"
	•	Publish (accent)
	•	Cancel

Rules:
	•	Must type at least 1 character

⸻

5.11 Reading mode (Article view)

Layout
	•	Center column, larger type
	•	Title (28px web / 24px mobile)
	•	Author line + date
	•	Body at 18px web / 17px mobile
	•	Links are prominent and tappable
	•	Bottom sections:
	•	Sources
	•	Referenced by
	•	Quoted by

⸻

5.12 Explore (transparent discovery)

Top
	•	Search bar
	•	Settings icon "Relevance"

Tabs
	•	Topics
	•	People
	•	Quoted now
	•	Deep dives
	•	Newsroom

Common controls
	•	Language filter pill: "My languages / All"
	•	Sort pill: Recommended / Newest / Most cited

"Why" label
For recommended items show: "Why: Topic overlap + cited today"

⸻

5.13 Topic page (Wikipedia vibe)

Header:
	•	Topic title
	•	Follow topic button
	•	Optional description block (future editable; now can be system-generated summary)
Sections:
	•	Start here (most cited)
	•	New
	•	People (top authors)
	•	Sources (frequent URLs)

Each post row shows quote count and excerpt.

⸻

5.14 Profile (public)

Header:
	•	Avatar placeholder (circle) — minimal
	•	Display name + handle
	•	Bio
	•	Verification badge (if any)
	•	Buttons:
	•	Follow / Requested / Following
	•	Message (if allowed)
Counts row:
	•	Followers
	•	Following
	•	Quotes received
Tabs:
	•	Posts
	•	Replies
	•	Quotes
	•	Collections

⸻

5.15 Collections (profile)

Collections list
	•	Each item:
	•	title
	•	short description
	•	privacy icon
	•	count of items
	•	Create collection button (self only)

Collection detail
	•	Header: title, description, public/private toggle (self only)
	•	Toggle: "Share saves" (self only)
	•	List of saved posts:
	•	original author + excerpt
	•	curator note (if any)
	•	remove button (self)
	•	Share button (public collections only)

⸻

5.16 Keeps library (self)
	•	Search
	•	Filters: All / Unsorted / In collections
	•	Keep rows with quick "Add to collection" button

⸻

5.17 Inbox

Tabs:
	•	Notifications
	•	Messages

Notification item UI
	•	Icon + text + timestamp
	•	Tap opens destination
	•	"Mark all read" (overflow)

Messages
	•	Threads list
	•	Compose message allowed only if rules allow (mutual follow or prior interaction)

⸻

5.18 Settings (must be clean and powerful)

Sections:
	1.	Account: email, sign out
	2.	Privacy: Open/Protected, follow approvals
	3.	Notifications:
	•	Push on/off
	•	toggles per type
	•	quiet hours
	4.	Feed:
	•	toggle "Show saves from people I follow"
	5.	Explore relevance controls:
	•	toggles + sliders
	•	"Show why"
	6.	Languages
	7.	Safety: blocked/muted lists
	8.	Data: export archive, delete account
	9.	Legal: Terms, Privacy, Imprint

⸻

6. UI components inventory (for design system + dev)

Designers must deliver components with states (default/hover/pressed/disabled).

Buttons
	•	Primary action text button (accent text)
	•	Secondary text button (white/gray)
	•	Outline pill button (follow)
	•	Icon button (44px)

Inputs
	•	Text field
	•	Search field with clear button
	•	Multi-select chips

Post modules
	•	Author header row
	•	Post body renderer (with link styling)
	•	Action bar
	•	Embedded quote card
	•	Sources list component
	•	Backlinks list component

Sheets/modals
	•	Targets Sheet (multi-link)
	•	Add to collection sheet
	•	Link dialog
	•	Report dialog

⸻

7. Brand and marketing screens (agency deliverables)

Required:
	•	App icon in light/dark
	•	Wordmark and icon usage guidelines
	•	Landing page hero concept (dark editorial)
	•	App Store screenshots: 6–8 frames focusing on:
	1.	Linked text like Wikipedia
	2.	Topics
	3.	Reading mode
	4.	Quotes as recognition
	5.	Collections
	6.	Transparent relevance controls

⸻

8. Non-negotiable "must feel amazing" details
	1.	Link tapping is instant: single target opens immediately; multi-target uses sheet with previews.
	2.	Editor feels supportive, not nerdy: toolbar does 90% of the work.
	3.	Reading mode is gorgeous: type spacing and rhythm matter.
	4.	Explore is transparent: "Why" labels, user controls.
	5.	Collections make profiles valuable: curated identity, not just self-posts.

⸻

9. Deliverables checklist for the agency
	1.	Logo system: wordmark + icon + usage rules
	2.	Color + type system and tokens
	3.	Mobile screens (iOS + Android) for all pages above
	4.	Web screens (responsive) for all pages above
	5.	Component library (Figma) with states
	6.	Prototype flows:
	•	onboarding
	•	create post with topic link and sources
	•	quote a post
	•	follow topic and explore deep dive
	•	create collection and "saved by" event
	7.	Copywriting kit:
	•	onboarding text
	•	empty states
	•	error states
	8.	Accessibility pass: contrast + tap targets
