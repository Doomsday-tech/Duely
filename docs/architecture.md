# Architecture & System Design — Duely

## Overview

Duely is designed as a calm, modular monolith built around a fundamental entity lifecycle:

```
ITEM (Thing) → DOCUMENT → EXPIRY / DEADLINE → ACTION → REMINDER → RENEWAL HISTORY
```

The system prioritizes deterministic expiry calculations, multi-tenant data isolation, and user agency over opaque automation.

---

## High-Level Topology

```
+------------------------------------------------------------------+
|                           Client Layer                           |
|       React 19 + TypeScript + Vite + Tailwind CSS (v4)          |
|    - Single-page architecture                                    |
|    - State: AuthContext, ThingsContext, Modal Controllers        |
|    - Design: Warm Editorial / Modern Premium Planner             |
|      * Soft Oat flat background (#F7F6F3)                        |
|      * Natural off-white left sidebar (#EFECE6)                  |
|      * Soft charcoal & dark slate typography (#2C2C2C / #1C1C1E) |
|      * Serif headers (Lora) paired with clean sans (Inter)       |
|      * Standard sentence casing, no terminal brackets or slashes  |
|      * Faint warm-gray item dividers (#E2E0D9)                   |
|      * Structured buttons with gentle 5px radius (rounded-[5px]) |
+---------------------------------+--------------------------------+
                                  | HTTP / JSON + Bearer JWT
                                  v
+---------------------------------+--------------------------------+
|                        Server & API Layer                        |
|                     Node.js 22 + Express 4                       |
|    - Modular architecture (auth, things, documents, reminders)   |
|    - Multer file storage (PDF/image upload & validation)         |
|    - In-process reminder scheduler (60-second ticker)            |
+---------------------------------+--------------------------------+
                                  |
                                  v
+---------------------------------+--------------------------------+
|                           Data Layer                             |
|                        Prisma ORM Client                         |
|    - SQLite (dev.db) for zero-config local dev & tests           |
|    - PostgreSQL drop-in schema for production environments       |
|    - Foreign keys, cascades, composite indexes, timestamps       |
+------------------------------------------------------------------+
```

---

## Core Modules

### 1. Auth Module (`server/src/modules/auth`)
- **Password Security**: Passwords hashed with `bcryptjs` (10 salt rounds).
- **Session Tokens**: Cryptographically signed JSON Web Tokens (JWT) with 14-day validity.
- **Tenant Isolation**: All database operations scope records by `userId` extracted from the verified JWT payload. Users cannot read, mutate, or delete another user's records.

### 2. Things Module (`server/src/modules/things`)
- Handles creation, lifecycle management, updates, and renewal of personal tracked items.
- Automatically calculates:
  - `daysRemaining` (UTC midnight delta)
  - `status` (`ACTIVE`, `DUE_SOON`, `URGENT`, `EXPIRED`, `OVERDUE`, `RENEWED`)
  - `urgencyLevel` (`urgent`, `soon`, `upcoming`, `overdue`)
  - Human-friendly label (e.g., "Due today", "Tomorrow", "6 days", "2 months", "1 year")

### 3. Expiry Calculation Engine (`server/src/utils/expiry.ts`)
- Calendar-day difference algorithm calculates day offsets strictly by UTC calendar date, preventing 1-hour daylight savings or timezone transition drift.
- Supports both `expiryDate` and `renewalDate`.
- Thresholds:
  - `< 0 days`: `OVERDUE` (urgency: overdue)
  - `0 - 7 days`: `URGENT` (urgency: urgent)
  - `8 - 30 days`: `DUE_SOON` (urgency: soon)
  - `> 30 days`: `ACTIVE` (urgency: upcoming)

### 4. Document Intelligence & Storage (`server/src/modules/documents`)
- Multi-part document upload via Multer (max 25MB).
- Validates mime types (PDF, images, word documents).
- **Intelligence Pipeline**:
  - Uses Google GenAI (`@google/genai`) when `GEMINI_API_KEY` is present.
  - Falls back to heuristic regex and ISO-date parser when offline.
  - **Human-in-the-loop guarantee**: Extraction results are presented to the user with explicit `[Confirm]` and `[Edit]` controls before writing or changing item deadlines.

### 5. Action System (`server/src/modules/actions`)
- Differentiates Duely from passive reminder apps.
- Links actionable tasks directly to things (e.g., "Renew insurance policy", "Inspect battery health", "Send lease renewal notice").
- Allows external URLs and completion toggles.

### 6. Renewal Lifecycle & History (`server/src/modules/things/things.service.ts`)
- On renewal:
  1. Archives previous expiry date, cost, and notes to `RenewalHistory`.
  2. Sets new expiry date on `Thing`.
  3. Recalculates reminder schedule for the new cycle.
  4. Marks pending renewal actions completed.
  5. Never deletes historical records.

### 7. Background Reminder Job (`server/src/jobs/reminderJob.ts`)
- Runs every 60 seconds.
- Queries `Reminder` records where `status = 'PENDING'` and `remindAt <= now`.
- Updates reminder status to `TRIGGERED` and syncs items transitioning into overdue states.
- Exposes programmatic and manual API triggers for testing and external cron integration.
