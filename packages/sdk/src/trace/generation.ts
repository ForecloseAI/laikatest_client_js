import { traceOperation } from './core';

/**
 * Trace LLM generation
 * @param name - Generation step name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * const response = await trace.generation('summarize', async () => {
 *   return await openai.chat.completions.create({
 *     model: 'gpt-4',
 *     messages: [{ role: 'user', content: prompt }]
 *   });
 * });
 * ```
 */
export async function generation<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('generation', name, fn);
}
