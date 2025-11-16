// Type definitions for @laikatest/js-client
// Project: LaikaTest SDK
// Definitions by: LaikaTest Team

export type PromptContent = string | Record<string, unknown> | Array<unknown>;

/**
 * Score types supported by the scoring system
 */
export type ScoreType = 'int' | 'bool' | 'string';

/**
 * Score source (user or template)
 */
export type ScoreSource = 'sdk' | 'ui';

/**
 * Individual score item structure
 */
export interface ScoreInput {
  /** Name of the score metric (e.g., 'rating', 'helpful') */
  name: string;
  /** Type of the score value */
  type: ScoreType;
  /** The actual score value (must match the type) */
  value: number | boolean | string;
}

/**
 * Options for pushScore method
 */
export interface PushScoreOptions {
  /** Session identifier (optional if user_id provided) */
  session_id?: string;
  /** User identifier (optional if session_id provided) */
  user_id?: string;
}

/**
 * Response from pushScore method
 */
export interface PushScoreResponse {
  success: boolean;
  statusCode: number;
  data?: any;
  message?: string;
}

export class Prompt<C = PromptContent> {
  constructor(content: C);

  getContent(): C;

  getType(): 'chat' | 'text';

  getBucketId(): string | null;

  getExperimentId(): string | null;

  getPromptId(): string | null;

  getPromptVersionId(): string | null;

  compile(variables: Record<string, unknown>): Prompt<C>;

  /**
   * Push score for experimental prompts
   * @param scores - Array of score items
   * @param options - Options object containing session_id and/or user_id (at least one required)
   * @returns Promise resolving to push score response
   * @throws {Error} If prompt is not from an experiment
   * @throws {ValidationError} If scores are invalid or neither session_id nor user_id is provided
   * @throws {NetworkError} If network request fails
   */
  pushScore(
    scores: ScoreInput[],
    options: PushScoreOptions
  ): Promise<PushScoreResponse>;
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
   * Evaluate an experiment and retrieve the assigned prompt
   * @param experimentTitle - The title of the experiment to evaluate
   * @param context - Optional contextual data used for experiment bucketing
   * @returns Promise resolving to experiment assignment details
   * @throws {ValidationError} If experiment title or context is invalid
   * @throws {AuthenticationError} If API key is invalid
   * @throws {LaikaServiceError} If API returns an error
   * @throws {NetworkError} If network request fails
   */
  getExperimentPrompt<C = PromptContent>(experimentTitle: string, context?: Record<string, unknown>): Promise<Prompt<C>>;

  /**
   * Push score for experimental prompts (advanced usage)
   * Note: Most users should use prompt.pushScore() instead
   * @param exp_id - Experiment ID
   * @param bucket_id - Bucket ID
   * @param prompt_version_id - Prompt Version ID
   * @param scores - Array of score items
   * @param session_id - Session identifier (optional if user_id provided)
   * @param user_id - User identifier (optional if session_id provided)
   * @returns Promise resolving to push score response
   * @throws {ValidationError} If inputs are invalid
   * @throws {NetworkError} If network request fails
   */
  pushScore(
    exp_id: string,
    bucket_id: string,
    prompt_version_id: string,
    scores: ScoreInput[],
    session_id?: string | null,
    user_id?: string | null
  ): Promise<PushScoreResponse>;

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
