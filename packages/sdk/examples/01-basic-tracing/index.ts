/**
 * Basic Tracing Demo
 *
 * Shows automatic OpenTelemetry tracing for OpenAI calls.
 * All LLM requests are traced with token usage, latency, and custom context.
 */

import 'dotenv/config';
import { LaikaTest, setSessionId, setUserId, setProperty } from '@laikatest/sdk';
// NOTE: OpenAI is imported dynamically AFTER SDK init for instrumentation to work

async function main() {
  // Initialize with just your API key - everything else is auto-detected
  const laika = LaikaTest.init({
    apiKey: process.env.LAIKA_API_KEY!,
    debug: true, // Enable debug logging to see what's happening
  });

  // Import OpenAI AFTER SDK initialization so instrumentation can hook into it
  const { default: OpenAI } = await import('openai');

  console.log('LaikaTest SDK initialized');
  console.log('Tracing enabled:', laika.isTracingEnabled());

  // Set context that will appear in all traces
  setSessionId('demo-session-' + Date.now());
  setUserId('demo-user-123');
  setProperty('environment', 'demo');
  setProperty('demo_name', 'basic-tracing');

  console.log('\nMaking OpenAI request...');

  // Create OpenAI client - calls are automatically traced
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is 2 + 2? Reply briefly.' },
    ],
    max_tokens: 50,
  });

  console.log('\nResponse:', response.choices[0].message.content);
  console.log('Tokens used:', response.usage?.total_tokens);

  // Shutdown cleanly - flushes all pending traces
  console.log('\nShutting down...');
  await laika.shutdown();

  console.log('Done! Check your LaikaTest dashboard for traces.');
}

main().catch(console.error);
