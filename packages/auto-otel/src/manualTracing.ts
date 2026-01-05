import { trace, context, Span, SpanStatusCode, Context } from '@opentelemetry/api';

const TRACER_NAME = 'laikatest';

/**
 * Execute async function within a span (auto-closes)
 * @param name - Span name
 * @param fn - Async callback function
 * @returns Promise resolving to callback result
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
    } finally {
      span.end();
    }
  });
}

/**
 * Execute sync function within a span (auto-closes)
 * The span is made active in the context, so nested spans will be its children
 * @param name - Span name
 * @param fn - Sync callback function
 * @returns Callback result
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
    } finally {
      span.end();
    }
  });
}

/**
 * Create span for manual lifecycle control (must call .end())
 * @param name - Span name
 * @param context - Optional context
 * @returns Span instance
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
