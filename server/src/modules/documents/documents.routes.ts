import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import {
  createDocumentRecord,
  listUserDocuments,
  getDocumentById,
  deleteDocument,
} from './documents.service.js';
import { prisma } from '../../config/db.js';
import { calculateThingExpiry } from '../../utils/expiry.js';

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

// List user documents
documentsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { thingId } = req.query as { thingId?: string };
    const docs = await listUserDocuments(req.user!.id, thingId);
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Upload document
documentsRouter.post(
  '/upload',
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Please choose a document to upload.' });
        return;
      }

      const { thingId, documentType, issueDate, expiryDate, identifier } = req.body;

      const result = await createDocumentRecord(req.user!.id, req.file, {
        thingId: thingId || null,
        documentType,
        issueDate,
        expiryDate,
        identifier,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Get single document metadata
documentsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await getDocumentById(req.params.id, req.user!.id);
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// Download / stream document content
documentsRouter.get(
  '/:id/download',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const doc = await getDocumentById(req.params.id, req.user!.id);

      if (!fs.existsSync(doc.filePath)) {
        res.status(404).json({ error: 'Document file could not be found on storage.' });
        return;
      }

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(doc.originalName)}"`
      );

      const fileStream = fs.createReadStream(doc.filePath);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
);

// Confirm or update extraction onto document & optionally sync to associated Thing
documentsRouter.post(
  '/:id/confirm-extraction',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const doc = await getDocumentById(req.params.id, req.user!.id);
      const { expiryDate, issueDate, documentType, identifier, syncToThing } = req.body;

      const updatedDoc = await prisma.document.update({
        where: { id: doc.id },
        data: {
          documentType: documentType || doc.documentType,
          expiryDate: expiryDate ? new Date(expiryDate) : doc.expiryDate,
          issueDate: issueDate ? new Date(issueDate) : doc.issueDate,
          identifier: identifier !== undefined ? identifier : doc.identifier,
        },
      });

      // If user confirms to sync expiry date to the associated Thing:
      if (syncToThing && doc.thingId && expiryDate) {
        const newExpiry = new Date(expiryDate);
        const calc = calculateThingExpiry(newExpiry, null);
        await prisma.thing.update({
          where: { id: doc.thingId },
          data: {
            expiryDate: newExpiry,
            status: calc.status,
          },
        });
      }

      res.json({ success: true, document: updatedDoc });
    } catch (err) {
      next(err);
    }
  }
);

// Delete document
documentsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await deleteDocument(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
