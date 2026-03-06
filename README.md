# Frutiger Cloud

Frutiger Cloud is a full-stack web app with a nostalgic **Frutiger Aero** interface. It supports registration, login, JWT-based sessions, and file management in per-user Google Drive folders.

## Tech stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js + Express.js
- **Database:** SQLite
- **Authentication:** bcrypt password hashing + JWT tokens
- **Storage:** Google Drive API (service account)

## Project structure

```text
/backend
  server.js
  auth.js
  drive.js
  database.js
  middleware.js
/frontend
  index.html
  login.html
  dashboard.html
  files.html
  style.css
  app.js
```

## Features

1. User registration (`username`, `email`, `password`)
2. Password hashing with bcrypt
3. Automatic creation of user Google Drive folder under `frutiger-cloud/<username>`
4. Login system with JWT token sessions
5. Dashboard after login
6. File upload to user Google Drive folder
7. Files page with list + download + delete actions
8. Frutiger Aero visual style: gradients, glossy controls, glassmorphism, and animated bubbles

## Local setup instructions

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
JWT_SECRET=replace_with_secure_secret
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

> Notes:
> - Use a Google Cloud service account with the Drive API enabled.
> - If you plan to use a shared drive/folder permission model, ensure the service account has access to the target Drive.

### 3) Run locally

```bash
npm start
```

Open:

- `http://localhost:3000/index.html` for registration
- `http://localhost:3000/login.html` for login

## Deployment notes

The app is easy to deploy later because it is a stateless Express server + SQLite database file. For production:

- Move SQLite to managed storage or a managed DB alternative.
- Set strong environment variables for JWT and Google credentials.
- Use HTTPS and reverse proxy (Nginx / cloud load balancer).
- Replace local token storage strategy if stricter security is needed.
