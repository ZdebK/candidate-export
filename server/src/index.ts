import './shared/config/env.config'; // Validate env vars at startup
import express from 'express';
import { exportRouter } from './modules/candidate-export/controllers/export.controller';
import { errorHandler } from './shared/middleware/error-handler.middleware';
import { config } from './shared/config/env.config';

const app = express();

app.use(express.json());

// Routes
app.use('/api/candidate-export', exportRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling (must be last)
app.use(errorHandler);

app.listen(config.server.port, () => {
  console.log(`[Server] Running on port ${config.server.port} (${config.server.nodeEnv})`);
});

export default app;
