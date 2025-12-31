// Main class
export { Laika } from './laika';
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
