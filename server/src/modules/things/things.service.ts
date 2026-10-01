import { prisma } from '../../config/db.js';
import { calculateThingExpiry } from '../../utils/expiry.js';

export interface CreateThingInput {
  name: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  purchaseDate?: string | null;
  expiryDate?: string | null;
  renewalDate?: string | null;
  notes?: string;
  reminders?: number[]; // daysBefore array e.g. [7, 14, 30]
  initialAction?: {
    title: string;
    actionUrl?: string;
    notes?: string;
  };
}

export async function listUserThings(
  userId: string,
  filter?: {
    status?: string;
    category?: string;
    search?: string;
    sort?: string;
  }
) {
  const where: any = { userId };

  if (filter?.category) {
    where.category = { name: filter.category };
  }

  if (filter?.search) {
    const s = filter.search.toLowerCase();
    where.OR = [
      { name: { contains: s } },
      { description: { contains: s } },
      { notes: { contains: s } },
    ];
  }

  const rawThings = await prisma.thing.findMany({
    where,
    include: {
      category: true,
      _count: {
        select: {
          documents: true,
          actions: true,
          reminders: true,
        },
      },
      actions: {
        select: {
          id: true,
          title: true,
          completed: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const enrichedThings = rawThings.map((thing) => {
    const calc = calculateThingExpiry(
      thing.expiryDate,
      thing.renewalDate,
      thing.status
    );
    return {
      ...thing,
      calculated: calc,
    };
  });

  // Filter by calculated status if specified
  let filtered = enrichedThings;
  if (filter?.status) {
    const desired = filter.status.toUpperCase();
    if (desired === 'ATTENTION') {
      filtered = filtered.filter(
        (t) =>
          t.calculated.status === 'URGENT' ||
          t.calculated.status === 'DUE_SOON' ||
          t.calculated.status === 'OVERDUE'
      );
    } else if (desired === 'UPCOMING') {
      filtered = filtered.filter((t) => t.calculated.status === 'ACTIVE');
    } else {
      filtered = filtered.filter((t) => t.calculated.status === desired);
    }
  }

  // Sort
  if (filter?.sort === 'expiryAsc') {
    filtered.sort((a, b) => {
      const aTime = a.calculated.effectiveDate?.getTime() ?? Infinity;
      const bTime = b.calculated.effectiveDate?.getTime() ?? Infinity;
      return aTime - bTime;
    });
  } else if (filter?.sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filter?.sort === 'urgency') {
    filtered.sort((a, b) => {
      const aDays = a.calculated.daysRemaining ?? 99999;
      const bDays = b.calculated.daysRemaining ?? 99999;
      return aDays - bDays;
    });
  }

  return filtered;
}

export async function getThingDetail(id: string, userId: string) {
  const thing = await prisma.thing.findFirst({
    where: { id, userId },
    include: {
      category: true,
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      reminders: {
        orderBy: { daysBefore: 'asc' },
      },
      actions: {
        orderBy: { createdAt: 'desc' },
      },
      renewalHistory: {
        orderBy: { renewedAt: 'desc' },
      },
    },
  });

  if (!thing) {
    throw new Error('Item not found or you do not have permission to view it.');
  }

  const calc = calculateThingExpiry(
    thing.expiryDate,
    thing.renewalDate,
    thing.status
  );

  return {
    ...thing,
    calculated: calc,
  };
}

export async function createThing(userId: string, input: CreateThingInput) {
  if (!input.name || !input.name.trim()) {
    throw new Error('Please enter a name for this item.');
  }

  let categoryId = input.categoryId;
  if (!categoryId && input.categoryName) {
    // Lookup or create category for user
    const existing = await prisma.category.findFirst({
      where: { userId, name: input.categoryName.trim() },
    });
    if (existing) {
      categoryId = existing.id;
    } else {
      const created = await prisma.category.create({
        data: {
          userId,
          name: input.categoryName.trim(),
        },
      });
      categoryId = created.id;
    }
  }

  const expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
  const renewalDate = input.renewalDate ? new Date(input.renewalDate) : null;
  const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : null;

  const initialCalc = calculateThingExpiry(expiryDate, renewalDate);

  const thing = await prisma.thing.create({
    data: {
      userId,
      categoryId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      purchaseDate,
      expiryDate,
      renewalDate,
      status: initialCalc.status,
      notes: input.notes?.trim() || null,
    },
  });

  // Create reminders if requested or if default days provided and target date exists
  const effectiveDate = expiryDate || renewalDate;
  const daysList = input.reminders && input.reminders.length > 0 ? input.reminders : [14, 7];

  if (effectiveDate && !isNaN(effectiveDate.getTime())) {
    for (const days of daysList) {
      const remindAt = new Date(effectiveDate);
      remindAt.setDate(remindAt.getDate() - days);
      await prisma.reminder.create({
        data: {
          userId,
          thingId: thing.id,
          daysBefore: days,
          remindAt,
          channel: 'IN_APP',
          status: 'PENDING',
        },
      });
    }
  }

  // Create initial action if provided
  if (input.initialAction?.title) {
    await prisma.action.create({
      data: {
        userId,
        thingId: thing.id,
        title: input.initialAction.title.trim(),
        actionUrl: input.initialAction.actionUrl?.trim() || null,
        notes: input.initialAction.notes?.trim() || null,
      },
    });
  }

  return getThingDetail(thing.id, userId);
}

export async function updateThing(
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    categoryId: string | null;
    description: string | null;
    purchaseDate: string | null;
    expiryDate: string | null;
    renewalDate: string | null;
    notes: string | null;
    status: string;
  }>
) {
  const existing = await prisma.thing.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error('Item not found or unauthorized.');
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status;

  if (data.purchaseDate !== undefined) {
    updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
  }
  if (data.expiryDate !== undefined) {
    updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  }
  if (data.renewalDate !== undefined) {
    updateData.renewalDate = data.renewalDate ? new Date(data.renewalDate) : null;
  }

  // If expiry or renewal updated, recalculate status and update existing reminders
  const newExpiry =
    data.expiryDate !== undefined ? updateData.expiryDate : existing.expiryDate;
  const newRenewal =
    data.renewalDate !== undefined ? updateData.renewalDate : existing.renewalDate;

  if (data.expiryDate !== undefined || data.renewalDate !== undefined) {
    const calc = calculateThingExpiry(newExpiry, newRenewal, updateData.status || existing.status);
    updateData.status = calc.status;

    const effectiveDate = newExpiry || newRenewal;
    if (effectiveDate && !isNaN(effectiveDate.getTime())) {
      // Update pending reminders
      const pendingReminders = await prisma.reminder.findMany({
        where: { thingId: id, status: 'PENDING' },
      });
      for (const r of pendingReminders) {
        const remindAt = new Date(effectiveDate);
        remindAt.setDate(remindAt.getDate() - r.daysBefore);
        await prisma.reminder.update({
          where: { id: r.id },
          data: { remindAt },
        });
      }
    }
  }

  await prisma.thing.update({
    where: { id },
    data: updateData,
  });

  return getThingDetail(id, userId);
}

export async function deleteThing(id: string, userId: string) {
  const existing = await prisma.thing.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error('Item not found or unauthorized.');
  }

  await prisma.thing.delete({
    where: { id },
  });

  return { success: true };
}

export async function renewThing(
  id: string,
  userId: string,
  input: {
    newExpiryDate: string;
    renewalDate?: string | null;
    cost?: number | null;
    notes?: string;
  }
) {
  const existing = await prisma.thing.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error('Item not found or unauthorized.');
  }

  if (!input.newExpiryDate) {
    throw new Error('Please specify the new expiry date.');
  }

  const newExpiry = new Date(input.newExpiryDate);
  if (isNaN(newExpiry.getTime())) {
    throw new Error('Invalid new expiry date format.');
  }

  // 1. Archive previous expiry in RenewalHistory
  await prisma.renewalHistory.create({
    data: {
      userId,
      thingId: id,
      previousExpiry: existing.expiryDate,
      newExpiry,
      cost: input.cost ? Number(input.cost) : null,
      notes: input.notes?.trim() || null,
      renewedAt: new Date(),
    },
  });

  // 2. Calculate status for new date
  const newCalc = calculateThingExpiry(newExpiry, input.renewalDate ? new Date(input.renewalDate) : null);

  // 3. Update Thing
  await prisma.thing.update({
    where: { id },
    data: {
      expiryDate: newExpiry,
      renewalDate: input.renewalDate ? new Date(input.renewalDate) : null,
      status: newCalc.status,
    },
  });

  // 4. Reset reminders for the new cycle
  const reminders = await prisma.reminder.findMany({
    where: { thingId: id },
  });

  for (const r of reminders) {
    const remindAt = new Date(newExpiry);
    remindAt.setDate(remindAt.getDate() - r.daysBefore);
    await prisma.reminder.update({
      where: { id: r.id },
      data: {
        remindAt,
        status: 'PENDING',
        triggeredAt: null,
      },
    });
  }

  // 5. Mark pending renewal actions as done
  await prisma.action.updateMany({
    where: {
      thingId: id,
      completed: false,
      title: { contains: 'renew' },
    },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  });

  return getThingDetail(id, userId);
}

export async function getDashboardSummary(userId: string) {
  const allThings = await listUserThings(userId);

  const attention = allThings.filter(
    (t) =>
      t.calculated.status === 'OVERDUE' ||
      t.calculated.status === 'URGENT' ||
      t.calculated.status === 'DUE_SOON'
  );

  const upcoming = allThings.filter(
    (t) => t.calculated.status === 'ACTIVE' && t.calculated.effectiveDate !== null
  );

  // Sort attention by urgency (lowest days remaining first, overdue at very top)
  attention.sort((a, b) => {
    const aDays = a.calculated.daysRemaining ?? 99999;
    const bDays = b.calculated.daysRemaining ?? 99999;
    return aDays - bDays;
  });

  // Sort upcoming by closest date
  upcoming.sort((a, b) => {
    const aTime = a.calculated.effectiveDate?.getTime() ?? Infinity;
    const bTime = b.calculated.effectiveDate?.getTime() ?? Infinity;
    return aTime - bTime;
  });

  // Recently updated (last 5)
  const recentlyUpdated = [...allThings]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return {
    totalCount: allThings.length,
    attentionCount: attention.length,
    overdueCount: attention.filter((t) => t.calculated.status === 'OVERDUE').length,
    urgentCount: attention.filter((t) => t.calculated.status === 'URGENT').length,
    dueSoonCount: attention.filter((t) => t.calculated.status === 'DUE_SOON').length,
    upcomingCount: upcoming.length,
    attention: attention.slice(0, 8),
    upcoming: upcoming.slice(0, 8),
    recentlyUpdated,
  };
}
