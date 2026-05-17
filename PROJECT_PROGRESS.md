# Bookrithm Frontend — Project Progress

**Last Updated**: May 16, 2026  
**Status**: ✅ Full Feature Set + Styling Complete — Admin Panel Remaining

---

## Project Overview

Building the frontend web application for **Bookrithm**, a book tracking and discovery platform with multi-dimensional reviews and weighted category tagging.

**Tech Stack**:
- Next.js 16.2.6 (App Router)
- React 19.2.4
- TypeScript 5 (strict)
- Tailwind CSS 4
- `@react-oauth/google` for Google Sign-In
- `openapi-typescript` for type codegen from OpenAPI spec
- Backend API: `http://localhost:8080/api/v1`

**Learning Goal**: First Next.js + TypeScript project — Java dev background, learning by doing.

---

## Phase 1: Foundation & Setup ✅ COMPLETE

- [x] Project initialized with Next.js + TypeScript + Tailwind
- [x] Project directory structure (`lib/`, `types/`, `components/`, `app/`)
- [x] TypeScript types via codegen (`npm run generate:types` → `types/generated.ts` → `types/api.ts`)
- [x] Environment variables (`.env.local`) — API URL + Google Client ID
- [x] Base API client (`lib/api/client.ts`) — fetch wrapper with auth headers, error handling, safe empty-body parsing
- [x] Auth API service (`lib/api/auth.ts`) — register, getCurrentUser, updateProfile
- [x] Auth context + hook (`lib/hooks/useAuth.tsx`) — global user state, token persistence, `updateUser()` for profile edits
- [x] Root layout (`app/layout.tsx`) — GoogleOAuthProvider → AuthProvider → Header → children
- [x] next.config.ts — COOP header fix for Google Sign-In popup
- [x] Cleanup — removed scaffold SVGs, unused CSS vars, Geist Mono font

---

## Phase 2: Core Features ✅ COMPLETE

### Auth & Users
- [x] **Landing page** (`app/page.tsx`) — hero + sign-in for guests; dashboard tiles for logged-in users
- [x] **Header** (`components/layout/Header.tsx`) — Browse Books (always), My Shelves + Suggest + username + Sign out (logged-in)
- [x] **Google Sign-In button** (`components/features/SignInButton.tsx`)
- [x] **Registration page** (`app/register/page.tsx`)
- [x] **Profile page** (`app/profile/page.tsx`) — view + inline edit form (displayName, bio, readerStatus, isPrivate)

### Books
- [x] **Books search page** (`app/books/page.tsx`) — debounced search, book card grid, pagination, skeleton loader, empty state card
- [x] **Book detail page** (`app/books/[id]/page.tsx`) — cover, description, categories with weight bars, add-to-shelf, skeleton loader
- [x] **Books API service** (`lib/api/books.ts`) — searchBooks, getBook, getBookCategories

### Shelves
- [x] **Shelves list page** (`app/shelves/page.tsx`) — clickable shelf cards, skeleton loader
- [x] **Shelf detail page** (`app/shelves/[id]/page.tsx`) — books on shelf, remove book (optimistic), pagination, skeleton loader
- [x] **Shelves API service** (`lib/api/shelves.ts`) — getShelves, getShelfBooks, setBookState, removeBookState

### Reviews
- [x] **ReviewSection component** (`components/features/ReviewSection.tsx`) — write/edit/delete reviews, score picker (0–10 per dimension), score bars
- [x] **Reviews API service** (`lib/api/reviews.ts`) — getReviews, createReview, updateReview, deleteReview

---

## Phase 3: Advanced Features ✅ COMPLETE

### Suggestions
- [x] **Suggestions API service** (`lib/api/suggestions.ts`) — submitSuggestion, getSuggestions
- [x] **SuggestionForm component** (`components/features/SuggestionForm.tsx`) — type selector (CATEGORY/TROPE/CONTENT_WARNING), name, optional description
- [x] **Suggestions page** (`app/suggestions/page.tsx`) — user's own submission history, status badges (PENDING/APPROVED/REJECTED), pagination, collapsible form
- [x] **Book detail integration** — "Suggest a Tag" section on book detail page (logged-in only)
- [x] **Header nav link** — "Suggest" link for logged-in users

### Anonymous Reviews
- [x] `isAnonymous` on `ReviewRequest`/`ReviewResponse`; `userId` nullable on response
- [x] Types regenerated; ReviewSection shows anonymous toggle + "Anonymous" display when active

### Private Shelves
- [x] `isPrivate` on `ShelfResponse`; `CreateShelfRequest`/`UpdateShelfRequest`; `POST/PATCH/DELETE /users/me/shelves` in spec + types
- [x] `lib/api/shelves.ts` — `createShelf(body)`, `updateShelf(shelfId, body)`, `deleteShelf(shelfId)`
- [x] Shelves list — inline "+ New Shelf" create form; lock icon on private shelves; "default" pill on system shelves
- [x] Shelf detail — privacy toggle + "Delete shelf" for non-system shelves
- [x] Backend gap doc: `BACKEND_GAP_PRIVATE_SHELVES.md`

