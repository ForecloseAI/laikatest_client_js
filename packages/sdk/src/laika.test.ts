/**
 * Unit tests for laika.ts - Unified SDK
 */

import { Laika } from './laika';

// Mock auto-otel
jest.mock('@laikatest/auto-otel', () => ({
  initLaika: jest.fn(),
  shutdown: jest.fn().mockResolvedValue(undefined),
}));

// Mock js-client
jest.mock('@laikatest/js-client', () => ({
  LaikaTest: jest.fn().mockImplementation(() => ({
    getPrompt: jest.fn().mockResolvedValue({ content: 'test' }),
    getExperimentPrompt: jest.fn().mockResolvedValue({ content: 'test' }),
    destroy: jest.fn(),
  })),
}));

import { initLaika, shutdown } from '@laikatest/auto-otel';
import { LaikaTest } from '@laikatest/js-client';

describe('Laika.init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes tracing by default', () => {
    Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
    });

    expect(initLaika).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        serviceName: 'test-service',
      })
    );
  });

  test('initializes experiments client by default', () => {
    Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
    });

    expect(LaikaTest).toHaveBeenCalledWith('test-key', expect.any(Object));
  });

  test('does not initialize tracing when tracing: false', () => {
    Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });

    expect(initLaika).not.toHaveBeenCalled();
  });

  test('does not initialize experiments when experiments: false', () => {
    Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    expect(LaikaTest).not.toHaveBeenCalled();
  });

  test('isTracingEnabled returns correct state', () => {
    const instanceWithTracing = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });
    expect(instanceWithTracing.isTracingEnabled()).toBe(true);

    const instanceWithoutTracing = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });
    expect(instanceWithoutTracing.isTracingEnabled()).toBe(false);
  });

  test('isExperimentsEnabled returns correct state', () => {
    const instanceWithExperiments = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });
    expect(instanceWithExperiments.isExperimentsEnabled()).toBe(true);

    const instanceWithoutExperiments = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });
    expect(instanceWithoutExperiments.isExperimentsEnabled()).toBe(false);
  });
});

describe('Laika methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPrompt throws when experiments disabled', async () => {
    const instance = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    await expect(instance.getPrompt('test-prompt')).rejects.toThrow(
      'Experiments not enabled. Set experiments: true in config.'
    );
  });

  test('getExperimentPrompt throws when experiments disabled', async () => {
    const instance = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    await expect(instance.getExperimentPrompt('test-experiment')).rejects.toThrow(
      'Experiments not enabled. Set experiments: true in config.'
    );
  });

  test('getPrompt works when experiments enabled', async () => {
    const instance = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });

    await expect(instance.getPrompt('test-prompt')).resolves.toBeDefined();
  });

  test('getExperimentPrompt works when experiments enabled', async () => {
    const instance = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });

    await expect(instance.getExperimentPrompt('test-experiment')).resolves.toBeDefined();
  });
});

describe('Laika.shutdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shutdown works with tracing-only initialization', async () => {
    const instance = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    await expect(instance.shutdown()).resolves.not.toThrow();
    expect(shutdown).toHaveBeenCalled();
  });

  test('shutdown works with experiments-only initialization', async () => {
    const instance = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });

    await expect(instance.shutdown()).resolves.not.toThrow();
    expect(shutdown).not.toHaveBeenCalled();
  });

  test('shutdown handles partial failures gracefully', async () => {
    (shutdown as jest.Mock).mockRejectedValueOnce(new Error('Shutdown failed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const instance = Laika.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
    });

    await expect(instance.shutdown()).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Laika] Errors during shutdown:',
      expect.any(Array)
    );

    consoleSpy.mockRestore();
  });
});
