# Bookrithm Frontend — Deployment & Connection Guide

Track your progress by checking off each step.

---

## Overview

| What | Where |
|---|---|
| API (backend) | Google Cloud Run — already deployed |
| Frontend hosting | Firebase Hosting |
| Auth | Google Sign-In (OAuth2) — ID token sent to API as Bearer token |
| GCP / Firebase project | `bookrithm-7eadd` |

---

## Phase 1 — Get Your API URL

### Step 1 — Confirm the Cloud Run service URL

Run in Cloud Shell:

```bash
gcloud run services describe bookrithm-api \
  --region=us-central1 \
  --format="value(status.url)"
```

It will look like: `https://bookrithm-api-xxxxxxxxxx-uc.a.run.app`

Your full API base URL is:

```
https://bookrithm-api-xxxxxxxxxx-uc.a.run.app/api/v1
```

Note this value — your frontend will use it as `NEXT_PUBLIC_API_BASE_URL` (or equivalent).

- [ ] Cloud Run URL noted

---

## Phase 2 — Google OAuth Setup

The API validates Google ID tokens. The frontend needs a Google OAuth2 client ID to obtain those tokens.

### Step 2 — Create an OAuth 2.0 Client ID

1. Go to `console.cloud.google.com/apis/credentials?project=bookrithm-7eadd`
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Bookrithm Frontend`
5. Under **Authorised JavaScript origins**, add:
   - `http://localhost:3000` (for local dev)
   - `https://YOUR_FIREBASE_HOSTING_DOMAIN` (add after Step 9)
6. Under **Authorised redirect URIs**, add:
   - `http://localhost:3000` (for local dev)
   - `https://YOUR_FIREBASE_HOSTING_DOMAIN` (add after Step 9)
7. Click **Create**
8. Copy the **Client ID** (looks like `696093636828-xxxx.apps.googleusercontent.com`)

- [ ] OAuth client ID created
- [ ] Client ID copied

> The API already validates tokens issued to client ID `696093636828-g6hjerovfhcu3pehjspgdol6pmmh65rv.apps.googleusercontent.com` (from your previous Postman tests). If this is a different client ID, the API will reject tokens from the new one. Either reuse the existing client ID or check `SecurityConfig` to ensure the new one is also accepted.

---

## Phase 3 — Frontend Environment Variables

Your frontend needs these environment variables. The exact names depend on your framework — adjust for React, Next.js, Vite, etc.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://YOUR_CLOUD_RUN_URL/api/v1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Your OAuth 2.0 Client ID from Step 2 |

For local development, put these in `.env.local` (gitignored):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=696093636828-xxxx.apps.googleusercontent.com
```

For production, store them as Firebase environment config or directly in your hosting deployment command — they are **not** secrets since they are public-facing.

- [ ] `.env.local` configured for local dev
- [ ] Production env vars configured

---

## Phase 4 — Connect Auth Flow

The API is a JWT resource server — it never issues tokens. Here is how the frontend authenticates:

### Every authenticated request

```
Authorization: Bearer <google_id_token>
```

The `id_token` comes from Google Sign-In. It expires every hour — use the Google Sign-In SDK refresh flow.

### First login flow

```
1. User clicks "Sign in with Google"
2. Receive google_id_token from Google SDK
3. GET /users/me  (with Authorization header)
   → 200: user exists, go to home
   → 404: first time, go to registration page
4. POST /users/me  { username, displayName, email }
   → 201: profile created, go to home
```

### Subsequent logins

```
GET /users/me → 200 → go to home
```

- [ ] Google Sign-In SDK installed and initialised
- [ ] Token is attached to every API request via an HTTP interceptor or wrapper
- [ ] First login / registration flow implemented

---

## Phase 5 — API Base URL Conventions

All endpoints are under `/api/v1`. Example full URLs:

| What | URL |
|---|---|
| Search books | `GET /api/v1/books?q=fantasy` |
| Get book | `GET /api/v1/books/{id}` |
| Get book categories | `GET /api/v1/books/{id}/categories` |
| Register user | `POST /api/v1/users/me` |
| Get current user | `GET /api/v1/users/me` |
| List shelves | `GET /api/v1/users/me/shelves` |
| Shelf books | `GET /api/v1/users/me/shelves/{shelfId}/books` |
| Set book shelf | `PUT /api/v1/users/me/books/{bookId}/state` |
| Remove from shelf | `DELETE /api/v1/users/me/books/{bookId}/state` |
| Book reviews | `GET /api/v1/books/{bookId}/reviews` |
| Create review | `POST /api/v1/books/{bookId}/reviews` |
| Categories | `GET /api/v1/categories` |
| Submit suggestion | `POST /api/v1/suggestions` |

Full model reference and UI flow guidance: `FRONTEND_CONTEXT.md`

- [ ] API client / HTTP wrapper configured with correct base URL

---

## Phase 6 — Firebase Hosting Setup

### Step 3 — Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

- [ ] Firebase CLI installed
- [ ] Logged in as `s1c.pr0x@gmail.com`

### Step 4 — Initialise Firebase Hosting in your frontend repo

Run this **inside your frontend project directory**:

```bash
firebase init hosting
```

When prompted:
- Select existing project: `bookrithm-7eadd`
- Public directory: `out` (Next.js static export) or `dist` or `build` — depends on your framework
- Single-page app: **Yes** (rewrite all URLs to `index.html`)
- Automatic builds with GitHub Actions: **Yes** (recommended)

- [ ] `firebase init hosting` completed
- [ ] `firebase.json` and `.firebaserc` generated in frontend repo

### Step 5 — Configure your framework for static export (if Next.js)

In `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
}

