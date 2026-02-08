# Teamtailor Candidate Export

Full-stack application that connects to the [Teamtailor API](https://docs.teamtailor.com/), fetches all candidates with their job applications, and allows downloading the data as a CSV file.

## Features

- Export all candidates + job applications to CSV
- Background job with real-time progress tracking
- Animated modal UI (progress bar, success/error states)
- Rate limiting and retry with exponential backoff
- Streaming CSV generation (memory-efficient for large datasets)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript, ts-node |
| Animation | motion/react |
| CSV | csv-stringify |

## Project Structure

```
teamtailor/
├── client/                        # React frontend (Vite)
│   └── src/
│       ├── modules/
│       │   └── candidate-export/  # Export feature module
│       │       ├── components/    # ExportButton, ExportModal, ExportProgress
│       │       ├── hooks/         # useExportJob, useExportPolling
│       │       └── types/         # export.types.ts
│       └── shared/
│           ├── components/ui/     # Button, Progress
│           └── utils/             # cn() helper
│
└── server/                        # Express backend
    └── src/
        ├── modules/
        │   └── candidate-export/  # Export feature module
        │       ├── controllers/   # REST endpoints
        │       ├── services/      # teamtailor, csv-generator, export-job, progress-tracker
        │       ├── models/        # ExportJob in-memory store
        │       ├── types/         # JSON API types
        │       └── utils/         # api-client, retry
        └── shared/
            ├── config/            # env.config.ts (validation)
            ├── middleware/        # error-handler
            └── utils/             # retry.util
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/candidate-export/start` | Start export job → returns `{ jobId }` |
| `GET` | `/api/candidate-export/status/:jobId` | Poll progress |
| `GET` | `/api/candidate-export/download/:jobId` | Download CSV file |
| `GET` | `/health` | Health check |

## Getting Started

### Prerequisites

- Node.js 18+
- Teamtailor API key with Admin scope

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd teamtailor

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your API key:

```bash
TEAMTAILOR_API_KEY=your_api_key_here
TEAMTAILOR_API_URL=https://api.teamtailor.com/v1  # or https://api.na.teamtailor.com/v1 for NA
```

### 3. Run in development

**Option A — VS Code (recommended):**

Press `F5` to launch the Full Stack debug configuration. This starts:
- Vite dev server on `http://localhost:5173`
- Express server on `http://localhost:3000` with Node debugger

**Option B — manual:**

Terminal 1 (server):
```bash
cd server
npm run dev
```

Terminal 2 (client):
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

## How It Works

1. User clicks **Export to CSV**
2. Frontend sends `POST /api/candidate-export/start` → receives `jobId`
3. Server fetches `GET /v1/candidates?include=job-applications` (paginated)
4. Progress updates polled every 2.5s via `GET /api/candidate-export/status/:jobId`
5. When complete, browser auto-downloads CSV via `GET /api/candidate-export/download/:jobId`

## CSV Format

```csv
candidate_id,first_name,last_name,email,job_application_id,job_application_created_at
123,John,Doe,john@example.com,456,2024-01-15T10:30:00Z
```

One row per job application. Candidates with multiple applications appear in multiple rows.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEAMTAILOR_API_KEY` | — | **Required.** Teamtailor API key |
| `TEAMTAILOR_API_URL` | — | **Required.** API base URL |
| `TEAMTAILOR_API_VERSION` | `20240404` | API version header |
| `PORT` | `3000` | Express server port |
| `EXPORT_DELAY_MS` | `200` | Delay between API pages (rate limiting) |
| `EXPORT_MAX_RETRIES` | `3` | Max retries on failed requests |
| `EXPORT_FILE_RETENTION_HOURS` | `24` | How long export files are kept |
