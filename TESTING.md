# User Service End-to-End Testing Guide

This guide walks you through verifying the complete authentication and user-profile flow using Postman and curl. It assumes the current implementation in the following files:

- [backend/user-service/app.js](backend/user-service/app.js)
- [backend/user-service/routes/auth.js](backend/user-service/routes/auth.js)
- [backend/user-service/controllers/authController.js](backend/user-service/controllers/authController.js)
- [backend/user-service/routes/userRoutes.js](backend/user-service/routes/userRoutes.js)
- [backend/user-service/controllers/userController.js](backend/user-service/controllers/userController.js)
- [backend/user-service/middleware/validators.js](backend/user-service/middleware/validators.js)
- [backend/user-service/middleware/rateLimiters.js](backend/user-service/middleware/rateLimiters.js)
- [backend/user-service/models/User.js](backend/user-service/models/User.js)

## 1) Prerequisites

- Node 18+ (Node 20 tested)
- MongoDB connection string configured in [.env](backend/user-service/.env)
- Dependencies installed: `npm install` in [backend/user-service/](backend/user-service)
- Server running: `npm run dev` in [backend/user-service/](backend/user-service)

Ensure environment variables in [.env](backend/user-service/.env):

```env
MONGODB_URI=...
PORT=3000
SESSION_SECRET=...
SESSION_NAME=your-sessions-name
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
```

## 2) Start the server

```bash
cd backend/user-service
npm run dev
```

Expected logs: session store init, server listening on port, no crashes.

## 3) Postman setup

- Create an environment with:
  - baseUrl = http://localhost:3000
  - csrfToken = (blank initially)
- Ensure “Automatically follow redirects” is ON.
- Enable cookie jar for the host so session cookies persist.

## 4) Get CSRF token

All state-changing routes (POST/PUT/PATCH/DELETE) require CSRF via header X-CSRF-Token. Fetch it first.
Request:

- Method: GET
- URL: {{baseUrl}}/api/auth/csrf-token
- Response: `{ "csrfToken": "<value>" }`
- Save the value into your Postman environment variable csrfToken.

curl:

```bash
curl -i \
  -c cookies.txt \
  "http://localhost:3000/api/auth/csrf-token"
```

The response sets an httpOnly cookie (CSRF secret) in cookies.txt and returns a token.

## 5) Sign up (register + session)

Request:

- Method: POST
- URL: {{baseUrl}}/api/auth/signup
- Headers: X-CSRF-Token: {{csrfToken}}
- Body (JSON):

```json
{
  "email": "user@example.com",
  "username": "ekx",
  "fullName": "Ekow Sackey",
  "password": "StrongP@ssw0rd"
}
```

Expected:

- 201 Created
- JSON `{ "user": { ... } }` (no password field)
- Session cookie set (check Postman cookies)

curl:

```bash
curl -i \
  -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $(jq -r .csrfToken csrf.json 2>/dev/null || echo YOUR_TOKEN)" \
  -d '{"email":"user@example.com","username":"ekx","fullName":"Ekow Sackey","password":"StrongP@ssw0rd"}' \
  "http://localhost:3000/api/auth/signup"
```

Note: Alternatively capture the token manually and replace YOUR_TOKEN.

## 6) Get current user (/api/auth/me)

Request:

- Method: GET
- URL: {{baseUrl}}/api/auth/me
  Expected:
- 200 OK with `{ "user": { ... } }` (if session cookie present)
- 401 Unauthorized if not authenticated

curl:

```bash
curl -i -b cookies.txt "http://localhost:3000/api/auth/me"
```

## 7) Logout

Request:

- Method: POST
- URL: {{baseUrl}}/api/auth/logout
- Headers: X-CSRF-Token: {{csrfToken}}
  Expected:
- 200 OK with `{ "message": "Logged out successfully. BYE!" }`
- Session invalidated

curl:

