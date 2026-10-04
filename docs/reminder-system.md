# Reminder & Deadline Engine — Duely

## Principles

1. **Deterministic Calculations**: Urgency is computed dynamically from calendar UTC dates, never stored as stale static counts.
2. **Action-Oriented**: A reminder exists to prompt a specific action, not merely create noise.
3. **Multi-Stage Staggering**: Items support multiple notification lead times (e.g., 30 days before, 14 days before, 7 days before, 1 day before).

---

## State Lifecycle

```
[Create Item with Deadline]
           ↓
[Schedule Reminders] (e.g., 30d, 14d, 7d before)
           ↓
[Status: ACTIVE] (days > 30)
           ↓
[Status: DUE_SOON] (8 <= days <= 30)
           ↓
[Status: URGENT] (0 <= days <= 7)
           ↓
[Reminder Fires (remindAt <= now)] → Status: TRIGGERED
           ↓
[Target Date Passes (days < 0)] → Status: OVERDUE
           ↓
[User Executes Action & Renews]
           ↓
[Archive in RenewalHistory & Recalculate Reminders]
           ↓
[Status: ACTIVE]
```

---

## Urgency Thresholds

| Days Remaining | Status | Urgency Level | Human Label Pattern |
|---|---|---|---|
| `< 0` | `OVERDUE` | `overdue` | "Overdue by X days" / "Expired yesterday" |
| `0` | `URGENT` | `urgent` | "Due today" |
| `1` | `URGENT` | `urgent` | "Tomorrow" |
| `2 – 7` | `URGENT` | `urgent` | "X days" |
| `8 – 30` | `DUE_SOON` | `soon` | "X days" |
| `31 – 60` | `ACTIVE` | `upcoming` | "1 month" |
| `61 – 365` | `ACTIVE` | `upcoming` | "X months" |
| `> 365` | `ACTIVE` | `upcoming` | "X years" |

---

## Background Scheduler Implementation

The background job (`server/src/jobs/reminderJob.ts`) operates on an in-process ticker:

1. **Cycle Interval**: Runs every 60 seconds (`intervalMs = 60000`).
2. **Reminder Triggering**:
   ```sql
   SELECT * FROM Reminder WHERE status = 'PENDING' AND remindAt <= NOW()
   ```
   Updates matching reminders to `status = 'TRIGGERED'` and records `triggeredAt`.
3. **Status Synchronization**:
   Iterates active items whose effective dates have elapsed and synchronizes their state from `DUE_SOON` to `OVERDUE`.
4. **Manual & API Triggers**:
   Developers and administrators can trigger the job on-demand via `POST /api/jobs/run-reminders` or in unit/integration test scripts.
