/**
 * Callback function for trace operations
 */
export type TraceCallback<T> = () => Promise<T>;

/**
 * Synchronous callback function for trace operations
 */
export type TraceSyncCallback<T> = () => T;

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
