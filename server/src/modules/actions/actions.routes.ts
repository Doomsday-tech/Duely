import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { createAction, updateAction, deleteAction } from './actions.service.js';

export const actionsRouter = Router();

actionsRouter.use(requireAuth);

// Create action for thing
actionsRouter.post('/thing/:thingId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const action = await createAction(req.user!.id, req.params.thingId, req.body);
    res.status(201).json(action);
  } catch (err) {
    next(err);
  }
});

// Update action (e.g. toggle completed, change url/notes)
actionsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await updateAction(req.params.id, req.user!.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete action
actionsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await deleteAction(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
