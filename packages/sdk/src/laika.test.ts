/**
 * Unit tests for laika.ts - Unified SDK
 */

import { LaikaTest } from './laika';

// Mock auto-otel
jest.mock('@laikatest/auto-otel', () => ({
  initLaikaTest: jest.fn(),
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

import { initLaikaTest, shutdown } from '@laikatest/auto-otel';
import { LaikaTest as LaikaTestClient } from '@laikatest/js-client';

describe('LaikaTest.init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes tracing by default', () => {
    LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
    });

    expect(initLaikaTest).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        serviceName: 'test-service',
      })
    );
  });

  test('initializes experiments client by default', () => {
    LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
    });

    expect(LaikaTestClient).toHaveBeenCalledWith('test-key', expect.any(Object));
  });

  test('does not initialize tracing when tracing: false', () => {
    LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });

    expect(initLaikaTest).not.toHaveBeenCalled();
  });

  test('does not initialize experiments when experiments: false', () => {
    LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    expect(LaikaTestClient).not.toHaveBeenCalled();
  });

  test('isTracingEnabled returns correct state', () => {
    const instanceWithTracing = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });
    expect(instanceWithTracing.isTracingEnabled()).toBe(true);

    const instanceWithoutTracing = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });
    expect(instanceWithoutTracing.isTracingEnabled()).toBe(false);
  });

  test('isExperimentsEnabled returns correct state', () => {
    const instanceWithExperiments = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });
    expect(instanceWithExperiments.isExperimentsEnabled()).toBe(true);

    const instanceWithoutExperiments = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });
    expect(instanceWithoutExperiments.isExperimentsEnabled()).toBe(false);
  });
});

describe('LaikaTest methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPrompt throws when experiments disabled', async () => {
    const instance = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    await expect(instance.getPrompt('test-prompt')).rejects.toThrow(
      'Experiments not enabled. Set experiments: true in config.'
    );
  });

  test('getExperimentPrompt throws when experiments disabled', async () => {
    const instance = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    await expect(instance.getExperimentPrompt('test-experiment')).rejects.toThrow(
      'Experiments not enabled. Set experiments: true in config.'
    );
  });

  test('getPrompt works when experiments enabled', async () => {
    const instance = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });

    await expect(instance.getPrompt('test-prompt')).resolves.toBeDefined();
  });

  test('getExperimentPrompt works when experiments enabled', async () => {
    const instance = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      tracing: false,
    });

    await expect(instance.getExperimentPrompt('test-experiment')).resolves.toBeDefined();
  });
});

describe('LaikaTest.shutdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shutdown works with tracing-only initialization', async () => {
    const instance = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
      experiments: false,
    });

    await expect(instance.shutdown()).resolves.not.toThrow();
    expect(shutdown).toHaveBeenCalled();
  });

  test('shutdown works with experiments-only initialization', async () => {
    const instance = LaikaTest.init({
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

    const instance = LaikaTest.init({
      apiKey: 'test-key',
      serviceName: 'test-service',
    });

    await expect(instance.shutdown()).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[LaikaTest] Errors during shutdown:',
      expect.any(Array)
    );

    consoleSpy.mockRestore();
  });
});
