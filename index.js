// index.js
// LaikaTest SDK - Main entry point

const { PromptCache } = require('./lib/cache');
const { fetchPrompt } = require('./lib/prompts');
const { validateApiKey, validatePromptName, validateVersionId } = require('./lib/validation');
const {
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError
} = require('./lib/errors');

// Main LaikaTest client class
class LaikaTest {
  // Initialize client with API key 
  constructor(apiKey, options = {}) {
    validateApiKey(apiKey);

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.laikatest.com';
    this.timeout = options.timeout || 10000;

    const cacheTTL = options.cacheTTL !== undefined ? options.cacheTTL : 30 * 60 * 1000;
    this.cacheEnabled = options.cacheEnabled !== false;
    this.cache = this.cacheEnabled ? new PromptCache(cacheTTL) : null;
  }

  // Get prompt content by name with optional version
  async getPrompt(promptName, options = {}) {
    validatePromptName(promptName);

    const versionId = validateVersionId(options.versionId);
    

    const bypassCache = options.bypassCache || false;

    // Check cache first if enabled and not bypassed
    if (this.cacheEnabled && !bypassCache) {
      const cached = this.cache.get(promptName, versionId);
      if (cached) {
        return { content: cached };
      }
    }

    // Fetch from API
    const content = await fetchPrompt(
      this.apiKey,
      this.baseUrl,
      promptName,
      versionId,
      this.timeout
    );

    // Store in cache if enabled
    if (this.cacheEnabled) {
      this.cache.set(promptName, versionId, content);
    }

    return { content };
  }

  // Cleanup resources and cache
  destroy() {
    if (this.cache) {
      this.cache.destroy();
    }
  }
}

// Export main class and error classes
module.exports = {
  LaikaTest,
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError
};
