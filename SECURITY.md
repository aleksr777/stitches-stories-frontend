# Frontend security

The application keeps access tokens in JavaScript memory and refresh tokens in an `HttpOnly` cookie issued by the API. Do not move access tokens to `localStorage` or `sessionStorage`.

## Content Security Policy

The Vite build injects a browser-enforced CSP meta policy into `index.html`. In production, `connect-src` is restricted to the exact origin derived from `VITE_API_URL` plus the frontend origin. Development builds additionally allow `ws:`/`wss:` for Vite HMR.

GitHub Pages does not allow this repository to configure arbitrary HTTP response headers, so the meta policy provides the strongest portable baseline available on the current static host.

For production hosting under your own reverse proxy or a provider that supports custom response headers, prefer sending CSP as an HTTP response header.

Recommended additional response headers for production hosting:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.example.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Content-Type-Options: nosniff
```

`frame-ancestors` cannot be enforced from a CSP `<meta>` element, so clickjacking protection should be configured as an HTTP response header when the frontend is moved behind a configurable production host.

## Deployment

The CI workflow runs dependency audit, TypeScript checking, ESLint, Stylelint, Prettier, regression tests, and the production build for pushes to `develop`/`main` and pull requests targeting either branch. The GitHub Pages deployment repeats these checks before publishing `main`.

Production deployment requires the repository Actions variable `VITE_API_URL` to contain the real HTTPS backend API URL. The build validates it and uses only its origin in `connect-src`; the full URL remains available to the frontend API client.
