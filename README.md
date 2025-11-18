# LaikaTest Prompts Client

JavaScript SDK for fetching LaikaTest prompt templates via API. Zero dependencies, intelligent caching, and easy-to-use interface.

## Installation

```bash
npm install @laikatest/js-client
```

## Quick Start

```javascript
const { LaikaTest } = require('@laikatest/js-client');

// Initialize client with your API key
const client = new LaikaTest('your-api-key-here');

// Fetch a prompt
const prompt = await client.getPrompt('greeting-prompt');
console.log(prompt.getContent());

// Compile with variables
const compiled = prompt.compile({ name: 'Ada' });
console.log(compiled.getContent());

// Don't forget to cleanup when done
client.destroy();
```

## Authentication

### Getting Your API Key

1. Log in to your LaikaTest dashboard
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy the key and store it securely (e.g., in environment variables)

## Basic Usage

### Fetching Current Version

By default, `getPrompt()` fetches the current published version of a prompt:

```javascript
const { LaikaTest } = require('@laikatest/js-client');

const client = new LaikaTest(process.env.LAIKATEST_API_KEY);

try {
  const result = await client.getPrompt('welcome-message');
  console.log('Prompt content:', result.getContent());
  const compiled = result.compile({ name: 'Ada' });
  console.log('Compiled content:', compiled.getContent());
} catch (error) {
  console.error('Error fetching prompt:', error.message);
} finally {
  client.destroy();
}
```

### Fetching Specific Version

To fetch a specific version of a prompt, provide the version ID (numeric format):

```javascript
const result = await client.getPrompt('welcome-message', {
  versionId: '10'  // or 'v10'
});

console.log('Version content:', result.getContent());
const compiled = result.compile({ name: 'Ada' });
console.log('Compiled:', compiled.getContent());
```

### Bypassing Cache

To force a fresh fetch from the API, bypassing the cache:

```javascript
const result = await client.getPrompt('welcome-message', {
  bypassCache: true
});
```

### Evaluating Experiments

Use `getExperimentPrompt()` to evaluate an experiment and automatically retrieve the prompt tied to the assigned group:

```javascript
const experiment = await client.getExperimentPrompt('homepage-layout-test', {
  userId: 'abc-123',
  plan: 'pro'
});

console.log('Prompt content:', experiment.getContent());
```

The method returns both the assigned experiment group and a `Prompt` instance, so you can keep using helpers amlike `compile()` on the experiment result.

### Tracking Experiment Performance with Scores

After using an experimental prompt, you can push performance metrics to analyze A/B test results:

```javascript
// Get experimental prompt
const prompt = await client.getExperimentPrompt('my-experiment', {
  userId: 'user-123'
});

// Use the prompt in your application
const response = await callYourLLM(prompt.getContent());

// Track performance metrics using prompt.pushScore()
const result = await prompt.pushScore(
  [
    { name: 'rating', type: 'int', value: 5 },
    { name: 'helpful', type: 'bool', value: true },
    { name: 'feedback', type: 'string', value: 'Great response!' }
  ],
  {
    sessionId: 'session-abc-123',
    userId: 'user-123'
  }
);

// Check if score was submitted successfully
if (!result.success) {
  console.warn('Score submission failed:', result.error);
}
```

**How it works:**
1. `getExperimentPrompt()` returns a prompt with embedded experiment metadata
2. The prompt stores the experiment ID, bucket ID, and promptVersion ID internally
3. When you call `prompt.pushScore()`, it automatically includes this metadata in the API request

**Supported Score Types:**
- `int` - Numeric values (e.g., ratings, response time)
- `bool` - Boolean values (e.g., helpful/not helpful, success/failure)
- `string` - Text values (e.g., user feedback, categories)

**Important Notes:**
- Only prompts from `getExperimentPrompt()` can be scored
- Regular prompts from `getPrompt()` will throw an error if you try to score them
- At least one identifier (`sessionId` or `userId`) is required
- Each score item must have: `name` (string), `type` ('int'|'bool'|'string'), and `value` (matching the type)

## Configuration Options

You can customize the client behavior with configuration options:

```javascript
const client = new LaikaTest(apiKey, {
  // Base URL for the API (default: 'https://api.laikatest.com')
  baseUrl: 'https://api.laikatest.com',

  // Request timeout in milliseconds (default: 10000)
  timeout: 15000,

  // Cache TTL in milliseconds (default: 1800000 - 30 minutes)
  cacheTTL: 60 * 60 * 1000, // 1 hour

  // Enable/disable caching (default: true)
  cacheEnabled: true
});
```

## Caching Behavior

The client implements intelligent caching to minimize API calls:

- **Default TTL**: 30 minutes (configurable)
- **Cache Key**: Combines prompt name and version ID (if specified)
- **Automatic Cleanup**: Expired entries removed every 5 minutes
- **Memory Efficient**: Stores only prompt content and metadata

### Cache Control

