# @laikatest/auto-otel

One-line OpenTelemetry setup for LaikaTest - automatic LLM call tracing and observability.

## Features

- **One-line initialization**: Set up complete OpenTelemetry tracing with a single function call
- **Session tracking**: Group related traces by conversation or session
- **User tracking**: Associate traces with user IDs for per-user analytics
- **Custom properties**: Add arbitrary metadata to all spans
- **A/B test linking**: Automatic experiment context injection when using @laikatest/client
- **HTTP auto-instrumentation**: Automatically traces all HTTP requests
- **OpenAI instrumentation**: Native tracing for OpenAI SDK calls with token usage
- **Graceful shutdown**: Handles SIGTERM for clean span export on process exit
- **Privacy-first**: Content capture disabled by default

## Installation

```bash
npm install @laikatest/auto-otel
```

## Quick Start

```javascript
// IMPORTANT: This must be the first import in your application
const { initLaikaTest } = require('@laikatest/auto-otel');

initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app'
});

// Now import and use your other modules
const { OpenAI } = require('openai');
const openai = new OpenAI();

// All HTTP requests are automatically traced
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Configuration

```typescript
interface LaikaConfig {
  // Required: Your LaikaTest API key
  apiKey: string;

  // Required: Service name for resource identification
  serviceName: string;

  // Optional: OTLP endpoint URL
  // Default: https://api.laikatest.com/otel/v1/traces
  endpoint?: string;

  // Optional: Capture prompt/response content for OpenAI calls
  // Default: false (privacy-first)
  captureContent?: boolean;

  // Optional: Static session ID for grouping traces
  sessionId?: string;

  // Optional: Dynamic session ID getter
  getSessionId?: () => string;

  // Optional: Static user ID for per-user analytics
  userId?: string;

  // Optional: Dynamic user ID getter
  getUserId?: () => string;

  // Optional: Default properties to attach to all spans
  defaultProperties?: Record<string, string | number | boolean>;

  // Optional: Enable debug logging
  // Default: false
  debug?: boolean;
}
```

## Session Tracking

Group related traces by conversation or user session:

```javascript
const { initLaikaTest, setSessionId, clearSessionId } = require('@laikatest/auto-otel');

// Option 1: Set at initialization
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
  sessionId: 'conversation-123'
});

// Option 2: Dynamic session ID
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
  getSessionId: () => getCurrentConversationId()
});

// Option 3: Set at runtime
setSessionId('new-conversation-456');

// Clear when conversation ends
clearSessionId();
```

All spans will include `laikatest.session.id` attribute for grouping in the UI.

## User Tracking

Associate traces with specific users:

```javascript
const { initLaikaTest, setUserId, clearUserId } = require('@laikatest/auto-otel');

// Option 1: Set at initialization
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
  userId: 'user-789'
});

// Option 2: Dynamic user ID
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
  getUserId: () => getCurrentUserId()
});

// Option 3: Set at runtime (e.g., after login)
setUserId('user-789');

// Clear on logout
clearUserId();
```

All spans will include `laikatest.user.id` attribute for per-user analytics.

## Custom Properties

Add arbitrary metadata to all spans:

```javascript
const {
  initLaika,
  setProperty,
  setProperties,
  getProperties,
  removeProperty,
  clearProperties
} = require('@laikatest/auto-otel');

// Option 1: Set default properties at initialization
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
  defaultProperties: {
    environment: 'production',
    version: '1.2.3',
    tier: 'enterprise'
  }
});

// Option 2: Set properties at runtime
setProperty('feature', 'checkout');
setProperty('requestId', 12345);
setProperty('isPremium', true);

// Set multiple properties at once
setProperties({
  tenant: 'acme-corp',
  region: 'us-west'
});

// Get current properties
const props = getProperties();
// { feature: 'checkout', requestId: 12345, isPremium: true, tenant: 'acme-corp', region: 'us-west' }

// Remove specific property
removeProperty('requestId');

// Clear all properties
clearProperties();
```

Properties are prefixed with `laikatest.property.` in spans (e.g., `laikatest.property.feature`).

## A/B Test Linking (Differentiator)

When using `@laikatest/client` for A/B testing, experiment context is automatically injected into traces:

```javascript
// Initialize OTel first
const { initLaikaTest } = require('@laikatest/auto-otel');
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app'
});

// Use the client for experiments
const { LaikaTest } = require('@laikatest/client');
const client = new LaikaTest(process.env.LAIKA_API_KEY);

