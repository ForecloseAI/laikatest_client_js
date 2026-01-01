/**
 * Unified configuration for LaikaTest SDK.
 * Combines tracing (observability) and experimentation (A/B testing) config.
 */
export interface LaikaConfig {
  /** API key for Laika authentication (required) */
  apiKey: string;

  /** Service name for resource identification (required) */
  serviceName: string;

  // Feature toggles
  /** Enable OpenTelemetry tracing. Default: true */
  tracing?: boolean;

  /** Enable A/B testing client. Default: true */
  experiments?: boolean;

  // Tracing options (passed to @laikatest/auto-otel)
  /** OTLP endpoint URL. If not set, derived from baseUrl + '/otel/v1/traces' */
  endpoint?: string;

  /** Capture prompt/response content. Default: false (privacy-first) */
  captureContent?: boolean;

  /** Enable debug logging. Default: false */
  debug?: boolean;

  // Shared context options
  /** Static session ID for grouping related traces */
  sessionId?: string;

  /** Dynamic session ID getter function */
  getSessionId?: () => string;

  /** Static user ID for per-user analytics */
  userId?: string;

  /** Dynamic user ID getter function */
  getUserId?: () => string;

  /** Default properties to attach to all spans */
  defaultProperties?: Record<string, string | number | boolean>;

  // Client options (passed to @laikatest/client)
  /** API base URL. Also used to derive OTLP endpoint if not set. Default: https://api.laikatest.com */
  baseUrl?: string;

  /** Request timeout in milliseconds. Default: 10000 */
  timeout?: number;

  /** Enable prompt caching. Default: true */
  cacheEnabled?: boolean;

  /** Cache TTL in milliseconds. Default: 30 * 60 * 1000 (30 minutes) */
  cacheTTL?: number;
}
