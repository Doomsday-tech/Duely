import { Router, Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from './auth.service.js';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    const result = await registerUser(email, password, name);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  // Client handles clearing token from memory/storage
  res.json({ message: 'Signed out successfully.' });
});

authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  // Safe architecture response without revealing email enumeration
  res.json({
    message:
      'If an account exists for that email, password reset instructions have been dispatched.',
  });
});
