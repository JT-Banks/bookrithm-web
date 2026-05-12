# Bookrithm Frontend — Project Progress

**Last Updated**: May 11, 2026  
**Status**: 🚧 Initial Setup Phase

---

## Project Overview

Building the frontend web application for **Bookrithm**, a book tracking and discovery platform with multi-dimensional reviews and weighted category tagging.

**Tech Stack**:
- Next.js 16.2.6 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4
- Backend API: `http://localhost:8080/bookrithm/v1`

**Learning Goal**: This is your first Next.js + TypeScript project — focus on learning by doing!

---

## Phase 1: Foundation & Setup

### ✅ Completed
- [x] Project initialized with Next.js
- [x] TypeScript configured
- [x] Tailwind CSS installed
- [x] Basic app structure created
- [x] Project documentation reviewed (FRONTEND_CONTEXT.md, backend_api_specification.yml)
- [x] **Project directory structure established** (lib/, types/, components/)
- [x] **TypeScript types created** from API specification (types/api.ts)
- [x] **Environment variables configured** (.env.local, .env.local.example)
- [x] **Base API client built** (lib/api/client.ts) with auth handling
- [x] **Auth API service created** (lib/api/auth.ts) for user endpoints

### 🎯 Current Focus
- [ ] Google OAuth integration setup
- [ ] Auth context provider (for managing user state)
- [ ] Registration page UI
- [ ] Profile page UI

### 📋 Upcoming Tasks
- [ ] Layout components (Header, Navigation)
- [ ] Landing page UI
- [ ] Book search functionality
- [ ] Reading shelves management

---

## Phase 2: Core Features (Not Started)

### Authentication & User Management
- [ ] Google Sign-In integration
- [ ] JWT token management
- [ ] User registration flow
- [ ] User profile page
- [ ] Profile editing

### Book Discovery
- [ ] Book search page
- [ ] Book detail page
- [ ] Category filtering
- [ ] Maturity rating filters
- [ ] Weighted category visualization

### Reading Shelves
- [ ] Shelf list view
- [ ] Book management (add/move/remove)
- [ ] System shelves (Want to Read, Currently Reading, Read)
- [ ] Shelf book list with pagination

### Reviews
- [ ] Multi-dimensional review form
- [ ] Review display component
- [ ] Review editing
- [ ] Review deletion

---

## Phase 3: Advanced Features (Not Started)

### Suggestions System
- [ ] Category suggestion form
- [ ] Trope suggestion form
- [ ] Content warning suggestion form
- [ ] User suggestion history

### Admin Panel (if applicable)
- [ ] Suggestion moderation queue
- [ ] Approve/reject decisions
- [ ] Moderation reason input

---

## Technical Decisions Log

### Decisions Made ✅
- **Next.js App Router**: Using modern App Router (not Pages Router)
- **Tailwind CSS**: For styling
- **TypeScript**: Strict mode for type safety
- **API Client**: Native `fetch` API (no Axios needed - keeping it simple!)
- **Token Storage**: localStorage for JWT tokens
- **Project Structure**:
  - `lib/` - Shared utilities, API clients, hooks
  - `types/` - TypeScript type definitions
  - `components/` - React components (ui, features, layout)
  - `app/` - Next.js pages and routes
- **Backend Connection**: Runs locally on `localhost:8080`
- **Development Approach**: Path A - Auth-First (Google Sign-In → Registration → Profile)

### Decisions Needed
- [ ] State management approach (Context API for auth, React Query for data?)
- [ ] Form handling library (React Hook Form, Formik, or native?)
- [ ] Toast/notification system (react-hot-toast, sonner, or custom?)
- [ ] Date formatting library (date-fns, dayjs, or native Intl?)
- [ ] Icon library (Lucide, Heroicons, or Font Awesome?)

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
