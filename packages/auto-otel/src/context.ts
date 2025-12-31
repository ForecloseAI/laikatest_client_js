/**
 * Context management for session and user tracking.
 * Provides runtime APIs to set/get session and user IDs.
 *
 * Uses AsyncLocalStorage for request-scoped context in concurrent environments.
 * Falls back to global state for single-request scenarios.
 */

import { AsyncLocalStorage } from 'async_hooks';

interface LaikaContext {
  sessionId: string | null;
  userId: string | null;
}

const asyncLocalStorage = new AsyncLocalStorage<LaikaContext>();

// Gets current context from AsyncLocalStorage or creates default
function getContext(): LaikaContext {
  return asyncLocalStorage.getStore() || { sessionId: null, userId: null };
}

// Sets the current session ID for all subsequent spans in this async context
export function setSessionId(sessionId: string): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.sessionId = sessionId;
  }
}

// Gets the current session ID
export function getSessionId(): string | null {
  return getContext().sessionId;
}

// Clears the current session ID
export function clearSessionId(): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.sessionId = null;
  }
}

// Sets the current user ID for all subsequent spans in this async context
export function setUserId(userId: string): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.userId = userId;
  }
}

// Gets the current user ID
export function getUserId(): string | null {
  return getContext().userId;
}

// Clears the current user ID
export function clearUserId(): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.userId = null;
  }
}

/**
 * Runs a callback within an isolated async context.
 * Use this to prevent context leakage between concurrent requests.
 */
export function runWithContext<T>(callback: () => T): T {
  return asyncLocalStorage.run({ sessionId: null, userId: null }, callback);
}

/**
 * Runs an async callback within an isolated async context.
 * Use this for async request handlers in Express/Koa/etc.
 */
export function runWithContextAsync<T>(callback: () => Promise<T>): Promise<T> {
  return asyncLocalStorage.run({ sessionId: null, userId: null }, callback);
}
