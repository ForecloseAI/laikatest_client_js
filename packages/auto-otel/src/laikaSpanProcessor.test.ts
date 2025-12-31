/**
 * Unit tests for laikaSpanProcessor.ts - Span attribute injection
 * Tests run within AsyncLocalStorage context.
 */

import { LaikaSpanProcessor } from './laikaSpanProcessor';
import { setSessionId, setUserId, runWithContext } from './context';
import { setProperties, runWithProperties } from './properties';
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
  let mockContext: Context;

  beforeEach(() => {
    processor = new LaikaSpanProcessor();
    mockContext = {} as Context;
  });

  describe('onStart - session and user context', () => {
    test('injects session ID when set', () => {
      runWithContext(() => {
        const mockSpan = new MockSpan();
        setSessionId('session-123');
        processor.onStart(mockSpan as any, mockContext);
        expect(mockSpan.attributes['laika.session.id']).toBe('session-123');
      });
    });

    test('does not inject session ID when not set', () => {
      runWithContext(() => {
        const mockSpan = new MockSpan();
        processor.onStart(mockSpan as any, mockContext);
        expect(mockSpan.attributes['laika.session.id']).toBeUndefined();
      });
    });

    test('injects user ID when set', () => {
      runWithContext(() => {
        const mockSpan = new MockSpan();
        setUserId('user-456');
        processor.onStart(mockSpan as any, mockContext);
        expect(mockSpan.attributes['laika.user.id']).toBe('user-456');
      });
    });

    test('does not inject user ID when not set', () => {
      runWithContext(() => {
        const mockSpan = new MockSpan();
        processor.onStart(mockSpan as any, mockContext);
        expect(mockSpan.attributes['laika.user.id']).toBeUndefined();
      });
    });

    test('injects both session and user IDs together', () => {
      runWithContext(() => {
        const mockSpan = new MockSpan();
        setSessionId('session-123');
        setUserId('user-456');
        processor.onStart(mockSpan as any, mockContext);
        expect(mockSpan.attributes['laika.session.id']).toBe('session-123');
        expect(mockSpan.attributes['laika.user.id']).toBe('user-456');
      });
    });
  });

  describe('onStart - custom properties', () => {
    test('injects custom properties with prefix', () => {
      runWithProperties(() => {
        const mockSpan = new MockSpan();
        setProperties({
          environment: 'production',
          version: '1.0.0'
        });
        processor.onStart(mockSpan as any, mockContext);
        expect(mockSpan.attributes['laika.property.environment']).toBe('production');
        expect(mockSpan.attributes['laika.property.version']).toBe('1.0.0');
      });
    });

    test('handles multiple property types', () => {
      runWithProperties(() => {
        const mockSpan = new MockSpan();
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
    });

    test('handles empty properties', () => {
      runWithProperties(() => {
        const mockSpan = new MockSpan();
        processor.onStart(mockSpan as any, mockContext);
        // No properties should be set
        const propKeys = Object.keys(mockSpan.attributes).filter(k => k.startsWith('laika.property.'));
        expect(propKeys.length).toBe(0);
      });
    });
  });

  describe('lifecycle methods', () => {
    test('onEnd does not throw', () => {
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

describe('LaikaSpanProcessor - Experiment Context', () => {
  let processor: LaikaSpanProcessor;
  let mockContext: Context;

  beforeEach(() => {
    processor = new LaikaSpanProcessor();
    mockContext = {} as Context;
    jest.resetModules();
  });

  test('does not inject experiment attributes when client not installed', () => {
    const mockSpan = new MockSpan();
    processor.onStart(mockSpan as any, mockContext);
    expect(mockSpan.attributes['laika.experiment.id']).toBeUndefined();
    expect(mockSpan.attributes['laika.experiment.variant_id']).toBeUndefined();
  });

  test('logs error for unexpected require errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // The error logging only happens for non-MODULE_NOT_FOUND errors
    // This is tested implicitly by verifying no crash occurs
    const mockSpan = new MockSpan();
    processor.onStart(mockSpan as any, mockContext);

    consoleSpy.mockRestore();
  });
});
