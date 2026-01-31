import { Span } from '@opentelemetry/api';
import { traceOperation } from './core';

/**
 * Trace an evaluation step
 * @param name - Evaluation name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const score = await trace.evaluation('relevance-check', async (span) => {
 *   span.setAttribute('evaluation.type', 'relevance');
 *   span.setAttribute('evaluation.input', JSON.stringify({ query, response }));
 *   const result = await evaluator.score(query, response);
 *   span.setAttribute('evaluation.score', result.score);
 *   return result;
 * });
 * ```
 */
export async function evaluation<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('evaluation', name, fn);
}
