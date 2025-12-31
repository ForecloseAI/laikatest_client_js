/**
 * Custom properties API for adding metadata to spans.
 * Properties are prefixed with 'laika.property.' for namespacing.
 *
 * Uses AsyncLocalStorage for request-scoped properties in concurrent environments.
 */

import { AsyncLocalStorage } from 'async_hooks';

type PropertyValue = string | number | boolean;
type PropertyMap = Map<string, PropertyValue>;

const asyncLocalStorage = new AsyncLocalStorage<PropertyMap>();

// Gets current properties from AsyncLocalStorage or returns empty map
function getPropertyStore(): PropertyMap {
  return asyncLocalStorage.getStore() || new Map();
}

// Sets a single custom property (prefixed with 'laika.property.')
export function setProperty(key: string, value: PropertyValue): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set(key, value);
  }
}

// Sets multiple custom properties at once
export function setProperties(props: Record<string, PropertyValue>): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    Object.entries(props).forEach(([key, value]) => {
      store.set(key, value);
    });
  }
}

// Gets all custom properties as a plain object
export function getProperties(): Record<string, PropertyValue> {
  return Object.fromEntries(getPropertyStore());
}

// Clears all custom properties
export function clearProperties(): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.clear();
  }
}

// Removes a specific property
export function removeProperty(key: string): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.delete(key);
  }
}

/**
 * Runs a callback within an isolated properties context.
 * Use this to prevent property leakage between concurrent requests.
 */
export function runWithProperties<T>(callback: () => T): T {
  return asyncLocalStorage.run(new Map(), callback);
}

/**
 * Runs an async callback within an isolated properties context.
 */
export function runWithPropertiesAsync<T>(callback: () => Promise<T>): Promise<T> {
  return asyncLocalStorage.run(new Map(), callback);
}
