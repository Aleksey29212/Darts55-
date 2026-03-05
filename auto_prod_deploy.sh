#!/bin/bash
set -e

# --- Log Colors ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# --- GitHub Configuration (User must fill these in!) ---
GITHUB_USER="<YOUR_GITHUB_USERNAME>"
GITHUB_REPO="<YOUR_GITHUB_REPOSITORY>"
# GITHUB_TOKEN is expected to be in the environment, e.g., export GITHUB_TOKEN="your_token"

# ===============================================
# 1. PROJECT STRUCTURE AND FILE GENERATION
# ===============================================
log_info "1️⃣  Setting up project structure and configuration files..."

# --- Create directory structure ---
mkdir -p src/app src/components src/lib public
log_info "Standard directories ensured."

# --- Create package.json ---
cat > package.json <<EOL
{
  "name": "darts55-prod",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3000"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "firebase": "11.9.1"
  },
  "devDependencies": {
    "@types/node": "20",
    "@types/react": "18",
    "@types/react-dom": "18",
    "typescript": "5"
  },
  "engines": {
    "node": ">=20"
  }
}
EOL
log_info "Created package.json"

# --- Create next.config.ts ---
cat > next.config.ts <<EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone"
};
export default nextConfig;
EOL
log_info "Created next.config.ts"

# --- Create Dockerfile ---
cat > Dockerfile <<EOL
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy the standalone output from the builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
EOL
log_info "Created Dockerfile"

# --- Create .gitignore ---
cat > .gitignore <<EOL
# Dependencies
/node_modules
/.pnp
.pnp.js

# Next.js
/.next/
/out/

# Production
/build

# Env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Misc
.DS_Store
*.pem
*.log
auto_prod_deploy.sh
EOL
log_info "Created .gitignore"

# --- Create .dockerignore ---
cat > .dockerignore <<EOL
.git
.next/cache
node_modules
Dockerfile
.env
.env.local
auto_prod_deploy.sh
README.md
EOL
log_info "Created .dockerignore"

# --- Create .env.example ---
cat > .env.example <<EOL
# Firebase Public Config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Admin Password
NEXT_PUBLIC_ADMIN_PASSWORD=

# AI Services
GEMINI_API_KEY=

# GitHub token for API calls from the app
GITHUB_TOKEN=
EOL
log_info "Created .env.example"

# --- Create simplified layout and page ---
cat > src/app/layout.tsx <<EOL
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
EOL

cat > src/app/page.tsx <<EOL
export default function Page() {
  return <h1>Darts55 работает 🚀</h1>
}
EOL
log_info "Created simplified layout and page."

# --- Create lib/firebase.ts ---
cat > src/lib/firebase.ts <<EOL
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;
EOL
log_info "Created src/lib/firebase.ts"

# --- Create README.md ---
cat > README.md <<EOL
# Darts55 - Production Deployment

This project is configured for automated deployment to Timeweb via Docker and GitHub Actions.

### Deployment

Pushing to the \`main\` branch will trigger the GitHub Actions workflow to build and deploy the application.
EOL
log_info "Created README.md"

# ===============================================
# 2. BUILD AND TEST
# ===============================================
log_info "\n2️⃣  Installing dependencies and building the project..."

npm install || { log_error "npm install failed"; exit 1; }
log_info "Dependencies installed."

npm run build || { log_error "Build failed"; exit 1; }
log_info "Project built successfully."

log_info "\n3️⃣  Starting local server for health check..."
npm start &
SERVER_PID=$!
sleep 10 # Give server time to start

log_info "Pinging server at http://localhost:3000..."
if curl -s --head http://localhost:3000 | head -n 1 | grep "200 OK" > /dev/null; then
    log_info "✅ Health check PASSED. Server is running."
else
    log_error "❌ Health check FAILED. Server did not respond with 200 OK."
    kill $SERVER_PID
    exit 1
fi
kill $SERVER_PID
log_info "Server stopped."

# ===============================================
# 3. GIT OPERATIONS
# ===============================================
log_info "\n4️⃣  Preparing for deployment..."

if [ -z "$GITHUB_TOKEN" ]; then
    log_error "GITHUB_TOKEN is not set. Please set it as an environment variable."
    exit 1
fi

if [[ "$GITHUB_USER" == "<YOUR_GITHUB_USERNAME>" ]] || [[ "$GITHUB_REPO" == "<YOUR_GITHUB_REPOSITORY>" ]]; then
    log_error "Please update GITHUB_USER and GITHUB_REPO variables in the script."
    exit 1
fi

if [ ! -d ".git" ]; then
    log_info "Initializing new Git repository."
    git init
    git branch -M main
fi

# Ensure remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    log_info "Adding git remote origin."
    git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git
else
    log_info "Git remote 'origin' already exists."
fi

git add .
git commit -m "feat: Production-ready setup via automation script" || log_warn "No new changes to commit."
log_info "Committed changes."

log_info "Pushing to GitHub... This will trigger the deployment workflow."
git push -u origin main --force || { log_error "git push failed!"; exit 1; }
log_info "✅ Successfully pushed to GitHub."

# ===============================================
# 4. DEPLOYMENT INFO
# ===============================================
log_info "\n5️⃣  Deployment process initiated on GitHub."
echo -e "Your project is now being built and deployed by the existing GitHub Actions workflow."
echo -e "You can monitor the progress here: ${GREEN}https://github.com/${GITHUB_USER}/${GITHUB_REPO}/actions${NC}"
echo -e "Once completed, your application will be available on your Timeweb Cloud URL."
