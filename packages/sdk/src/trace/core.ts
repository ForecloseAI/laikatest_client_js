import { withSpan } from '@laikatest/auto-otel';
import { Span } from '@opentelemetry/api';

/**
 * Trace an operation with semantic naming
 * @param operation - Operation type (e.g., 'rag', 'agent', 'tool')
 * @param name - User-provided name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 */
export async function traceOperation<T>(
  operation: string,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const spanName = `${operation}.${name}`;

  return withSpan(spanName, async (span: Span) => {
    // Add semantic attributes
    span.setAttribute('laikatest.operation.type', operation);
    span.setAttribute('laikatest.operation.name', name);

    return await fn();
  });
}
