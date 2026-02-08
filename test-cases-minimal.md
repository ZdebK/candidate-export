# Test Cases - Candidate Export Feature (Minimized)

> **Note**: This is a single-user application without authentication. Multi-user and authorization test cases have been removed.

## Priority: CRITICAL (Must Pass Before Deploy)

### TC-001: Basic Export Works (Happy Path)
**Setup**: 374 candidates, 780 applications (current production data)

**Steps**:
1. Open application → Badge shows "374 candidates · 780 applications ready to export"
2. Click "Export to CSV" button
3. Observe modal + progress bar
4. Wait for completion
5. CSV downloads automatically

**Expected**:
- ✅ Modal shows "Exporting Candidates" with animated icon
- ✅ Progress: "Fetching candidates" 0% → 90% (updates as pages complete)
- ✅ Progress: "Generating CSV..." 95% → 100%
- ✅ Success: "Export Complete!" with green checkmark
- ✅ CSV filename: `candidates_2026-02-08_12-34-56.csv`
- ✅ CSV contains: 780 rows (one per application) + 1 header
- ✅ Columns: `candidate_id`, `first_name`, `last_name`, `email`, `job_application_id`, `job_application_created_at`
- ✅ Server logs show: `[Teamtailor] Starting parallel fetch: 374 candidates across 13 pages`

---

### TC-002: Invalid API Key
**Setup**: Set `TEAMTAILOR_API_KEY=invalid_key` in `.env`

**Steps**:
1. Restart server: `npm run dev`
2. Click "Export to CSV"

**Expected**:
- ✅ Export starts, then fails within 5 seconds
- ✅ Modal shows: "Export Failed"
- ✅ Error: "Unable to connect to Teamtailor API. Please check your API key configuration."
- ✅ No CSV downloaded
- ✅ Close button available

---

### TC-003: API Key Not Exposed
**Steps**:
1. Open DevTools → Network tab
2. Click "Export to CSV"
3. Inspect all XHR requests (`/count`, `/start`, `/status`, `/download`)
4. Inspect downloaded CSV

**Expected**:
- ✅ API key NEVER appears in browser network tab
- ✅ API key NOT in CSV file
- ✅ Only server-side requests have API key

---

## Priority: HIGH

### TC-004: Empty Dataset
**Setup**: Test Teamtailor account with 0 candidates

**Steps**:
1. Click "Export to CSV"

**Expected**:
- ✅ Badge shows "0 candidates · 0 applications ready to export"
- ✅ Export completes quickly
- ✅ CSV downloads with header row only (no data rows)
- ✅ Success modal: "0 records"

---

### TC-005: Network Timeout + Retry
**Setup**: Use network throttling or disconnect WiFi briefly during export

**Steps**:
1. Click "Export to CSV"
2. Disconnect network when progress = 30%
3. Wait 30 seconds
4. Reconnect network

**Expected**:
- ✅ Progress freezes when disconnected
- ✅ Browser console: `[API] Retry attempt 1/3: ...`
- ✅ After reconnect: export resumes or retries
- ✅ Eventually completes OR shows error after 3 failed retries
- ✅ Error message: "Connection timeout" or similar

---

### TC-006: Rate Limit (429 Error)
**Setup**: Trigger 5+ exports rapidly to hit Teamtailor rate limit

**Steps**:
1. Complete first export
2. Immediately click "Export to CSV" again (x5 times rapidly)

**Expected**:
- ✅ System detects 429 response
- ✅ Server logs: "Rate limit exceeded"
- ✅ Waits for `Retry-After` header (or 5s default)
- ✅ Export eventually completes after wait
- ✅ No data corruption

---

### TC-007: Special Characters in Data
**Test Data**: Candidate with name "Marie-José O'Brien", email "test+tag@domain.com"

**Steps**:
1. Create test candidate in Teamtailor
2. Export CSV
3. Open CSV in Excel + text editor

**Expected**:
- ✅ Diacritics preserved: "José" not "Jose"
- ✅ Quotes/commas escaped: `"O'Brien"` properly quoted
- ✅ UTF-8 encoding (no �� characters)
- ✅ Plus signs in emails not corrupted
- ✅ Hyphens preserved

---

### TC-008: Parallel Fetch Performance
**Setup**: 374 candidates (13 pages)

