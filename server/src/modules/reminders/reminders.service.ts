import { prisma } from '../../config/db.js';

export async function listUserReminders(userId: string, filter?: { status?: string }) {
  const where: any = { userId };
  if (filter?.status) {
    where.status = filter.status.toUpperCase();
  }

  return prisma.reminder.findMany({
    where,
    include: {
      thing: {
        select: {
          id: true,
          name: true,
          expiryDate: true,
          status: true,
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { remindAt: 'asc' },
  });
}

export async function addReminderToThing(
  userId: string,
  thingId: string,
  input: {
    daysBefore: number;
    customDate?: string | null;
    channel?: string;
  }
) {
  const thing = await prisma.thing.findFirst({
    where: { id: thingId, userId },
  });
  if (!thing) {
    throw new Error('Item not found or unauthorized.');
  }

  const effectiveDate = thing.expiryDate || thing.renewalDate;
  if (!effectiveDate && !input.customDate) {
    throw new Error('Cannot set a relative reminder without an expiry or renewal date on this item.');
  }

  let remindAt: Date;
  if (input.customDate) {
    remindAt = new Date(input.customDate);
  } else {
    remindAt = new Date(effectiveDate!);
    remindAt.setDate(remindAt.getDate() - input.daysBefore);
  }

  return prisma.reminder.create({
    data: {
      userId,
      thingId,
      daysBefore: input.daysBefore || 7,
      customDate: input.customDate ? new Date(input.customDate) : null,
      remindAt,
      channel: input.channel || 'IN_APP',
      status: 'PENDING',
    },
    include: {
      thing: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function updateReminder(
  id: string,
  userId: string,
  data: Partial<{
    daysBefore: number;
    channel: string;
    status: string;
    customDate: string | null;
  }>
) {
  const reminder = await prisma.reminder.findFirst({
    where: { id, userId },
    include: { thing: true },
  });
  if (!reminder) {
    throw new Error('Reminder not found or unauthorized.');
  }

  const updateData: any = {};
  if (data.channel) updateData.channel = data.channel;
  if (data.status) updateData.status = data.status.toUpperCase();
  if (data.daysBefore !== undefined) {
    updateData.daysBefore = data.daysBefore;
    const effective = reminder.thing.expiryDate || reminder.thing.renewalDate;
    if (effective) {
      const remindAt = new Date(effective);
      remindAt.setDate(remindAt.getDate() - data.daysBefore);
      updateData.remindAt = remindAt;
    }
  }

  return prisma.reminder.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteReminder(id: string, userId: string) {
  const reminder = await prisma.reminder.findFirst({
    where: { id, userId },
  });
  if (!reminder) {
    throw new Error('Reminder not found or unauthorized.');
  }

  await prisma.reminder.delete({
    where: { id },
  });

  return { success: true };
}
