import { Router } from 'express';
import * as fs from 'fs';
import { createExportJob, getExportJob } from '../services/export-job.service';
import { fetchCandidateCount } from '../services/teamtailor.service';

export const exportRouter = Router();

// GET /api/candidate-export/count
exportRouter.get('/count', async (_req, res, next) => {
  try {
    const counts = await fetchCandidateCount();
    res.json(counts);
  } catch (error) {
    next(error);
  }
});

// POST /api/candidate-export/start
exportRouter.post('/start', (_req, res) => {
  const job = createExportJob();

  res.status(202).json({
    jobId: job.jobId,
    status: job.status,
  });
});

// GET /api/candidate-export/status/:jobId
exportRouter.get('/status/:jobId', (req, res) => {
  const job = getExportJob(req.params.jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({
    status: job.status,
    progress: job.progress,
    ...(job.result && {
      result: {
        fileName: job.result.fileName,
        recordCount: job.result.recordCount,
      },
    }),
    ...(job.error && { error: job.error }),
  });
});

// GET /api/candidate-export/download/:jobId
exportRouter.get('/download/:jobId', (req, res) => {
  const job = getExportJob(req.params.jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (job.status !== 'completed' || !job.result) {
    res.status(409).json({ error: 'Export not ready', status: job.status });
    return;
  }

  const { filePath, fileName } = job.result;

  if (!fs.existsSync(filePath)) {
    res.status(410).json({ error: 'Export file has expired' });
    return;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => res.status(500).json({ error: 'Failed to stream file' }));
  stream.pipe(res);
});
