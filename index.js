// index.js
// LaikaTest SDK - Main entry point

const { PromptCache } = require('./lib/cache');
const { fetchPrompt } = require('./lib/prompt_utils');
const { validateApiKey, validatePromptName, validateVersionId, validateExperimentTitle, validateScores, validateSessionOrUserId } = require('./lib/validation');
const { Prompt } = require('./lib/prompt');
const { evaluateExperiment } = require('./lib/experiment');
const { pushScore: pushScoreUtil } = require('./lib/score_utils');
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
        return new Prompt(cached);
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

    return new Prompt(content);
  }

  // Get experiment prompt with bucket assignment
  async getExperimentPrompt(experimentTitle, context = {}) {
    validateExperimentTitle(experimentTitle);
    const result = await evaluateExperiment(
      this.apiKey,
      this.baseUrl,
      experimentTitle,
      context,
      this.timeout
    );

    // Create Prompt with experiment metadata and client reference
    return new Prompt(
      result.promptContent,
      result.promptMetadata.promptVersionId,
      result.experimentId,
      result.bucketId,
      this  // Pass client reference for pushScore
    );
  }

  // Push score for an experiment prompt
  async pushScore(exp_id, bucket_id, prompt_id, scores, session_id = null, user_id = null, metadata = null) {
    // Validate inputs
    validateScores(scores);
    validateSessionOrUserId(session_id, user_id);

    // Delegate to score_utils
    return await pushScoreUtil(
      this.apiKey,
      this.baseUrl,
      exp_id,
      bucket_id,
      prompt_id,
      scores,
      session_id,
      user_id,
      metadata,
      this.timeout
    );
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
  Prompt,
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError
};
