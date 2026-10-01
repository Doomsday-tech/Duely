import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
import { calculateThingExpiry } from '../../utils/expiry.js';

export const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    if (!q) {
      res.json({ things: [], documents: [] });
      return;
    }

    const userId = req.user!.id;

    // Search Things across name, description, notes, and category
    const things = await prisma.thing.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { notes: { contains: q } },
          { category: { name: { contains: q } } },
        ],
      },
      include: {
        category: true,
        _count: {
          select: { documents: true, actions: true },
        },
      },
      take: 20,
    });

    // Search Documents across originalName, identifier, documentType, notes, and associated Thing name
    const documents = await prisma.document.findMany({
      where: {
        userId,
        OR: [
          { originalName: { contains: q } },
          { identifier: { contains: q } },
          { documentType: { contains: q } },
          { thing: { name: { contains: q } } },
        ],
      },
      include: {
        thing: {
          select: { id: true, name: true },
        },
      },
      take: 20,
    });

    const enrichedThings = things.map((t) => ({
      ...t,
      calculated: calculateThingExpiry(t.expiryDate, t.renewalDate, t.status),
    }));

    res.json({
      things: enrichedThings,
      documents,
    });
  } catch (err) {
    next(err);
  }
});
