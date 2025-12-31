/**
 * Unit tests for properties.ts - Custom Properties API
 * Tests run within AsyncLocalStorage context using runWithProperties.
 */

import {
  setProperty,
  setProperties,
  getProperties,
  clearProperties,
  removeProperty,
  runWithProperties,
  runWithPropertiesAsync
} from './properties';

describe('Custom Properties API', () => {
  describe('setProperty', () => {
    test('sets a string property', () => {
      runWithProperties(() => {
        setProperty('environment', 'production');
        expect(getProperties()).toEqual({ environment: 'production' });
      });
    });

    test('sets a number property', () => {
      runWithProperties(() => {
        setProperty('retryCount', 3);
        expect(getProperties()).toEqual({ retryCount: 3 });
      });
    });

    test('sets a boolean property', () => {
      runWithProperties(() => {
        setProperty('isEnabled', true);
        expect(getProperties()).toEqual({ isEnabled: true });
      });
    });

    test('overwrites existing property', () => {
      runWithProperties(() => {
        setProperty('env', 'dev');
        setProperty('env', 'prod');
        expect(getProperties()).toEqual({ env: 'prod' });
      });
    });

    test('handles special characters in key', () => {
      runWithProperties(() => {
        setProperty('my-prop_name.v1', 'value');
        expect(getProperties()).toEqual({ 'my-prop_name.v1': 'value' });
      });
    });
  });

  describe('setProperties', () => {
    test('sets multiple properties at once', () => {
      runWithProperties(() => {
        setProperties({
          environment: 'production',
          version: '1.2.3',
          tier: 'enterprise'
        });
        expect(getProperties()).toEqual({
          environment: 'production',
          version: '1.2.3',
          tier: 'enterprise'
        });
      });
    });

    test('merges with existing properties', () => {
      runWithProperties(() => {
        setProperty('existing', 'value');
        setProperties({ new1: 'a', new2: 'b' });
        expect(getProperties()).toEqual({
          existing: 'value',
          new1: 'a',
          new2: 'b'
        });
      });
    });

    test('overwrites existing when keys collide', () => {
      runWithProperties(() => {
        setProperty('key', 'old');
        setProperties({ key: 'new', other: 'value' });
        expect(getProperties()).toEqual({ key: 'new', other: 'value' });
      });
    });

    test('handles empty object', () => {
      runWithProperties(() => {
        setProperty('existing', 'value');
        setProperties({});
        expect(getProperties()).toEqual({ existing: 'value' });
      });
    });

    test('handles mixed types', () => {
      runWithProperties(() => {
        setProperties({
          str: 'text',
          num: 42,
          bool: false
        });
        expect(getProperties()).toEqual({
          str: 'text',
          num: 42,
          bool: false
        });
      });
    });
  });

  describe('getProperties', () => {
    test('returns empty object when no properties set', () => {
      runWithProperties(() => {
        expect(getProperties()).toEqual({});
      });
    });

    test('returns copy of properties', () => {
      runWithProperties(() => {
        setProperty('key', 'value');
        const props = getProperties();
        props['modified'] = 'test';
        expect(getProperties()).toEqual({ key: 'value' });
      });
    });
  });

  describe('clearProperties', () => {
    test('removes all properties', () => {
      runWithProperties(() => {
        setProperties({ a: 1, b: 2, c: 3 });
        clearProperties();
        expect(getProperties()).toEqual({});
      });
    });

    test('handles clearing empty properties', () => {
      runWithProperties(() => {
        clearProperties();
        expect(getProperties()).toEqual({});
      });
    });
  });

  describe('removeProperty', () => {
    test('removes specific property', () => {
      runWithProperties(() => {
        setProperties({ a: 1, b: 2, c: 3 });
        removeProperty('b');
        expect(getProperties()).toEqual({ a: 1, c: 3 });
      });
    });

    test('handles removing non-existent property', () => {
      runWithProperties(() => {
        setProperty('existing', 'value');
        removeProperty('nonexistent');
        expect(getProperties()).toEqual({ existing: 'value' });
      });
    });

    test('handles removing from empty properties', () => {
      runWithProperties(() => {
        removeProperty('any');
        expect(getProperties()).toEqual({});
      });
    });
  });
});

describe('Properties Isolation', () => {
  test('properties are isolated between runWithProperties calls', () => {
    runWithProperties(() => {
      setProperty('key', 'value-A');
    });

    runWithProperties(() => {
      expect(getProperties()).toEqual({});
    });
  });

  test('runWithPropertiesAsync provides isolated async context', async () => {
    await runWithPropertiesAsync(async () => {
      setProperty('asyncKey', 'asyncValue');
      await Promise.resolve();
      expect(getProperties()).toEqual({ asyncKey: 'asyncValue' });
    });

    await runWithPropertiesAsync(async () => {
      expect(getProperties()).toEqual({});
    });
  });

  test('concurrent properties contexts do not interfere', async () => {
    const results: Record<string, string | number | boolean>[] = [];

    const context1 = runWithPropertiesAsync(async () => {
      setProperty('ctx', 'context-1');
      await new Promise(resolve => setTimeout(resolve, 10));
      results.push(getProperties());
    });

    const context2 = runWithPropertiesAsync(async () => {
      setProperty('ctx', 'context-2');
      await new Promise(resolve => setTimeout(resolve, 5));
      results.push(getProperties());
    });

    await Promise.all([context1, context2]);

    expect(results).toContainEqual({ ctx: 'context-1' });
    expect(results).toContainEqual({ ctx: 'context-2' });
  });
});
