# @laikatest/sdk

Unified LaikaTest SDK for tracing and A/B testing. Single initialization for both observability and experiments.

## Why This Package?

The SDK provides a single, unified initialization for both tracing and A/B testing. No need to manage separate packages or duplicate configuration - one init call enables everything you need.

```typescript
import { LaikaTest } from '@laikatest/sdk';

const laika = LaikaTest.init({
  apiKey: 'your-api-key',
});
// Both tracing and experiments enabled automatically
```

## Installation

```bash
npm install @laikatest/sdk
```

## Quick Start

```typescript
import { LaikaTest, setSessionId } from '@laikatest/sdk';

// Initialize with just your API key - everything else is auto-detected
const laika = LaikaTest.init({
  apiKey: process.env.LAIKA_API_KEY,
});

// Set context for multi-turn conversations
setSessionId('conversation-123');

// Get A/B tested prompt
const prompt = await laika.getExperimentPrompt('my-experiment', {
  userId: 'user-123',
});

// Make LLM call (automatically traced with experiment context)
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt.getContent() }],
});

// Track outcome score
await prompt.pushScore(
  [{ name: 'rating', type: 'int', value: 5 }],
  { userId: 'user-123' }
);

// Cleanup before exit
await laika.shutdown();
```

## Configuration

```typescript
interface LaikaConfig {
  // Required
  apiKey: string;        // Your LaikaTest API key

  // Optional (smart defaults)
  serviceName?: string;  // Service name (auto-detected from package.json or directory name)

  // Feature toggles (both default: true)
  tracing?: boolean;     // Enable OpenTelemetry tracing
  experiments?: boolean; // Enable A/B testing client

  // Tracing options (passed to @laikatest/auto-otel)
  endpoint?: string;          // OTLP endpoint (default: https://api.laikatest.com/otel/v1/traces)
  captureContent?: boolean;   // Capture prompt/response content (default: false)
  debug?: boolean;            // Enable debug logging

  // Shared context
  sessionId?: string;                    // Static session ID
  getSessionId?: () => string;           // Dynamic session ID getter
  userId?: string;                       // Static user ID
  getUserId?: () => string;              // Dynamic user ID getter
  defaultProperties?: Record<string, string | number | boolean>;

  // Client options (passed to @laikatest/js-client)
  baseUrl?: string;       // API base URL (default: https://api.laikatest.com)
  timeout?: number;       // Request timeout ms (default: 10000)
  cacheEnabled?: boolean; // Enable prompt caching (default: true)
  cacheTTL?: number;      // Cache TTL ms (default: 30 minutes)
}
```

### Auto-Detection

The SDK automatically detects:
- **Service Name**: From `package.json` name field, or directory name as fallback
- **Environment**: From `NODE_ENV` environment variable (defaults to 'development')
- **Version**: From `package.json` version field

These are automatically added to all spans as attributes for filtering and analytics.

## Feature Toggles

Enable only what you need:

```typescript
// Tracing only (observability without experiments)
const laika = LaikaTest.init({
  apiKey: 'key',
  experiments: false,
});

// Experiments only (A/B testing without tracing)
const laika = LaikaTest.init({
  apiKey: 'key',
  tracing: false,
});

// Check what's enabled
laika.isTracingEnabled();     // true/false
laika.isExperimentsEnabled(); // true/false
```

## Context Management

All context functions are re-exported from `@laikatest/auto-otel`:

```typescript
import {
  // Session tracking (multi-turn conversations)
  setSessionId,
  getSessionId,
  clearSessionId,

  // User tracking (per-user analytics)
  setUserId,
  getUserId,
  clearUserId,

  // Custom properties (filtering/segmentation)
  setProperty,
  setProperties,
  getProperties,
  clearProperties,
  removeProperty,
} from '@laikatest/sdk';

// Example: Set context for a chat session
setSessionId('conversation-123');
setUserId('user-456');
setProperties({
  environment: 'production',
  feature: 'checkout',
  tier: 'enterprise',
});
```

## AI-Native Tracing

The SDK provides semantic helpers for common AI workflows like RAG pipelines and agent systems. These helpers automatically create properly-named spans with semantic attributes.

### RAG Pipeline Example

```typescript
import { trace } from '@laikatest/sdk';

const answer = await trace.rag('customer-qa', async () => {
  // Step 1: Retrieve documents
  const docs = await trace.retrieval('search', async () => {
    return await vectorDB.search(query);
  });

  // Step 2: Rerank for relevance
  const reranked = await trace.rerank('scoring', async () => {
    return await reranker.rerank(docs, query);
  });

  // Step 3: Generate answer
  const answer = await trace.generation('answer', async () => {
    return await llm.generate(reranked, query);
  });

  return answer;
});
```

### Agent Workflow Example

```typescript
import { trace } from '@laikatest/sdk';

await trace.agent('research-agent', async () => {
  // Plan the next action
  const plan = await trace.step('planning', async () => {
    return await planNextAction(query);
  });

  // Execute tool
  const results = await trace.tool('web-search', async () => {
    return await searchTool.run(plan.query);
  });

  // Analyze results
  return await trace.step('analysis', async () => {
    return await analyzeResults(results);
  });
});
```

