# @laikatest/sdk Examples

Ready-to-run demo projects showcasing different use cases for the LaikaTest unified SDK.

## Prerequisites

1. **LaikaTest API Key**: Get one from [LaikaTest Dashboard](https://laikatest.com)
2. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com)
3. **Node.js 18+**

## Available Demos

| Demo | Description |
|------|-------------|
| [01-basic-tracing](./01-basic-tracing) | Automatic OpenTelemetry tracing for OpenAI calls |
| [02-ab-testing](./02-ab-testing) | Experiment prompt fetching and score tracking |
| [03-express-server](./03-express-server) | SDK integration in an Express.js web server |
| [04-ai-native-tracing](./04-ai-native-tracing) | AI-native semantic tracing API for RAG, agents, and custom workflows |

## Quick Start

```bash
# 1. Navigate to a demo
cd 01-basic-tracing

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Run the demo
npm start
```

## Demo Overview

### 01-basic-tracing

The simplest example - shows how to:
- Initialize the SDK with just your API key
- Set session and user context for trace grouping
- Make OpenAI calls that are automatically traced
- **Properly shutdown the SDK (mandatory)**

### 02-ab-testing

Demonstrates A/B testing features:
- Fetch experiment prompts with automatic bucketing
- Access the assigned variant and prompt content
- Track outcome scores for experiment analysis
- Experiment context is auto-injected into traces

### 03-express-server

Full server integration pattern:
- SDK initialization at server startup
- Middleware for per-request context (session/user from headers)
- API endpoints that leverage tracing
- **Graceful shutdown on SIGTERM (mandatory)**

### 04-ai-native-tracing

AI-native semantic tracing API:
- RAG pipeline tracing (retrieval, rerank, generation)
- Agent workflow tracing (agent, tool, step)
- LLM operations (generation, evaluation)
- Generic spans for custom use cases with attributes and events

## Important: Mandatory Shutdown

All examples demonstrate calling `laika.shutdown()` before process exit. **This is mandatory** to ensure:

- All pending traces are flushed to the server
- Resources are properly cleaned up
- No data is lost

For short-lived scripts:
```typescript
await laika.shutdown();
```

For long-running servers:
```typescript
process.on('SIGTERM', async () => {
  await laika.shutdown();
  process.exit(0);
});
```

## Viewing Traces

After running a demo, view your traces in the [LaikaTest Dashboard](https://laikatest.com):

1. Go to **Tracing** tab
2. Find traces from your service name
3. See OpenAI call details, token usage, latency, and custom context
