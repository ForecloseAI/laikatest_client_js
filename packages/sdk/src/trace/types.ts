import { Span } from '@opentelemetry/api';

/**
 * Callback function for trace operations with span access
 * The span parameter allows adding custom attributes, events, and metadata
 */
export type TraceCallback<T> = (span: Span) => Promise<T>;

/**
 * Synchronous callback function for trace operations with span access
 */
export type TraceSyncCallback<T> = (span: Span) => T;

/**
 * Operation types for semantic tracing
 */
export type OperationType =
  | 'rag'
  | 'retrieval'
  | 'rerank'
  | 'embedding'
  | 'agent'
  | 'tool'
  | 'step'
  | 'generation'
  | 'evaluation';

// Re-export Span for convenience
export type { Span } from '@opentelemetry/api';
