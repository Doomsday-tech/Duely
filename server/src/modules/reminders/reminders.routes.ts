import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import {
  listUserReminders,
  addReminderToThing,
  updateReminder,
  deleteReminder,
} from './reminders.service.js';

export const remindersRouter = Router();

remindersRouter.use(requireAuth);

// List reminders
remindersRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string };
    const reminders = await listUserReminders(req.user!.id, { status });
    res.json(reminders);
  } catch (err) {
    next(err);
  }
});

// Add reminder to thing
remindersRouter.post('/thing/:thingId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reminder = await addReminderToThing(
      req.user!.id,
      req.params.thingId,
      req.body
    );
    res.status(201).json(reminder);
  } catch (err) {
    next(err);
  }
});

// Update reminder
remindersRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await updateReminder(req.params.id, req.user!.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete reminder
remindersRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await deleteReminder(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Dismiss reminder
remindersRouter.post('/:id/dismiss', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await updateReminder(req.params.id, req.user!.id, { status: 'DISMISSED' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