module.exports = nextConfig
```

- [ ] Framework configured for static output

### Step 6 — Build and deploy

```bash
# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

After deploy, Firebase gives you a URL like: `https://bookrithm-7eadd.web.app`

- [ ] Build successful
- [ ] Deployed — live URL noted

---

## Phase 7 — Wire Production Together

### Step 7 — Update CORS on the API

Now that you have the real frontend URL, update the CORS secret so the API accepts requests from it. Run in Cloud Shell:

```bash
echo -n "https://bookrithm-7eadd.web.app" | \
  gcloud secrets versions add BOOKRITHM_CORS_ORIGINS --data-file=-
```

If you have a custom domain (e.g. `https://bookrithm.com`), use that instead.

Then trigger a redeploy of the API — either push a commit to `master` or re-run the last GitHub Actions workflow run manually.

- [ ] `BOOKRITHM_CORS_ORIGINS` updated with real frontend URL
- [ ] API redeployed to pick up new secret version

### Step 8 — Add production origin to OAuth client

Go back to `console.cloud.google.com/apis/credentials` → your OAuth client → add the production frontend URL to:
- **Authorised JavaScript origins**
- **Authorised redirect URIs**

- [ ] Production URL added to OAuth client

### Step 9 — Smoke test in production

```
1. Open https://bookrithm-7eadd.web.app
2. Click Sign in with Google
3. Complete registration (first time)
4. Search for a book
5. Add a book to a shelf
6. Write a review
```

- [ ] End-to-end flow works in production

---

## Phase 8 — Custom Domain (optional)

If you want `https://bookrithm.com` instead of `https://bookrithm-7eadd.web.app`:

1. Go to Firebase Console → Hosting → **Add custom domain**
2. Follow the DNS verification steps
3. Update `BOOKRITHM_CORS_ORIGINS` to the custom domain
4. Update OAuth client origins/redirects
5. Redeploy API

- [ ] Custom domain configured (optional)

---

## Troubleshooting

### 401 Unauthorized on API calls

- Confirm the `Authorization: Bearer <token>` header is present on every request
- Google ID tokens expire after 1 hour — make sure your auth layer refreshes them
- The token must come from the correct Google OAuth client ID

### 403 CORS error in browser

- The `BOOKRITHM_CORS_ORIGINS` secret does not include your frontend origin
- Update the secret and redeploy the API (see Step 7)

### 404 on all API calls

- Check the base URL — it must include `/api/v1`
- Example: `https://YOUR_CLOUD_RUN_URL/api/v1/books` not `/books`

### First login returns 404 on `GET /users/me`

- This is expected on first login — it means the user has not registered yet
- Redirect to the registration page and call `POST /users/me`

### Firebase deploy fails

- Run `firebase login --reauth` if session expired
- Confirm the public directory in `firebase.json` matches your build output folder

---

## Reference

| Resource | Link |
|---|---|
| Cloud Run service | `https://console.cloud.google.com/run/detail/us-central1/bookrithm-api/metrics?project=bookrithm-7eadd` |
| Firebase Hosting | `https://console.firebase.google.com/project/bookrithm-7eadd/hosting` |
| OAuth credentials | `https://console.cloud.google.com/apis/credentials?project=bookrithm-7eadd` |
| Secret Manager | `https://console.cloud.google.com/security/secret-manager?project=bookrithm-7eadd` |
| Full API contract | `src/main/resources/specifications/specification.yml` |
| Full frontend context | `FRONTEND_CONTEXT.md` |