// Get experiment prompt - this automatically sets experiment context
const prompt = await client.getExperimentPrompt('my-experiment', { userId: 'user-123' });

// Make LLM call - experiment context is automatically included in trace
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt.getContent() }]
});
```

All subsequent spans will include:
- `laikatest.experiment.id` - The experiment ID
- `laikatest.experiment.variant_id` - The variant/bucket the user was assigned to
- `laikatest.experiment.user_id` - The user ID used for bucketing

This enables correlation between A/B test results and LLM performance metrics.

## Complete Example

```javascript
const {
  initLaikaTest,
  setSessionId,
  setUserId,
  setProperties,
  shutdown
} = require('@laikatest/auto-otel');
const { LaikaTest } = require('@laikatest/client');
const { OpenAI } = require('openai');

// Initialize with all features
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-chatbot',
  defaultProperties: {
    environment: process.env.NODE_ENV,
    version: '2.0.0'
  }
});

const client = new LaikaTest(process.env.LAIKA_API_KEY);
const openai = new OpenAI();

async function handleUserMessage(userId, conversationId, message) {
  // Set context for this request
  setSessionId(conversationId);
  setUserId(userId);
  setProperties({ messageType: 'user-query' });

  // Get A/B tested prompt (automatically adds experiment context)
  const prompt = await client.getExperimentPrompt('chatbot-prompt-v2', { userId });

  // Make LLM call (all context is automatically included in trace)
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: prompt.getContent() },
      { role: 'user', content: message }
    ]
  });

  return response.choices[0].message.content;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});
```

## Span Attributes Reference

| Attribute | Description | Example |
|-----------|-------------|---------|
| `laikatest.session.id` | Session/conversation ID | `conv-123` |
| `laikatest.user.id` | User identifier | `user-456` |
| `laikatest.property.<key>` | Custom property | `laikatest.property.env: production` |
| `laikatest.experiment.id` | A/B experiment ID | `exp-789` |
| `laikatest.experiment.variant_id` | Assigned variant | `variant-a` |
| `laikatest.experiment.user_id` | Experiment user | `user-456` |

## OpenAI Support

When using the OpenAI SDK, the following are automatically traced:

- **Chat completions**: `openai.chat.completions.create()`
- **Embeddings**: `openai.embeddings.create()`
- **Model and parameters**: Model name, temperature, max_tokens, etc.
- **Token usage**: prompt_tokens, completion_tokens, total_tokens
- **Request latency**: Duration of each API call
- **Content capture**: When `captureContent: true`, prompt messages and responses are captured

### Capturing Content

To capture prompt and response content, set `captureContent: true`:

```javascript
initLaikaTest({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
  captureContent: true  // Enable content capture
});
```

**Privacy note**: Content capture is disabled by default. Only enable when needed for debugging or analysis, and ensure you comply with your data handling policies.

## How It Works

1. **NodeSDK**: Sets up OpenTelemetry SDK with BatchSpanProcessor
2. **OTLPTraceExporter**: Sends spans to LaikaTest endpoint with API key auth
3. **LaikaSpanProcessor**: Injects session, user, properties, and experiment context
4. **HttpInstrumentation**: Auto-instruments all HTTP requests
5. **OpenAIInstrumentation**: Auto-instruments OpenAI SDK calls
6. **Resource**: Tags all spans with your service name
7. **Shutdown Handler**: Flushes remaining spans on SIGTERM/SIGINT

## API Reference

### Initialization

| Function | Description |
|----------|-------------|
| `initLaikaTest(config)` | Initialize the SDK with configuration |
| `shutdown()` | Gracefully shutdown and flush spans |

### Session Context

| Function | Description |
|----------|-------------|
| `setSessionId(id)` | Set current session ID |
| `getSessionId()` | Get current session ID |
| `clearSessionId()` | Clear session ID |

### User Context

| Function | Description |
|----------|-------------|
| `setUserId(id)` | Set current user ID |
| `getUserId()` | Get current user ID |
| `clearUserId()` | Clear user ID |

### Custom Properties

| Function | Description |
|----------|-------------|
| `setProperty(key, value)` | Set a single property |
| `setProperties(props)` | Set multiple properties |
| `getProperties()` | Get all properties |
| `removeProperty(key)` | Remove a property |
| `clearProperties()` | Clear all properties |

## Requirements

- Node.js >= 18

## License

MIT
