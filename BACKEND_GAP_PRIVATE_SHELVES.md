# Backend Gap — Private Shelves

**Feature:** Customer Feedback #3 — Private shelves  
**Frontend status:** ✅ Complete (spec updated, types regenerated, UI implemented)  
**Backend status:** ❌ Not yet implemented

---

## What the frontend expects

### New field on `ShelfResponse`
```json
{
  "id": "uuid",
  "name": "string",
  "bookCount": 0,
  "isSystem": false,
  "isPrivate": false   // ← NEW — defaults to false
}
```

### New endpoints

#### `POST /api/v1/users/me/shelves`
Create a custom shelf for the authenticated user.

**Request body:**
```json
{ "name": "string (1–80 chars, required)" }
```

**Response:** `201 Created` → `ShelfResponse` (new shelf, `isPrivate: false`, `isSystem: false`, `bookCount: 0`)

**Error cases:**
- `400` — name blank or > 80 chars
- `401` — unauthenticated

---

#### `PATCH /api/v1/users/me/shelves/{shelfId}`
Rename a custom shelf and/or toggle its privacy.

**Request body (all fields optional):**
```json
{
  "name": "string (1–80 chars, nullable)",
  "isPrivate": true
}
```

**Response:** `200 OK` → updated `ShelfResponse`

**Error cases:**
- `400` — name provided but blank or > 80 chars
- `403` — shelf belongs to another user, or `isSystem: true` (system shelves cannot be renamed or made private)
- `404` — shelf not found

---

#### `DELETE /api/v1/users/me/shelves/{shelfId}`
Delete a custom shelf and all its book-state entries.

**Response:** `204 No Content`

**Error cases:**
- `403` — shelf belongs to another user, or `isSystem: true`
- `404` — shelf not found

---

## Database changes

### `shelves` table
Add one column:

```sql
ALTER TABLE shelves
  ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT FALSE;
```

No migration is needed for existing rows — they all default to `false` (public).

---

## Privacy enforcement rules

| Scenario | Behaviour |
|----------|-----------|
| Owner reads their own private shelf | ✅ Return full data |
| Other authenticated user reads a private shelf | `403 Forbidden` |
| Unauthenticated user reads a private shelf | `403 Forbidden` |
| Admin reads any shelf | ✅ Return full data (or enforce same rules — your call) |

Applies to:
- `GET /api/v1/users/{userId}/shelves` — omit private shelves from the list (or 403 per shelf — omitting is cleaner)
- `GET /api/v1/users/{userId}/shelves/{shelfId}` — 403 if private and not owner
- Any endpoint that exposes a shelf object should respect the privacy flag

---

## Business rules

1. **System shelves are immutable** — `POST /users/me/shelves` creates a shelf with `isSystem: false`. System shelves (`Want to Read`, `Currently Reading`, `Read`) cannot be renamed, made private, or deleted.  
2. **No duplicate names** — Optionally enforce unique shelf names per user (return `409` if name already taken).  
3. **Cascade delete** — When a shelf is deleted, all `UserBookState` rows referencing that shelf must also be deleted (`ON DELETE CASCADE` on the FK, or explicit delete in the service layer).

---

## Security checklist

- [ ] Ownership check on PATCH/DELETE — verify `shelf.userId == authenticatedUserId` before modifying
- [ ] `isSystem` guard on PATCH/DELETE — return `403` (not `400`) so the frontend can display "can't edit this shelf"
- [ ] Privacy check on GET — checked at the repository/service layer, not just controller
- [ ] Input sanitisation — `name` field: strip leading/trailing whitespace, enforce 1–80 chars

---

## Frontend behaviour (already live)

- **Shelf list page** (`/shelves`): Shows a lock icon next to private shelves. Has a "+ New Shelf" button that opens an inline create form.
- **Shelf detail page** (`/shelves/[id]`): For non-system shelves, shows a privacy toggle ("Private" / "Public") and a "Delete shelf" button in the header.
- On successful delete, the frontend redirects to `/shelves`.
- Privacy toggle calls `PATCH` with `{ isPrivate: !current }` and updates state optimistically.
