# Bookrithm — Frontend Agent Context

## Project Vision

Bookrithm is a **book tracking and discovery platform** built for readers who care about precision — not just stars-out-of-five. Its core differentiator is:

1. **Weighted category tagging** — a book is not just "Romance". It is Dark Romance (62), Tragedy (24), Horror (14). Users and AI both vote on how much of each category a book represents. This replaces genre checkboxes with a weighted breakdown that reflects a book's actual content.
2. **Multi-dimensional reviews** — instead of a single 1-5 star rating, users score a book across: Overall, Grammar, Storytelling, Worldbuilding, Characters, and Pacing — all 0–10 and all optional. Readers can choose which dimensions matter to them.
3. **Curated taxonomy** — Categories, tropes, and content warnings are not arbitrary tags. They are user-submitted, AI-vetted, and admin-approved before appearing on the platform. This keeps the taxonomy professional and meaningful.

The platform is for serious readers: people who want to find books by their actual content fingerprint, not by broad genre buckets.

---

## Tech Stack (Backend)

| Component | Detail |
|---|---|
| Language | Java 25 |
| Framework | Spring Boot 4 |
| Database | PostgreSQL 18 |
| Auth | Google OAuth2 — JWT resource server only (never issues tokens) |
| API Style | REST, JSON |
| API Base URL (local) | `http://localhost:8080/api/v1` |

---

## Authentication

The API is a **JWT resource server**. It validates Google ID tokens — it does not issue its own tokens.

**Frontend flow:**
1. User clicks "Sign in with Google"
2. Frontend receives a Google ID token (JWT) from Google Sign-In SDK
3. Frontend sends `Authorization: Bearer <google_id_token>` on every protected request
4. On first login: call `POST /users/me` to create the user profile
5. On subsequent logins: call `GET /users/me` to check if profile exists; if `404`, redirect to registration

**Public endpoints (no token required):**
- `GET /books`
- `GET /books/{id}`
- `GET /books/{id}/categories`
- `GET /categories`
- `GET /categories/{id}`
- `GET /books/{bookId}/reviews`

**All other endpoints require** `Authorization: Bearer <token>`.

---

## API Reference

All responses follow a consistent error shape on failure:

```json
{
  "status": 404,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Book not found.",
  "path": "/bookrithm/v1/books/abc",
  "timestamp": "2026-05-09T23:00:00Z"
}
```

Error codes: `RESOURCE_NOT_FOUND`, `RESOURCE_ALREADY_EXISTS`, `FORBIDDEN`, `VALIDATION_FAILED`, `MALFORMED_REQUEST`, `EXTERNAL_SERVICE_UNAVAILABLE`, `INTERNAL_SERVER_ERROR`

---

### Books

#### `GET /books` — Search and list books

Public. Query params:

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | — | Search query. minLength=2, maxLength=200. If absent, browses all books |
| `page` | integer | 0 | Minimum 0 |
| `size` | integer | 20 | 1–100 |
| `sortBy` | `BookSortBy` | `READS` | Sort: `READS` (most read) or `SHELVED` (most shelved). Ignored when `q` is present |

Response `200`:
```json
{
  "content": [ BookResponse ],
  "page": { "page": 0, "size": 20, "totalElements": 42, "totalPages": 3 }
}
```

**Search behaviour:** if books are found in the local DB, they are returned immediately. On a DB miss, Google Books is queried, results are saved to the DB, and then returned. The DB is a write-through cache.

---

#### `GET /books/{id}` — Get a book by ID

Public. Path: `id` (UUID).

Response `200`: `BookResponse`
Response `404`: not found

---

#### `GET /books/{id}/categories` — Get weighted categories for a book

Public. Path: `id` (UUID).

Response `200`: array of `CategoryWeightResponse`
Response `404`: book not found

Note: category weight data is not yet populated (returns empty array). This will be driven by user votes and AI.

---

### Reviews

#### `GET /books/{bookId}/reviews` — List reviews for a book

Public. Query: `page` (default 0), `size` (default 20).

Response `200`:
```json
{
  "content": [ ReviewResponse ],
  "page": { ... }
}
```

---

#### `POST /books/{bookId}/reviews` — Create a review

Auth required. All review dimensions are optional — a user may leave only a text review with no scores, or score some dimensions and skip others.

