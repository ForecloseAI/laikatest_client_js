/**
 * Configuration for LaikaTest OpenTelemetry SDK.
 * Matches PRD Path 1 - Greenfield integration.
 */
export interface LaikaConfig {
  /** API key for LaikaTest authentication (required) */
  apiKey: string;
  /** Service name for resource identification (required) */
  serviceName: string;
  /** OTLP endpoint URL. Default: https://api.laikatest.com/otel/v1/traces */
  endpoint?: string;
  /** Capture prompt/response content. Default: false (privacy-first) */
  captureContent?: boolean;
  /** Optional callback for PII masking before export */
  maskingCallback?: ((text: string) => string) | null;
  /** Enable debug logging. Default: false */
  debug?: boolean;

  // Session tracking
  /** Static session ID for grouping related traces */
  sessionId?: string;
  /** Dynamic session ID getter function */
  getSessionId?: () => string;

  // User tracking
  /** Static user ID for per-user analytics */
  userId?: string;
  /** Dynamic user ID getter function */
  getUserId?: () => string;

  // Custom properties
  /** Default properties to attach to all spans */
  defaultProperties?: Record<string, string | number | boolean>;
}
