```sh
npm ci

# Database: Docker
npm run db

# Database alternative without Docker: keep this running in a separate terminal
npm run db:local

# With either database running
npm run seed
npm run dev

# Or run the API and web in separate terminals
npm run dev:api
npm run dev:web

# Production build
npm run build

# API: separate terminal
npm run start --workspace api

# Web: separate terminal
npm run start --workspace web

```
