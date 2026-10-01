import { prisma } from '../../config/db.js';

export async function createAction(
  userId: string,
  thingId: string,
  input: {
    title: string;
    actionUrl?: string | null;
    notes?: string | null;
  }
) {
  const thing = await prisma.thing.findFirst({
    where: { id: thingId, userId },
  });
  if (!thing) {
    throw new Error('Item not found or unauthorized.');
  }

  if (!input.title || !input.title.trim()) {
    throw new Error('Please provide an action title.');
  }

  return prisma.action.create({
    data: {
      userId,
      thingId,
      title: input.title.trim(),
      actionUrl: input.actionUrl?.trim() || null,
      notes: input.notes?.trim() || null,
      completed: false,
    },
  });
}

export async function updateAction(
  id: string,
  userId: string,
  data: Partial<{
    title: string;
    actionUrl: string | null;
    notes: string | null;
    completed: boolean;
  }>
) {
  const action = await prisma.action.findFirst({
    where: { id, userId },
  });
  if (!action) {
    throw new Error('Action not found or unauthorized.');
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.actionUrl !== undefined) updateData.actionUrl = data.actionUrl?.trim() || null;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
  if (data.completed !== undefined) {
    updateData.completed = data.completed;
    updateData.completedAt = data.completed ? new Date() : null;
  }

  return prisma.action.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteAction(id: string, userId: string) {
  const action = await prisma.action.findFirst({
    where: { id, userId },
  });
  if (!action) {
    throw new Error('Action not found or unauthorized.');
  }

  await prisma.action.delete({
    where: { id },
  });

  return { success: true };
}
