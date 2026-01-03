/**
 * AI-Native Tracing API Demo
 *
 * Demonstrates the new semantic tracing API that speaks AI developer language
 * instead of OpenTelemetry jargon.
 */

import 'dotenv/config';
import { LaikaTest, trace, withSpan } from '@laikatest/sdk';

// Mock functions for demo
async function vectorSearch(query: string) {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [
    { id: '1', text: 'Document about vector databases...', score: 0.95 },
    { id: '2', text: 'Document about embeddings...', score: 0.89 },
    { id: '3', text: 'Document about similarity search...', score: 0.85 },
  ];
}

async function reranker(docs: any[], query: string) {
  await new Promise(resolve => setTimeout(resolve, 30));
  return docs.slice(0, 2); // Return top 2
}

async function generateAnswer(context: any[], query: string) {
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    answer: 'Vector databases store embeddings for similarity search...',
    usage: { total_tokens: 150 }
  };
}

async function main() {
  // Initialize SDK
  const laika = LaikaTest.init({
    apiKey: process.env.LAIKA_API_KEY!,
    debug: true,
  });

  console.log('\n=== AI-Native Tracing Demo ===\n');

  // Demo 1: RAG Pipeline
  console.log('Running RAG Pipeline...\n');

  const query = 'What are vector databases?';

  const answer = await trace.rag('customer-qa', async () => {
    console.log('  1. Retrieving documents...');
    const docs = await trace.retrieval('knowledge-base', async () => {
      return await vectorSearch(query);
    });
    console.log(`     Retrieved ${docs.length} documents`);

    console.log('  2. Reranking documents...');
    const reranked = await trace.rerank('relevance-scoring', async () => {
      return await reranker(docs, query);
    });
    console.log(`     Reranked to top ${reranked.length} documents`);

    console.log('  3. Generating answer...');
    const response = await trace.generation('answer-synthesis', async () => {
      return await generateAnswer(reranked, query);
    });
    console.log(`     Generated answer (${response.usage.total_tokens} tokens)`);

    return response.answer;
  });

  console.log(`\nAnswer: "${answer}"\n`);

  // Demo 2: Agent Workflow
  console.log('Running Agent Workflow...\n');

  await trace.agent('research-assistant', async () => {
    console.log('  1. Planning action...');
    const plan = await trace.step('planning', async () => {
      await new Promise(resolve => setTimeout(resolve, 30));
      return { action: 'search', query: 'latest AI news' };
    });
    console.log(`     Plan: ${plan.action}`);

    console.log('  2. Executing tool...');
    const results = await trace.tool('web-search', async () => {
      await new Promise(resolve => setTimeout(resolve, 60));
      return ['Result 1', 'Result 2', 'Result 3'];
    });
    console.log(`     Found ${results.length} results`);

    console.log('  3. Analyzing results...');
    await trace.step('analysis', async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
      return 'Analysis complete';
    });
    console.log(`     Analysis complete`);
  });

  // Demo 3: Generic Span for Custom Use Cases
  console.log('Running Custom Workflow with Generic Spans...\n');

  await withSpan('custom-workflow', async (span) => {
    console.log('  1. Processing data...');

    // Add custom attributes
    span.setAttribute('workflow.type', 'data-processing');
    span.setAttribute('input.size', 1024);

    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('     Data processed');

    console.log('  2. Validating results...');

    // Nested generic span
    await withSpan('validation', async (validationSpan) => {
      validationSpan.setAttribute('validation.rules', 5);
      await new Promise(resolve => setTimeout(resolve, 30));
    });

    console.log('     Validation complete');

    // Add events to track important moments
    span.addEvent('workflow_checkpoint', {
      checkpoint: 'validation_passed',
      timestamp: Date.now(),
    });
  });

  // Cleanup
  await laika.shutdown();
  console.log('\nDemo complete! Check your dashboard for traces.\n');
}

main().catch(console.error);
