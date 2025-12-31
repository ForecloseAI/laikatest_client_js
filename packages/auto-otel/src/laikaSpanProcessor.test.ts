/**
 * Unit tests for laikaSpanProcessor.ts - Span attribute injection
 */

import { LaikaSpanProcessor } from './laikaSpanProcessor';
import { setSessionId, clearSessionId, setUserId, clearUserId } from './context';
import { setProperties, clearProperties } from './properties';
import { Context } from '@opentelemetry/api';

// Mock span for testing
class MockSpan {
  attributes: Record<string, string | number | boolean> = {};

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }
}

describe('LaikaSpanProcessor', () => {
  let processor: LaikaSpanProcessor;
  let mockSpan: MockSpan;
  let mockContext: Context;

  beforeEach(() => {
    processor = new LaikaSpanProcessor();
    mockSpan = new MockSpan();
    mockContext = {} as Context;

    // Clear all context before each test
    clearSessionId();
    clearUserId();
    clearProperties();
  });

  describe('onStart', () => {
    test('injects session ID when set', () => {
      setSessionId('session-123');
      processor.onStart(mockSpan as any, mockContext);
      expect(mockSpan.attributes['laika.session.id']).toBe('session-123');
    });

    test('does not inject session ID when not set', () => {
      processor.onStart(mockSpan as any, mockContext);
      expect(mockSpan.attributes['laika.session.id']).toBeUndefined();
    });

    test('injects user ID when set', () => {
      setUserId('user-456');
      processor.onStart(mockSpan as any, mockContext);
      expect(mockSpan.attributes['laika.user.id']).toBe('user-456');
    });

    test('does not inject user ID when not set', () => {
      processor.onStart(mockSpan as any, mockContext);
      expect(mockSpan.attributes['laika.user.id']).toBeUndefined();
    });

    test('injects custom properties with prefix', () => {
      setProperties({
        environment: 'production',
        version: '1.0.0'
      });
      processor.onStart(mockSpan as any, mockContext);
      expect(mockSpan.attributes['laika.property.environment']).toBe('production');
      expect(mockSpan.attributes['laika.property.version']).toBe('1.0.0');
    });

    test('handles multiple property types', () => {
      setProperties({
        strProp: 'text',
        numProp: 42,
        boolProp: true
      });
      processor.onStart(mockSpan as any, mockContext);
      expect(mockSpan.attributes['laika.property.strProp']).toBe('text');
      expect(mockSpan.attributes['laika.property.numProp']).toBe(42);
      expect(mockSpan.attributes['laika.property.boolProp']).toBe(true);
    });

    test('injects all context together', () => {
      setSessionId('session-123');
      setUserId('user-456');
      setProperties({ env: 'prod' });

      processor.onStart(mockSpan as any, mockContext);

      expect(mockSpan.attributes['laika.session.id']).toBe('session-123');
      expect(mockSpan.attributes['laika.user.id']).toBe('user-456');
      expect(mockSpan.attributes['laika.property.env']).toBe('prod');
    });

    test('handles empty properties', () => {
      processor.onStart(mockSpan as any, mockContext);
      expect(Object.keys(mockSpan.attributes).length).toBe(0);
    });
  });

  describe('lifecycle methods', () => {
    test('onEnd is a no-op', () => {
      expect(() => processor.onEnd({} as any)).not.toThrow();
    });

    test('shutdown resolves', async () => {
      await expect(processor.shutdown()).resolves.toBeUndefined();
    });

    test('forceFlush resolves', async () => {
      await expect(processor.forceFlush()).resolves.toBeUndefined();
    });
  });
});
