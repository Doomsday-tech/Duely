# Duely

> Know what's due.

Duely is a personal life-admin and expiry management application. It gives you a single place to track documents, warranties, insurance policies, and critical personal deadlines before they become problems.

---

## The Problem

Important deadlines are usually scattered across emails, paper folders, WhatsApp messages, calendar entries, and memory:
- A car insurance policy lapses unnoticed until an accident occurs or a traffic stop happens.
- A laptop warranty expires a week before the battery starts bulging.
- A passport expires with only 4 months validity remaining, invalidating international boarding.
- A domain name auto-renew quietly fails on an expired credit card.
- A rental agreement requires 30 days notice to the landlord, which passes unnoticed.

Generic to-do and reminder apps only handle task lists. They don't track the core relationship:

```
ITEM → DOCUMENT → EXPIRY / DEADLINE → ACTION → REMINDER
```

Duely brings these into a single calm interface so you can answer in five seconds: **"What do I need to worry about?"**

---

## Core Features

- **Executive Action Dashboard**: Instantly divides your horizon into **Attention** (urgent and due soon) and **Upcoming** (months and years ahead). No unnecessary analytics charts.
- **Document Intelligence (Human-in-the-Loop)**: When uploading policies, warranties, and invoices, Duely extracts dates and identifiers (using Gemini when available, or heuristic pattern analysis). Extracted values are presented with explicit `[Confirm]` / `[Edit]` controls—the user always remains in control.
- **Action System**: Deadlines are coupled directly to actions (e.g., "Renew insurance online", "Compare quotes", "Inspect battery before warranty cutoff").
- **Renewal Lifecycle & History**: Marking an item renewed automatically archives the previous expiry in an immutable historical ledger (`2024 → 2025 → 2026`) and recalculates reminder schedules for the next cycle.
- **Multi-Stage Reminders**: Configure multiple reminder checkpoints (e.g., 30 days, 14 days, 7 days, 1 day before).
- **Timeline & Calendar**: Chronological horizon of expirations, renewals, and actions.
- **Global Search (`⌘K` / `/`)**: Fast search across item names, notes, attached file names, categories, and policy numbers.
- **Warm Editorial / Modern Premium Planner UI**: Inspired by high-end physical stationery and notebook ledgers. Built on a calming Soft Oat background (`#F7F6F3`), an organic off-white left sidebar (`#EFECE6`), soft charcoal and dark slate typography (`#2C2C2C` / `#1C1C1E`), literary serif titles (`Lora`), human-readable sans-serif body text (`Inter`), standard sentence casing, faint warm-gray dividers (`#E2E0D9`), gentle 5px border-radii (`rounded-[5px]`) on buttons without generic pill bubbles, and comfortable breathable whitespace.

---

## Architecture & Tech Stack

Duely is structured as a clean, modular monolith:

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (v4), Lucide React.
- **Backend**: Node.js 22, Express 4, TypeScript (`tsx`).
- **Database**: PostgreSQL-ready schema with Prisma ORM (configured with SQLite for zero-config local development and testing).
- **Authentication**: Salted password hashing via `bcryptjs`, stateless JWT bearer tokens, row-level tenant isolation.
- **File Storage**: Local filesystem disk storage (`uploads/`), architected for easy swap to S3 or Google Cloud Storage.
- **Background Jobs**: In-process 60-second ticker checking upcoming deadlines and transitioning overdue statuses.

---

## Setup & Running Locally

### 1. Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- npm 10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Default configuration in `.env`:
```ini
DATABASE_URL="file:./dev.db"
JWT_SECRET="duely-dev-jwt-secret-key-32charsmin"
PORT="3000"
# GEMINI_API_KEY="" # Optional: activates GenAI document intelligence
```

### 4. Database Setup & Migrations
Synchronize the Prisma schema to create the local SQLite database (`dev.db`):
```bash
npx prisma db push
```

For PostgreSQL in production, set `DATABASE_URL="postgresql://user:password@localhost:5432/duely"` and run:
```bash
npx prisma migrate dev --name init --schema=prisma/schema.postgresql.prisma
```

### 5. Seed Development Data
Seed a pre-populated development account (`demo@duely.local`) with realistic dates:
```bash
npm run seed
```

### 6. Start the Server
Start the full-stack server (Express backend + Vite frontend):
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## Development Demo Credentials

| Role | Email | Password |
|---|---|---|
| Development User | `demo@duely.local` | `Password123!` |

*(You can also click the "Use Demo Account" shortcut on the sign-in page)*

---

## Testing

Run the automated test suite covering unit calculations, date edge cases (expiry today, tomorrow, already expired, timezone diffs), authentication, tenant isolation, and renewal history:

```bash
npm run test
```

Expected output:
```
=============================================
  DUELY: Comprehensive Backend & Edge Cases Test Suite
=============================================
  ✓ Expiry Today calculates daysRemaining === 0
  ✓ Expiry Tomorrow calculates daysRemaining === 1
  ✓ Expired Yesterday calculates daysRemaining === -1
  ✓ Overdue by 6 days
  ✓ 14 days remaining categorized as DUE_SOON
  ✓ Calendar day diff handles cross-hour timezone differences consistently
  ✓ User 1 registered and received JWT token
  ✓ Tenant isolation: User 2 cannot read User 1 item
  ✓ Renewal history entry archived
=============================================
  RESULTS: 33 passed, 0 failed (Total: 33)
=============================================
```

---

## Known Limitations & Production Readiness

- **File Storage**: In this development configuration, uploaded documents are stored in the local `uploads/` directory. For multi-instance production deployments, mount an S3/GCS bucket abstraction.
- **Job Concurrency**: The background reminder job runs in-process. In a horizontally scaled cluster, execute the job as a single worker process or use PgBoss/BullMQ.
- **Email Delivery**: The reminder engine transitions records to `TRIGGERED` and dispatches in-app notifications. Email delivery requires configuring an SMTP/Postmark transport.

---

## Suggested GitHub Commit Sequence

```
feat: create initial application structure
feat: add authentication
feat: add things and categories
feat: add expiry tracking
feat: add reminders
feat: add document management
feat: add action tracking
feat: add renewal history
feat: add search
test: add expiry edge cases
test: add authorization tests
docs: add architecture documentation
```
