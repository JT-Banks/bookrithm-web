# Bookrithm Frontend — Project Progress

**Last Updated**: May 13, 2026  
**Status**: 🚧 Suggestions Complete — Admin Panel Remaining

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

## Phase 3: Advanced Features

### 🎯 Suggestions ✅ COMPLETE
- [x] **Suggestions API service** (`lib/api/suggestions.ts`) — submitSuggestion, getSuggestions
- [x] **SuggestionForm component** (`components/features/SuggestionForm.tsx`) — type selector (CATEGORY/TROPE/CONTENT_WARNING), name, optional description
- [x] **Suggestions page** (`app/suggestions/page.tsx`) — user's own submission history, status badges (PENDING/APPROVED/REJECTED), pagination, collapsible form
- [x] **Book detail integration** — "Suggest a Tag" section on book detail page (logged-in only)
- [x] **Header nav link** — "Suggest" link for logged-in users

### 🎨 Global Styling Pass ✅ COMPLETE
- [x] Replaced all `Loading...` text with animated skeleton placeholders across all pages
- [x] Added empty state cards: "No books found" (books page), improved empty states project-wide
- [x] Fixed `gray-*` → `zinc-*` inconsistency in `app/books/page.tsx`
- [x] Fixed heading color inconsistency (`text-zinc-900 dark:text-zinc-50` → `text-white`)
- [x] Consistent pagination button styles across pages

### Admin Panel (low priority)
- [ ] Suggestion moderation queue (admin-only) — `GET /admin/suggestions`
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
- [x] Base API client (`lib/api/client.ts`) — fetch wrapper with auth headers + error handling
- [x] Auth API service (`lib/api/auth.ts`) — register, getCurrentUser, updateProfile
- [x] Auth context + hook (`lib/hooks/useAuth.tsx`) — global user state, token persistence
- [x] Root layout (`app/layout.tsx`) — GoogleOAuthProvider → AuthProvider → Header → children
- [x] next.config.ts — COOP header fix for Google Sign-In popup

---

## Phase 2: Core Features 🚧 IN PROGRESS

### ✅ Done
- [x] **Landing page** (`app/page.tsx`) — hero + sign-in for guests; dashboard tiles for logged-in users
- [x] **Header** (`components/layout/Header.tsx`) — nav links: Browse Books (always), My Shelves + username + Sign out (logged-in)
- [x] **Google Sign-In button** (`components/features/SignInButton.tsx`) — credential flow, routes to /register on 404
- [x] **Registration page** (`app/register/page.tsx`) — username/displayName/email form, calls authApi.register()
- [x] **Shelves page** (`app/shelves/page.tsx`) — lists user's shelves with book counts; auth-guarded
- [x] **Shelves API service** (`lib/api/shelves.ts`)
- [x] **Books search page** (`app/books/page.tsx`) — debounced search, book card grid, pagination
- [x] **Books API service** (`lib/api/books.ts`) — searchBooks(), getBook()
- [x] **Profile page** (`app/profile/page.tsx`) — displays avatar, name, username, bio, reader status; auth-guarded

### 🎯 Current Focus — Core User Loop
- [ ] **Book detail page** (`app/books/[id]/page.tsx`) — cover, description, categories, add-to-shelf
- [ ] **Add to shelf** — `PUT /users/me/books/{bookId}/state` from the detail page

### 📋 Up Next
- [ ] **Profile editing** — wire up "Edit Profile" button, `PUT /users/me`
- [ ] **Reviews** — write + display multi-dimensional reviews on book detail page
- [ ] **Shelf book list** — clicking a shelf shows the books inside it

---

## Phase 3: Advanced Features (Not Started)

### Suggestions System
- [ ] Category suggestion form
- [ ] Trope suggestion form
- [ ] Content warning suggestion form
- [ ] User suggestion history

### Admin Panel
- [ ] Suggestion moderation queue
- [ ] Approve/reject decisions

---

## Technical Decisions Log

### Decided ✅
- **App Router** (not Pages Router)
- **Tailwind CSS** inline — dark theme, `zinc-*` palette
- **TypeScript strict mode**
- **API Client**: native `fetch` (no Axios)
- **Token storage**: `localStorage`
- **Types**: auto-generated via `openapi-typescript`, re-exported from `types/api.ts`
- **Forms**: native controlled inputs (no form library — keeping it simple)
- **API base URL**: `http://localhost:8080/api/v1`

### Still Open
- [ ] Toast/notification system (react-hot-toast, sonner, or custom?)
- [ ] Icon library (Lucide, Heroicons, or none?)
- [ ] Global styling pass (after all core features are done)

---

## Learning Resources & Notes

### Next.js Key Concepts to Learn
- [ ] App Router vs Pages Router
- [ ] Server Components vs Client Components
- [ ] File-based routing
- [ ] Layouts and nested routes
- [ ] Loading and error states
- [ ] Metadata and SEO
- [ ] API route handlers (optional, since backend exists)

### TypeScript Concepts
- [ ] Interface vs Type
- [ ] Generics for API responses
- [ ] Type guards
- [ ] Utility types (Partial, Pick, Omit)

### React Patterns
- [ ] Custom hooks
- [ ] Context for global state
- [ ] Controlled vs uncontrolled components
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