Request body:
```json
{
  "overall": 8,
  "grammar": 7,
  "storytelling": 9,
  "worldbuilding": null,
  "characters": 8,
  "pacing": 6,
  "reviewText": "Gripping from start to finish."
}
```

Response `201`: `ReviewResponse`
Response `409`: user already reviewed this book

---

#### `PUT /books/{bookId}/reviews/{reviewId}` — Update a review

Auth required. Only the review owner may update. Partial update — only provided fields are changed.

Response `200`: updated `ReviewResponse`
Response `403`: not the owner
Response `404`: review or book not found

---

#### `DELETE /books/{bookId}/reviews/{reviewId}` — Delete a review

Auth required. Only the review owner may delete.

Response `204`: no content
Response `403`: not the owner
Response `404`: review or book not found

---

### Categories

#### `GET /categories` — List categories

Public. Query: `parentId` (UUID, optional), `page` (default 0), `size` (default 20).

Only returns `APPROVED` categories. If `parentId` is supplied, returns children of that category (sub-genres). If absent, returns top-level categories.

Response `200`:
```json
{
  "content": [ CategoryResponse ],
  "page": { ... }
}
```

---

#### `GET /categories/{id}` — Get a category by ID

Public.

Response `200`: `CategoryResponse`
Response `404`: not found

---

### Users

#### `POST /users/me` — Register on first login

Auth required. Called once when a user authenticates for the first time.

Request body:
```json
{
  "username": "jsmith",
  "displayName": "Joshua",
  "email": "user@gmail.com"
}
```

- `username`: 3–40 chars, alphanumeric + underscores only (`^[a-zA-Z0-9_]+$`)
- `displayName`: 1–80 chars
- `email`: valid email, max 254 chars

Response `201`: `UserResponse`
Response `409`: user already registered

On success, **three system shelves are automatically created**: "Want to Read", "Currently Reading", "Read".

---

#### `GET /users/me` — Get current user profile

Auth required.

Response `200`: `UserResponse`
Response `404` (implicit, via `ResourceNotFoundException`): profile not yet created — redirect to registration

---

#### `PATCH /users/me` — Update current user profile

Auth required. All fields are optional — only supplied fields are changed.

Request body mirrors `UpdateUserRequest`. Patchable fields: `username`, `displayName`, `firstName`, `lastName`, `location`, `bio`, `avatarUrl`, `websiteUrl`, `goodreadsUrl`, `storyGraphUrl`, `instagramUrl`, `twitterUrl`, `readerStatus`, `isPrivate`, `allowAnonymousPublicReviews`, `allowPublicCredibilityStats`.

Response `200`: updated `UserResponse`

---

### Shelves

#### `GET /users/me/shelves` — List current user's shelves

Auth required. Returns all shelves including system shelves (in order: Want to Read, Currently Reading, Read, Did Not Finish, Could Not Finish) and any user-created shelves.

Response `200`: array of `ShelfResponse`

---

#### `POST /users/me/shelves` — Create a shelf

Auth required.

Request body: `CreateShelfRequest` (`name`, optional `isPrivate`)

Response `201`: `ShelfResponse`

---

#### `PATCH /users/me/shelves/{shelfId}` — Update a shelf

Auth required. Cannot update system shelves.

Request body: `UpdateShelfRequest` (`name`, `isPrivate` — both optional)

Response `200`: `ShelfResponse`
Response `403`: system shelf or not owner

---

#### `DELETE /users/me/shelves/{shelfId}` — Delete a shelf

Auth required. Cannot delete system shelves.

Response `204`: no content
Response `403`: system shelf or not owner

---

#### `GET /users/me/shelves/{shelfId}/books` — List books on a shelf

Auth required. Query: `page` (default 0), `size` (default 20).

Response `200`:
```json
{
  "content": [ UserBookStateResponse ],
  "page": { ... }
}
```

---

#### `PUT /users/me/books/{bookId}/state` — Add or move a book to a shelf

Auth required. A book can only be on one shelf at a time per user — this operation moves it if already shelved.

Request body:
```json
{ "shelfId": "uuid-of-target-shelf" }
```

Response `200`: `UserBookStateResponse`
Response `404`: book or shelf not found

---

#### `DELETE /users/me/books/{bookId}/state` — Remove a book from all shelves

Auth required.