```javascript
// Disable caching entirely
const client = new LaikaTest(apiKey, {
  cacheEnabled: false
});

// Adjust cache TTL to 1 hour
const client = new LaikaTest(apiKey, {
  cacheTTL: 60 * 60 * 1000
});

// Bypass cache for a single request
const result = await client.getPrompt('prompt-name', {
  bypassCache: true
});
```

## Error Handling

The client provides specific error classes for different failure scenarios:

```javascript
const {
  LaikaTest,
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError
} = require('@laikatest/js-client');

try {
  const result = await client.getPrompt('my-prompt');
} catch (error) {
  if (error instanceof ValidationError) {
    // Invalid input (empty prompt name, invalid IDs, etc.)
    console.error('Validation error:', error.message);
  } else if (error instanceof AuthenticationError) {
    // Invalid API key or authentication failed
    console.error('Authentication error:', error.message);
  } else if (error instanceof NetworkError) {
    // Network issues, timeout, connection failed
    console.error('Network error:', error.message);
  } else if (error instanceof LaikaServiceError) {
    // API returned an error (404, 403, 500, etc.)
    console.error('Service error:', error.message);
    console.error('Status code:', error.statusCode);
  } else {
    // Unexpected error
    console.error('Unexpected error:', error);
  }
}
```

### Common Error Scenarios

| Error Type | Cause | Solution |
|------------|-------|----------|
| `ValidationError` | Empty prompt name or invalid version ID | Check your inputs (version must be numeric like "10" or "v10") |
| `AuthenticationError` | Invalid API key | Verify your API key |
| `LaikaServiceError` (404) | Prompt not found | Check prompt name and project |
| `LaikaServiceError` (403) | Access denied | Verify project ownership |
| `NetworkError` | Connection timeout | Check network/API availability |

## API Reference

### `new LaikaTest(apiKey, options?)`

Creates a new client instance.

**Parameters:**
- `apiKey` (string, required): Your LaikaTest API key
- `options` (object, optional): Configuration options

**Options:**
- `baseUrl` (string): API base URL (default: `'https://api.laikatest.com'`)
- `timeout` (number): Request timeout in ms (default: `10000`)
- `cacheTTL` (number): Cache time-to-live in ms (default: `1800000`)
- `cacheEnabled` (boolean): Enable caching (default: `true`)

### `client.getPrompt(promptName, options?)`

Fetches prompt content by name.

**Parameters:**
- `promptName` (string, required): Name of the prompt template
- `options` (object, optional): Fetch options

**Options:**
- `versionId` (string): Specific version to fetch (numeric format: "10" or "v10")
- `bypassCache` (boolean): Force fresh API fetch

**Returns:** `Promise<Prompt>`

**Throws:**
- `ValidationError`: Invalid inputs (e.g., empty prompt name, invalid version ID format)
- `AuthenticationError`: Auth failure
- `NetworkError`: Network issues
- `LaikaServiceError`: API errors

### `prompt.getContent()`

Returns the content of the prompt.

**Returns:** The prompt content (string, array, or object)

### `prompt.compile(variables)`

Compiles the prompt by injecting variables into `{{placeholders}}`.

**Parameters:**
- `variables` (object): Key/value pairs for placeholder replacement

**Returns:** A new `Prompt` instance with the compiled content. Use `getContent()` to access the compiled result.

### `prompt.pushScore(scores, options)`

Pushes performance scores for experimental prompts to track A/B test results.

**Parameters:**
- `scores` (array, required): Array of score objects with the following structure:
  - `name` (string): Metric name (e.g., 'rating', 'helpful', 'responseQuality')
  - `type` (string): Score type - must be one of: `'int'`, `'bool'`, or `'string'`
  - `value` (number|boolean|string): The score value - must match the declared type
- `options` (object, required): Options object containing:
  - `sessionId` (string, optional): Session identifier
  - `userId` (string, optional): User identifier

**Note:** At least one of `sessionId` or `userId` must be provided.

**Returns:** `Promise<PushScoreResponse>`

Response object structure:
- On success: `{ success: true, statusCode: 200 | 201, data: any }`
- On network failure: `{ success: false, error: string, errorType: 'NetworkError', details: string }`

**Throws:**
- `Error`: If the prompt is not from an experiment (must be created via `getExperimentPrompt()`)
- `Error`: If the client reference is not available
- `ValidationError`: If scores structure is invalid or identifiers are missing
- `AuthenticationError`: If API authentication fails
- `LaikaServiceError`: If the API returns an error response (4xx, 5xx status codes)

**Note:** Network failures (connection timeout, DNS errors, etc.) do NOT throw an exception. Instead, the promise resolves with `{ success: false, errorType: 'NetworkError', ... }`. This allows your application to continue gracefully without crashing.

