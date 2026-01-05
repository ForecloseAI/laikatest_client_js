import { traceOperation } from './core';

/**
 * Trace an agent workflow
 * @param name - Agent name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * await trace.agent('research-agent', async () => {
 *   const plan = await trace.step('planning', () => planAction());
 *   const result = await trace.tool('web-search', () => search());
 *   return result;
 * });
 * ```
 */
export async function agent<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('agent', name, fn);
}

/**
 * Trace a tool execution
 * @param name - Tool name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 */
export async function tool<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('tool', name, fn);
}

/**
 * Trace a generic step/operation
 * @param name - Step name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 */
export async function step<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return traceOperation('step', name, fn);
}
