import { trace, context, Span, SpanStatusCode, Context } from '@opentelemetry/api';

const TRACER_NAME = 'laikatest';

/**
 * Records error on span and rethrows it.
 * Handles both Error objects and non-Error thrown values.
 */
function recordSpanError(span: Span, error: unknown): never {
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error instanceof Error ? error.message : String(error)
  });

  // Only record as exception if it's actually an Error
  if (error instanceof Error) {
    span.recordException(error);
  } else {
    // For non-Error values, add as event with context
    span.addEvent('exception', {
      'exception.type': typeof error,
      'exception.message': String(error),
    });
  }

  throw error;
}

/**
 * Execute async function within a span (auto-closes)
 *
 * @param name - Span name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
 * @throws Re-throws any error from the callback after recording it in the span
 *
 * @example
 * ```typescript
 * try {
 *   await withSpan('my-operation', async (span) => {
 *     span.setAttribute('custom', 'value');
 *     return await doSomething();
 *   });
 * } catch (error) {
 *   // Error is already recorded in span
 *   console.error('Operation failed:', error);
 * }
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer(TRACER_NAME);
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      recordSpanError(span, error);
    } finally {
      span.end();
    }
  });
}

/**
 * Execute sync function within a span (auto-closes)
 * The span is made active in the context, so nested spans will be its children
 *
 * @param name - Span name
 * @param fn - Sync callback function
 * @returns Callback result
 * @throws Re-throws any error from the callback after recording it in the span
 *
 * @example
 * ```typescript
 * try {
 *   const result = withSpanSync('sync-operation', (span) => {
 *     span.setAttribute('custom', 'value');
 *     return computeSomething();
 *   });
 * } catch (error) {
 *   // Error is already recorded in span
 *   console.error('Operation failed:', error);
 * }
 * ```
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T
): T {
  const tracer = trace.getTracer(TRACER_NAME);
  const span = tracer.startSpan(name);

  // Make span active in context for proper parent-child relationships
  return context.with(trace.setSpan(context.active(), span), () => {
    try {
      const result = fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      recordSpanError(span, error);
    } finally {
      span.end();
    }
  });
}

/**
 * Create span for manual lifecycle control.
 *
 * WARNING: You MUST call .end() on the returned span. Failure to do so will
 * cause memory leaks and prevent the span from being exported.
 *
 * For most use cases, prefer withSpan() or withSpanSync() which handle
 * span lifecycle automatically.
 *
 * @param name - Span name
 * @param context - Optional context for parent span
 * @returns Span instance requiring manual .end() call
 *
 * @example
 * ```typescript
 * const span = startSpan('manual-span');
 * try {
 *   // Do work
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (error) {
 *   span.setStatus({ code: SpanStatusCode.ERROR });
 *   span.recordException(error);
 *   throw error;
 * } finally {
 *   span.end(); // CRITICAL: Always call end()
 * }
 * ```
 */
export function startSpan(name: string, context?: Context): Span {
  const tracer = trace.getTracer(TRACER_NAME);
  return tracer.startSpan(name, {}, context);
}

/**
 * Get currently active span
 * @returns Active span or undefined
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan();
}