Response `204`: no content
Response `404`: book not on any shelf

---

#### `POST /users/me/books/{bookId}/read-log` — Mark a book as read (log a read)

Auth required. Increments `readCount` on the user's book state and appends a `ReadLogEntry`.

Response `201`: `ReadLogEntry`
Response `404`: book not found

---

#### `GET /users/me/read-log` — Get the user's reading log

Auth required. Query: `page` (default 0), `size` (default 20). Newest first.

Response `200`: `ReadLogPage` (`content: ReadLogEntry[]` + page meta)

---

#### `GET /users/me/stats` — Get the user's reading statistics

Auth required.

Response `200`: `UserReadStats`

---

### Suggestions

#### `GET /suggestions` — List the current user's submissions

Auth required. Query: `page` (default 0), `size` (default 20).

Response `200`: `SuggestionPage`

---

#### `POST /suggestions` — Submit a suggestion

Auth required. Users can suggest new Categories, Tropes, or Content Warnings. Suggestions are queued for AI vetting and then admin review.

Request body:
```json
{
  "type": "CATEGORY",
  "bookId": null,
  "payload": { "name": "Dark Academia", "description": "Optional" }
}
```

- `type`: `CATEGORY`, `TROPE`, or `CONTENT_WARNING`
- `bookId`: optional, links suggestion to a specific book
- `payload`: free JSON object; the `name` field within it is used for dedup checking

Response `202`: `SuggestionResponse` with `status: PENDING`

---

### Admin

Requires `trustLevel` of `MODERATOR` or `ADMIN`. Returns `403` for lower trust levels.

#### `GET /admin/suggestions` — List suggestions queue

Query: `status` (`PENDING`, `APPROVED`, `REJECTED`), `type` (`CATEGORY`, `TROPE`, `CONTENT_WARNING`), `page`, `size`.

Response `200`: `SuggestionPage`

---

#### `PUT /admin/suggestions/{id}/decision` — Approve or reject a suggestion

Request body:
```json
{
  "approved": true,
  "reason": "Legitimate sub-genre with established usage."
}
```

Response `200`: updated `SuggestionResponse`

---

## Data Models

### `BookResponse`
```typescript
{
  id: string            // UUID
  source: "GOOGLE_BOOKS"
  title: string
  author: string
  description?: string
  coverUrl?: string
  isFanfiction: boolean
  maturity: "UNKNOWN" | "EVERYONE" | "TEEN" | "MATURE"
  isbn10?: string
  isbn13?: string
}
```

### `CategoryResponse`
```typescript
{
  id: string
  name: string
  parentId?: string     // null for top-level categories
  maturity: MaturityRating
}
```

### `CategoryWeightResponse`
```typescript
{
  category: CategoryResponse
  weight: number        // 0–100; represents what % of the book belongs to this category
  computedAt: string    // ISO date-time
}
```

### `ReviewResponse`
```typescript
{
  id: string
  userId: string | null  // null when isAnonymous=true
  bookId: string
  overall?: number      // 0–10
  grammar?: number
  storytelling?: number
  worldbuilding?: number
  characters?: number
  pacing?: number
  reviewText?: string
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
}
```

### `UserResponse`
```typescript
{
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  readerStatus?: "READING" | "COZY_READING" | "BETWEEN_BOOKS" | "SEARCHING" | "REREADING" | "ON_HIATUS" | "BUSY"
  isPrivate: boolean
  firstName?: string    // only visible when isPrivate=false or viewer is the owner
  lastName?: string
  location?: string
  websiteUrl?: string
  goodreadsUrl?: string
  storyGraphUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  allowAnonymousPublicReviews: boolean
  allowPublicCredibilityStats: boolean
  trustLevel: "NORMAL" | "TRUSTED" | "MODERATOR" | "ADMIN"
  createdAt: string
}
```

### `ShelfResponse`
```typescript
{
  id: string
  name: string
  isSystem: boolean     // system shelves cannot be deleted or renamed
  isPrivate: boolean    // hidden from other users
  maxItems?: number
  bookCount: number
}
```

### `UserBookStateResponse`
```typescript
{
  bookId: string
  bookTitle?: string
  shelfId: string
  shelfName: string
  position: number
  addedAt: string
  readCount: number     // how many times the user has marked this book as read
}
```

