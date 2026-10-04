# Security
- Keys live only in Vercel environment variables; the client never sees them. `/api/health` reports provider names, never keys.
- On Vercel (or `NODE_ENV=production`) a missing or short (<24 chars) `ENGINE_TOKEN` makes every API, including `/api/session`, return 503 (fail closed). Locally, with no token set, the API is open for development.
- Skill files are untrusted data: hashed before use, size-capped (64 KB), path-traversal and symlink checked, never executed. In prompts they are wrapped in `<skill>` tags with a system rule that they cannot grant tools or override rules.
- Free-only policy: OpenRouter models must end in `:free`; any 429/402/5xx moves to the next free provider, then stops with `PROVIDERS_EXHAUSTED`. No paid fallback exists in code.

## Authentication
Two ways in, both checked by `guard()` in `api/_core.mjs`:

1. **Browser: HttpOnly cookie session.** `POST /api/session` with `{token}` and header `X-Requested-With: poors`. The token is compared in constant time (SHA-256 digests compared with `timingSafeEqual`, so there is no length leak). On success the server sets
   `poors_session=<expiryEpoch>.<base64url HMAC-SHA256(key, expiry)>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=604800`.
   The HMAC key is derived from `ENGINE_TOKEN` (`HMAC(ENGINE_TOKEN, "poors-session-v1")`), so the session is stateless and **rotating `ENGINE_TOKEN` revokes every session**. Cookies with a bad signature, a past expiry, an expiry more than 7 days ahead, or a malformed value are rejected.
   `GET /api/session` → `{authenticated}`; `DELETE /api/session` (with the header) clears the cookie.
2. **Scripts and tests: `Authorization: Bearer <ENGINE_TOKEN>`.** If an `Authorization` header is present it alone decides the result; a wrong bearer is not rescued by a valid cookie.

- **CSRF:** cookie-authenticated non-GET requests must send `X-Requested-With: poors` (403 otherwise). A cross-site form cannot set custom headers, and a cross-site `fetch` with one needs a CORS preflight that this API never grants. `SameSite=Strict` is a second layer. Login and logout require the header too. Bearer requests do not need it (no ambient credentials).
- **Brute force:** serverless functions have no shared rate-limit store, so every failed login waits a fixed 400 ms before answering 401. The real protection is token entropy: use 24+ random characters (32+ recommended). Vercel's firewall rate limiting can be added on `/api/session` if needed.
- **No secrets in responses or logs:** neither the token nor the cookie value is echoed in JSON bodies, and no handler logs request bodies or headers.
- **Console:** the password field is cleared as soon as the form is submitted; the token is never kept in JS variables, `localStorage` or `sessionStorage`. All requests use `credentials: 'same-origin'`. The cookie is HttpOnly, so page scripts (and XSS) cannot read it.

## Known limits
- Logout clears the browser cookie, but a stolen cookie value stays valid until it expires (max 7 days), because sessions are stateless. Rotate `ENGINE_TOKEN` to revoke all sessions at once.
- `Secure` cookies are not stored over plain `http://` except on `localhost`; use `http://localhost:<port>` for the local dev server.