**Example:**
```javascript
const prompt = await client.getExperimentPrompt('my-test', { userId: '123' });

// Use the prompt...
const response = await callLLM(prompt.getContent());

// Track performance
await prompt.pushScore(
  [
    { name: 'rating', type: 'int', value: 5 },
    { name: 'helpful', type: 'bool', value: true },
    { name: 'comment', type: 'string', value: 'Excellent!' }
  ],
  { sessionId: 'session-456' }
);
```

**How it works internally:**
1. Validates that the prompt has experiment metadata (experimentId, bucketId, promptVersionId)
2. Validates that a client reference is available
3. Delegates to `client.pushScore()` with the stored metadata
4. The client enriches the request with API key, base URL, and timeout
5. Calls the score utility which validates inputs and sends the HTTP request to `/api/v1/scores`

### `client.destroy()`

Cleanup resources and stop background processes. Always call this when done.

## Best Practices

### 1. Use Environment Variables

```javascript
const client = new LaikaTest(process.env.LAIKATEST_API_KEY);
```

### 2. Always Call destroy()

```javascript
const client = new LaikaTest(apiKey);

try {
  const prompt = await client.getPrompt('my-prompt');
  // Use prompt...
} finally {
  client.destroy(); // Cleanup
}
```

### 3. Handle Errors Gracefully

```javascript
try {
  const prompt = await client.getPrompt('my-prompt');
  return prompt.getContent();
} catch (error) {
  // Log error and provide fallback
  console.error('Failed to fetch prompt:', error);
  return 'Default fallback prompt content';
}
```

### 4. Reuse Client Instances

Create one client instance and reuse it for multiple requests:

```javascript
// Good: Reuse client
const client = new LaikaTest(apiKey);
const prompt1 = await client.getPrompt('prompt-1');
const prompt2 = await client.getPrompt('prompt-2');
client.destroy();

// Avoid: Creating multiple clients
const client1 = new LaikaTest(apiKey);
const prompt1 = await client1.getPrompt('prompt-1');
client1.destroy();

const client2 = new LaikaTest(apiKey);
const prompt2 = await client2.getPrompt('prompt-2');
client2.destroy();
```

### 5. Use TypeScript for Type Safety

```typescript
import { LaikaTest, Prompt } from '@laikatest/js-client';

const client = new LaikaTest(apiKey);
const prompt: Prompt = await client.getPrompt('my-prompt');
const compiled = prompt.compile({ name: 'Ada' });
const content = compiled.getContent();
```

## Examples

### Basic Usage

```javascript
const { LaikaTest } = require('@laikatest/js-client');

const client = new LaikaTest(process.env.LAIKATEST_API_KEY);

try {
  // Fetch current version
  const prompt = await client.getPrompt('welcome-message');
  console.log(prompt.getContent());

  // Fetch specific version
  const versioned = await client.getPrompt('welcome-message', {
    versionId: '10'  // or 'v10'
  });
  console.log(versioned.getContent());

  // Bypass cache
  const fresh = await client.getPrompt('welcome-message', {
    bypassCache: true
  });
  console.log(fresh.getContent());
} catch (error) {
  console.error('Error:', error.message);
} finally {
  client.destroy();
}
```

### Custom Configuration

```javascript
const client = new LaikaTest(process.env.LAIKATEST_API_KEY, {
  timeout: 15000,
  cacheTTL: 60 * 60 * 1000, // 1 hour
  cacheEnabled: true
});
```

### A/B Testing with Score Tracking

Complete example of running an A/B test experiment with score tracking:

```javascript
const { LaikaTest } = require('@laikatest/js-client');

const client = new LaikaTest(process.env.LAIKATEST_API_KEY);

try {
  // Get experimental prompt (user is assigned to a variant)
  const prompt = await client.getExperimentPrompt('welcome-message-test', {
    userId: 'user-12345',
    plan: 'premium'
  });

  console.log('Assigned to bucket:', prompt.getBucketId());

  // Use the prompt content
  const content = prompt.getContent();
  const response = await yourLLMFunction(content);

  // Track how well this variant performed
  const scoreResult = await prompt.pushScore(
    [
      { name: 'userRating', type: 'int', value: 5 },
      { name: 'taskCompleted', type: 'bool', value: true },
      { name: 'responseTimeMs', type: 'int', value: 342 },
      { name: 'userFeedback', type: 'string', value: 'Very helpful!' }
    ],
    {
      sessionId: 'session-xyz789',
      userId: 'user-12345'
    }
  );

  if (scoreResult.success) {
    console.log('Score submitted successfully!');
  } else {
    console.error('Failed to submit score:', scoreResult.error);
    // Your app continues running even if score submission fails
  }

} catch (error) {
  console.error('Error:', error.message);
} finally {
  client.destroy();
}
```

**Key Points:**
- The prompt automatically knows which experiment and variant it belongs to
- You can track multiple metrics with different types in a single call
- Both sessionId and userId help correlate scores with user sessions


## Requirements

- Node.js >= 12.0.0
- No external dependencies

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/laikatest/prompts-client-js/issues
- Documentation: https://docs.laikatest.com
- Email: support@laikatest.com
