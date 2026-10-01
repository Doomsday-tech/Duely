import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/db.js';
import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.js';

export interface ExtractedDocumentMeta {
  documentType?: string;
  issueDate?: string;
  expiryDate?: string;
  identifier?: string; // Policy / Serial / License number
  providerOrIssuer?: string;
  notes?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Heuristic fallback parser from filename and patterns.
 */
function extractHeuristicFromFilename(filename: string): ExtractedDocumentMeta {
  const lower = filename.toLowerCase();
  let documentType = 'OTHER';

  if (lower.includes('insurance') || lower.includes('policy')) {
    documentType = 'POLICY';
  } else if (lower.includes('passport')) {
    documentType = 'PASSPORT';
  } else if (lower.includes('invoice') || lower.includes('bill') || lower.includes('receipt')) {
    documentType = 'INVOICE';
  } else if (lower.includes('warranty')) {
    documentType = 'WARRANTY';
  } else if (lower.includes('license') || lower.includes('licence') || lower.includes('driving')) {
    documentType = 'CONTRACT';
  } else if (lower.includes('agreement') || lower.includes('rent') || lower.includes('lease')) {
    documentType = 'CONTRACT';
  } else if (lower.includes('certificate') || lower.includes('puc')) {
    documentType = 'CERTIFICATE';
  }

  // Look for potential year/dates in filename e.g. 2026-10-24 or 2027
  let expiryDate: string | undefined;
  const isoMatch = lower.match(/(20\d\d)[-_/](0[1-9]|1[0-2])[-_/](0[1-9]|[12]\d|3[01])/);
  if (isoMatch) {
    expiryDate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Look for policy/serial numbers
  let identifier: string | undefined;
  const idMatch = filename.match(/[A-Z0-9]{6,16}/i);
  if (idMatch && !idMatch[0].toLowerCase().includes('invoice') && !idMatch[0].toLowerCase().includes('document')) {
    identifier = idMatch[0];
  }

  return {
    documentType,
    expiryDate,
    identifier,
    confidence: expiryDate ? 'medium' : 'low',
  };
}

/**
 * Intelligent document parser using Gemini if available, falling back to heuristics.
 */
export async function analyzeDocumentFile(
  filePath: string,
  originalName: string,
  mimeType: string
): Promise<ExtractedDocumentMeta> {
  const heuristics = extractHeuristicFromFilename(originalName);

  if (!config.geminiApiKey) {
    return heuristics;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

    // If image or PDF, we can pass inline data if under 10MB
    const stats = fs.statSync(filePath);
    if (stats.size > 8 * 1024 * 1024) {
      return heuristics;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    const prompt = `Analyze this document. Extract the following fields if present:
- documentType: one of "POLICY", "INVOICE", "PASSPORT", "WARRANTY", "CONTRACT", "CERTIFICATE", "OTHER"
- expiryDate: in YYYY-MM-DD format (if an expiration, valid until, or renewal date is mentioned)
- issueDate: in YYYY-MM-DD format (if an issue or purchase date is mentioned)
- identifier: policy number, serial number, license number, or certificate ID
- providerOrIssuer: company or authority that issued this document
- notes: brief one-line summary

Respond ONLY with valid JSON conforming to this TypeScript interface:
{
  "documentType": string,
  "expiryDate": string | null,
  "issueDate": string | null,
  "identifier": string | null,
  "providerOrIssuer": string | null,
  "notes": string | null
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return {
        documentType: parsed.documentType || heuristics.documentType,
        expiryDate: parsed.expiryDate || heuristics.expiryDate,
        issueDate: parsed.issueDate,
        identifier: parsed.identifier || heuristics.identifier,
        providerOrIssuer: parsed.providerOrIssuer,
        notes: parsed.notes,
        confidence: 'high',
      };
    }
  } catch (error) {
    console.warn('AI document extraction fallback to heuristics:', error);
  }

  return heuristics;
}

export async function createDocumentRecord(
  userId: string,
  file: Express.Multer.File,
  metadata: {
    thingId?: string | null;
    documentType?: string;
    issueDate?: string | null;
    expiryDate?: string | null;
    identifier?: string | null;
  }
) {
  // Analyze document for intelligent extraction suggestions
  const extraction = await analyzeDocumentFile(file.path, file.originalname, file.mimetype);

  const documentType = metadata.documentType || extraction.documentType || 'OTHER';
  const expiryDate = metadata.expiryDate
    ? new Date(metadata.expiryDate)
    : extraction.expiryDate
    ? new Date(extraction.expiryDate)
    : null;
  const issueDate = metadata.issueDate
    ? new Date(metadata.issueDate)
    : extraction.issueDate
    ? new Date(extraction.issueDate)
    : null;

  const doc = await prisma.document.create({
    data: {
      userId,
      thingId: metadata.thingId || null,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      filePath: file.path,
      documentType,
      issueDate,
      expiryDate,
      identifier: metadata.identifier || extraction.identifier || null,
      extractedMeta: JSON.stringify(extraction),
    },
    include: {
      thing: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    document: doc,
    suggestedExtraction: extraction,
  };
}

export async function listUserDocuments(userId: string, thingId?: string) {
  const where: any = { userId };
  if (thingId) {
    where.thingId = thingId;
  }

  return prisma.document.findMany({
    where,
    include: {
      thing: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocumentById(id: string, userId: string) {
  const doc = await prisma.document.findFirst({
    where: { id, userId },
    include: {
      thing: true,
    },
  });
  if (!doc) {
    throw new Error('Document not found or unauthorized.');
  }
  return doc;
}

export async function deleteDocument(id: string, userId: string) {
  const doc = await getDocumentById(id, userId);

  // Remove local file if it exists
  try {
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
  } catch (e) {
    console.warn('Could not remove file on disk:', e);
  }

  await prisma.document.delete({
    where: { id },
  });

  return { success: true };
}
