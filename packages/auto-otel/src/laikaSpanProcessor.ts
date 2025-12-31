/**
 * Custom SpanProcessor that injects Laika context into all spans.
 * Handles: session ID, user ID, custom properties, and experiment context.
 */

import { SpanProcessor, ReadableSpan, Span } from '@opentelemetry/sdk-trace-base';
import { Context } from '@opentelemetry/api';
import { getSessionId, getUserId } from './context';
import { getProperties } from './properties';

// Tries to get experiment context from @laikatest/client if available
function getExperimentContext(): { experimentId: string; variantId: string; userId?: string } | null {
  try {
    // Dynamic require to avoid hard dependency on @laikatest/client
    const client = require('@laikatest/client');
    if (client && typeof client.getCurrentExperiment === 'function') {
      return client.getCurrentExperiment();
    }
  } catch {
    // @laikatest/client not installed or no experiment context
  }
  return null;
}

export class LaikaSpanProcessor implements SpanProcessor {
  // Called when a span starts - inject all Laika context
  onStart(span: Span, _parentContext: Context): void {
    // Inject session ID
    const sessionId = getSessionId();
    if (sessionId) {
      span.setAttribute('laika.session.id', sessionId);
    }

    // Inject user ID
    const userId = getUserId();
    if (userId) {
      span.setAttribute('laika.user.id', userId);
    }

    // Inject custom properties (prefixed)
    const props = getProperties();
    Object.entries(props).forEach(([key, value]) => {
      span.setAttribute(`laika.property.${key}`, value);
    });

    // Inject experiment context if available
    const experiment = getExperimentContext();
    if (experiment) {
      span.setAttribute('laika.experiment.id', experiment.experimentId);
      span.setAttribute('laika.experiment.variant_id', experiment.variantId);
      if (experiment.userId) {
        span.setAttribute('laika.experiment.user_id', experiment.userId);
      }
    }
  }

  // Called when a span ends - no action needed
  onEnd(_span: ReadableSpan): void {
    // No-op
  }

  // Shuts down the processor
  async shutdown(): Promise<void> {
    // No resources to clean up
    return Promise.resolve();
  }

  // Forces a flush of any pending spans
  async forceFlush(): Promise<void> {
    // No buffering, nothing to flush
    return Promise.resolve();
  }
}
