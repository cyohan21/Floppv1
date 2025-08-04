# Flopp.app

Flopp.app is a playful, open‑source spending tracker. The project is structured as a monorepo with a TypeScript/Express backend and an Expo React Native client.

## Repository layout

```
.
├── apps
│   ├── backend    # Node.js REST API
│   └── mobile     # Expo/React Native app
├── documentation  # design notes and other docs
└── README.md      # you are here
```

## Requirements

- **Node.js** 18 or newer (Node 22 is used in the Dockerfiles)
- **npm**
- **PostgreSQL** for the backend
- Optional: **Docker** and **docker compose**

## Getting started

Clone the repository and install dependencies for each app:

```bash
git clone <repo-url>
cd Floppv1

# backend dependencies
cd apps/backend
npm install

# mobile dependencies
cd ../mobile
npm install
```

## Backend (`apps/backend`)

### Environment variables

Create `apps/backend/.env` with the following values:

```
DEV_DB_URL=postgresql://user:password@localhost:5432/flopp
PORT=3030
BACKEND_URL=http://localhost:3030
FRONTEND_URL=http://localhost:8081
FRONTEND_PORT=8081
CUSTOM_URL_SCHEME=myapp-dev://
APP_NAME=Flopp.app
ANDROID_PACKAGE_NAME=com.example.myapp

# Third‑party services (optional)
PLAID_CLIENT_ID=your-plaid-client
PLAID_SECRET=your-plaid-secret
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email settings
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

`DEV_DB_URL` is used by Prisma to connect to PostgreSQL.

### Database setup

Run migrations and generate the Prisma client:

```bash
npx prisma migrate dev
```

### Running the API

```bash
npm run dev        # start with hot reload
npm run build      # build for production
npm start          # run the compiled server
```

The server listens on `http://localhost:3030` and exposes a health check at `/api/health`.

### Tests

Run the unit tests with Vitest:

```bash
npm test
```

### Docker

The backend ships with a Dockerfile:

```bash
docker build -t flopp-backend apps/backend
docker run --env-file apps/backend/.env -p 3030:3030 flopp-backend
```

## Mobile app (`apps/mobile`)

### Environment variables

Copy the example file and adjust values for your environment:

```bash
cd apps/mobile
cp env.example .env
```

The `.env` file defines values such as:

```
APP_NAME=MyApp
APP_SLUG=my-app
CUSTOM_URL_SCHEME=myapp
API_BASE_URL=https://api.example.com/api
WEB_BASE_URL=https://app.example.com
IOS_BUNDLE_ID=com.example.myapp
ANDROID_PACKAGE_NAME=com.example.myapp
EAS_PROJECT_ID=your-project-id
EXPO_OWNER=your-expo-username
```

### Running the app

```bash
npm start           # expo dev server
```

Use the terminal options to open the app on Android, iOS or the web (`npm run android`, `npm run ios`, or `npm run web`).

### Linting

```bash
npm run lint
```

### Docker

```
docker build -t flopp-mobile apps/mobile
docker run --env-file apps/mobile/.env -p 8081:8081 flopp-mobile
```
