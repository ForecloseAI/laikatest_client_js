import { initLaikaTest, shutdown } from '@laikatest/auto-otel';
import { LaikaTest as LaikaTestClient, Prompt, GetPromptOptions } from '@laikatest/js-client';
import { LaikaConfig } from './types';

/**
 * Unified LaikaTest SDK for tracing and experiments.
 * Provides a single entry point for both observability and A/B testing.
 */
export class LaikaTest {
  private client: LaikaTestClient | null = null;
  private tracingEnabled: boolean = false;

  private constructor() {}

  /**
   * Initialize LaikaTest with unified configuration.
   * Enables both tracing and experiments by default.
   * @throws {Error} If apiKey or serviceName is missing/invalid
   * @throws {Error} If OpenTelemetry SDK fails to start
   */
  static init(config: LaikaConfig): LaikaTest {
    const instance = new LaikaTest();

    // Derive OTLP endpoint from baseUrl if not explicitly set
    const baseUrl = config.baseUrl || 'https://api.laikatest.com';
    const endpoint = config.endpoint || `${baseUrl}/otel/v1/traces`;

    try {
      // Initialize tracing (if enabled, default: true)
      if (config.tracing !== false) {
        initLaikaTest({
          apiKey: config.apiKey,
          serviceName: config.serviceName,
          endpoint: endpoint,
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
        instance.client = new LaikaTestClient(config.apiKey, {
          baseUrl: baseUrl,
          timeout: config.timeout,
          cacheEnabled: config.cacheEnabled,
          cacheTTL: config.cacheTTL,
        });
      }

      return instance;
    } catch (error) {
      // Cleanup any partial initialization
      if (instance.tracingEnabled) {
        shutdown().catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Fetch prompt content by name.
   * Requires experiments to be enabled.
   * @throws {Error} If experiments are not enabled
   * @throws {ValidationError} If prompt name is invalid
   * @throws {AuthenticationError} If API key is invalid
   * @throws {LaikaServiceError} If API returns an error
   * @throws {NetworkError} If network request fails
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
   * @throws {Error} If experiments are not enabled
   * @throws {ValidationError} If experiment title or context is invalid
   * @throws {AuthenticationError} If API key is invalid
   * @throws {LaikaServiceError} If API returns an error
   * @throws {NetworkError} If network request fails
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
    const errors: Error[] = [];

    if (this.tracingEnabled) {
      try {
        await shutdown();
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (this.client) {
      try {
        this.client.destroy();
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      console.error('[LaikaTest] Errors during shutdown:', errors);
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
