/**
 * Unit tests for init.ts - SDK initialization and shutdown
 */

import { initLaikaTest, shutdown } from './init';

// Mock the OpenTelemetry SDK
jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    shutdown: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn(),
}));

jest.mock('@opentelemetry/resources', () => ({
  Resource: jest.fn(),
  resourceFromAttributes: jest.fn(),
}));

jest.mock('@opentelemetry/instrumentation-http', () => ({
  HttpInstrumentation: jest.fn(),
}));

jest.mock('@opentelemetry/instrumentation-openai', () => ({
  OpenAIInstrumentation: jest.fn(),
}));

describe('initLaikaTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await shutdown();
  });

  test('throws error when apiKey is missing', () => {
    expect(() => {
      initLaikaTest({ apiKey: '', serviceName: 'test-service' });
    }).toThrow('[LaikaTest] apiKey is required and must be a non-empty string');
  });

  test('throws error when serviceName is missing', () => {
    expect(() => {
      initLaikaTest({ apiKey: 'test-key', serviceName: '' });
    }).toThrow('[LaikaTest] serviceName is required and must be a non-empty string');
  });

  test('throws error when apiKey is not a string', () => {
    expect(() => {
      initLaikaTest({ apiKey: 123 as any, serviceName: 'test-service' });
    }).toThrow('[LaikaTest] apiKey is required and must be a non-empty string');
  });

  test('throws error when serviceName is not a string', () => {
    expect(() => {
      initLaikaTest({ apiKey: 'test-key', serviceName: null as any });
    }).toThrow('[LaikaTest] serviceName is required and must be a non-empty string');
  });

  test('initializes successfully with valid config', () => {
    expect(() => {
      initLaikaTest({ apiKey: 'test-key', serviceName: 'test-service' });
    }).not.toThrow();
  });

  test('logs warning and skips when already initialized', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    initLaikaTest({ apiKey: 'test-key', serviceName: 'test-service' });
    initLaikaTest({ apiKey: 'test-key2', serviceName: 'test-service2' });

    expect(consoleSpy).toHaveBeenCalledWith('[LaikaTest] Already initialized, skipping');
    consoleSpy.mockRestore();
  });
});

describe('shutdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is safe to call when SDK not initialized', async () => {
    await expect(shutdown()).resolves.not.toThrow();
  });

  test('can be called multiple times without error', async () => {
    initLaikaTest({ apiKey: 'test-key', serviceName: 'test-service' });

    await expect(shutdown()).resolves.not.toThrow();
    await expect(shutdown()).resolves.not.toThrow();
  });

  test('logs success message on shutdown', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    initLaikaTest({ apiKey: 'test-key', serviceName: 'test-service' });
    await shutdown();

    expect(consoleSpy).toHaveBeenCalledWith('[LaikaTest] SDK shut down');
    consoleSpy.mockRestore();
  });
});
