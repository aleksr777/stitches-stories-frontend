# react-routing-authorization

React + Vite frontend for the routing and authorization template.

Companion backend: [nestjs-routing-authorization](https://github.com/aleksr777/nestjs-routing-authorization)

## Features

- registration and email-code confirmation;
- login/logout and password recovery;
- access-token refresh through an HttpOnly backend refresh cookie;
- protected and administrator-only routes;
- current-user profile and profile editing;
- email change, password change/reset, and self-account deletion;
- active-session list with remote session revocation;
- administrator user search/view/block/unblock/delete workflows;
- administrator inspection and revocation of managed users' active sessions;
- blocked-account messaging;
- backend-driven verification attempt/cooldown/lockout UI;
- cross-tab logout/session invalidation;
- periodic server-side session validation for already rendered protected pages;
- request timeouts and controlled authentication retry behavior;
- pull-request CI and validated GitHub Pages deployment.

Multi-factor authentication is intentionally not part of this base template. Add the MFA mechanism and recovery policy appropriate to each application separately.

## Authentication model

The access token is kept **only in memory**. It is not written to `localStorage` or `sessionStorage`.

The refresh token is managed by the backend through an HttpOnly cookie and is unavailable to frontend JavaScript.

On page reload the in-memory access token is gone. The application attempts `POST /api/auth/refresh-tokens`; if the refresh session remains valid, the backend returns a new access token and authentication is restored.

Protected requests use the Bearer access token. The API client refreshes proactively near access-token expiry and performs at most one refresh/retry after an authenticated `401` response.

`401` and `403` responses that represent an invalid session clear local authentication state. Transient network failures, timeouts, and server errors do not incorrectly log the user out.

Backend JWT/session/role guards are the security boundary. Frontend route guards only control presentation/navigation.

## Server-session validation

A protected route validates the current server session through `GET /api/auth/session`:

- when protected content is entered;
- when the tab becomes visible again;
- approximately every 60 seconds while the protected tab remains visible.

Background heartbeat checks do not replace already rendered content on transient failure, but a confirmed `401/403` invalidation clears authentication immediately.

Authentication clearing is propagated between tabs through `BroadcastChannel` when supported, so logout or session invalidation in one tab is reflected in the others without moving tokens into persistent browser storage.

## API timeout behavior

API calls have a default 15-second timeout through `AbortController`. Timeout failures are exposed as HTTP-like status `408` to the UI and do not automatically destroy a valid authentication session.

The refresh request uses the same timeout policy.

## Browser security policy

The Vite build injects a CSP meta policy into `index.html` together with a `strict-origin-when-cross-origin` referrer policy. In production, `connect-src` is restricted to the exact origin derived from `VITE_API_URL` plus the frontend origin; development additionally allows WebSocket connections for Vite HMR. The CSP also limits scripts to the application origin, blocks plugins/objects, and constrains forms/base URLs.

GitHub Pages cannot configure all HTTP response security headers. In particular, `frame-ancestors` cannot be enforced from a CSP `<meta>` element. For production hosting where clickjacking protection and full response-header control are required, serve the built frontend from hosting that supports custom headers.

## Environment

Create `.env` for local development:

```env
VITE_API_URL=http://localhost:5174/api
VITE_BASE_PATH=/
```

Production builds require an explicit `VITE_API_URL`. A non-local production API URL must use HTTPS; the build no longer silently falls back to `http://localhost:5174/api`.

`VITE_BASE_PATH` controls both Vite asset URLs and the React Router basename. Keep `/` for localhost or root-domain hosting. The GitHub Pages workflow sets it automatically to `/<repository-name>/` so project-page assets and routes resolve correctly.

For GitHub Pages, create a repository **Actions variable** named `VITE_API_URL` containing the full HTTPS API base URL, including `/api`. The deploy workflow refuses to publish when this variable is missing or non-HTTPS.

Do not embed backend secrets in `VITE_*` variables: Vite variables are part of the client bundle and are public.

## Local development

```bash
npm ci
npm run dev
```

Useful validation commands:

```bash
npm run typecheck
npm run lint
npm run stylelint
npm run prettier
npm test
npm run build
```

`npm run build` uses Vite production mode and therefore requires `VITE_API_URL` in the environment or an appropriate `.env` file. HTTP is accepted only for loopback hosts such as `localhost` during local validation.

## CI

The frontend CI workflow validates pushes to `develop`/`main` and pull requests targeting either branch. It runs dependency installation/audit, TypeScript checking, ESLint, Stylelint, Prettier, regression tests, and a production build. CI supplies a non-routable HTTPS example API origin solely to validate compilation; it is never used for deployment.

The authentication regression tests cover the shared response policy, including session invalidation and the single refresh/retry rule. Vitest also renders the real application with mocked API responses to check registration/profile redirects, automatic sign-in after password recovery, and preservation of the current credentials after email changes, including rejected confirmation codes.

## Deployment

The GitHub Pages workflow validates the same critical checks before building/deploying `main`. It obtains the real production API URL exclusively from the repository Actions variable `VITE_API_URL`.

For GitHub Pages project hosting, the workflow sets the Vite/Router base to `/<repository-name>/`. After the production build it copies `dist/index.html` to `dist/404.html`; GitHub Pages therefore serves the SPA for direct deep-link requests while React Router keeps normal path-based URLs instead of hash routing.

GitHub Actions is the canonical deployment path for this template; the legacy local `gh-pages` package deployment script is intentionally not included.

Before deploying the frontend together with backend authentication changes:

1. Deploy/configure the backend and run required database migrations first.
2. Confirm backend `/api/health/live` and `/api/health/ready`.
3. Set/verify the repository Actions variable `VITE_API_URL` with the real HTTPS backend `/api` URL.
4. Confirm the production frontend origin matches backend `FRONTEND_URL`/CORS configuration.
5. Confirm refresh-cookie `Secure`/`SameSite` settings match the actual frontend/backend topology.
6. Build and deploy the frontend.
7. Smoke-test the project root plus a direct deep link, then login, refresh after page reload, logout, protected routes, and remote session revocation.

## Security notes

- Never move the access token to browser persistent storage as a convenience workaround.
- Never put passwords, access/refresh tokens, verification codes, or backend secrets in console logs or analytics.
- Treat `VITE_API_URL` as public configuration.
- Prefer HTTPS for every production origin.
- Keep frontend and backend authentication/session protocol changes version-compatible.
