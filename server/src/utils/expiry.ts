export type ExpiryStatus =
  | 'ACTIVE'
  | 'DUE_SOON'
  | 'URGENT'
  | 'EXPIRED'
  | 'OVERDUE'
  | 'RENEWED';

export interface ExpiryCalculation {
  effectiveDate: Date | null;
  daysRemaining: number | null;
  status: ExpiryStatus;
  humanRemaining: string;
  urgencyLevel: 'urgent' | 'soon' | 'upcoming' | 'overdue' | 'none';
  isOverdue: boolean;
  isDueSoon: boolean;
}

/**
 * Calculates calendar day difference ignoring hours/minutes/seconds.
 */
export function getCalendarDaysDiff(targetDate: Date, referenceDate: Date = new Date()): number {
  const targetUtc = Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate()
  );
  const refUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - refUtc) / msPerDay);
}

/**
 * Formats day difference into human-friendly description like:
 * "Due today", "Expires tomorrow", "6 days", "2 months", "11 months", "2 years", "Overdue by 4 days"
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) {
    const absDays = Math.abs(days);
    if (absDays === 1) return 'Expired yesterday';
    return `Overdue by ${absDays} days`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return `${days} days`;
  if (days < 60) return '1 month';
  if (days < 365) {
    const months = Math.round(days / 30.4);
    return `${months} months`;
  }
  const years = (days / 365.25).toFixed(1);
  const roundedYears = Math.round(days / 365.25);
  return roundedYears === 1 ? '1 year' : `${roundedYears} years`;
}

/**
 * Computes status, daysRemaining, and urgency for a thing.
 */
export function calculateThingExpiry(
  expiryDate: Date | string | null | undefined,
  renewalDate: Date | string | null | undefined,
  currentStatus: string = 'ACTIVE',
  referenceDate: Date = new Date()
): ExpiryCalculation {
  if (currentStatus === 'RENEWED') {
    return {
      effectiveDate: expiryDate ? new Date(expiryDate) : null,
      daysRemaining: null,
      status: 'RENEWED',
      humanRemaining: 'Renewed',
      urgencyLevel: 'none',
      isOverdue: false,
      isDueSoon: false,
    };
  }

  // Determine effective deadline: expiryDate takes precedence, fallback to renewalDate
  const targetDate = expiryDate
    ? new Date(expiryDate)
    : renewalDate
    ? new Date(renewalDate)
    : null;

  if (!targetDate || isNaN(targetDate.getTime())) {
    return {
      effectiveDate: null,
      daysRemaining: null,
      status: 'ACTIVE',
      humanRemaining: 'No deadline set',
      urgencyLevel: 'none',
      isOverdue: false,
      isDueSoon: false,
    };
  }

  const daysRemaining = getCalendarDaysDiff(targetDate, referenceDate);
  const humanRemaining = formatDaysRemaining(daysRemaining);

  let status: ExpiryStatus = 'ACTIVE';
  let urgencyLevel: 'urgent' | 'soon' | 'upcoming' | 'overdue' | 'none' = 'upcoming';

  if (daysRemaining < 0) {
    status = 'OVERDUE';
    urgencyLevel = 'overdue';
  } else if (daysRemaining <= 7) {
    status = 'URGENT';
    urgencyLevel = 'urgent';
  } else if (daysRemaining <= 30) {
    status = 'DUE_SOON';
    urgencyLevel = 'soon';
  } else {
    status = 'ACTIVE';
    urgencyLevel = 'upcoming';
  }

  return {
    effectiveDate: targetDate,
    daysRemaining,
    status,
    humanRemaining,
    urgencyLevel,
    isOverdue: daysRemaining < 0,
    isDueSoon: daysRemaining >= 0 && daysRemaining <= 30,
  };
}
