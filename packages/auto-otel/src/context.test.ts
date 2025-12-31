/**
 * Unit tests for context.ts - Session and User tracking APIs
 */

import {
  setSessionId,
  getSessionId,
  clearSessionId,
  setUserId,
  getUserId,
  clearUserId
} from './context';

describe('Session Context', () => {
  beforeEach(() => {
    clearSessionId();
  });

  test('getSessionId returns null when not set', () => {
    expect(getSessionId()).toBeNull();
  });

  test('setSessionId stores the session ID', () => {
    setSessionId('session-123');
    expect(getSessionId()).toBe('session-123');
  });

  test('setSessionId overwrites previous value', () => {
    setSessionId('session-1');
    setSessionId('session-2');
    expect(getSessionId()).toBe('session-2');
  });

  test('clearSessionId removes the session ID', () => {
    setSessionId('session-123');
    clearSessionId();
    expect(getSessionId()).toBeNull();
  });

  test('setSessionId handles empty string', () => {
    setSessionId('');
    expect(getSessionId()).toBe('');
  });

  test('setSessionId handles UUID format', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    setSessionId(uuid);
    expect(getSessionId()).toBe(uuid);
  });
});

describe('User Context', () => {
  beforeEach(() => {
    clearUserId();
  });

  test('getUserId returns null when not set', () => {
    expect(getUserId()).toBeNull();
  });

  test('setUserId stores the user ID', () => {
    setUserId('user-456');
    expect(getUserId()).toBe('user-456');
  });

  test('setUserId overwrites previous value', () => {
    setUserId('user-1');
    setUserId('user-2');
    expect(getUserId()).toBe('user-2');
  });

  test('clearUserId removes the user ID', () => {
    setUserId('user-456');
    clearUserId();
    expect(getUserId()).toBeNull();
  });

  test('setUserId handles email format', () => {
    setUserId('user@example.com');
    expect(getUserId()).toBe('user@example.com');
  });

  test('session and user are independent', () => {
    setSessionId('session-123');
    setUserId('user-456');

    clearSessionId();
    expect(getSessionId()).toBeNull();
    expect(getUserId()).toBe('user-456');

    clearUserId();
    expect(getUserId()).toBeNull();
  });
});
