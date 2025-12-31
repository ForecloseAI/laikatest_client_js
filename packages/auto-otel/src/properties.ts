/**
 * Custom properties API for adding metadata to spans.
 * Properties are prefixed with 'laika.property.' for namespacing.
 */

const properties: Map<string, string | number | boolean> = new Map();

// Sets a single custom property (prefixed with 'laika.property.')
export function setProperty(key: string, value: string | number | boolean): void {
  properties.set(key, value);
}

// Sets multiple custom properties at once
export function setProperties(props: Record<string, string | number | boolean>): void {
  Object.entries(props).forEach(([key, value]) => {
    setProperty(key, value);
  });
}

// Gets all custom properties as a plain object
export function getProperties(): Record<string, string | number | boolean> {
  return Object.fromEntries(properties);
}

// Clears all custom properties
export function clearProperties(): void {
  properties.clear();
}

// Removes a specific property
export function removeProperty(key: string): void {
  properties.delete(key);
}
