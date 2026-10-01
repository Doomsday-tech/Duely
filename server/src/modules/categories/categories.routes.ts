import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: req.user!.id }, { userId: null }],
      },
      include: {
        _count: {
          select: { things: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const cleanName = name.trim();
    const existing = await prisma.category.findFirst({
      where: { userId: req.user!.id, name: cleanName },
    });
    if (existing) {
      res.json(existing);
      return;
    }

    const created = await prisma.category.create({
      data: {
        userId: req.user!.id,
        name: cleanName,
        color: color || null,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
