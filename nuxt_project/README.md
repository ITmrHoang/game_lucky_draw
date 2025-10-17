# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

create pass hash:
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"

env : ADMIN_PASSWORD_HASH


# What I added:
PWA:
public/manifest.webmanifest and public/sw.js
Registers service worker in app/app.vue
Adds manifest link in nuxt.config.ts
Production Docker:
DockerFileBuild multi-stage build using Nuxt .output server
Build/run:
Local PWA dev:
```
npm i
npm run dev```
Docker build:
```
docker build -f DockerFileBuild -t lucky-draw:prod .
docker run -p 3000:3000 --env ADMIN_PASSWORD_HASH=<sha256> --env ADMIN_SESSION_SECRET=<secret> lucky-draw:prod
```