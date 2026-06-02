# x-bot

X (Twitter) automation platform built with Next.js, Playwright, and Prisma.

## Features

- **Account Creation** - Automated X account creation with temporary emails (Mail.tm)
- **Account Warming** - Human-like browsing to make accounts appear legitimate
- **Campaigns** - Bulk like, retweet, comment, and video plays across multiple accounts
- **Multi-tenant** - Admin creates clients; each client manages their own accounts
- **Anti-detection** - Randomized user agents, viewports, timezones, and human-like delays

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma |
| Browser Automation | Playwright (Chromium) |
| Styling | Tailwind CSS v4 |
| Validation | Zod |

## Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `MAILTM_API_URL` | Mail.tm API endpoint | `https://api.mail.tm` |

## Initial Setup

1. Start the dev server: `npm run dev`
2. Create the first admin via the seed endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/seed \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}'
   ```
3. Login with the admin credentials
4. Create clients from the admin panel

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Run tests
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # React components
├── context/          # React context (auth)
├── lib/              # Core libraries
│   ├── playwright/   # Browser automation engine
│   ├── mailtm/       # Temporary email client
│   ├── sse/          # Server-Sent Events manager
│   ├── utils/        # Stealth config, random data generator
│   ├── validation/   # Zod schemas
│   └── errors.ts     # Error handling system
└── proxy.ts          # Next.js middleware (auth protection)
```

## Docker

```bash
docker-compose up -d
```

## License

MIT
