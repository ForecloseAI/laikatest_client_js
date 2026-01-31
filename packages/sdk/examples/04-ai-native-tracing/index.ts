/**
 * AI-Native Tracing API Demo
 *
 * Demonstrates the new semantic tracing API that speaks AI developer language
 * instead of OpenTelemetry jargon.
 *
 * All trace helpers now provide span access for adding custom data like
 * tool inputs/outputs, model parameters, token usage, etc.
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

  // Demo 1: RAG Pipeline with Custom Data
  console.log('Running RAG Pipeline with Custom Data...\n');

  const query = 'What are vector databases?';

  const answer = await trace.rag('customer-qa', async (ragSpan) => {
    // Add query to the RAG span
    ragSpan.setAttribute('rag.query', query);

    console.log('  1. Retrieving documents...');
    const docs = await trace.retrieval('knowledge-base', async (span) => {
      // Add retrieval-specific attributes
      span.setAttribute('retrieval.query', query);
      span.setAttribute('retrieval.top_k', 10);

      const results = await vectorSearch(query);

      // Add results metadata
      span.setAttribute('retrieval.results_count', results.length);
      span.setAttribute('retrieval.max_score', results[0]?.score ?? 0);

      return results;
    });
    console.log(`     Retrieved ${docs.length} documents`);

    console.log('  2. Reranking documents...');
    const reranked = await trace.rerank('relevance-scoring', async (span) => {
      span.setAttribute('rerank.input_count', docs.length);

      const results = await reranker(docs, query);

      span.setAttribute('rerank.output_count', results.length);
      return results;
    });
    console.log(`     Reranked to top ${reranked.length} documents`);

    console.log('  3. Generating answer...');
    const response = await trace.generation('answer-synthesis', async (span) => {
      // Add generation parameters
      span.setAttribute('generation.model', 'gpt-4');
      span.setAttribute('generation.context_docs', reranked.length);

      const result = await generateAnswer(reranked, query);

      // Add usage metrics
      span.setAttribute('generation.total_tokens', result.usage.total_tokens);

      return result;
    });
    console.log(`     Generated answer (${response.usage.total_tokens} tokens)`);

    // Add final metrics to RAG span
    ragSpan.setAttribute('rag.total_docs_retrieved', docs.length);
    ragSpan.setAttribute('rag.total_tokens', response.usage.total_tokens);

    return response.answer;
  });

  console.log(`\nAnswer: "${answer}"\n`);

  // Demo 2: Agent Workflow with Tool Call Tracing
  console.log('Running Agent Workflow with Tool Call Tracing...\n');

  await trace.agent('research-assistant', async (agentSpan) => {
    agentSpan.setAttribute('agent.model', 'gpt-4');
    agentSpan.setAttribute('agent.max_iterations', 5);

    console.log('  1. Planning action...');
    const plan = await trace.step('planning', async (span) => {
      span.setAttribute('step.type', 'planning');
      await new Promise(resolve => setTimeout(resolve, 30));
      const result = { action: 'search', query: 'latest AI news' };
      span.setAttribute('step.output', JSON.stringify(result));
      return result;
    });
    console.log(`     Plan: ${plan.action}`);

    console.log('  2. Executing tool...');
    const toolInput = { query: plan.query, maxResults: 3 };
    const results = await trace.tool('web-search', async (span) => {
      // Log tool input
      span.setAttribute('tool.input', JSON.stringify(toolInput));
      span.setAttribute('tool.name', 'web-search');

      await new Promise(resolve => setTimeout(resolve, 60));
      const output = ['Result 1', 'Result 2', 'Result 3'];

      // Log tool output
      span.setAttribute('tool.output', JSON.stringify(output));
      span.setAttribute('tool.results_count', output.length);

      return output;
    });
    console.log(`     Found ${results.length} results`);

    console.log('  3. Analyzing results...');
    await trace.step('analysis', async (span) => {
      span.setAttribute('step.type', 'analysis');
      span.setAttribute('step.input_count', results.length);
      await new Promise(resolve => setTimeout(resolve, 40));
      span.setAttribute('step.output', 'Analysis complete');
      return 'Analysis complete';
    });
    console.log(`     Analysis complete`);

    agentSpan.setAttribute('agent.total_tool_calls', 1);
    agentSpan.setAttribute('agent.total_steps', 3);
  });

  // Demo 3: Generic Span for Custom Use Cases (still works)
  console.log('\nRunning Custom Workflow with Generic Spans...\n');

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
