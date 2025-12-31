/**
 * Configuration for LaikaTest OpenTelemetry SDK.
 * Matches PRD Path 1 - Greenfield integration.
 */
export interface LaikaConfig {
  /** API key for Laika authentication (required) */
  apiKey: string;
  /** Service name for resource identification (required) */
  serviceName: string;
  /** OTLP endpoint URL. Default: https://ingest.laikatest.com/otel/v1/traces */
  endpoint?: string;
  /** Capture prompt/response content. Default: false (privacy-first) */
  captureContent?: boolean;
  /** Optional callback for PII masking before export */
  maskingCallback?: ((text: string) => string) | null;
  /** Enable debug logging. Default: false */
  debug?: boolean;
}
