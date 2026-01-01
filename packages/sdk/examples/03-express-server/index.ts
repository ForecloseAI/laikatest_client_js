/**
 * Express.js Server Demo
 *
 * Shows SDK integration in a web server with per-request context.
 * Demonstrates middleware patterns and graceful shutdown.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { LaikaTest, setSessionId, setUserId, setProperty, clearSessionId, clearUserId, clearProperties } from '@laikatest/sdk';
import OpenAI from 'openai';

const PORT = process.env.PORT || 3000;

// Initialize SDK at server startup
const laika = LaikaTest.init({
  apiKey: process.env.LAIKA_API_KEY!,
  serviceName: 'express-server-demo',
  debug: true,
});

console.log('LaikaTest SDK initialized');

const app = express();
app.use(express.json());

/**
 * Context middleware - extracts session/user from headers
 * In production, you'd get these from your auth system
 */
function contextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Clear previous request's context
  clearSessionId();
  clearUserId();
  clearProperties();

  // Set context from headers
  const sessionId = req.headers['x-session-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (sessionId) setSessionId(sessionId);
  if (userId) setUserId(userId);

  // Add request metadata
  setProperty('endpoint', req.path);
  setProperty('method', req.method);

  next();
}

app.use(contextMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    tracing: laika.isTracingEnabled(),
    experiments: laika.isExperimentsEnabled(),
  });
});

// Chat endpoint - makes OpenAI call with tracing
app.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const openai = new OpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message },
      ],
      max_tokens: 150,
    });

    const reply = response.choices[0].message.content;

    res.json({
      reply,
      tokens: response.usage?.total_tokens,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nTry these commands:');
  console.log(`  curl http://localhost:${PORT}/health`);
  console.log(`  curl -X POST http://localhost:${PORT}/chat \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -H "X-Session-Id: session-123" \\`);
  console.log(`    -H "X-User-Id: user-456" \\`);
  console.log(`    -d '{"message": "Hello!"}'`);
});

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down gracefully...');

  server.close(async () => {
    await laika.shutdown();
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
