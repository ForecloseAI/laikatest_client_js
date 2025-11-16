// lib/prompt.js
// Prompt wrapper with compile utilities

const { injectVariables } = require('./variables');

class Prompt {
  constructor(content, promptVersionId = null, experimentId = null, bucketId = null, client = null, promptId = null) {
    this._content = content;
    this._type = Array.isArray(content) ? 'chat' : 'text';
    this._promptVersionId = promptVersionId;
    this._promptId = promptId;

    //to be used for experiment tracking not to be revealed in getContent
    this._experimentId = experimentId;
    this._bucketId = bucketId;

    // Store client reference for pushScore
    this._client = client;
  }

  getContent() {
    return this._content;
  }
  getType() {
    return this._type;
  }
  getBucketId() {
    return this._bucketId;
  }
  getExperimentId() {
    return this._experimentId;
  }
  getPromptId() {
    return this._promptId;
  }
  getPromptVersionId() {
    return this._promptVersionId;
  }

  compile(variables) {
    return new Prompt(
      injectVariables(this._content, variables),
      this._promptVersionId,
      this._experimentId,
      this._bucketId,
      this._client,
      this._promptId
    );
  }

  // Push score for experimental prompts
  async pushScore(scores, options={}) {
    // Validate that we have the required metadata
    if (!this._experimentId || !this._bucketId || !this._promptVersionId) {
      console.error('[Laikatest SDK] Cannot push score: This prompt is not from an experiment.');
      return {
        success: false,
        error: 'Cannot push score: This prompt is not from an experiment. Use getExperimentPrompt() to get a scorable prompt.',
        errorType: 'ValidationError'
      };
    }

    // Validate that we have a client reference
    if (!this._client) {
      console.error('[Laikatest SDK] Cannot push score: Client reference not available.');
      return {
        success: false,
        error: 'Cannot push score: Client reference not available.',
        errorType: 'ValidationError'
      };
    }

    // Extract options with defaults
    const { session_id = null, user_id = null } = options;

    // Delegate to client.pushScore() with stored metadata
    // Pass prompt_version_id to match backend schema
    return await this._client.pushScore(
      this._experimentId,
      this._bucketId,
      this._promptVersionId,
      scores,
      session_id,
      user_id
    );
  }
}

module.exports = { Prompt };
