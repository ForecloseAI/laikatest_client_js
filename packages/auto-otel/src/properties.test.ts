/**
 * Unit tests for properties.ts - Custom Properties API
 */

import {
  setProperty,
  setProperties,
  getProperties,
  clearProperties,
  removeProperty
} from './properties';

describe('Custom Properties API', () => {
  beforeEach(() => {
    clearProperties();
  });

  describe('setProperty', () => {
    test('sets a string property', () => {
      setProperty('environment', 'production');
      expect(getProperties()).toEqual({ environment: 'production' });
    });

    test('sets a number property', () => {
      setProperty('retryCount', 3);
      expect(getProperties()).toEqual({ retryCount: 3 });
    });

    test('sets a boolean property', () => {
      setProperty('isEnabled', true);
      expect(getProperties()).toEqual({ isEnabled: true });
    });

    test('overwrites existing property', () => {
      setProperty('env', 'dev');
      setProperty('env', 'prod');
      expect(getProperties()).toEqual({ env: 'prod' });
    });

    test('handles special characters in key', () => {
      setProperty('my-prop_name.v1', 'value');
      expect(getProperties()).toEqual({ 'my-prop_name.v1': 'value' });
    });
  });

  describe('setProperties', () => {
    test('sets multiple properties at once', () => {
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

    test('merges with existing properties', () => {
      setProperty('existing', 'value');
      setProperties({ new1: 'a', new2: 'b' });
      expect(getProperties()).toEqual({
        existing: 'value',
        new1: 'a',
        new2: 'b'
      });
    });

    test('overwrites existing when keys collide', () => {
      setProperty('key', 'old');
      setProperties({ key: 'new', other: 'value' });
      expect(getProperties()).toEqual({ key: 'new', other: 'value' });
    });

    test('handles empty object', () => {
      setProperty('existing', 'value');
      setProperties({});
      expect(getProperties()).toEqual({ existing: 'value' });
    });

    test('handles mixed types', () => {
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

  describe('getProperties', () => {
    test('returns empty object when no properties set', () => {
      expect(getProperties()).toEqual({});
    });

    test('returns copy of properties', () => {
      setProperty('key', 'value');
      const props = getProperties();
      props['modified'] = 'test';
      expect(getProperties()).toEqual({ key: 'value' });
    });
  });

  describe('clearProperties', () => {
    test('removes all properties', () => {
      setProperties({ a: 1, b: 2, c: 3 });
      clearProperties();
      expect(getProperties()).toEqual({});
    });

    test('handles clearing empty properties', () => {
      clearProperties();
      expect(getProperties()).toEqual({});
    });
  });

  describe('removeProperty', () => {
    test('removes specific property', () => {
      setProperties({ a: 1, b: 2, c: 3 });
      removeProperty('b');
      expect(getProperties()).toEqual({ a: 1, c: 3 });
    });

    test('handles removing non-existent property', () => {
      setProperty('existing', 'value');
      removeProperty('nonexistent');
      expect(getProperties()).toEqual({ existing: 'value' });
    });

    test('handles removing from empty properties', () => {
      removeProperty('any');
      expect(getProperties()).toEqual({});
    });
  });
});
