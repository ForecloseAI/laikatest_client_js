# Express.js Server Demo

Demonstrates `@laikatest/sdk` integration in an Express.js web server with per-request context.

## What This Demo Shows

- **Server Integration**: SDK initialization at server startup
- **Context Middleware**: Extract session/user from request headers
- **Per-Request Tracing**: Each request has its own context in traces
- **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT

## Setup

```bash
# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env
# Add your API keys to .env
```

## Run

```bash
npm start
```

## Test the Server

```bash
# Health check
curl http://localhost:3000/health

# Chat endpoint with context headers
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: session-123" \
  -H "X-User-Id: user-456" \
  -d '{"message": "Hello! What can you do?"}'
```

## Expected Output

Server logs:
```
Laika SDK initialized
Server running on http://localhost:3000

Try these commands:
  curl http://localhost:3000/health
  curl -X POST http://localhost:3000/chat ...
```

API response:
```json
{
  "reply": "Hello! I'm here to help...",
  "tokens": 42
}
```

## Architecture

```
Request with Headers
      │
      ▼
┌─────────────────────┐
│  Context Middleware │  ← Extracts X-Session-Id, X-User-Id
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│   Route Handler     │  ← Makes OpenAI call
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  Laika Tracing      │  ← Captures with context
└─────────────────────┘
```

## Production Considerations

1. **Auth Integration**: Replace header extraction with your auth system
2. **Error Handling**: Add proper error boundaries and logging
3. **Rate Limiting**: Add rate limiting for production use
4. **Health Checks**: Expand health check for load balancers
