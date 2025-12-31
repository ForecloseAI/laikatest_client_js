/**
 * Unit tests for context.ts - Session and User tracking APIs
 * Tests run within AsyncLocalStorage context using runWithContext.
 */

import {
  setSessionId,
  getSessionId,
  clearSessionId,
  setUserId,
  getUserId,
  clearUserId,
  runWithContext,
  runWithContextAsync
} from './context';

describe('Session Context', () => {
  test('getSessionId returns null when not set', () => {
    runWithContext(() => {
      expect(getSessionId()).toBeNull();
    });
  });

  test('setSessionId stores the session ID', () => {
    runWithContext(() => {
      setSessionId('session-123');
      expect(getSessionId()).toBe('session-123');
    });
  });

  test('setSessionId overwrites previous value', () => {
    runWithContext(() => {
      setSessionId('session-1');
      setSessionId('session-2');
      expect(getSessionId()).toBe('session-2');
    });
  });

  test('clearSessionId removes the session ID', () => {
    runWithContext(() => {
      setSessionId('session-123');
      clearSessionId();
      expect(getSessionId()).toBeNull();
    });
  });

  test('setSessionId handles empty string', () => {
    runWithContext(() => {
      setSessionId('');
      expect(getSessionId()).toBe('');
    });
  });

  test('setSessionId handles UUID format', () => {
    runWithContext(() => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      setSessionId(uuid);
      expect(getSessionId()).toBe(uuid);
    });
  });
});

describe('User Context', () => {
  test('getUserId returns null when not set', () => {
    runWithContext(() => {
      expect(getUserId()).toBeNull();
    });
  });

  test('setUserId stores the user ID', () => {
    runWithContext(() => {
      setUserId('user-456');
      expect(getUserId()).toBe('user-456');
    });
  });

  test('setUserId overwrites previous value', () => {
    runWithContext(() => {
      setUserId('user-1');
      setUserId('user-2');
      expect(getUserId()).toBe('user-2');
    });
  });

  test('clearUserId removes the user ID', () => {
    runWithContext(() => {
      setUserId('user-456');
      clearUserId();
      expect(getUserId()).toBeNull();
    });
  });

  test('setUserId handles email format', () => {
    runWithContext(() => {
      setUserId('user@example.com');
      expect(getUserId()).toBe('user@example.com');
    });
  });

  test('session and user are independent', () => {
    runWithContext(() => {
      setSessionId('session-123');
      setUserId('user-456');

      clearSessionId();
      expect(getSessionId()).toBeNull();
      expect(getUserId()).toBe('user-456');

      clearUserId();
      expect(getUserId()).toBeNull();
    });
  });
});

describe('Context Isolation', () => {
  test('contexts are isolated between runWithContext calls', () => {
    runWithContext(() => {
      setSessionId('session-A');
      setUserId('user-A');
    });

    runWithContext(() => {
      // New context should start fresh
      expect(getSessionId()).toBeNull();
      expect(getUserId()).toBeNull();
    });
  });

  test('runWithContextAsync provides isolated async context', async () => {
    await runWithContextAsync(async () => {
      setSessionId('async-session');
      await Promise.resolve();
      expect(getSessionId()).toBe('async-session');
    });

    await runWithContextAsync(async () => {
      expect(getSessionId()).toBeNull();
    });
  });

  test('concurrent contexts do not interfere', async () => {
    const results: string[] = [];

    const context1 = runWithContextAsync(async () => {
      setSessionId('context-1');
      await new Promise(resolve => setTimeout(resolve, 10));
      results.push(`1:${getSessionId()}`);
    });

    const context2 = runWithContextAsync(async () => {
      setSessionId('context-2');
      await new Promise(resolve => setTimeout(resolve, 5));
      results.push(`2:${getSessionId()}`);
    });

    await Promise.all([context1, context2]);

    expect(results).toContain('1:context-1');
    expect(results).toContain('2:context-2');
  });
});
