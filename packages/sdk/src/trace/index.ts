import { rag, retrieval, rerank, embedding } from './rag';
import { agent, tool, step } from './agent';
import { generation } from './generation';
import { evaluation } from './evaluation';

/**
 * AI-native tracing API for LaikaTest SDK
 *
 * Provides semantic helpers for common AI workflows instead of low-level span API.
 * All helpers automatically create properly named spans and add semantic attributes.
 *
 * @example
 * ```typescript
 * import { trace } from '@laikatest/sdk';
 *
 * // RAG pipeline
 * const answer = await trace.rag('qa', async () => {
 *   const docs = await trace.retrieval('search', () => vectorDB.search(query));
 *   return await trace.generation('answer', () => llm.generate(docs));
 * });
 *
 * // Agent workflow
 * await trace.agent('assistant', async () => {
 *   const result = await trace.tool('calculator', () => calculate(x, y));
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
export type { TraceCallback, TraceSyncCallback, OperationType } from './types';
