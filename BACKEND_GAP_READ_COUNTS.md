# Backend Gap — Read Counts & Category Stats

**Feature:** Customer Feedback #1 — Read counts + reading stats by category  
**Frontend status:** ✅ Complete (spec updated, types regenerated, UI implemented)  
**Backend status:** ❌ Not yet implemented

---

## What the frontend expects

### New field on `UserBookStateResponse`
```json
{
  "bookId": "uuid",
  "bookTitle": "string",
  "shelfId": "uuid",
  "shelfName": "string",
  "position": 0,
  "addedAt": "2024-01-01T00:00:00Z",
  "readCount": 2   // ← NEW — how many times the user has marked this book as read
}
```

---

## New endpoints

### `POST /api/v1/users/me/books/{bookId}/read-log`
Record that the authenticated user finished reading a book.

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "bookId": "uuid",
  "bookTitle": "string | null",
  "completedAt": "2024-01-01T00:00:00Z"
}
```

**Error cases:**
- `404` — book not found
- `401` — unauthenticated

> Each call appends a new entry — one book can have multiple entries (re-reads allowed). The frontend uses the count to show "Read 3×".

---

### `GET /api/v1/users/me/read-log`
Paginated list of the user's read-log entries, newest first.

**Query params:** `page` (0-based, default 0), `size` (default 20)

**Response:** `200 OK` — paginated `ReadLogEntry` array:
```json
{
  "content": [
    { "id": "uuid", "bookId": "uuid", "bookTitle": "string", "completedAt": "..." }
  ],
  "page": { "number": 0, "size": 20, "totalElements": 5, "totalPages": 1 }
}
```

---

### `GET /api/v1/users/me/stats`
Aggregated reading statistics for the authenticated user.

**Response:** `200 OK`
```json
{
  "totalReads": 12,
  "uniqueBooksRead": 9,
  "topCategories": [
    {
      "category": { "id": "uuid", "name": "Fiction" },
      "readCount": 5
    }
  ]
}
```

- `totalReads` — total number of `ReadLogEntry` rows for this user
- `uniqueBooksRead` — `COUNT(DISTINCT book_id)` across all log entries
- `topCategories` — top N categories (suggest N=10) ranked by how many of the user's read books belong to each category, via the `book_categories` join table

---

## Database changes

### New table: `read_log`

```sql
CREATE TABLE read_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id      UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_read_log_user_id ON read_log(user_id);
CREATE INDEX idx_read_log_book_id ON read_log(book_id);
```

### `readCount` on `UserBookStateResponse`
This is a **derived value** — compute it with:

```sql
SELECT COUNT(*) FROM read_log
WHERE user_id = :userId AND book_id = :bookId
```

Or join it into the existing shelf-books query as a subselect / LEFT JOIN to avoid N+1.

**Recommended approach (avoid N+1):**
```sql
SELECT ubs.*, COALESCE(rl.read_count, 0) AS read_count
FROM user_book_states ubs
LEFT JOIN (
  SELECT book_id, COUNT(*) AS read_count
  FROM read_log
  WHERE user_id = :userId
  GROUP BY book_id
) rl ON rl.book_id = ubs.book_id
WHERE ubs.user_id = :userId
  AND ubs.shelf_id = :shelfId
ORDER BY ubs.position
```

---

## Stats query

```sql
-- totalReads
SELECT COUNT(*) FROM read_log WHERE user_id = :userId;

-- uniqueBooksRead
SELECT COUNT(DISTINCT book_id) FROM read_log WHERE user_id = :userId;

-- topCategories
SELECT c.id, c.name, COUNT(*) AS read_count
FROM read_log rl
JOIN book_categories bc ON bc.book_id = rl.book_id
JOIN categories c ON c.id = bc.category_id
WHERE rl.user_id = :userId
GROUP BY c.id, c.name
ORDER BY read_count DESC
LIMIT 10;
```

---

## Business rules

1. **Re-reads are allowed** — each `POST /read-log` call appends a new row. There is no deduplication. This is intentional: if a user reads a book three times, `readCount` should show 3.
2. **No delete endpoint needed** — the frontend does not expose a way to remove read-log entries. (Can be added later if requested.)
3. **`readCount: 0` vs omitted** — the field is optional in the spec (`minimum: 0`). When the count is zero the frontend simply omits the "Read N×" badge, so returning `0` or omitting the field are both fine. Returning `0` is preferable for consistency.

---

## Security checklist

- [ ] All `/users/me/*` endpoints require a valid JWT — return `401` if missing/invalid
- [ ] `read_log` rows are scoped to `user_id` — never expose another user's log
- [ ] The `/stats` endpoint only returns data for the authenticated user

---

## Frontend behaviour (already live)

- **Shelf detail page** (`/shelves/[id]`): Each book card shows a "Mark read" button. On click, calls `POST /users/me/books/{bookId}/read-log` and increments the local `readCount` optimistically. A "Read N×" badge appears when `readCount > 0`.
- **Profile page** (`/profile`): Fetches `GET /users/me/stats` on load and displays:
  - Total reads count
  - Unique books count
  - Top categories as pill badges (`Fiction · 5×`)