### Available Helpers

**RAG Workflow:**
```typescript
trace.rag(name, fn)         // RAG pipeline wrapper
trace.retrieval(name, fn)   // Document retrieval
trace.rerank(name, fn)      // Document reranking
trace.embedding(name, fn)   // Embedding generation
```

**Agent Workflow:**
```typescript
trace.agent(name, fn)       // Agent wrapper
trace.tool(name, fn)        // Tool execution
trace.step(name, fn)        // Generic step
```

**LLM Operations:**
```typescript
trace.generation(name, fn)  // LLM generation
trace.evaluation(name, fn)  // Evaluation
```

### Complete Example

```typescript
import { trace } from '@laikatest/sdk';

// RAG Pipeline
const answer = await trace.rag('support-qa', async () => {
  // Step 1: Retrieve documents
  const docs = await trace.retrieval('knowledge-base', async () => {
    return await vectorDB.query(userQuestion, { topK: 5 });
  });

  // Step 2: Rerank for relevance
  const reranked = await trace.rerank('relevance', async () => {
    return await reranker.rerank(docs, userQuestion);
  });

  // Step 3: Generate answer
  const answer = await trace.generation('answer', async () => {
    return await openai.chat.completions.create({
      model: 'gpt-4',
      messages: buildPrompt(reranked, userQuestion)
    });
  });

  return answer;
});

// Agent Workflow
await trace.agent('research-agent', async () => {
  const plan = await trace.step('planning', async () => {
    return await planNextAction(query);
  });

  const results = await trace.tool('web-search', async () => {
    return await searchTool.run(plan.query);
  });

  return await trace.step('analysis', async () => {
    return await analyzeResults(results);
  });
});
```

### Span Naming

All helpers automatically create semantic span names:
- `trace.rag('customer-qa')` → Span: `rag.customer-qa`
- `trace.retrieval('search')` → Span: `retrieval.search`
- `trace.tool('web-search')` → Span: `tool.web-search`

Each span also includes:
- `laikatest.operation.type` - The operation type (rag, agent, tool, etc.)
- `laikatest.operation.name` - The user-provided name

## API Reference

### LaikaTest Class

| Method | Description |
|--------|-------------|
| `LaikaTest.init(config)` | Initialize SDK (static factory) |
| `laika.getPrompt(name, options?)` | Fetch prompt by name |
| `laika.getExperimentPrompt(title, context?)` | Get A/B tested prompt |
| `laika.shutdown()` | Cleanup resources |
| `laika.isTracingEnabled()` | Check if tracing is on |
| `laika.isExperimentsEnabled()` | Check if experiments is on |

### Re-exported from @laikatest/js-client

| Export | Description |
|--------|-------------|
| `Prompt` | Prompt class with `getContent()`, `pushScore()` |
| `LaikaServiceError` | API error (4xx/5xx) |
| `NetworkError` | Network/timeout error |
| `ValidationError` | Input validation error |
| `AuthenticationError` | Auth failure error |

### Re-exported Types

```typescript
import type {
  PromptContent,
  ScoreInput,
  ScoreType,
  PushScoreOptions,
  PushScoreResponse,
  ClientOptions,
  GetPromptOptions,
} from '@laikatest/sdk';
```

## Integration Patterns

### Multi-Turn Chatbot

```typescript
import { LaikaTest, setSessionId, setUserId } from '@laikatest/sdk';

const laika = LaikaTest.init({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'chatbot',
});

async function handleMessage(userId: string, conversationId: string, message: string) {
  // Set context (appears in all traces)
  setSessionId(conversationId);
  setUserId(userId);

  // Get experiment prompt
  const prompt = await laika.getExperimentPrompt('system-prompt-v2', { userId });

  // Call LLM (auto-traced with session, user, experiment context)
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: prompt.getContent() },
      { role: 'user', content: message },
    ],
  });

  return response.choices[0].message.content;
}
```

### Express.js Middleware

```typescript
import { LaikaTest, setSessionId, setUserId, setProperty } from '@laikatest/sdk';

const laika = LaikaTest.init({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'api-server',
});

// Middleware to set context per request
app.use((req, res, next) => {
  if (req.headers['x-session-id']) {
    setSessionId(req.headers['x-session-id']);
  }
  if (req.user?.id) {
    setUserId(req.user.id);
  }
  setProperty('endpoint', req.path);
  next();
});
```

## Migration from Separate Packages

If you're currently using `@laikatest/auto-otel` and `@laikatest/js-client` separately, you can migrate to the unified SDK:

```typescript
import { LaikaTest, setSessionId } from '@laikatest/sdk';

const laika = LaikaTest.init({ apiKey: 'key', serviceName: 'app' });

setSessionId('conv-123');
const prompt = await laika.getExperimentPrompt('exp', { userId: 'u1' });
```

## Backward Compatibility

- `@laikatest/auto-otel` continues to work standalone
- `@laikatest/js-client` continues to work standalone
- Migrate to `@laikatest/sdk` at your own pace

## License

MIT
