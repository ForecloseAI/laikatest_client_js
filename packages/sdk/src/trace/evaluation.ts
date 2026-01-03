import { traceOperation } from './core';

/**
 * Trace an evaluation step
 * @param name - Evaluation name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 */
export async function evaluation<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('evaluation', name, fn);
}
