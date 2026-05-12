# Getting Started Guide

Welcome to your Bookrithm frontend project! This guide will help you understand what we've set up and what to do next.

---

## ✅ What We've Built So Far

### 1. **Project Structure**
We organized your project following Next.js conventions:

- **`types/api.ts`** - All TypeScript types matching your backend API
- **`lib/api/client.ts`** - Base API client that handles HTTP requests and authentication
- **`lib/api/auth.ts`** - User registration and profile management functions
- **`.env.local`** - Environment variables (API URL, Google Client ID)

### 2. **TypeScript Types**
Look at [types/api.ts](types/api.ts) - this file has types for everything:
- `UserResponse`, `BookResponse`, `ReviewResponse`, etc.
- Think of these like Java POJOs/DTOs, but for TypeScript
- They ensure you can't accidentally pass wrong data types

### 3. **API Client**
Look at [lib/api/client.ts](lib/api/client.ts) - this handles:
- Making HTTP requests with `fetch`
- Automatically adding the JWT token to protected requests
- Converting responses to JSON
- Throwing consistent errors
- **It's like a service class in Spring, but for HTTP calls!**

### 4. **Auth Service**
Look at [lib/api/auth.ts](lib/api/auth.ts) - three main functions:
- `register()` - Create user profile on first login
- `getCurrentUser()` - Get user profile
- `updateProfile()` - Update user profile

---

## 🎯 Next Steps - Google OAuth Setup

Before we can build the UI, you need to get a Google Client ID. Here's how:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Name it something like "Bookrithm" or "Bookrithm Dev"

### Step 2: Enable Google Sign-In API

1. In the left sidebar, go to **"APIs & Services" → "OAuth consent screen"**
2. Choose **"External"** (unless you have a Google Workspace)
3. Fill in the required fields:
   - **App name**: Bookrithm
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. Skip adding scopes (click "Save and Continue")
6. Add yourself as a test user
7. Click **"Save and Continue"** and then **"Back to Dashboard"**

### Step 3: Create OAuth Client ID

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"Create Credentials" → "OAuth client ID"**
3. Choose **"Web application"**
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
5. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
6. Click **"Create"**
7. **Copy the Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)

### Step 4: Add Client ID to Your Project

1. Open [.env.local](.env.local)
2. Replace `your-google-client-id-here` with your actual Client ID:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   ```
3. Save the file

---

## 🏗️ What We'll Build Next

Once you have your Google Client ID set up, we'll build these together:

### 1. **Auth Context Provider** (lib/hooks/useAuth.tsx)
A React Context that manages:
- Current user state
- Sign in / sign out functions
- Loading states
- Token management

**Concept**: Like a singleton service in Java that's accessible throughout your app

### 2. **Sign In Button Component** (components/features/SignInButton.tsx)
A button that:
- Opens Google Sign-In popup
- Receives the JWT token
- Stores it in localStorage
- Calls the backend to check if user is registered

### 3. **Registration Page** (app/register/page.tsx)
A form for first-time users with:
- Username input (3-40 chars, alphanumeric + underscores)
- Display name input
- Email pre-filled from Google
- Submit button that calls `authApi.register()`

### 4. **Profile Page** (app/profile/page.tsx)
A page that shows:
- User's profile info
- Edit button to update profile
- Sign out button

### 5. **Header Component** (components/layout/Header.tsx)
A navigation bar with:
- Logo/site name
- Sign In button (when not authenticated)
- User menu dropdown (when authenticated)

---

## 📚 Learning Resources

As we build, I'll explain these React/Next.js concepts:

- **Components**: Like classes in Java, but for UI
- **Props**: Parameters passed to components (like method arguments)
- **State**: Data that changes over time (like instance variables)
- **Hooks**: Special functions that let you use React features
  - `useState` - For component state
  - `useEffect` - For side effects (like componentDidMount in old React)
  - `useContext` - For accessing global state
- **Server vs Client Components**: Next.js runs some components on the server, others in the browser
- **File-based Routing**: `app/profile/page.tsx` → `/profile` URL

---

## 🚀 Running Your Project

Whenever you're ready to see your work in the browser:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

**Make sure your Java backend is running on http://localhost:8080** before testing API calls!

---

## 💡 Tips for Learning

1. **Read the comments** - I've added detailed comments in every file
2. **Look at the types** - They tell you what data looks like
3. **Console.log everything** - When in doubt, log it out!
4. **Break things** - Try changing code and see what happens
5. **Ask questions** - If something doesn't make sense, just ask!

---

## 🔥 Ready to Build?

Once you have your Google Client ID set up in `.env.local`, let me know and we'll start building the authentication flow together!

The first thing we'll build is the **Auth Context Provider** - it's the foundation for everything else.
