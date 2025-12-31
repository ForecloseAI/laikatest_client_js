import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { OpenAIInstrumentation } from '@opentelemetry/instrumentation-openai';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { LaikaConfig } from './types';

const DEFAULT_ENDPOINT = 'https://api.laikatest.com/otel/v1/traces';
let sdk: NodeSDK | null = null;

// Creates OTLP exporter configured for Laika endpoint
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
    await sdk.shutdown();
    sdk = null;
    console.log('[LaikaTest] SDK shut down');
  }
}

// Registers signal handlers for graceful SDK shutdown
function setupShutdown(): void {
  const shutdownHandler = async () => {
    await shutdown();
    process.exit(0);
  };
  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);
}

// Enables OpenTelemetry diagnostic logging
function enableDebugLogging(): void {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Initializes LaikaTest OpenTelemetry SDK with tracing and HTTP instrumentation
export function initLaika(config: LaikaConfig): void {
  if (sdk) {
    console.warn('[LaikaTest] Already initialized, skipping');
    return;
  }

  if (config.debug) {
    enableDebugLogging();
  }

  sdk = new NodeSDK({
    resource: createResource(config.serviceName),
    traceExporter: createExporter(config),
    instrumentations: createInstrumentations(config)
  });

  sdk.start();
  setupShutdown();
  console.log('[LaikaTest] OpenTelemetry initialized');
}
