// Core initialization
export { initLaika, shutdown } from './init';
export { LaikaConfig } from './types';

// Session and user context
export {
  setSessionId,
  getSessionId,
  clearSessionId,
  setUserId,
  getUserId,
  clearUserId
} from './context';

// Custom properties
export {
  setProperty,
  setProperties,
  getProperties,
  clearProperties,
  removeProperty
} from './properties';
