import { initLaika, shutdown } from '@laikatest/auto-otel';
import { LaikaTest, Prompt, GetPromptOptions } from '@laikatest/js-client';
import { LaikaConfig } from './types';

/**
 * Unified LaikaTest SDK for tracing and experiments.
 * Provides a single entry point for both observability and A/B testing.
 */
export class Laika {
  private client: LaikaTest | null = null;
  private tracingEnabled: boolean = false;

  private constructor() {}

  /**
   * Initialize LaikaTest with unified configuration.
   * Enables both tracing and experiments by default.
   */
  static init(config: LaikaConfig): Laika {
    const instance = new Laika();

    // Initialize tracing (if enabled, default: true)
    if (config.tracing !== false) {
      initLaika({
        apiKey: config.apiKey,
        serviceName: config.serviceName,
        endpoint: config.endpoint,
        captureContent: config.captureContent,
        debug: config.debug,
        sessionId: config.sessionId,
        getSessionId: config.getSessionId,
        userId: config.userId,
        getUserId: config.getUserId,
        defaultProperties: config.defaultProperties,
      });
      instance.tracingEnabled = true;
    }

    // Initialize experiments client (if enabled, default: true)
    if (config.experiments !== false) {
      instance.client = new LaikaTest(config.apiKey, {
        baseUrl: config.baseUrl,
        timeout: config.timeout,
        cacheEnabled: config.cacheEnabled,
        cacheTTL: config.cacheTTL,
      });
    }

    return instance;
  }

  /**
   * Fetch prompt content by name.
   * Requires experiments to be enabled.
   */
  async getPrompt<C = unknown>(
    promptName: string,
    options?: GetPromptOptions
  ): Promise<Prompt<C>> {
    this.ensureClient();
    return this.client!.getPrompt<C>(promptName, options);
  }

  /**
   * Get experiment prompt with automatic bucketing.
   * Requires experiments to be enabled.
   */
  async getExperimentPrompt<C = unknown>(
    experimentTitle: string,
    context?: Record<string, unknown>
  ): Promise<Prompt<C>> {
    this.ensureClient();
    return this.client!.getExperimentPrompt<C>(experimentTitle, context);
  }

  /** Returns true if tracing is enabled. */
  isTracingEnabled(): boolean {
    return this.tracingEnabled;
  }

  /** Returns true if experiments client is enabled. */
  isExperimentsEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Shutdown both tracing and client resources.
   * Call this before process exit for clean shutdown.
   */
  async shutdown(): Promise<void> {
    if (this.tracingEnabled) {
      await shutdown();
    }
    if (this.client) {
      this.client.destroy();
    }
  }

  /** Throws if experiments not enabled. */
  private ensureClient(): void {
    if (!this.client) {
      throw new Error(
        'Experiments not enabled. Set experiments: true in config.'
      );
    }
  }
}