### Read Counts & Reading Stats
- [x] `readCount` on `UserBookStateResponse`; `BookSortBy [READS, SHELVED]` + `sortBy` on `GET /books`; `ReadLogEntry`, `UserReadStats`, `CategoryReadCount` in spec + types
- [x] `POST /users/me/books/{bookId}/read-log`, `GET /users/me/read-log`, `GET /users/me/stats` in spec + types
- [x] `lib/api/shelves.ts` — `markAsRead(bookId)`, `getReadLog(page?, size?)`, `getStats()`
- [x] `lib/api/books.ts` — `sortBy?: BookSortBy` on `searchBooks()`
- [x] Shelf detail — "Mark read" button; "Read N×" badge when `readCount > 0`
- [x] Profile page — reading stats: totalReads, uniqueBooksRead, topCategories pills
- [x] Browse page — sort toggle ("Most read" / "Most shelved") defaulting to READS
- [x] Backend gap doc: `BACKEND_GAP_READ_COUNTS.md`

### New Pages
- [x] **`/read-log`** (`app/read-log/page.tsx`) — paginated reading history; auth-guarded; loading skeleton + empty state
- [x] **`not-found.tsx`** — 404 page with "Back to home" link

---

## Phase 4: Styling & UI Polish ✅ COMPLETE

### Warm Library Aesthetic
- [x] **`app/globals.css`** — full warm palette override in `@theme {}`: zinc-950 = `#0e0804` (dark walnut) → zinc-50 = `#fdf4e3` (cream); `--color-white: #fef9f0`
- [x] **Lora serif font** — loaded via `next/font/google`; `h1–h4` use `var(--font-serif)`
- [x] **Background image** — `public/images/bg-library.png` fixed background on `<body>`; `bg-zinc-950/60 backdrop-blur-[1px]` overlay wraps content

### Navigation
- [x] Header — `bg-zinc-950/80 backdrop-blur-sm`; 📚 logo; active route underline via `usePathname()`
- [x] Nav labels: Browse, Shelves, History (`/read-log`), Suggest, displayName, Sign out
- [x] Emojis throughout: 📚 logo, 🔎 Browse, 📜 History, ✍️ Suggest, 🪪 Profile, 📖 welcome

### Landing Page
- [x] Logged-out hero — 📚 emoji, sign-in CTA, 3 glassmorphism feature tiles
- [x] Logged-in dashboard — 5-tile grid (Shelves, Browse, History, Suggest, Profile); `bg-zinc-900/50 backdrop-blur-sm`; hover: amber border + lift + shadow

### Book Cards
- [x] Glassmorphism — `bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50`
- [x] Cover gradient overlay — bleeds cover into card body
- [x] Hover — `-translate-y-1.5`, amber border glow, deep shadow

---

## Admin Panel (low priority, not started)
- [ ] Suggestion moderation queue — `GET /admin/suggestions`
- [ ] Approve/reject decisions — `PUT /admin/suggestions/{id}/decision`

---

## Technical Decisions Log

### Decided ✅
- **App Router** (not Pages Router)
- **Tailwind CSS** inline — pure dark theme, `zinc-*` palette throughout
- **TypeScript strict mode**
- **API Client**: native `fetch`, reads body as text first to avoid SyntaxError on empty responses
- **Token storage**: `localStorage`
- **Types**: auto-generated via `openapi-typescript`, re-exported from `types/api.ts`
- **Forms**: native controlled inputs (no form library)
- **Dynamic routes**: `useParams<{ id: string }>()` in client components; `await params` in server components
- **Optimistic updates**: used on shelf-book remove and review delete
- **API base URL**: `http://localhost:8080/api/v1`
- **No icon library, no component library** — pure Tailwind + custom components

- [ ] useEffect dependencies

---

## Open Questions

1. Should we use Server Components for public pages (book search, detail) and Client Components for authenticated features?
2. How should we handle the JWT token lifecycle (localStorage, sessionStorage, httpOnly cookies)?
3. Do we need to implement our own pagination component or use a library?
4. How should weighted category visualization work (progress bars, pie chart, tag cloud)?
5. Should reviews show all 6 dimensions or collapse empty ones?

---

## Blockers & Issues

*None yet*

---

## Project Structure

```
bookrithm-web/
├── app/                    # Next.js pages (App Router)
│   ├── layout.tsx         # Root layout (wraps all pages)
│   ├── page.tsx           # Home page (/)
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── ui/                # Reusable UI components (Button, Input, Card, etc.)
│   ├── features/          # Feature-specific components (ReviewForm, ShelfCard, etc.)
│   └── layout/            # Layout components (Header, Footer, Navigation)
├── lib/                    # Shared utilities and business logic
│   ├── api/               # API client services
│   │   ├── client.ts      # Base API client with auth
│   │   └── auth.ts        # User/auth endpoints
│   ├── hooks/             # Custom React hooks (useAuth, useBooks, etc.)
│   └── utils/             # Helper functions (formatDate, validation, etc.)
├── types/                  # TypeScript type definitions
│   └── api.ts             # API types from backend spec
├── public/                 # Static assets
└── specifications/         # API documentation
```

## Next Steps - Building Authentication

Now we'll build the Google Sign-In flow together! Here's what we need:

1. **Set up Google OAuth** in Google Cloud Console (get Client ID)
2. **Create an Auth Context** to manage user state across the app
3. **Build the Registration Page** for first-time users
4. **Build the Profile Page** to display and edit user info
5. **Add a Header/Navigation** with Sign In/Sign Out buttons

---

## Reference Links

- [FRONTEND_CONTEXT.md](./FRONTEND_CONTEXT.md) - Detailed API documentation
- [Backend API Spec](./specifications/backend_api_specification.yml) - OpenAPI specification
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
