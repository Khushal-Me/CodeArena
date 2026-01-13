# CodeArena API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, CodeArena uses session-based identification. A session ID is automatically created and stored in cookies.

## Endpoints

### Health Check

Check if the API is running.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Problems

#### List All Problems

Get a list of all available coding problems.

```http
GET /api/problems
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| difficulty | string | Filter by difficulty: `easy`, `medium`, `hard` |
| language | string | Filter by supported language |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response:**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Two Sum",
      "slug": "two-sum",
      "difficulty": "easy",
      "tags": ["array", "hash-table"],
      "supportedLanguages": ["python", "javascript", "java", "cpp"],
      "acceptanceRate": 45.2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 21,
    "totalPages": 2
  }
}
```

#### Get Problem Details

Get detailed information about a specific problem.

```http
GET /api/problems/:id
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Two Sum",
  "slug": "two-sum",
  "description": "Given an array of integers nums and an integer target...",
  "difficulty": "easy",
  "supportedLanguages": ["python", "javascript", "java", "cpp"],
  "timeLimit": 10,
  "memoryLimit": 256,
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9"
  ],
  "hints": [
    "A brute force approach would be to check all pairs.",
    "Can you use a hash map to optimize?"
  ],
  "tags": ["array", "hash-table"]
}
```

---

### Submissions

#### Submit Solution

Submit a code solution for evaluation.

```http
POST /api/submissions
```

**Request Body:**
```json
{
  "problemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []",
  "language": "python"
}
```

**Response:**
```json
{
  "submissionId": "sub-123e4567-e89b-12d3-a456-426614174000",
  "status": "queued",
  "message": "Submission queued for processing"
}
```

#### Get Submission Status

Get the current status and results of a submission.

```http
GET /api/submissions/:id
```

**Response (Processing):**
```json
{
  "id": "sub-123e4567-e89b-12d3-a456-426614174000",
  "problemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "language": "python",
  "status": "processing",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Response (Completed):**
```json
{
  "id": "sub-123e4567-e89b-12d3-a456-426614174000",
  "problemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "problemTitle": "Two Sum",
  "language": "python",
  "status": "accepted",
  "executionTime": 45,
  "memoryUsage": 12.5,
  "results": [
    {
      "passed": true,
      "input": "{\"nums\": [2,7,11,15], \"target\": 9}",
      "expected": "[0,1]",
      "actual": "[0,1]",
      "executionTime": 12
    },
    {
      "passed": true,
      "input": "{\"nums\": [3,2,4], \"target\": 6}",
      "expected": "[1,2]",
      "actual": "[1,2]",
      "executionTime": 10
    }
  ],
  "code": "def two_sum(nums, target):\n    ...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "completedAt": "2024-01-15T10:30:02.000Z"
}
```

---

### History

#### Get Submission History

Get submission history for the current session.

```http
GET /api/history
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| problemId | string | Filter by problem |
| status | string | Filter by status |

**Response:**
```json
{
  "data": [
    {
      "id": "sub-123",
      "problemId": "a1b2c3d4",
      "problemTitle": "Two Sum",
      "language": "python",
      "status": "accepted",
      "executionTime": 45,
      "memoryUsage": 12.5,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

## WebSocket Events

Connect to `ws://localhost:3001` for real-time updates.

### Client Events

#### Subscribe to Submission

```javascript
socket.emit('subscribe', { submissionId: 'sub-123' });
```

#### Unsubscribe from Submission

```javascript
socket.emit('unsubscribe', { submissionId: 'sub-123' });
```

### Server Events

#### Status Update

```javascript
socket.on('status_update', (data) => {
  console.log(data);
  // {
  //   submissionId: 'sub-123',
  //   status: 'processing',
  //   currentTestCase: 2,
  //   totalTestCases: 5
  // }
});
```

#### Test Result

```javascript
socket.on('test_result', (data) => {
  console.log(data);
  // {
  //   submissionId: 'sub-123',
  //   testCase: 2,
  //   passed: true,
  //   executionTime: 15
  // }
});
```

#### Completion

```javascript
socket.on('complete', (data) => {
  console.log(data);
  // {
  //   submissionId: 'sub-123',
  //   status: 'accepted',
  //   executionTime: 125,
  //   memoryUsage: 15.2,
  //   results: [...]
  // }
});
```

---

## Status Codes

### Submission Status Values

| Status | Description |
|--------|-------------|
| `queued` | Submission is waiting in the queue |
| `processing` | Code is being executed |
| `accepted` | All test cases passed |
| `wrong_answer` | One or more test cases failed |
| `time_limit_exceeded` | Execution exceeded time limit |
| `memory_limit_exceeded` | Execution exceeded memory limit |
| `runtime_error` | Code crashed during execution |
| `compilation_error` | Code failed to compile (Java/C++) |
| `system_error` | Internal system error |

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 requests/minute |
| Submissions | 10 requests/minute |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705315800
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "code",
        "message": "Code is required"
      }
    ]
  }
}
```

---

## Example Usage

### JavaScript (Fetch)

```javascript
// Submit a solution
const response = await fetch('http://localhost:3000/api/submissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    problemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    code: 'def solution(nums, target): return [0, 1]',
    language: 'python'
  }),
});

const { submissionId } = await response.json();
console.log('Submission ID:', submissionId);
```

### Python (requests)

```python
import requests

# Get all problems
response = requests.get('http://localhost:3000/api/problems')
problems = response.json()['data']

# Submit solution
submission = requests.post(
    'http://localhost:3000/api/submissions',
    json={
        'problemId': problems[0]['id'],
        'code': 'def solution(nums, target): return [0, 1]',
        'language': 'python'
    }
)
print(submission.json())
```

### cURL

```bash
# Get problems
curl http://localhost:3000/api/problems

# Submit solution
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "code": "def solution(nums, target): return [0, 1]",
    "language": "python"
  }'
```
