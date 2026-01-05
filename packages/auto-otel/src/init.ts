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
import * as path from 'path';
import * as fs from 'fs';

const DEFAULT_ENDPOINT = 'https://api.laikatest.com/otel/v1/traces';
let sdk: NodeSDK | null = null;

/**
 * Auto-detects service name from package.json or directory name
 */
function autoDetectServiceName(): string {
  try {
    // Try reading package.json from current working directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.name) {
        return packageJson.name;
      }
    }
  } catch (error) {
    // Fallback if reading fails
    console.warn(
      '[LaikaTest] Failed to auto-detect service name from package.json:',
      error instanceof Error ? error.message : String(error)
    );
  }

  // Fallback: use directory name
  return path.basename(process.cwd());
}

/**
 * Auto-detects default properties (environment, version)
 */
function autoDetectDefaultProperties(): Record<string, string> {
  const props: Record<string, string> = {};

  // Auto-detect environment from NODE_ENV
  const environment = process.env.NODE_ENV || 'development';
  props.environment = environment;

  // Try to get version from package.json
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.version) {
        props.version = packageJson.version;
      }
    }
  } catch (error) {
    // Ignore if version detection fails
    console.warn(
      '[LaikaTest] Failed to auto-detect version from package.json:',
      error instanceof Error ? error.message : String(error)
    );
  }

  return props;
}

// Creates OTLP exporter configured for LaikaTest endpoint
function createExporter(config: LaikaConfig): OTLPTraceExporter {
  const endpoint = config.endpoint || DEFAULT_ENDPOINT;
  return new OTLPTraceExporter({
    url: endpoint,
    headers: { 'Authorization': `Bearer ${config.apiKey}` }
  });
}

// Creates resource with service name attribute (auto-detects if not provided)
function createResource(serviceName?: string): Resource {
  const actualServiceName = serviceName || autoDetectServiceName();
  return resourceFromAttributes({ [ATTR_SERVICE_NAME]: actualServiceName });
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
  // serviceName is now optional - will be auto-detected if not provided
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

  // Auto-detect and merge default properties
  const autoDetectedProps = autoDetectDefaultProperties();
  const mergedProps = {
    ...autoDetectedProps,
    ...(config.defaultProperties || {}),
  };

  // Set merged properties
  if (Object.keys(mergedProps).length > 0) {
    setProperties(mergedProps);
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

  // Auto-detect service name if not provided
  const serviceName = config.serviceName || autoDetectServiceName();

  if (config.debug && !config.serviceName) {
    console.log(`[LaikaTest] Auto-detected service name: ${serviceName}`);
  }

  // Initialize context from config
  initializeContext(config);

  const exporter = createExporter(config);

  sdk = new NodeSDK({
    resource: createResource(serviceName),
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
