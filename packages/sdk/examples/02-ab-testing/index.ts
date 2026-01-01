/**
 * A/B Testing Demo
 *
 * Shows experiment prompt fetching and score tracking.
 * Demonstrates how to run A/B tests on prompts and track outcomes.
 */

import 'dotenv/config';
import { LaikaTest } from '@laikatest/sdk';
import OpenAI from 'openai';

// Replace with your actual experiment title from LaikaTest dashboard
const EXPERIMENT_TITLE = 'demo-experiment';

async function main() {
  // Initialize SDK with both tracing and experiments enabled
  const laika = LaikaTest.init({
    apiKey: process.env.LAIKA_API_KEY!,
    serviceName: 'ab-testing-demo',
    debug: true,
  });

  console.log('LaikaTest SDK initialized');
  console.log('Tracing enabled:', laika.isTracingEnabled());
  console.log('Experiments enabled:', laika.isExperimentsEnabled());

  // Generate a random user ID for demo purposes
  // In production, use your actual user IDs for consistent bucketing
  const userId = 'user-' + Math.random().toString(36).slice(2, 8);
  console.log('\nUser ID:', userId);

  try {
    // Fetch experiment prompt - user is automatically bucketed to a variant
    console.log(`\nFetching experiment: ${EXPERIMENT_TITLE}`);
    const prompt = await laika.getExperimentPrompt(EXPERIMENT_TITLE, { userId });

    // Log experiment details
    console.log('Experiment ID:', prompt.getExperimentId());
    console.log('Bucket/Variant ID:', prompt.getBucketId());
    console.log('Prompt Version ID:', prompt.getPromptVersionId());
    console.log('Prompt Content:', prompt.getContent());

    // Use the prompt with OpenAI
    console.log('\nMaking OpenAI request with experiment prompt...');
    const openai = new OpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt.getContent() as string },
        { role: 'user', content: 'Hello! How can you help me today?' },
      ],
      max_tokens: 100,
    });

    console.log('\nResponse:', response.choices[0].message.content);

    // Track outcome score for experiment analysis
    // This helps determine which variant performs better
    console.log('\nPushing score...');
    const scoreResult = await prompt.pushScore(
      [
        { name: 'success', type: 'bool', value: true },
        { name: 'response_length', type: 'int', value: response.choices[0].message.content?.length || 0 },
      ],
      { userId }
    );

    console.log('Score pushed:', scoreResult.success ? 'Success' : 'Failed');

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('\nExperiment not found. To run this demo:');
      console.log('1. Go to LaikaTest dashboard');
      console.log('2. Create an experiment titled:', EXPERIMENT_TITLE);
      console.log('3. Add at least 2 variants with different prompts');
      console.log('4. Start the experiment');
      console.log('5. Run this demo again');
    } else {
      throw error;
    }
  }

  // Shutdown cleanly
  console.log('\nShutting down...');
  await laika.shutdown();

  console.log('Done!');
}

main().catch(console.error);
