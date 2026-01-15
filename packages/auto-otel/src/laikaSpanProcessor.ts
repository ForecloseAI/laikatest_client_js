/**
 * Custom SpanProcessor that injects LaikaTest context into all spans.
 * Handles: session ID, user ID, custom properties, and experiment context.
 */

import { SpanProcessor, ReadableSpan, Span } from '@opentelemetry/sdk-trace-base';
import { Context } from '@opentelemetry/api';
import { getSessionId, getUserId } from './context';
import { getProperties } from './properties';

/**
 * Retrieves current experiment context if @laikatest/js-client is installed.
 * Uses dynamic require to keep the client package optional - tracing works
 * standalone but gains experiment context injection when client is also used.
 */
function getExperimentContext(): { experimentId: string; variantId: string; userId?: string; sessionId?: string } | null {
  try {
    const client = require('@laikatest/js-client');
    if (client && typeof client.getCurrentExperiment === 'function') {
      return client.getCurrentExperiment();
    }
    return null;
  } catch (error: unknown) {
    // MODULE_NOT_FOUND is expected when client package is not installed
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      return null;
    }
    // Log unexpected errors - they indicate real problems
    console.error('[LaikaTest] Failed to get experiment context:', error);
    return null;
  }
}

export class LaikaSpanProcessor implements SpanProcessor {
  // Called when a span starts - inject all LaikaTest context
  onStart(span: Span, _parentContext: Context): void {
    // Inject session ID
    const sessionId = getSessionId();
    if (sessionId) {
      span.setAttribute('laikatest.session.id', sessionId);
    }

    // Inject user ID
    const userId = getUserId();
    if (userId) {
      span.setAttribute('laikatest.user.id', userId);
    }

    // Inject custom properties (prefixed)
    const props = getProperties();
    Object.entries(props).forEach(([key, value]) => {
      span.setAttribute(`laikatest.property.${key}`, value);
    });

    // Inject experiment context if available
    const experiment = getExperimentContext();
    if (experiment) {
      span.setAttribute('laikatest.experiment.id', experiment.experimentId);
      span.setAttribute('laikatest.experiment.variant_id', experiment.variantId);
      if (experiment.userId) {
        span.setAttribute('laikatest.experiment.user_id', experiment.userId);
      }
      if (experiment.sessionId) {
        span.setAttribute('laikatest.experiment.session_id', experiment.sessionId);
      }
    }
  }

  // Context is injected on start; no end processing needed for LaikaTest attributes
  onEnd(_span: ReadableSpan): void {}

  async shutdown(): Promise<void> {}

  async forceFlush(): Promise<void> {}
}
