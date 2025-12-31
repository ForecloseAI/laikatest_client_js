// Core initialization
export { initLaika, shutdown } from './init';
export { LaikaConfig } from './types';

// Session and user context (with AsyncLocalStorage support)
export {
  setSessionId,
  getSessionId,
  clearSessionId,
  setUserId,
  getUserId,
  clearUserId,
  runWithContext,
  runWithContextAsync
} from './context';

// Custom properties (with AsyncLocalStorage support)
export {
  setProperty,
  setProperties,
  getProperties,
  clearProperties,
  removeProperty,
  runWithProperties,
  runWithPropertiesAsync
} from './properties';
