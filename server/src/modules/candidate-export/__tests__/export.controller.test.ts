import request from 'supertest';
import express from 'express';
import { exportRouter } from '../controllers/export.controller';
import * as teamtailorService from '../services/teamtailor.service';
import * as exportJobService from '../services/export-job.service';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/candidate-export', exportRouter);

// Mock services
jest.mock('../services/teamtailor.service');
jest.mock('../services/export-job.service');

describe('Export Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC-001: Basic Export Works (Happy Path)', () => {
    it('should return counts with candidates and applications', async () => {
      // Mock fetchCandidateCount
      jest.spyOn(teamtailorService, 'fetchCandidateCount').mockResolvedValue({
        candidates: 374,
        applications: 780,
      });

      const response = await request(app).get('/api/candidate-export/count');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        candidates: 374,
        applications: 780,
      });
    });

    it('should start export job and return jobId', async () => {
      const mockJob = {
        jobId: 'test-job-id-123',
        status: 'pending' as const,
        progress: {
          percentage: 0,
          stage: 'Pending',
          candidatesProcessed: 0,
          totalCandidates: 0,
          applicationsProcessed: 0,
          totalApplications: 0,
        },
        createdAt: new Date().toISOString(),
      };

      jest.spyOn(exportJobService, 'createExportJob').mockReturnValue(mockJob);

      const response = await request(app).post('/api/candidate-export/start');

      expect(response.status).toBe(202);
      expect(response.body).toEqual({
        jobId: mockJob.jobId,
        status: mockJob.status,
      });
    });

    it('should return job status', async () => {
      const mockJob = {
        jobId: 'test-job-id',
        status: 'processing' as const,
        progress: {
          percentage: 50,
          stage: 'Fetching candidates',
          candidatesProcessed: 187,
          totalCandidates: 374,
          applicationsProcessed: 0,
          totalApplications: 0,
        },
        createdAt: new Date().toISOString(),
      };

      jest.spyOn(exportJobService, 'getExportJob').mockReturnValue(mockJob);

      const response = await request(app).get('/api/candidate-export/status/test-job-id');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('processing');
      expect(response.body.progress.percentage).toBe(50);
    });
  });

  describe('TC-002: Invalid API Key', () => {
    it('should handle API error when fetching count with invalid key', async () => {
      jest.spyOn(teamtailorService, 'fetchCandidateCount').mockRejectedValue(
        new Error('Unable to connect to Teamtailor API. Please check your API key configuration.')
      );

      const response = await request(app).get('/api/candidate-export/count');

      expect(response.status).toBe(500);
    });
  });

  describe('TC-003: API Key Not Exposed', () => {
    it('should not expose API key in count response', async () => {
      jest.spyOn(teamtailorService, 'fetchCandidateCount').mockResolvedValue({
        candidates: 374,
        applications: 780,
      });

      const response = await request(app).get('/api/candidate-export/count');

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('api');
      expect(responseString).not.toContain('key');
      expect(responseString).not.toContain('token');
      expect(response.body).toEqual({
        candidates: 374,
        applications: 780,
      });
    });

    it('should not expose API key in start job response', async () => {
      const mockJob = {
        jobId: 'test-job-id',
        status: 'pending' as const,
        progress: {
          percentage: 0,
          stage: 'Pending',
          candidatesProcessed: 0,
          totalCandidates: 0,
          applicationsProcessed: 0,
          totalApplications: 0,
        },
        createdAt: new Date().toISOString(),
      };

      jest.spyOn(exportJobService, 'createExportJob').mockReturnValue(mockJob);

      const response = await request(app).post('/api/candidate-export/start');

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('Token token=');
      expect(responseString).not.toContain('Authorization');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when job not found', async () => {
      jest.spyOn(exportJobService, 'getExportJob').mockReturnValue(undefined);

      const response = await request(app).get('/api/candidate-export/status/nonexistent-job');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });

    it('should return 409 when trying to download incomplete job', async () => {
      const mockJob = {
        jobId: 'test-job-id',
        status: 'processing' as const,
        progress: {
          percentage: 50,
          stage: 'Fetching candidates',
          candidatesProcessed: 187,
          totalCandidates: 374,
          applicationsProcessed: 0,
          totalApplications: 0,
        },
        createdAt: new Date().toISOString(),
      };

      jest.spyOn(exportJobService, 'getExportJob').mockReturnValue(mockJob);

      const response = await request(app).get('/api/candidate-export/download/test-job-id');

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Export not ready');
    });
  });
});
