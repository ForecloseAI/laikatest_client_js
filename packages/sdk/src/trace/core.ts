import { withSpan } from '@laikatest/auto-otel';
import { Span } from '@opentelemetry/api';

/**
 * Trace an operation with semantic naming
 * @param operation - Operation type (e.g., 'rag', 'agent', 'tool')
 * @param name - User-provided name
 * @param fn - Async callback function that receives the span for adding custom data
 * @returns Promise resolving to callback result
 *
 * @example
 * ```typescript
 * await traceOperation('tool', 'calculator', async (span) => {
 *   span.setAttribute('tool.input', JSON.stringify({ a: 5, b: 3 }));
 *   const result = calculate(5, 3);
 *   span.setAttribute('tool.output', JSON.stringify(result));
 *   return result;
 * });
 * ```
 */
export async function traceOperation<T>(
  operation: string,
  name: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const spanName = `${operation}.${name}`;

  return withSpan(spanName, async (span: Span) => {
    // Add semantic attributes
    span.setAttribute('laikatest.operation.type', operation);
    span.setAttribute('laikatest.operation.name', name);

    return await fn(span);
  });
}