**Steps**:
1. Monitor server logs during export
2. Note timestamps

**Expected**:
- ✅ Server logs show: `Starting parallel fetch: 374 candidates across 13 pages`
- ✅ Pages fetched in parallel (5 concurrent max): `Fetched page 2/13`, `Fetched page 3/13`... appear close together
- ✅ NOT sequential: timestamps should show overlap (not 200ms+ gap between each)
- ✅ Export completes in ~3-4 seconds (not ~7 seconds)

---

## Priority: MEDIUM

### TC-009: Large Dataset (10k candidates)
**Setup**: Test account with 10,000 candidates

**Steps**:
1. Click "Export to CSV"
2. Monitor memory (Task Manager / Activity Monitor)
3. Wait for completion (~70 seconds)

**Expected**:
- ✅ Progress updates smoothly (not stuck at any %)
- ✅ Memory usage < 300MB peak
- ✅ Export completes in < 90 seconds
- ✅ CSV file valid (spot check random rows)
- ✅ No memory leaks (memory returns to baseline after)

---

### TC-010: CSV Format Correctness
**Setup**: Standard dataset

**Steps**:
1. Export CSV
2. Verify structure

**Expected**:
- ✅ Header row: `candidate_id,first_name,last_name,email,job_application_id,job_application_created_at`
- ✅ Dates in ISO 8601: `2024-01-15T10:30:00Z` (with timezone)
- ✅ No duplicate rows (same candidate_id + job_application_id)
- ✅ Candidate with 3 applications appears in 3 rows
- ✅ No trailing commas or blank rows

---

### TC-011: Modal Interaction
**Steps**:
1. Click "Export to CSV"
2. While processing (30%), click backdrop (outside modal)
3. Try clicking X button

**Expected**:
- ✅ Backdrop click: shows confirmation "Export in progress. Are you sure you want to close?"
- ✅ If confirmed: modal closes BUT job continues in background
- ✅ X button: only visible AFTER export complete/failed
- ✅ During processing: no way to accidentally close modal

---

### TC-012: Progress Bar Accuracy
**Steps**:
1. Export 374 candidates
2. Observe progress updates

**Expected**:
- ✅ Progress never goes backwards
- ✅ Updates incrementally: 0% → 7% → 14% → ... → 90% → 95% → 100%
- ✅ Stage changes: "Fetching candidates" (0-90%) → "Generating CSV..." (95-100%) → "Complete" (100%)
- ✅ Percentage reflects actual work done (e.g., 50% ≈ 50% of pages fetched)

---

### TC-013: Candidate Count Preview
**Steps**:
1. Load application
2. Observe badge before clicking export

**Expected**:
- ✅ Badge shows: "374 candidates · 780 applications ready to export"
- ✅ Loading state: "Loading candidate count..." (brief)
- ✅ If API error: badge doesn't show (no crash)

---

## Priority: LOW

### TC-014: Responsive Design
**Steps**:
1. Test on desktop (1920×1080)
2. Test on mobile (375×667)

**Expected**:
- ✅ Modal fits screen on all devices
- ✅ Progress bar readable
- ✅ Button accessible
- ✅ No horizontal scroll needed

---

### TC-015: Browser Compatibility
**Steps**:
1. Test in Chrome, Firefox, Safari, Edge

**Expected**:
- ✅ Export works in all modern browsers
- ✅ CSV downloads correctly
- ✅ No console errors

---

## Removed Test Cases (Not Applicable)

The following test cases from original `test-cases.md` have been removed:

- **Authentication**: TC-SEC-002 (no login system)
- **Multi-user**: TC-CONC-001, TC-CONC-002, TC-SEC-004 (single-user app)
- **Tab recovery**: TC-UX-006 (no persistence/recovery UI)
- **Processing applications phase**: Removed from progress expectations (parallel fetch doesn't have separate phase)

---

## Test Execution Priority

1. **Before MVP**: TC-001, TC-002, TC-003
2. **Before Production**: All CRITICAL + HIGH
3. **Nice to have**: MEDIUM + LOW

---

## Quick Smoke Test (2 minutes)

1. ✅ Application loads
2. ✅ Badge shows correct count
3. ✅ Click export → modal appears
4. ✅ Progress bar moves
5. ✅ CSV downloads
6. ✅ Open CSV → data looks correct
