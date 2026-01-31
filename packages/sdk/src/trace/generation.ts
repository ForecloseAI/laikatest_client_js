import { Span } from '@opentelemetry/api';
import { traceOperation } from './core';

/**
 * Trace LLM generation
 * @param name - Generation step name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const response = await trace.generation('summarize', async (span) => {
 *   span.setAttribute('generation.model', 'gpt-4');
 *   span.setAttribute('generation.prompt', prompt);
 *   const result = await openai.chat.completions.create({
 *     model: 'gpt-4',
 *     messages: [{ role: 'user', content: prompt }]
 *   });
 *   span.setAttribute('generation.tokens', result.usage?.total_tokens ?? 0);
 *   return result;
 * });
 * ```
 */
export async function generation<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('generation', name, fn);
}
