# Basic Tracing Demo

Demonstrates automatic OpenTelemetry tracing for OpenAI calls using `@laikatest/sdk`.

## What This Demo Shows

- **SDK Initialization**: Single `Laika.init()` call sets up tracing
- **Automatic Tracing**: OpenAI calls are traced without code changes
- **Context Injection**: Session ID, user ID, and custom properties appear in traces
- **Clean Shutdown**: Proper resource cleanup with `laika.shutdown()`

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

## Expected Output

```
Laika SDK initialized
Tracing enabled: true

Making OpenAI request...

Response: 2 + 2 = 4.
Tokens used: 25

Shutting down...
Done! Check your LaikaTest dashboard for traces.
```

## View Traces

1. Go to [LaikaTest Dashboard](https://app.laikatest.com)
2. Navigate to **Tracing** tab
3. Find traces from service `basic-tracing-demo`

You'll see:
- Request/response details
- Token usage (prompt + completion)
- Latency metrics
- Custom context (session ID, user ID, properties)
