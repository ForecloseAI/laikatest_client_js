# @laikatest/auto-otel

One-line OpenTelemetry setup for LaikaTest - automatic LLM call tracing and observability.

## Features

- **One-line initialization**: Set up complete OpenTelemetry tracing with a single function call
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
const { initLaika } = require('@laikatest/auto-otel');

initLaika({
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
  // Default: https://ingest.laikatest.com/otel/v1/traces
  endpoint?: string;

  // Optional: Capture prompt/response content for OpenAI calls
  // Default: false (privacy-first)
  captureContent?: boolean;

  // Optional: PII masking callback
  // Note: Coming in future release
  maskingCallback?: ((text: string) => string) | null;
}
```

## Usage with @laikatest/client

For full A/B testing capabilities, combine with the LaikaTest client:

```javascript
// Initialize OTel first
const { initLaika } = require('@laikatest/auto-otel');
initLaika({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app'
});

// Then use the client for experiments
const { LaikaTestClient } = require('@laikatest/client');
const client = new LaikaTestClient(process.env.LAIKA_API_KEY);

const assignment = await client.getPromptForUser('experiment_id', 'user_123');
// All LLM calls are automatically traced with experiment context
```

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
initLaika({
  apiKey: process.env.LAIKA_API_KEY,
  serviceName: 'my-app',
  captureContent: true  // Enable content capture
});
```

**Privacy note**: Content capture is disabled by default. Only enable when needed for debugging or analysis, and ensure you comply with your data handling policies.

## How It Works

1. **TracerProvider**: Sets up OpenTelemetry SDK with BatchSpanProcessor
2. **OTLPTraceExporter**: Sends spans to LaikaTest ingest endpoint with API key auth
3. **HttpInstrumentation**: Auto-instruments all HTTP requests
4. **OpenAIInstrumentation**: Auto-instruments OpenAI SDK calls
5. **Resource**: Tags all spans with your service name
6. **Shutdown Handler**: Flushes remaining spans on SIGTERM/SIGINT

## Requirements

- Node.js >= 18

## License

MIT
