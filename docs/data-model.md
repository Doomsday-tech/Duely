# Data Model & Relational Schema — Duely

## Relational Entity Hierarchy

```
User (1)
  ├── Category (N)
  ├── Thing (N)
  │     ├── Document (N)
  │     ├── Reminder (N)
  │     ├── Action (N)
  │     └── RenewalHistory (N)
  ├── Document (N) [Direct user ownership]
  ├── Reminder (N)
  ├── Action (N)
  └── RenewalHistory (N)
```

Every secondary entity maintains a direct foreign key to `User`, enforcing strict row-level tenant isolation across all query layers.

---

## Entity Definitions

### 1. User
Represents an authenticated account owner.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / String | PK, Default UUID | Primary key |
| `email` | String | Unique, Indexed | User email address |
| `name` | String | Not Null | User display name |
| `passwordHash` | String | Not Null | bcrypt hash of password |
| `createdAt` | DateTime | Default now() | Account creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last profile modification |

---

### 2. Category
Organizes Things into high-level domains (e.g., Insurance, Vehicles, Warranties).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / String | PK | Primary key |
| `userId` | UUID / String | FK -> User(id), Cascade | Owner user (null for system defaults) |
| `name` | String | Not Null | Category label |
| `color` | String | Nullable | Subtle accent color token |
| `createdAt` | DateTime | Default now() | Creation timestamp |

Unique Constraint: `[userId, name]`

---

### 3. Thing
The central tracked record.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / String | PK | Primary key |
| `userId` | UUID / String | FK -> User(id), Cascade | Owner user ID |
| `categoryId` | UUID / String | FK -> Category(id), SetNull | Associated category |
| `name` | String | Not Null | Item name (e.g., "Car Insurance") |
| `description` | String | Nullable | Brief summary |
| `purchaseDate` | DateTime | Nullable | Initial purchase or registration date |
| `expiryDate` | DateTime | Nullable, Indexed | Expiration or validity cutoff |
| `renewalDate` | DateTime | Nullable | Scheduled renewal target |
| `status` | String | Default "ACTIVE", Indexed | ACTIVE, DUE_SOON, URGENT, EXPIRED, OVERDUE, RENEWED |
| `notes` | String | Nullable | Personal notes, policy terms |
| `createdAt` | DateTime | Default now() | Record creation date |
| `updatedAt` | DateTime | Auto-updated | Last updated timestamp |

Indexes: `[userId]`, `[expiryDate]`, `[status]`

---

### 4. Document
Supporting physical or digital proof (policy, invoice, passport, lease).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / String | PK | Primary key |
| `userId` | UUID / String | FK -> User(id), Cascade | Owner user ID |
| `thingId` | UUID / String | FK -> Thing(id), SetNull | Associated item |
| `filename` | String | Not Null | On-disk storage filename |
| `originalName` | String | Not Null | User-uploaded original filename |
| `mimeType` | String | Not Null | File MIME type (e.g. application/pdf) |
| `size` | Int | Not Null | Size in bytes |
| `filePath` | String | Not Null | Absolute or relative disk path |
| `documentType` | String | Nullable | POLICY, INVOICE, PASSPORT, WARRANTY, CONTRACT, CERTIFICATE |
| `issueDate` | DateTime | Nullable | Document issue date |
| `expiryDate` | DateTime | Nullable | Extracted or confirmed expiry date |
| `identifier` | String | Nullable | Policy number, serial number, ID |
| `extractedMeta` | String (JSON) | Nullable | Raw extraction hints from parser |
| `createdAt` | DateTime | Default now() | Upload timestamp |
| `updatedAt` | DateTime | Auto-updated | Metadata modification timestamp |

Indexes: `[userId]`, `[thingId]`

---

### 5. Reminder
Scheduled notification checkpoint.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / String | PK | Primary key |
| `userId` | UUID / String | FK -> User(id), Cascade | Owner user ID |
| `thingId` | UUID / String | FK -> Thing(id), Cascade | Associated item |
| `daysBefore` | Int | Not Null | Lead time (e.g., 30, 14, 7 days) |
| `customDate` | DateTime | Nullable | Specific override date if any |
| `remindAt` | DateTime | Not Null, Indexed | Calculated trigger timestamp |
| `channel` | String | Default "IN_APP" | IN_APP or EMAIL |
| `status` | String | Default "PENDING", Indexed | PENDING, TRIGGERED, DISMISSED |
| `triggeredAt` | DateTime | Nullable | When reminder fired |
| `createdAt` | DateTime | Default now() | Timestamp |
| `updatedAt` | DateTime | Auto-updated | Timestamp |

Indexes: `[userId]`, `[thingId]`, `[remindAt, status]`

---

### 6. Action
Action required before or upon expiry.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / String | PK | Primary key |
| `userId` | UUID / String | FK -> User(id), Cascade | Owner user ID |
| `thingId` | UUID / String | FK -> Thing(id), Cascade | Associated item |
| `title` | String | Not Null | Action description |
| `actionUrl` | String | Nullable | Portal or payment link |
| `notes` | String | Nullable | Action specific guidance |
| `completed` | Boolean | Default false | Completion status |
| `completedAt` | DateTime | Nullable | Completion timestamp |
| `createdAt` | DateTime | Default now() | Timestamp |
| `updatedAt` | DateTime | Auto-updated | Timestamp |

Indexes: `[userId]`, `[thingId]`

---

### 7. RenewalHistory
Immutable archive of renewals.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID / String | PK | Primary key |
| `userId` | UUID / String | FK -> User(id), Cascade | Owner user ID |
| `thingId` | UUID / String | FK -> Thing(id), Cascade | Associated item |
| `previousExpiry` | DateTime | Nullable | Past expiration date |
| `newExpiry` | DateTime | Not Null | Advanced expiration date |
| `renewedAt` | DateTime | Default now() | Renewal execution timestamp |
| `cost` | Float | Nullable | Amount paid for renewal |
| `notes` | String | Nullable | Terms or discounts applied |
| `createdAt` | DateTime | Default now() | Record creation date |

Indexes: `[userId]`, `[thingId]`
