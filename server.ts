import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createApp } from './server/src/app.js';
import { startReminderScheduler } from './server/src/jobs/reminderJob.js';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Mount API router under app
  const apiApp = createApp();
  app.use(apiApp);

  // In development, mount Vite's dev server middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static built files
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Start background reminder job
  startReminderScheduler(60000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Duely server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Duely server:', err);
  process.exit(1);
});
