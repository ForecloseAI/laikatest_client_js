// Example: LaikaTest initialization with OpenAI instrumentation test
// IMPORTANT: Initialize LaikaTest BEFORE importing OpenAI
import { initLaika, shutdown } from '../src/index';

initLaika({
  apiKey: process.env.LAIKA_API_KEY!,
  serviceName: 'my-app',
  endpoint: process.env.LAIKA_ENDPOINT || 'http://localhost:3001/otel/v1/traces',
  captureContent: true,
  debug: true
});

// Makes an OpenAI call and shuts down SDK to flush spans
async function main() {
  // Dynamic import AFTER initLaika() to ensure instrumentation works
  const { default: OpenAI } = await import('openai');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  console.log('Making OpenAI call...');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say hello in 3 words' }],
    max_tokens: 50
  });

  console.log('Response:', response.choices[0].message.content);

  // Flush spans before exit
  await shutdown();
  console.log('Done - traces sent to endpoint');
}

main().catch(console.error);
