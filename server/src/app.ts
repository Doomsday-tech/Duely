import express from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { thingsRouter } from './modules/things/things.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';
import { remindersRouter } from './modules/reminders/reminders.routes.js';
import { actionsRouter } from './modules/actions/actions.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { errorHandler } from './middleware/error.js';
import { processRemindersAndStatuses } from './jobs/reminderJob.js';
import { requireAuth } from './middleware/auth.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/things', thingsRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/reminders', remindersRouter);
  app.use('/api/actions', actionsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/search', searchRouter);

  // Background job manual trigger (for testing / admin / cron invocation)
  app.post('/api/jobs/run-reminders', requireAuth, async (_req, res, next) => {
    try {
      const stats = await processRemindersAndStatuses();
      res.json({ message: 'Reminders processed successfully', stats });
    } catch (err) {
      next(err);
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'Duely API', timestamp: new Date().toISOString() });
  });

  // Safe global error handler
  app.use(errorHandler);

  return app;
}
