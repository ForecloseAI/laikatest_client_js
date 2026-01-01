import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { OpenAIInstrumentation } from '@opentelemetry/instrumentation-openai';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { LaikaConfig } from './types';
import { LaikaSpanProcessor } from './laikaSpanProcessor';
import { setSessionId, setUserId } from './context';
import { setProperties } from './properties';

const DEFAULT_ENDPOINT = 'https://api.laikatest.com/otel/v1/traces';
let sdk: NodeSDK | null = null;

// Creates OTLP exporter configured for LaikaTest endpoint
function createExporter(config: LaikaConfig): OTLPTraceExporter {
  const endpoint = config.endpoint || DEFAULT_ENDPOINT;
  return new OTLPTraceExporter({
    url: endpoint,
    headers: { 'Authorization': `Bearer ${config.apiKey}` }
  });
}

// Creates resource with service name attribute
function createResource(serviceName: string): Resource {
  return resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName });
}

// Creates instrumentations array based on config
function createInstrumentations(config: LaikaConfig) {
  return [
    new HttpInstrumentation(),
    new OpenAIInstrumentation({
      captureMessageContent: config.captureContent ?? false
    })
  ];
}

// Manually shuts down the SDK and flushes pending spans
export async function shutdown(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      console.log('[LaikaTest] SDK shut down');
    } catch (error) {
      console.error('[LaikaTest] Error during SDK shutdown:', error);
    } finally {
      sdk = null;
    }
  }
}

// Registers signal handlers for graceful SDK shutdown
function setupShutdown(): void {
  const shutdownHandler = async () => {
    try {
      await shutdown();
      process.exit(0);
    } catch (error) {
      console.error('[LaikaTest] Shutdown failed:', error);
      process.exit(1);
    }
  };
  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);
}

// Validates required configuration fields
function validateConfig(config: LaikaConfig): void {
  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new Error('[LaikaTest] apiKey is required and must be a non-empty string');
  }
  if (!config.serviceName || typeof config.serviceName !== 'string') {
    throw new Error('[LaikaTest] serviceName is required and must be a non-empty string');
  }
}

// Enables OpenTelemetry diagnostic logging
function enableDebugLogging(): void {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Initializes context from config options
function initializeContext(config: LaikaConfig): void {
  // Set session ID from config
  const sessionId = config.sessionId || config.getSessionId?.();
  if (sessionId) {
    setSessionId(sessionId);
  }

  // Set user ID from config
  const userId = config.userId || config.getUserId?.();
  if (userId) {
    setUserId(userId);
  }

  // Set default properties from config
  if (config.defaultProperties) {
    setProperties(config.defaultProperties);
  }
}

// Initializes LaikaTest OpenTelemetry SDK with tracing and HTTP instrumentation
export function initLaikaTest(config: LaikaConfig): void {
  if (sdk) {
    console.warn('[LaikaTest] Already initialized, skipping');
    return;
  }

  validateConfig(config);

  if (config.debug) {
    enableDebugLogging();
  }

  // Initialize context from config
  initializeContext(config);

  const exporter = createExporter(config);

  sdk = new NodeSDK({
    resource: createResource(config.serviceName),
    instrumentations: createInstrumentations(config),
    spanProcessors: [
      new LaikaSpanProcessor(),
      new BatchSpanProcessor(exporter)
    ]
  });

  try {
    sdk.start();
    setupShutdown();
    console.log('[LaikaTest] OpenTelemetry initialized');
  } catch (error) {
    sdk = null;
    console.error('[LaikaTest] Failed to start OpenTelemetry SDK:', error);
    throw error;
  }
}
