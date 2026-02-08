# Claude Developer Profile

## Basic Information
- **Role**: Developer
- **Specialization**: JavaScript, TypeScript, React, Node.js
- **Current Focus**: Web applications for advanced developer recruitment

## Communication Preferences
- **Language**: Polish for communication
- **Documentation**: English
- **Explanation Style**: Detailed step-by-step explanations for certainty
- **Output Format**: Always provide code in ready-to-use files unless specified otherwise

## Technical Stack

### Primary Technologies
- JavaScript (JS)
- TypeScript (TS)
- React
- Node.js
- Tailwind CSS

### Build Tools & Package Management
- Vite
- npm

## Code Style & Best Practices

### Preferred Practices
1. **Clean Code**
   - SOLID principles
   - DRY (Don't Repeat Yourself)
   - Clear, readable naming conventions

2. **TypeScript Strict Mode**
   - Maximum type safety
   - Strict compiler options enabled

3. **Testing**
   - TDD/Unit Testing approach
   - Test before code
   - Tools: Jest, Vitest, Testing Library

4. **Modern React Patterns**
   - React Hooks
   - Component composition
   - Custom hooks

5. **Code Quality Tools**
   - ESLint for linting
   - Prettier for automatic formatting

## Architecture Preferences

### Project Structure
- **Modular Monolith Architecture**
  - Frontend/Backend separation with clear boundaries
  - Module-based organization by business domains
  - Each module encapsulates its own logic (frontend + backend)
  - Shared code in dedicated shared folders

## Development Guidelines

### When Writing Code
1. Always use TypeScript with strict mode
2. Write tests alongside components
3. Follow Clean Code principles
4. Use modern React patterns (hooks, composition)
5. Apply Tailwind for styling
6. Ensure code is formatted with Prettier
7. Validate with ESLint

### File Organization Example
```
project/
├── client/                    # Frontend
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── tests/
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── tests/
│   │   │   └── index.ts
│   │   └── dashboard/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── tests/
│   │       └── index.ts
│   └── shared/
│       ├── components/
│       ├── hooks/
│       └── utils/
│
└── server/                    # Backend
    ├── modules/
    │   ├── auth/
    │   │   ├── controllers/
    │   │   ├── services/
    │   │   ├── models/
    │   │   ├── tests/
    │   │   └── index.ts
    │   ├── users/
    │   │   ├── controllers/
    │   │   ├── services/
    │   │   ├── models/
    │   │   ├── tests/
    │   │   └── index.ts
    │   └── dashboard/
    │       ├── controllers/
    │       ├── services/
    │       ├── models/
    │       ├── tests/
    │       └── index.ts
    └── shared/
        ├── middleware/
        ├── utils/
        └── config/
```

## Project Context
- Building advanced web applications for developer recruitment
- Focus on demonstrating senior-level development skills
- Emphasis on code quality, testing, and best practices

## Additional Notes
- Provide complete, working files by default
- Include tests when creating components
- Document code in English
- Explain reasoning and approach in Polish

---

# Current Project: Candidate Export Feature

## Project Overview
Build a candidate export feature that connects to the Teamtailor API, fetches all candidates and their job applications, and allows users to download the data as a CSV file.

## Technical Specifications

### Architecture Pattern
- **Type**: Modular Monolith with client/server separation
- **Module Name**: `candidate-export`
- **Flow Pattern**: GitHub-style Background Job + Polling

### API Integration

#### Teamtailor API Details
- **Base URL**: `https://api.teamtailor.com/v1` (EU) or `https://api.na.teamtailor.com/v1` (NA)
- **Authentication**: Token-based
  - Header: `Authorization: Token token=YOUR_API_KEY`
  - Header: `X-Api-Version: 20240404`
- **Standard**: Follows JSON API Specification

#### Required Permissions
- API Key must have **Admin scope** to access candidate data
- Store in environment variables with validation at startup

#### Endpoints Used
```
GET /v1/candidates
GET /v1/job-applications
```

### Pagination Strategy
**Type**: Link-based pagination
```typescript
// API returns structure:
{
  "data": [...],
  "links": {
    "next": "https://api.teamtailor.com/v1/candidates?page[number]=2",
    "last": "https://api.teamtailor.com/v1/candidates?page[number]=10"
  },
  "meta": {
    "record-count": 250,
    "page-count": 10
  }
}
```

**Implementation**:
- Use async generator pattern
- Follow `links.next` until null
- No manual page number management

### Rate Limiting & Error Handling

#### Strategy: Conservative Approach
- **Delay**: 100-200ms between requests
- **Retry Logic**: Exponential backoff on 429 (rate limit)
- **Max Retries**: 3 attempts per request
- **Timeout**: 30 seconds per request

#### Error Scenarios
1. API timeout → Retry with backoff
2. Rate limit (429) → Use `Retry-After` header or exponential backoff
3. Invalid API key (401) → Fail fast with clear error message
4. Empty data → Return empty CSV with headers
5. Partial failure → Job system ensures completion or clear failure state

### Data Fetching Strategy

#### Two-Phase Fetch (Optimal Performance)
```typescript
// Phase 1: Fetch all candidates
GET /v1/candidates (with pagination)

// Phase 2: Fetch all job-applications
GET /v1/job-applications (with pagination)

// Phase 3: Join data on backend by candidate_id
```

**Why not include=job-applications?**
- More predictable payload sizes
- Better error isolation
- Easier to parallelize in future
- Allows batch processing

### CSV Generation

#### Library: csv-stringify
```bash
npm install csv-stringify
```

#### Processing: Batch-based Streaming
- **Batch Size**: 100 candidates per batch
- **Stream Pipeline**: Fetch → Transform → CSV → Storage/Response
- **Memory**: Process batches without loading entire dataset

#### CSV Structure
```csv
candidate_id,first_name,last_name,email,job_application_id,job_application_created_at
123,John,Doe,john@example.com,456,2024-01-15T10:30:00Z
123,John,Doe,john@example.com,789,2024-02-20T14:15:00Z
```

**Note**: One row per job application (candidates may appear multiple times)

### Background Job Architecture

#### Flow: GitHub-style with Polling

**User Journey:**
1. User clicks "Export Candidates" button
2. Modal opens: "Preparing export..."
3. Progress bar shows: "Fetching candidates... 127/500 (25%)"
4. When complete: "Download starting..." → Browser auto-downloads CSV
5. Modal shows: "✓ Downloaded successfully"

#### Backend Implementation

**Job System:**
```typescript
// 1. Create export job
POST /api/candidate-export/start
Response: { jobId: "uuid", status: "pending" }

// 2. Poll for progress (every 2-3 seconds)
GET /api/candidate-export/status/:jobId
Response: { 
  status: "processing" | "completed" | "failed",
  progress: { 
    percentage: 45,
    stage: "Fetching candidates",
    current: 225,
    total: 500
  }
}

// 3. Download when ready
GET /api/candidate-export/download/:jobId
Response: CSV file stream
```

**Job Persistence:**
- Store job status in memory (Redis for production)
- Keep completed files for 24 hours
- Allow user to re-download from "Recent Exports"

#### Progress Tracking
```typescript
interface ExportProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    percentage: number;        // 0-100
    stage: string;             // "Fetching candidates", "Processing applications", etc.
    candidatesProcessed: number;
    totalCandidates: number;
    applicationsProcessed: number;
    totalApplications: number;
  };
  result?: {
    fileUrl: string;
    fileName: string;
    recordCount: number;
  };
  error?: {
    message: string;
    code: string;
  };
  createdAt: string;
  completedAt?: string;
}
```

### Security & Environment Configuration

#### Environment Variables (.env)
```bash
# Teamtailor API
TEAMTAILOR_API_KEY=your_api_key_here
TEAMTAILOR_API_URL=https://api.teamtailor.com/v1
TEAMTAILOR_API_VERSION=20240404

# Application
NODE_ENV=development
PORT=3000

# Job Configuration
EXPORT_BATCH_SIZE=100
EXPORT_DELAY_MS=150
EXPORT_MAX_RETRIES=3
EXPORT_FILE_RETENTION_HOURS=24
```

#### Validation
```typescript
// Validate at application startup
const requiredEnvVars = [
  'TEAMTAILOR_API_KEY',
  'TEAMTAILOR_API_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

#### .gitignore
```
.env
.env.local
.env.*.local
```

#### .env.example (commit to repo)
```bash
TEAMTAILOR_API_KEY=your_teamtailor_api_key_here
TEAMTAILOR_API_URL=https://api.teamtailor.com/v1
TEAMTAILOR_API_VERSION=20240404
NODE_ENV=development
PORT=3000
```

### Project Structure

```
project/
├── client/
│   └── modules/
│       └── candidate-export/
│           ├── components/
│           │   ├── ExportButton.tsx
│           │   ├── ExportModal.tsx
│           │   ├── ExportProgress.tsx
│           │   └── RecentExports.tsx
│           ├── hooks/
│           │   ├── useExportJob.ts
│           │   └── useExportPolling.ts
│           ├── types/
│           │   └── export.types.ts
│           └── tests/
│               ├── ExportButton.test.tsx
│               └── useExportJob.test.ts
│
└── server/
    ├── modules/
    │   └── candidate-export/
    │       ├── controllers/
    │       │   └── export.controller.ts
    │       ├── services/
    │       │   ├── teamtailor.service.ts
    │       │   ├── csv-generator.service.ts
    │       │   ├── export-job.service.ts
    │       │   └── progress-tracker.service.ts
    │       ├── models/
    │       │   └── export-job.model.ts
    │       ├── types/
    │       │   └── teamtailor.types.ts
    │       ├── utils/
    │       │   ├── api-client.util.ts
    │       │   └── retry.util.ts
    │       └── tests/
    │           ├── teamtailor.service.test.ts
    │           ├── csv-generator.service.test.ts
    │           └── export-job.service.test.ts
    │
    └── shared/
        ├── config/
        │   └── env.config.ts
        └── middleware/
            └── error-handler.middleware.ts
```

### Implementation Phases

#### Phase 1: Core API Integration
- [ ] Environment configuration and validation
- [ ] Teamtailor API client with authentication
- [ ] Link-based pagination implementation
- [ ] Rate limiting with retry logic
- [ ] Unit tests for API client

#### Phase 2: Data Processing
- [ ] Fetch candidates with pagination
- [ ] Fetch job applications with pagination
- [ ] Join data on backend
- [ ] Batch processing implementation
- [ ] Unit tests for data services

#### Phase 3: CSV Generation
- [ ] CSV streaming with csv-stringify
- [ ] Batch-to-CSV transformation
- [ ] File storage (temporary)
- [ ] Unit tests for CSV generator

#### Phase 4: Job System
- [ ] Export job model and service
- [ ] Progress tracking system
- [ ] Job status endpoints
- [ ] File download endpoint
- [ ] Integration tests

#### Phase 5: Frontend
- [ ] Export button component
- [ ] Export modal with progress
- [ ] Polling hook
- [ ] Recent exports list (optional)
- [ ] Component tests

#### Phase 6: Polish & Production
- [ ] Error handling refinement
- [ ] Loading states optimization
- [ ] Performance testing with large datasets
- [ ] Documentation
- [ ] Deployment configuration

### Testing Strategy

#### Unit Tests
- All services must have >80% coverage
- Test error scenarios and edge cases
- Mock external API calls

#### Integration Tests
- End-to-end job flow
- API integration with Teamtailor (use test API key)
- CSV generation with sample data

#### Manual Testing Scenarios
1. Small dataset (<100 candidates)
2. Large dataset (>1000 candidates)
3. API rate limiting
4. Network failures mid-export
5. User closes browser during export
6. Multiple concurrent exports

### Performance Targets
- **Small datasets (<100)**: Complete in <10 seconds
- **Medium datasets (100-1000)**: Complete in <60 seconds
- **Large datasets (>1000)**: Progress updates every 2-3 seconds
- **Memory usage**: <200MB regardless of dataset size
- **Concurrent exports**: Support 5+ simultaneous jobs

### Non-Functional Requirements
- **Reliability**: Jobs must complete or fail clearly (no hanging states)
- **Observability**: Log all API calls, errors, and job state changes
- **Scalability**: Architecture supports adding Redis/Bull queue later
- **Maintainability**: Clear separation of concerns, typed interfaces
- **Security**: API keys never exposed to client, validated server-side
