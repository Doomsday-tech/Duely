import { prisma } from '../config/db.js';
import { calculateThingExpiry } from '../utils/expiry.js';

let intervalId: NodeJS.Timeout | null = null;

export async function processRemindersAndStatuses(): Promise<{
  triggeredCount: number;
  updatedThingsCount: number;
}> {
  const now = new Date();

  // 1. Find all pending reminders where remindAt is now or in the past
  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: 'PENDING',
      remindAt: { lte: now },
    },
    include: {
      thing: true,
      user: { select: { email: true, name: true } },
    },
  });

  let triggeredCount = 0;
  for (const reminder of dueReminders) {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        status: 'TRIGGERED',
        triggeredAt: now,
      },
    });
    triggeredCount++;
  }

  // 2. Synchronize status for any active things whose expiry status shifted (e.g. into DUE_SOON or OVERDUE)
  const activeThings = await prisma.thing.findMany({
    where: {
      status: { notIn: ['RENEWED'] },
      expiryDate: { not: null },
    },
  });

  let updatedThingsCount = 0;
  for (const thing of activeThings) {
    const calc = calculateThingExpiry(thing.expiryDate, thing.renewalDate, thing.status, now);
    if (calc.status !== thing.status) {
      await prisma.thing.update({
        where: { id: thing.id },
        data: { status: calc.status },
      });
      updatedThingsCount++;
    }
  }

  return { triggeredCount, updatedThingsCount };
}

export function startReminderScheduler(intervalMs: number = 60000) {
  if (intervalId) return;

  // Run once immediately after 3 seconds startup grace
  setTimeout(() => {
    processRemindersAndStatuses().catch((err) =>
      console.error('Initial reminder check error:', err)
    );
  }, 3000);

  intervalId = setInterval(() => {
    processRemindersAndStatuses().catch((err) =>
      console.error('Periodic reminder check error:', err)
    );
  }, intervalMs);

  console.log(`[Duely Background Job] Reminder scheduler started (interval: ${intervalMs}ms)`);
}

export function stopReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
