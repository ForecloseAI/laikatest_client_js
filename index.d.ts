// Type definitions for @laikatest/js-client
// Project: LaikaTest SDK
// Definitions by: LaikaTest Team

export type PromptContent = string | Record<string, unknown> | Array<unknown>;

export class Prompt<C = PromptContent> {
  constructor(content: C);

  getContent(): C;

  getType(): 'chat' | 'text';

  compile(variables: Record<string, unknown>): Prompt<C>;
}

export class LaikaTest {
  /**
   * Creates a new LaikaTest client
   * @param apiKey - Your LaikaTest API key
   * @param options - Optional configuration
   */
  constructor(apiKey: string, options?: ClientOptions);

  /**
   * Fetch prompt content by name
   * @param promptName - The name of the prompt template
   * @param options - Optional parameters for fetching
   * @returns Promise resolving to prompt content
   * @throws {ValidationError} If prompt name is invalid
   * @throws {AuthenticationError} If API key is invalid
   * @throws {LaikaServiceError} If API returns an error
   * @throws {NetworkError} If network request fails
   */
  getPrompt<C = PromptContent>(promptName: string, options?: GetPromptOptions): Promise<Prompt<C>>;

  /**
   * Cleanup resources and stop background processes
   */
  destroy(): void;
}

/**
 * Configuration options for the client
 */
export interface ClientOptions {
  /**
   * Base URL for the LaikaTest API
   * @default 'https://api.laikatest.com'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;

  /**
   * Cache TTL (time-to-live) in milliseconds
   * @default 1800000 (30 minutes)
   */
  cacheTTL?: number;

  /**
   * Enable or disable caching
   * @default true
   */
  cacheEnabled?: boolean;
}

/**
 * Options for getPrompt method
 */
export interface GetPromptOptions {
  /**
   * Specific version ID to retrieve
   * If not provided, fetches the current published version
   */
  versionId?: string;

  /**
   * Bypass cache and force fresh fetch from API
   * @default false
   */
  bypassCache?: boolean;
}

/**
 * Response from getPrompt method
 */
export interface PromptResponse<C = PromptContent> extends Prompt<C> {}

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * API or service-related errors (4xx, 5xx responses)
 */
export class LaikaServiceError extends Error {
  name: 'LaikaServiceError';
  statusCode: number;
  response: any;

  constructor(message: string, statusCode: number, response: any);
}

/**
 * Network connectivity or timeout errors
 */
export class NetworkError extends Error {
  name: 'NetworkError';
  originalError: Error;

  constructor(message: string, originalError: Error);
}

/**
 * Input validation errors
 */
export class ValidationError extends Error {
  name: 'ValidationError';

  constructor(message: string);
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends Error {
  name: 'AuthenticationError';

  constructor(message: string);
}
