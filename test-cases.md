# Test Cases - Candidate Export Feature

## Table of Contents
1. [Happy Path Test Cases](#happy-path-test-cases)
2. [Error Handling Test Cases](#error-handling-test-cases)
3. [Edge Cases](#edge-cases)
4. [Performance Test Cases](#performance-test-cases)
5. [Security Test Cases](#security-test-cases)
6. [UI/UX Test Cases](#uiux-test-cases)
7. [Concurrent Usage Test Cases](#concurrent-usage-test-cases)

---

## Happy Path Test Cases

### TC-HP-001: Successful Export - Small Dataset
**Preconditions:**
- User is logged in
- Teamtailor API is accessible
- Database contains 10 candidates with 15 total job applications

**Steps:**
1. Navigate to candidate management page
2. Click "Export Candidates" button
3. Observe export modal appears
4. Wait for progress to complete
5. Verify CSV file downloads automatically

**Expected Results:**
- ✅ Modal shows "Preparing export..."
- ✅ Progress bar displays: "Fetching candidates... 10/10 (100%)"
- ✅ Modal shows "Download starting..."
- ✅ CSV file downloads with name format: `candidates_YYYY-MM-DD_HHmmss.csv`
- ✅ CSV contains 15 rows (one per application) + 1 header row
- ✅ All columns present: candidate_id, first_name, last_name, email, job_application_id, job_application_created_at
- ✅ Data is accurate and complete
- ✅ Modal closes or shows success message

**Priority:** HIGH

---

### TC-HP-002: Successful Export - Medium Dataset
**Preconditions:**
- Database contains 250 candidates with 500 job applications

**Steps:**
1. Click "Export Candidates" button
2. Observe progress updates every 2-3 seconds
3. Wait for completion
4. Verify download

**Expected Results:**
- ✅ Progress updates smoothly (0% → 25% → 50% → 75% → 100%)
- ✅ Stage messages update: "Fetching candidates..." → "Processing applications..." → "Generating CSV..."
- ✅ Export completes in <60 seconds
- ✅ CSV file contains 500 rows + header
- ✅ No duplicate or missing records

**Priority:** HIGH

---

### TC-HP-003: Successful Export - Large Dataset
**Preconditions:**
- Database contains 1000+ candidates with 2000+ job applications

**Steps:**
1. Click "Export Candidates" button
2. Monitor progress for extended period
3. Verify completion

**Expected Results:**
- ✅ Progress bar updates consistently
- ✅ No UI freezing or hanging
- ✅ Memory usage stays reasonable (<200MB)
- ✅ Export completes successfully
- ✅ CSV file integrity verified

**Priority:** HIGH

---

### TC-HP-004: Multiple Columns Populated Correctly
**Preconditions:**
- Test data with various candidate scenarios

**Test Data:**
```
Candidate 1: Multiple applications (3)
Candidate 2: Single application
Candidate 3: Special characters in name (Müller, O'Brien)
Candidate 4: Long email address
```

**Steps:**
1. Export candidates
2. Open CSV in Excel/spreadsheet software
3. Verify each row

**Expected Results:**
- ✅ Candidate with 3 applications appears in 3 rows
- ✅ All candidate_id values are correct
- ✅ Special characters display correctly (UTF-8 encoding)
- ✅ Dates formatted as ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- ✅ Email addresses not truncated
- ✅ No data corruption

**Priority:** HIGH

---

## Error Handling Test Cases

### TC-ERR-001: Invalid API Key
**Preconditions:**
- Set invalid TEAMTAILOR_API_KEY in environment

**Steps:**
1. Start application
2. Click "Export Candidates" button

**Expected Results:**
- ✅ Application fails to start OR shows clear error before export
- ✅ Error message: "Unable to connect to Teamtailor API. Please check your API key configuration."
- ✅ User cannot initiate export
- ✅ No partial data downloaded
- ✅ Suggested action provided to user

**Priority:** HIGH

---

### TC-ERR-002: API Timeout During Fetch
**Preconditions:**
- Simulate slow/unresponsive Teamtailor API (network throttling)

**Steps:**
1. Click "Export Candidates" button
2. Wait for timeout (30 seconds)

**Expected Results:**
- ✅ Progress shows "Connecting to Teamtailor..."
- ✅ After timeout: "Connection timeout. Retrying... (Attempt 1/3)"
- ✅ System retries up to 3 times
- ✅ If all retries fail: Clear error message displayed
- ✅ Job status changes to "failed"
- ✅ User can try again

**Priority:** HIGH

---

### TC-ERR-003: Rate Limit Hit (429 Error)
**Preconditions:**
- Trigger multiple rapid exports to hit rate limit

**Steps:**
1. Start first export
2. Immediately start second export
3. Continue until rate limit hit

**Expected Results:**
- ✅ System detects 429 response
- ✅ Automatically applies exponential backoff
- ✅ Progress shows: "Rate limited. Waiting 5 seconds..."
- ✅ Export continues after waiting
- ✅ Eventually completes successfully
- ✅ No data loss

**Priority:** MEDIUM

---

### TC-ERR-004: Network Disconnection Mid-Export
**Preconditions:**
- Start export with medium dataset
- Disconnect network at 50% progress

**Steps:**
1. Click "Export Candidates" button
2. Wait until 50% progress
3. Disconnect network/internet
4. Wait 30 seconds
5. Reconnect network

**Expected Results:**
- ✅ Progress stops updating
- ✅ Error message: "Connection lost. Retrying..."
- ✅ System retries automatically when connection restored
- ✅ Export resumes from last successful point (no duplicate data)
- ✅ Eventually completes successfully

**Priority:** MEDIUM

---

### TC-ERR-005: API Returns Malformed Data
**Preconditions:**
- Mock API to return invalid JSON

**Steps:**
1. Click "Export Candidates" button

**Expected Results:**
- ✅ System detects invalid response
- ✅ Error logged to console/logs
- ✅ User sees: "Data format error. Please contact support."
- ✅ Job status: "failed"
- ✅ No corrupted CSV downloaded

**Priority:** MEDIUM

---

### TC-ERR-006: Empty Dataset
**Preconditions:**
- Database has 0 candidates

**Steps:**
1. Click "Export Candidates" button

**Expected Results:**
- ✅ Export job starts
- ✅ Progress completes quickly
- ✅ CSV file downloads
- ✅ CSV contains only header row (no data rows)
- ✅ Success message: "Export completed. 0 candidates found."

**Priority:** LOW

---

## Edge Cases

### TC-EDGE-001: Candidate Without Job Applications
**Preconditions:**
- Candidate exists but has 0 job applications

**Steps:**
1. Export candidates

**Expected Results:**
- ✅ Candidate does NOT appear in CSV (since no applications)
- ✅ OR appears with empty job_application_id and job_application_created_at
- ✅ Behavior documented clearly

**Priority:** MEDIUM

---

### TC-EDGE-002: Special Characters in Data
**Test Data:**
```
Names: "John "Johnny" Doe", "Marie-José O'Brien"
Emails: "test+tag@example.com", "user@sub-domain.co.uk"
```

**Steps:**
1. Create test candidates with special characters
2. Export CSV
3. Open in Excel and text editor

**Expected Results:**
- ✅ CSV properly escapes quotes and commas
- ✅ UTF-8 encoding preserved
- ✅ Diacritics display correctly (José, Müller)
- ✅ Plus signs in emails not corrupted
- ✅ Hyphens in names preserved

**Priority:** MEDIUM

---

### TC-EDGE-003: Very Long Field Values
**Test Data:**
```
Email: 254 characters (max valid email length)
Name: 100+ characters
```

**Steps:**
1. Create candidate with extremely long values
2. Export CSV

**Expected Results:**
- ✅ All data exported without truncation
- ✅ CSV columns properly separated
- ✅ No data overflow into adjacent columns

**Priority:** LOW

---

### TC-EDGE-004: Candidate Updated During Export
**Preconditions:**
- Start export with large dataset

**Steps:**
1. Start export (will take 30+ seconds)
2. While exporting, add new candidate via Teamtailor
3. Wait for export to complete

**Expected Results:**
- ✅ Export completes successfully
- ✅ New candidate may or may not be included (document behavior)
- ✅ No duplicate records
- ✅ No data corruption

**Priority:** LOW

---

### TC-EDGE-005: Date/Time Edge Cases
**Test Data:**
```
Application created: 2024-02-29T23:59:59Z (leap year, end of day)
Application created: 1970-01-01T00:00:00Z (Unix epoch start)
```

**Steps:**
1. Export candidates with edge case dates

**Expected Results:**
- ✅ All dates formatted correctly
- ✅ Timezone information preserved (UTC)
- ✅ Dates parseable by Excel/spreadsheet software

**Priority:** LOW

---

## Performance Test Cases

### TC-PERF-001: Memory Usage - Large Export
**Preconditions:**
- Database with 5000+ candidates

**Steps:**
1. Monitor server memory before export
2. Start export
3. Monitor memory during export
4. Check memory after completion

**Expected Results:**
- ✅ Memory usage increases gradually (streaming)
- ✅ Peak memory <200MB regardless of dataset size
- ✅ Memory returns to baseline after completion
- ✅ No memory leaks

**Priority:** HIGH

---

### TC-PERF-002: Multiple Concurrent Exports
**Preconditions:**
- Multiple user accounts

**Steps:**
1. 5 users simultaneously click "Export Candidates"
2. Monitor server resources
3. Verify all exports complete

**Expected Results:**
- ✅ All jobs process without errors
- ✅ No job interferes with others
- ✅ Server remains responsive
- ✅ All users get correct data
- ✅ CPU usage reasonable

**Priority:** MEDIUM

---

### TC-PERF-003: Network Bandwidth Usage
**Steps:**
1. Monitor network traffic during export
2. Verify data transfer patterns

**Expected Results:**
- ✅ API calls spaced 100-200ms apart (rate limiting)
- ✅ No excessive data transfer
- ✅ Streaming efficient (no repeated fetches)

**Priority:** LOW

---

## Security Test Cases

### TC-SEC-001: API Key Exposure
**Steps:**
1. Open browser developer tools
2. Click "Export Candidates"
3. Inspect network requests
4. Check response data

**Expected Results:**
- ✅ API key NOT visible in browser
- ✅ API key NOT in network requests from client
- ✅ API key NOT in downloaded CSV
- ✅ API key only exists server-side

**Priority:** CRITICAL

---

### TC-SEC-002: Unauthorized Access
**Preconditions:**
- User not logged in

**Steps:**
1. Attempt to access export endpoint directly
2. Try to poll job status for others' jobs
3. Try to download others' export files

**Expected Results:**
- ✅ 401 Unauthorized response
- ✅ Cannot access export functionality
- ✅ Cannot access other users' jobs
- ✅ Clear login prompt displayed

**Priority:** CRITICAL

---

### TC-SEC-003: SQL Injection / XSS Attempts
**Test Data:**
```
Malicious input in search: '; DROP TABLE candidates--
XSS attempt: <script>alert('xss')</script>
```

**Steps:**
1. Attempt to inject malicious code through any input
2. Export and verify

**Expected Results:**
- ✅ Input sanitized/escaped
- ✅ No code execution
- ✅ Malicious strings appear as plain text in CSV
- ✅ System remains secure

**Priority:** CRITICAL

---

### TC-SEC-004: File Access Control
**Steps:**
1. Complete export and get download URL
2. Wait 24 hours
3. Try to download again
4. Try to guess other file URLs

**Expected Results:**
- ✅ Files expire after 24 hours (configurable)
- ✅ Cannot access expired files
- ✅ Cannot guess/access other users' files
- ✅ Proper 404/403 responses

**Priority:** HIGH

---

## UI/UX Test Cases

### TC-UX-001: Modal Behavior
**Steps:**
1. Click "Export Candidates"
2. Try to close modal during export
3. Try to click outside modal
4. Try pressing ESC key

**Expected Results:**
- ✅ Modal cannot be closed accidentally during export
- ✅ Warning if user tries to close: "Export in progress. Are you sure?"
- ✅ If user confirms close: job continues in background
- ✅ User can return to check status later

**Priority:** MEDIUM

---

### TC-UX-002: Progress Bar Accuracy
**Steps:**
1. Start export
2. Observe progress bar updates

**Expected Results:**
- ✅ Progress never goes backwards
- ✅ Updates smoothly (no jumps from 10% to 90%)
- ✅ Percentage matches actual work done
- ✅ Stage messages meaningful and helpful

**Priority:** MEDIUM

---

### TC-UX-003: Responsive Design
**Steps:**
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x667)

**Expected Results:**
- ✅ Modal fits screen on all devices
- ✅ Button accessible and clickable
- ✅ Progress bar visible and readable
- ✅ No horizontal scrolling needed

**Priority:** MEDIUM

---

### TC-UX-004: Loading States
**Steps:**
1. Observe all loading indicators

**Expected Results:**
- ✅ Button shows loading spinner immediately on click
- ✅ Button disabled during export
- ✅ Clear visual feedback at all stages
- ✅ No blank/frozen screens

**Priority:** MEDIUM

---

### TC-UX-005: Success Feedback
**Steps:**
1. Complete export successfully

**Expected Results:**
- ✅ Clear success message displayed
- ✅ File name shown
- ✅ Record count displayed: "Exported 127 candidates with 245 applications"
- ✅ Option to close modal or export again

**Priority:** LOW

---

### TC-UX-006: Browser Tab/Window Close During Export
**Steps:**
1. Start export
2. Close browser tab
3. Reopen application

**Expected Results:**
- ✅ Job continues in background
- ✅ Upon return: notification "You have 1 pending export"
- ✅ Can view status and download when ready
- ✅ No data loss

**Priority:** HIGH

---

## Concurrent Usage Test Cases

### TC-CONC-001: Same User Multiple Exports
**Steps:**
1. User starts export #1
2. While #1 is running, start export #2

**Expected Results:**
- ✅ System allows both (or queues second)
- ✅ Both complete successfully
- ✅ Separate job IDs
- ✅ No data mixing between exports

**Priority:** MEDIUM

---

### TC-CONC-002: Multiple Users Same Time
**Steps:**
1. 10 users simultaneously click export

**Expected Results:**
- ✅ All jobs process fairly
- ✅ No job starvation
- ✅ Reasonable queue time
- ✅ All complete successfully

**Priority:** MEDIUM

---

## Acceptance Criteria Summary

### Critical Tests (Must Pass)
- ✅ TC-HP-001: Basic export works
- ✅ TC-HP-002: Medium dataset export
- ✅ TC-ERR-001: Invalid API key handled
- ✅ TC-ERR-002: Timeout retry works
- ✅ TC-SEC-001: API key not exposed
- ✅ TC-SEC-002: Unauthorized access blocked

### High Priority Tests
- All TC-HP-* (Happy Path)
- TC-ERR-003, TC-ERR-004 (Network issues)
- TC-PERF-001 (Memory efficiency)
- TC-UX-006 (Tab close recovery)

### Medium Priority Tests
- All TC-EDGE-* (Edge cases)
- Remaining TC-ERR-* (Error handling)
- TC-UX-* (User experience)

### Low Priority Tests
- Extended edge cases
- Performance optimization tests
- Non-critical UX polish

---

## Test Data Requirements

### Minimal Test Dataset
- 10 candidates
- 5 with 1 application each
- 3 with 2 applications each
- 2 with 3 applications each
- Total: 15 applications

### Medium Test Dataset
- 250 candidates
- 500 total applications
- Various application dates (last 12 months)

### Large Test Dataset
- 1000+ candidates
- 2000+ applications
- Edge cases included (special chars, long fields)

### Edge Case Test Dataset
- Candidates with 0 applications
- Candidates with 10+ applications
- Special characters in all fields
- Various date/time scenarios
- Empty/null values where applicable

---

## Test Execution Checklist

### Before Testing
- [ ] Environment variables configured correctly
- [ ] Test data populated in Teamtailor
- [ ] Both staging and production API keys available
- [ ] Browser developer tools ready
- [ ] Network throttling tools available
- [ ] Memory monitoring tools installed

### During Testing
- [ ] Document actual vs expected results
- [ ] Take screenshots of issues
- [ ] Note browser console errors
- [ ] Record network requests if issues occur
- [ ] Monitor server logs

### After Testing
- [ ] All critical tests passed
- [ ] High priority issues resolved
- [ ] Medium priority issues documented
- [ ] Test report generated
- [ ] Regression test suite updated

---

## Bug Report Template

```markdown
**Bug ID:** BUG-XXX
**Test Case:** TC-XXX-XXX
**Severity:** Critical / High / Medium / Low
**Priority:** P0 / P1 / P2 / P3

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- API Version: 20240404

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots/Logs:**
[Attach files]

**Additional Notes:**

```