### `CreateShelfRequest`
```typescript
{ name: string; isPrivate?: boolean }
```

### `UpdateShelfRequest`
```typescript
{ name?: string; isPrivate?: boolean }
```

### `ReadLogEntry`
```typescript
{
  id: string
  bookId: string
  bookTitle?: string
  completedAt: string   // ISO date-time
}
```

### `UserReadStats` (exported as `ReadStats` in `types/api.ts`)
```typescript
{
  totalReads: number
  uniqueBooksRead: number
  topCategories: CategoryReadCount[]
}
```

### `CategoryReadCount`
```typescript
{
  category: CategoryResponse
  readCount: number
}
```

### `SuggestionResponse`
```typescript
{
  id: string
  type: "CATEGORY" | "TROPE" | "CONTENT_WARNING"
  status: "PENDING" | "APPROVED" | "REJECTED"
  payload: Record<string, unknown>
  aiConfidence?: number   // 0–100; AI certainty score
  aiReason?: string
  createdAt: string
  decidedAt?: string
}
```

### `PageMeta`
```typescript
{
  page: number
  size: number
  totalElements: number
  totalPages: number
}
```

---

## UI Flows

### First Login
1. Google Sign-In button on landing page
2. Receive Google token
3. Call `GET /users/me` — if `404`, navigate to **Registration page**
4. Registration page: username + displayName fields (email pre-filled from Google JWT)
5. `POST /users/me` → success → navigate to home
6. System shelves are created server-side automatically

### Book Discovery
1. Landing/search page: search bar + browse grid
2. `GET /books?q=...` or `GET /books` (browse)
3. Filter controls: maturity, source (more filters will come)
4. Book detail page: cover, metadata, category weight bars, review list
5. "Add to Shelf" button: opens shelf picker → `PUT /users/me/books/{id}/state`

### Reading Shelf
1. Profile/library page: shelf list from `GET /users/me/shelves`
2. Click shelf → paginated book list from `GET /users/me/shelves/{id}/books`
3. Move book: shelf picker dropdown → `PUT /users/me/books/{id}/state`
4. Remove: `DELETE /users/me/books/{id}/state`

### Writing a Review
1. On book detail page: "Write a Review" (if authenticated and not reviewed yet)
2. Slider/input for each dimension (all optional)
3. Text area for review body
4. `POST /books/{id}/reviews`

### Suggesting a Category
1. Logged-in users see "Suggest a category / trope / content warning" 
2. Form: type selector + payload (name + optional description)
3. `POST /suggestions` → response `202` → show "Your suggestion is pending AI review"

### Admin Panel
1. Only visible to users with `trustLevel: MODERATOR` or `ADMIN`
2. Filterable suggestion queue from `GET /admin/suggestions`
3. Each suggestion card shows AI confidence + AI reason
4. Approve/reject with optional reason

---

## Implementation Status

### Backend — Complete
- All endpoints listed above are implemented and tested
- AI vetting pipeline (OpenAI GPT-4o-mini) is live; stub mode available for local dev
- Google OAuth2 JWT validation

### Not Yet Implemented (Future)
- Category weight voting (`book_category_votes`) — the schema is in the DB but the API surface is not yet exposed
- User profile photos (avatar upload)
- Social features (following, activity feeds)
- Series tracking
- Reading stats and challenges

---

## Local Development Notes

- API runs on `http://localhost:8080/bookrithm/v1`
- PostgreSQL on `localhost:5432`, database `bookrithm`, user `postgres`, no password
- Start with `SPRING_PROFILES_ACTIVE=local`
- CORS: configure the frontend origin in `SecurityConfig` or proxy via the dev server

---

## Conventions the Frontend Should Follow

- UUIDs are used for all entity IDs — treat them as opaque strings
- All timestamps are ISO 8601 with timezone (`date-time` format)
- Pagination is zero-indexed (`page: 0` is the first page)
- `isPrivate: true` on a `UserResponse` means `firstName`, `lastName`, `location` should not be displayed unless the viewer is the profile owner
- A book with `weight` breakdown from `/books/{id}/categories` should display as a bar chart or tag cloud with percentages — this is the signature visual of the platform
- `aiConfidence` on suggestions is a 0–100 integer — display as a percentage badge next to `PENDING`/`APPROVED`/`REJECTED` status

