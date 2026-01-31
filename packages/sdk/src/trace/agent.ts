import { Span } from '@opentelemetry/api';
import { traceOperation } from './core';

/**
 * Trace an agent workflow
 * @param name - Agent name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * await trace.agent('research-agent', async (span) => {
 *   span.setAttribute('agent.model', 'gpt-4');
 *   const plan = await trace.step('planning', (s) => planAction());
 *   const result = await trace.tool('web-search', (s) => search());
 *   return result;
 * });
 * ```
 */
export async function agent<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('agent', name, fn);
}

/**
 * Trace a tool execution
 * @param name - Tool name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * await trace.tool('calculator', async (span) => {
 *   span.setAttribute('tool.input', JSON.stringify({ a: 5, b: 3 }));
 *   const result = calculate(5, 3);
 *   span.setAttribute('tool.output', JSON.stringify(result));
 *   return result;
 * });
 * ```
 */
export async function tool<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('tool', name, fn);
}

/**
 * Trace a generic step/operation
 * @param name - Step name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 * @example
 * ```typescript
 * await trace.step('validation', async (span) => {
 *   span.setAttribute('step.items_count', items.length);
 *   return validate(items);
 * });
 * ```
 */
export async function step<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return traceOperation('step', name, fn);
}
