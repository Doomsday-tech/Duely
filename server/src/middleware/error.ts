import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled server error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File is too large. Maximum size is 25MB.' });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }

  const message =
    typeof err?.message === 'string' && !err.message.includes('Prisma')
      ? err.message
      : 'Something went wrong while processing your request. Please try again.';

  const statusCode = typeof err?.status === 'number' ? err.status : 500;
  res.status(statusCode).json({ error: message });
}