```bash
curl -i \
  -b cookies.txt -c cookies.txt \
  -H "X-CSRF-Token: YOUR_TOKEN" \
  -X POST "http://localhost:3000/api/auth/logout"
```

## 8) Login

Get a fresh CSRF token again (Step 4), then:

- Method: POST
- URL: {{baseUrl}}/api/auth/login
- Headers: X-CSRF-Token: {{csrfToken}}
- Body (JSON):

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd"
}
```

Expected:

- 200 OK with `{ "user": { ... } }`
- Session cookie set

## 9) Get my profile (/api/user/me)

Request:

- Method: GET
- URL: {{baseUrl}}/api/user/me
  Expected:
- 200 OK with `{ "user": { ... } }`
- 401 Unauthorized if session missing

## 10) Update my profile (/api/user/me)

Allowed fields: fullName, avatarUrl, countryOfResidence, countryOfOrigin, dateOfBirth.
Request:

- Method: PUT
- URL: {{baseUrl}}/api/user/me
- Headers: X-CSRF-Token: {{csrfToken}}
- Body (JSON):

```json
{
  "fullName": "Ekow S. Updated",
  "avatarUrl": "https://example.com/me.png",
  "countryOfResidence": "ghana",
  "countryOfOrigin": "ghana",
  "dateOfBirth": "1991-06-02"
}
```

Expected:

- 200 OK with updated `{ "user": { ... } }`
- 400 on invalid payload (e.g., invalid URL/date)
- 403 on missing/invalid CSRF token
- 409 on duplicate constraints (rare for these fields)

## 11) Negative tests

- Missing CSRF on POST/PUT → 403 JSON error (`invalid_csrf_token`).
- Invalid signup fields → 400 with `errors[]` (validators in [backend/user-service/middleware/validators.js](backend/user-service/middleware/validators.js)).
- Wrong login password → 401 with code `invalid_credentials` ([backend/user-service/controllers/authController.js](backend/user-service/controllers/authController.js)).
- Access /api/auth/me or /api/user/me without session → 401.
- Rate limit exceeded for signup/login → 429 with `too_many_requests` ([backend/user-service/middleware/rateLimiters.js](backend/user-service/middleware/rateLimiters.js)).

## 12) Swagger UI quick check

- Open: http://localhost:3000/api/docs
- For POST/PUT, first fetch CSRF token and add X-CSRF-Token in “Try it out”.
- Note: Swagger UI sends requests from the browser; ensure CORS origin is allowlisted in [.env](backend/user-service/.env) under `CORS_ORIGINS`.

## 13) Troubleshooting

- App crash: “argument handler must be a function”
  - Ensure user routes export the router: [backend/user-service/routes/userRoutes.js](backend/user-service/routes/userRoutes.js).
- App crash: path-to-regexp missing parameter name
  - Remove invalid globs like `app.options("/api/*", ...)`. If needed, prefer `app.options(/^\/api(?:\/.*)?$/, cors(corsOptions));`.
- Rate limiter IPv6 ValidationError
  - Remove custom `keyGenerator` in [backend/user-service/middleware/rateLimiters.js](backend/user-service/middleware/rateLimiters.js) or use `rateLimit.ipKeyGenerator`.
- CSRF 403 on POST/PUT
  - Always call GET /api/auth/csrf-token first; send the returned token in `X-CSRF-Token` and keep cookies enabled.
- 401 Unauthorized
  - Session cookie missing; ensure cookies are persisted in Postman and not cleared by logout before testing.
- CORS errors in browser
  - Ensure the frontend origin is listed in CORS_ORIGINS and `credentials: true` is set in [backend/user-service/app.js](backend/user-service/app.js).

## 14) Cleanup

- In your database GUI (e.g., MongoDB Compass), you can delete test users created during the flow.

All tests reflect the behavior of the current implementation; if you change controllers, validators, or security middleware, re-run these tests accordingly.
