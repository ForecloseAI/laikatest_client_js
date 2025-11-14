// Type definitions for @laikatest/js-client
// Project: LaikaTest SDK
// Definitions by: LaikaTest Team

export type PromptContent = string | Record<string, unknown> | Array<unknown>;

/**
 * Score types supported by the LaikaTest scoring system
 */
export type ScoreType = 'int' | 'bool' | 'string';

/**
 * Source of the score submission
 */
export type ScoreSource = 'sdk' | 'ui';

/**
 * Individual score item
 */
export interface ScoreInput {
  name: string;
  type: ScoreType;
  value: number | boolean | string;
}

/**
 * Response from pushScore method
 */
export interface PushScoreResponse {
  success: boolean;
  statusCode: number;
  data?: any;
  sdk_event_id: string;
  request_id: string;
}

export class Prompt<C = PromptContent> {
  constructor(
    content: C,
    promptVersionId?: string | null,
    experimentId?: string | null,
    bucketId?: string | null,
    client?: LaikaTest | null
  );

  getContent(): C;

  getType(): 'chat' | 'text';

  compile(variables: Record<string, unknown>): Prompt<C>;

  /**
   * Push score for this experiment prompt
   * Only works for prompts obtained via getExperimentPrompt()
   * @param scores - Array of score objects
   * @param session_id - Session identifier (optional)
   * @param user_id - User identifier (optional)
   * @param metadata - Additional metadata (optional)
   * @returns Promise resolving to push score response
   * @throws {ValidationError} If prompt is not from an experiment or missing required data
   */
  pushScore(
    scores: ScoreInput[],
    session_id?: string | null,
    user_id?: string | null,
    metadata?: Record<string, any> | null
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
   * Get experiment prompt with automatic bucket assignment
   * @param experimentTitle - The title of the experiment
   * @param context - Optional context for bucket assignment (e.g., user_id, session_id)
   * @returns Promise resolving to prompt with experiment metadata
   * @throws {ValidationError} If experiment title is invalid
   * @throws {AuthenticationError} If API key is invalid
   * @throws {LaikaServiceError} If API returns an error
   * @throws {NetworkError} If network request fails
   */
  getExperimentPrompt<C = PromptContent>(
    experimentTitle: string,
    context?: Record<string, any>
  ): Promise<Prompt<C>>;

  /**
   * Push score directly to LaikaTest API
   * Note: Typically you should use prompt.pushScore() instead
   * @param exp_id - Experiment ID
   * @param bucket_id - Bucket ID
   * @param prompt_id - Prompt version ID
   * @param scores - Array of score objects
   * @param session_id - Session identifier (optional)
   * @param user_id - User identifier (optional)
   * @param metadata - Additional metadata (optional)
   * @returns Promise resolving to push score response
   * @throws {ValidationError} If scores are invalid or missing session_id/user_id
   * @throws {NetworkError} If network request fails
   */
  pushScore(
    exp_id: string,
    bucket_id: string,
    prompt_id: string,
    scores: ScoreInput[],
    session_id?: string | null,
    user_id?: string | null,
    metadata?: Record<string, any> | null
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
