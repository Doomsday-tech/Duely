import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'duely-secret-key-change-in-production-min32chars',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
