# @laikatest/sdk

Unified LaikaTest SDK for tracing and A/B testing. Single initialization for both observability and experiments.

## Why This Package?

**Before** - confusing dual initialization:
```typescript
import { initLaika } from '@laikatest/auto-otel';
import { LaikaTest } from '@laikatest/js-client';

initLaika({ apiKey: 'key', serviceName: 'app' });  // Tracing
const client = new LaikaTest('key');               // Same key again?
```

**After** - single unified init:
```typescript
import { Laika } from '@laikatest/sdk';

const laika = Laika.init({
  apiKey: 'key',
  serviceName: 'app',
});
// Both tracing AND experiments enabled by default
```

## Installation

```bash
npm install @laikatest/sdk
```

## Quick Start

```typescript
import { Laika, setSessionId } from '@laikatest/sdk';

// Initialize once - enables both tracing and experiments
const laika = Laika.init({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
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
  serviceName: string;   // Service name for traces

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

## Feature Toggles

Enable only what you need:

```typescript
// Tracing only (observability without experiments)
const laika = Laika.init({
  apiKey: 'key',
  serviceName: 'app',
  experiments: false,
});

// Experiments only (A/B testing without tracing)
const laika = Laika.init({
  apiKey: 'key',
  serviceName: 'app',
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

## API Reference

### Laika Class

| Method | Description |
|--------|-------------|
| `Laika.init(config)` | Initialize SDK (static factory) |
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
import { Laika, setSessionId, setUserId } from '@laikatest/sdk';

const laika = Laika.init({
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
import { Laika, setSessionId, setUserId, setProperty } from '@laikatest/sdk';

const laika = Laika.init({
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

### Before (Two Packages)

```typescript
import { initLaika, setSessionId } from '@laikatest/auto-otel';
import { LaikaTest } from '@laikatest/js-client';

initLaika({ apiKey: 'key', serviceName: 'app' });
const client = new LaikaTest('key');

setSessionId('conv-123');
const prompt = await client.getExperimentPrompt('exp', { userId: 'u1' });
```

### After (Unified SDK)

```typescript
import { Laika, setSessionId } from '@laikatest/sdk';

const laika = Laika.init({ apiKey: 'key', serviceName: 'app' });

setSessionId('conv-123');
const prompt = await laika.getExperimentPrompt('exp', { userId: 'u1' });
```

## Backward Compatibility

- `@laikatest/auto-otel` continues to work standalone
- `@laikatest/js-client` continues to work standalone
- Migrate to `@laikatest/sdk` at your own pace

## License

MIT
