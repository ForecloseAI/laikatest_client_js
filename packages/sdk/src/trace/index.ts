import { rag, retrieval, rerank, embedding } from './rag';
import { agent, tool, step } from './agent';
import { generation } from './generation';
import { evaluation } from './evaluation';

/**
 * AI-native tracing API for LaikaTest SDK
 *
 * Provides semantic helpers for common AI workflows instead of low-level span API.
 * All helpers automatically create properly named spans and add semantic attributes.
 * Each callback receives the span as a parameter for adding custom data.
 *
 * @example
 * ```typescript
 * import { trace } from '@laikatest/sdk';
 *
 * // RAG pipeline with custom data
 * const answer = await trace.rag('qa', async (span) => {
 *   span.setAttribute('rag.query', query);
 *   const docs = await trace.retrieval('search', async (s) => {
 *     s.setAttribute('retrieval.top_k', 10);
 *     return vectorDB.search(query);
 *   });
 *   return await trace.generation('answer', async (s) => {
 *     s.setAttribute('generation.model', 'gpt-4');
 *     return llm.generate(docs);
 *   });
 * });
 *
 * // Agent workflow with tool call tracing
 * await trace.agent('assistant', async (span) => {
 *   span.setAttribute('agent.model', 'gpt-4');
 *   const result = await trace.tool('calculator', async (s) => {
 *     s.setAttribute('tool.input', JSON.stringify({ x, y }));
 *     const output = calculate(x, y);
 *     s.setAttribute('tool.output', JSON.stringify(output));
 *     return output;
 *   });
 *   return result;
 * });
 * ```
 */
export const trace = {
  // RAG workflow
  rag,
  retrieval,
  rerank,
  embedding,

  // Agent workflow
  agent,
  tool,
  step,

  // LLM operations
  generation,

  // Evaluation
  evaluation,
};

// Re-export types
export type { TraceCallback, TraceSyncCallback, OperationType, Span } from './types';
