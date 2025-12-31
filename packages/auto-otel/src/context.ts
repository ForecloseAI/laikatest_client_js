/**
 * Context management for session and user tracking.
 * Provides runtime APIs to set/get session and user IDs.
 */

let currentSessionId: string | null = null;
let currentUserId: string | null = null;

// Sets the current session ID for all subsequent spans
export function setSessionId(sessionId: string): void {
  currentSessionId = sessionId;
}

// Gets the current session ID
export function getSessionId(): string | null {
  return currentSessionId;
}

// Clears the current session ID
export function clearSessionId(): void {
  currentSessionId = null;
}

// Sets the current user ID for all subsequent spans
export function setUserId(userId: string): void {
  currentUserId = userId;
}

// Gets the current user ID
export function getUserId(): string | null {
  return currentUserId;
}

// Clears the current user ID
export function clearUserId(): void {
  currentUserId = null;
}
