// Main class
export { LaikaTest } from './laika';
export { LaikaConfig } from './types';

// Re-export from auto-otel for convenience
export {
  setSessionId,
  getSessionId,
  clearSessionId,
  setUserId,
  getUserId,
  clearUserId,
  runWithContext,
  runWithContextAsync,
  setProperty,
  setProperties,
  getProperties,
  clearProperties,
  removeProperty,
  runWithProperties,
  runWithPropertiesAsync,
  shutdown,
  withSpan,
  withSpanSync,
  getActiveSpan,
} from '@laikatest/auto-otel';

// Re-export from client for convenience
export {
  Prompt,
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError,
} from '@laikatest/js-client';

// Re-export types from client
export type {
  PromptContent,
  ScoreInput,
  ScoreType,
  ScoreSource,
  PushScoreOptions,
  PushScoreResponse,
  ClientOptions,
  GetPromptOptions,
} from '@laikatest/js-client';

// AI-native tracing API
export { trace } from './trace';
export type { TraceCallback, TraceSyncCallback, OperationType, Span } from './trace';
