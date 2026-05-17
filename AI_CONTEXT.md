# AI Context - Bookrithm Frontend Development

**Last Updated**: May 16, 2026  
**Session Type**: Learning-Focused Development  
**GitHub**: https://github.com/JT-Banks/bookrithm-web.git

---

## 👤 About the Developer

- **Name**: Joshua
- **Experience Level**: Java developer, **first time with Next.js and TypeScript**
- **Learning Goal**: Build a full-stack book tracking app while learning proper conventions
- **Development Environment**: Switches between desktop and laptop frequently

### Important Learning Preferences ⚠️

1. **Teaching Style**: 
   - Keep explanations simple and ease into concepts gradually
   - Be encouraging and supportive - user is not a strong developer (their words)
   - Use Java analogies when explaining React/TypeScript concepts
   - Add detailed inline comments in all code

2. **Development Approach**:
   - **User wants to code themselves** with your guidance (don't just build for them)
   - Provide structure and explain patterns, then guide them to write the code
   - Comments are welcome and encouraged
   - Explain concepts as you go

3. **Communication Style**:
   - Direct, friendly, and encouraging
   - Use emojis appropriately for visual organization
   - Break down complex topics into digestible pieces
   - Draw comparisons to Java concepts (Spring, POJOs, etc.)

4. **Code Organization**:
   - Establish structure and good habits from the start
   - Follow Next.js conventions strictly
   - Emphasize learning the "right way"

---

## 🎯 Project Overview

**Bookrithm** is a book tracking and discovery platform with three unique features:
1. **Weighted category tagging** - Books scored across multiple categories (e.g., Dark Romance: 62%, Tragedy: 24%)
2. **Multi-dimensional reviews** - 6 optional rating dimensions (Overall, Grammar, Storytelling, Worldbuilding, Characters, Pacing)
3. **Curated taxonomy** - User-submitted, AI-vetted, admin-approved categories/tropes

### Tech Stack

**Backend** (Already Built by User):
- Java 25 + Spring Boot 4 + PostgreSQL 18
- Runs on `http://localhost:8080/api/v1`
- Google OAuth2 (JWT validation only - doesn't issue tokens)

**Frontend** (Built):
- Next.js 16.2.6 (App Router)
- React 19.2.4
- TypeScript 5 (strict mode)
- Tailwind CSS 4 (warm `@theme` palette override — walnut/mahogany tones)
- Lora serif font (headings) + Geist Sans (body)
- Native `fetch` API (no Axios)
- `openapi-typescript` for type codegen

### Development Plan

**Current Phase**: Complete — all core features + styling shipped. Only remaining item is the admin moderation panel (low priority).

---

## ✅ What's Been Built

The app is **feature-complete**. Every page and API service below is implemented and working.

### Pages
| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Hero (logged-out) + 5-tile dashboard (logged-in) |
| `/register` | `app/register/page.tsx` | Username/displayName registration form |
| `/books` | `app/books/page.tsx` | Search, category filter, sort (READS/SHELVED), grid, pagination |
| `/books/[id]` | `app/books/[id]/page.tsx` | Cover, categories, reviews, add-to-shelf |
| `/shelves` | `app/shelves/page.tsx` | Shelf list, inline create form, lock icon for private |
| `/shelves/[id]` | `app/shelves/[id]/page.tsx` | Shelf books, mark read, remove, privacy toggle, delete |
| `/read-log` | `app/read-log/page.tsx` | Paginated reading history |
| `/suggestions` | `app/suggestions/page.tsx` | Submit + view own suggestions |
| `/profile` | `app/profile/page.tsx` | View/edit profile + reading stats |

### API Services (`lib/api/`)
- `client.ts` — base fetch wrapper with auth headers, error handling
- `auth.ts` — register, getCurrentUser, updateProfile
- `books.ts` — searchBooks (with sortBy), getBook, getBookCategories
- `categories.ts` — getCategories
- `shelves.ts` — getShelves, createShelf, updateShelf, deleteShelf, getShelfBooks, setBookState, removeBookState, markAsRead, getReadLog, getStats
- `reviews.ts` — getReviews, createReview, updateReview, deleteReview
- `suggestions.ts` — submitSuggestion, getSuggestions

### Key Components
- `components/layout/Header.tsx` — nav with active state via `usePathname()`
- `components/features/SignInButton.tsx` — Google OAuth credential flow
- `components/features/ReviewSection.tsx` — write/edit/delete reviews, score sliders, anonymous toggle
- `components/features/SuggestionForm.tsx` — suggestion submission form

### Styling
- **Warm library aesthetic**: zinc palette overridden with walnut/mahogany tones in `globals.css @theme {}`
- **Background**: `public/images/bg-library.png` fixed, with `bg-zinc-950/60 backdrop-blur-[1px]` overlay in `app/layout.tsx`
- **Cards**: glassmorphism (`bg-zinc-900/40 backdrop-blur-sm`), amber hover border + lift
- **Fonts**: Lora serif (`h1–h4`) + Geist Sans (body) — both via `next/font/google`

### 2. Key Files
bookrithm-web/
├── app/                    # Next.js pages (App Router)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── ui/                # Reusable UI (buttons, inputs, cards)
│   ├── features/          # Feature-specific (reviews, shelves)
│   └── layout/            # Layout (header, footer, nav)
├── lib/                    # Business logic and utilities
│   ├── api/               # API client services
│   │   ├── client.ts      # ✅ Base API client with auth
│   │   └── auth.ts        # ✅ User/auth endpoints
│   ├── hooks/             # Custom React hooks (empty - ready for useAuth)
│   └── utils/             # Helper functions (empty)
├── types/                  # TypeScript type definitions
│   └── api.ts             # ✅ All API types from backend spec
├── .env.local             # ✅ Environment variables (needs Google Client ID)
├── .env.local.example     # ✅ Template
├── FRONTEND_CONTEXT.md    # ✅ Detailed API documentation
├── PROJECT_PROGRESS.md    # ✅ Progress tracker
├── GETTING_STARTED.md     # ✅ Setup guide for user
└── specifications/
    └── backend_api_specification.yml  # OpenAPI spec
```

### 2. Key Files Created

**types/api.ts** - Complete TypeScript types for entire API
- All enums (BookSource, MaturityRating, TrustLevel, etc.)
- Request/Response types for all endpoints
- Paginated response wrappers
- Error response type
- **Heavily commented with Java analogies**

**lib/api/client.ts** - Base API client (like Spring RestTemplate)
- HTTP methods: get, post, put, patch, delete
- Automatic JWT token injection for protected endpoints
- Token management (get, set, clear from localStorage)
- Consistent error handling with custom ApiError class
- **Extensive comments explaining how fetch works**

**lib/api/auth.ts** - User authentication service
- `register()` - POST /users/me
- `getCurrentUser()` - GET /users/me
- `updateProfile()` - PATCH /users/me
- `isUserRegistered()` - Helper to check registration status

**.env.local** - Environment configuration
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/bookrithm/v1`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=` (user needs to fill this)

### 3. Documentation Created

**GETTING_STARTED.md**:
- Explains what we built and why
- Step-by-step Google OAuth setup instructions
- Next steps preview
- Learning resources for React/Next.js concepts

**PROJECT_PROGRESS.md**:
- Tracks completed tasks
- Current focus and upcoming work
- Technical decisions log
- Open questions

**FRONTEND_CONTEXT.md** (Existing):
- Complete API reference with endpoints
- Authentication flow details
- Data models (TypeScript format)
- UI flow descriptions

---

## 🎓 Technical Decisions Made

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **Routing** | App Router | Modern Next.js approach (not Pages Router) |
| **Styling** | Tailwind CSS 4 | Already installed, utility-first |
| **API Client** | Native `fetch` | Keep it simple for learning |
| **Token Storage** | localStorage | Simple and sufficient for this use case |
| **Type Safety** | TypeScript strict mode | Catch errors early |
| **Development Path** | Auth-First (Path A) | User's preference, logical flow |

### Decisions Still Needed (Don't Assume!)

- State management (Context API vs React Query?)
- Form handling (React Hook Form vs native?)
- Toast notifications (which library?)
- Date formatting (which library?)
- Icon library (which one?)

**Always ask the user before adding new dependencies!**

---

## 🚧 Current State & Next Steps

### Where We Are Now

✅ **Phase 1: Foundation - COMPLETE**
- Project structure established
- TypeScript types defined
- API client built and tested (conceptually)
- Environment configured

⏸️ **Waiting on User**: Google OAuth Client ID setup
- User needs to follow GETTING_STARTED.md instructions
- Get Client ID from Google Cloud Console
- Add to .env.local

🎯 **Next to Build**: Auth Context Provider
Once user has Client ID, guide them to build:

1. **lib/hooks/useAuth.tsx** - Auth Context Provider
   - Manages user state globally
   - Sign in/out functions
   - Token management
   - Concept: Like a Spring singleton service

2. **Google Sign-In Integration**
   - Load Google Sign-In SDK
   - Create SignInButton component
   - Handle token reception

3. **app/register/page.tsx** - Registration page
   - Form with username, displayName, email
   - Validation
   - Calls authApi.register()

4. **app/profile/page.tsx** - Profile page
   - Display user info
   - Edit functionality
   - Sign out button

5. **components/layout/Header.tsx** - Navigation
   - Logo/branding
   - Sign In button (unauthenticated)
   - User menu (authenticated)

---

## 🔑 Key Concepts to Teach (As Needed)

When building auth context and components, explain:

### React Concepts (Use Java Analogies)
- **Components**: Like Java classes for UI
- **Props**: Method parameters for components
- **State**: Instance variables that trigger re-renders
- **Hooks**: Special functions for React features
  - `useState`: Component instance variables
  - `useEffect`: Lifecycle methods (componentDidMount)
  - `useContext`: Dependency injection / global state
- **Context**: Like Spring's ApplicationContext for state

### Next.js Concepts
- **Server vs Client Components**: 
  - Server: Rendered on server (default in App Router)
  - Client: Interactive, runs in browser (need `'use client'` directive)
- **File-based Routing**: `app/profile/page.tsx` → `/profile` URL
- **Layouts**: Wrap pages (like a template pattern)
- **Environment Variables**: `NEXT_PUBLIC_` prefix for browser access

### TypeScript Concepts (Relate to Java)
- **Interfaces**: Like Java interfaces, define object shapes
- **Types**: Similar to interfaces but more flexible
- **Generics**: Same as Java generics (`<T>`)
- **Optional properties**: `field?:` means nullable
- **Union types**: `string | number` (like Java OR operator for types)

---

## 📝 How to Continue a Session

When user starts a new chat:

1. **Greet warmly and review context**: 
   - "Welcome back! I see we're building Bookrithm's auth system."
   - Briefly mention where we left off (check PROJECT_PROGRESS.md)

2. **Check user's status**:
   - Did they complete any setup tasks? (Google Client ID, etc.)
   - Are they ready to code or do they have questions?
   - Which machine are they on? (they switch frequently)

3. **Maintain the teaching approach**:
   - Guide, don't just implement
   - Ask if they want to try coding first or see an example
   - Keep explanations simple with Java analogies
   - Add extensive comments to all code

4. **Use the context files**:
   - Reference PROJECT_PROGRESS.md for status
   - Point to GETTING_STARTED.md for setup steps
   - Link to FRONTEND_CONTEXT.md for API details
   - Update PROJECT_PROGRESS.md as work progresses

---

## 🚀 Backend Status

**User's Java backend**:
- ✅ Fully implemented and functional
- ✅ Runs locally on http://localhost:8080
- ❌ Not deployed anywhere (if needed, user will deploy it)
- API documented in FRONTEND_CONTEXT.md and backend_api_specification.yml

**Authentication Flow**:
1. Frontend gets Google ID token from Google Sign-In
2. Frontend sends `Authorization: Bearer <google_token>` to backend
3. Backend validates token (doesn't issue its own)
4. First login: POST /users/me creates profile + 3 system shelves
5. Subsequent logins: GET /users/me returns existing profile

---

## 💡 Tips for AI Assistants

1. **Read PROJECT_PROGRESS.md first** - Always check current status
2. **Maintain the encouraging tone** - User is learning, be supportive
3. **Use Java analogies** - User understands Spring, Services, POJOs
4. **Guide, don't solve** - Let user write code with your guidance
5. **Comment everything** - Inline comments are essential
6. **Ask before adding dependencies** - Keep it simple
7. **Update PROJECT_PROGRESS.md** - Keep progress tracked
8. **Reference existing docs** - Link to GETTING_STARTED.md, FRONTEND_CONTEXT.md
9. **Explain concepts simply** - Break down complex topics
10. **Remember: User switches machines** - Context files are crucial!

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| PROJECT_PROGRESS.md | Current status, decisions, next steps |
| GETTING_STARTED.md | Setup instructions for user |
| FRONTEND_CONTEXT.md | Complete API documentation |
| AI_CONTEXT.md | This file - for AI assistants |
| backend_api_specification.yml | OpenAPI spec |
| types/api.ts | TypeScript type reference |
| lib/api/client.ts | API client implementation |
| lib/api/auth.ts | Auth service implementation |

---

## ✨ Communication Style Example

**Good** ✅:
> "Great! Let's build the Auth Context together. This is like a Spring service that's available throughout your app. Think of it as a singleton that holds your user's logged-in state. We'll use React Context API (similar to dependency injection in Spring). Ready to start coding?"

**Bad** ❌:
> "Here's the complete auth context implementation with error boundaries and retry logic." [pastes 200 lines of code without explanation]

---

**Remember**: Joshua is learning! Be patient, encouraging, and guide them to write code themselves. This is their first Next.js project - make it a great experience! 🚀
