import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import {
  listUserThings,
  getThingDetail,
  createThing,
  updateThing,
  deleteThing,
  renewThing,
  getDashboardSummary,
} from './things.service.js';

export const thingsRouter = Router();

thingsRouter.use(requireAuth);

// Dashboard summary
thingsRouter.get('/dashboard/summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getDashboardSummary(req.user!.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// List things
thingsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, sort } = req.query as Record<string, string>;
    const things = await listUserThings(req.user!.id, {
      status,
      category,
      search,
      sort,
    });
    res.json(things);
  } catch (err) {
    next(err);
  }
});

// Create thing
thingsRouter.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const thing = await createThing(req.user!.id, req.body);
    res.status(201).json(thing);
  } catch (err) {
    next(err);
  }
});

// Get thing detail
thingsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const thing = await getThingDetail(req.params.id, req.user!.id);
    res.json(thing);
  } catch (err) {
    next(err);
  }
});

// Update thing
thingsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await updateThing(req.params.id, req.user!.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete thing
thingsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await deleteThing(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Renew thing
thingsRouter.post('/:id/renew', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await renewThing(req.params.id, req.user!.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
