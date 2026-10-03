export type ExpiryStatus =
  | 'ACTIVE'
  | 'DUE_SOON'
  | 'URGENT'
  | 'EXPIRED'
  | 'OVERDUE'
  | 'RENEWED';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  color?: string | null;
  _count?: {
    things: number;
  };
}

export interface ExpiryCalculation {
  effectiveDate: string | null;
  daysRemaining: number | null;
  status: ExpiryStatus;
  humanRemaining: string;
  urgencyLevel: 'urgent' | 'soon' | 'upcoming' | 'overdue' | 'none';
  isOverdue: boolean;
  isDueSoon: boolean;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  thingId: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  documentType: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  identifier: string | null;
  extractedMeta: string | null;
  createdAt: string;
  updatedAt: string;
  thing?: {
    id: string;
    name: string;
  } | null;
}

export interface ReminderRecord {
  id: string;
  userId: string;
  thingId: string;
  daysBefore: number;
  customDate: string | null;
  remindAt: string;
  channel: string;
  status: 'PENDING' | 'TRIGGERED' | 'DISMISSED';
  triggeredAt: string | null;
  createdAt: string;
  thing?: {
    id: string;
    name: string;
    expiryDate: string | null;
    status: string;
    category?: { name: string } | null;
  };
}

export interface ActionRecord {
  id: string;
  userId: string;
  thingId: string;
  title: string;
  actionUrl: string | null;
  notes: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface RenewalHistoryRecord {
  id: string;
  userId: string;
  thingId: string;
  previousExpiry: string | null;
  newExpiry: string;
  renewedAt: string;
  cost: number | null;
  notes: string | null;
}

export interface Thing {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  purchaseDate: string | null;
  expiryDate: string | null;
  renewalDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  calculated: ExpiryCalculation;
  documents?: DocumentRecord[];
  reminders?: ReminderRecord[];
  actions?: ActionRecord[];
  renewalHistory?: RenewalHistoryRecord[];
  _count?: {
    documents: number;
    actions: number;
    reminders: number;
  };
}

export interface DashboardSummary {
  totalCount: number;
  attentionCount: number;
  overdueCount: number;
  urgentCount: number;
  dueSoonCount: number;
  upcomingCount: number;
  attention: Thing[];
  upcoming: Thing[];
  recentlyUpdated: Thing[];
}

export interface SearchResult {
  things: Thing[];
  documents: DocumentRecord[];
}
