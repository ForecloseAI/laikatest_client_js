// lib/prompt.js
// Prompt wrapper with compile utilities

const { injectVariables } = require('./variables');
const { ValidationError } = require('./errors');

class Prompt {
  constructor(content, promptVersionId = null, experimentId = null, bucketId = null, client = null) {
    this._content = content;
    this._type = Array.isArray(content) ? 'chat' : 'text';

    // Store experiment metadata (for experiment prompts)
    this._metadata = {
      promptVersionId: promptVersionId,
      experimentId: experimentId,
      bucketId: bucketId
    };

    // Store client reference for pushScore
    this._client = client;
  }

  getContent() {
    return this._content;
  }

  getType() {
    return this._type;
  }

  compile(variables) {
    return new Prompt(injectVariables(this._content, variables));
  }

  /**
   * Push score to LaikaTest API for this prompt
   * Only works for prompts obtained via getExperimentPrompt()
   * @param {Array} scores - Array of score objects [{name, type, value}]
   * @param {string|null} session_id - Session identifier (optional)
   * @param {string|null} user_id - User identifier (optional)
   * @param {Object} metadata - Additional metadata (optional)
   * @returns {Promise<Object>} Response object with success status
   */
  async pushScore(scores, session_id = null, user_id = null, metadata = null) {
    // Validate that this prompt has experiment metadata
    if (!this._metadata.experimentId || !this._metadata.bucketId) {
      throw new ValidationError(
        'pushScore() can only be called on prompts obtained via getExperimentPrompt(). ' +
        'Regular prompts from getPrompt() do not support scoring.'
      );
    }

    // Validate that client reference exists
    if (!this._client) {
      throw new ValidationError(
        'Prompt object is missing client reference. Cannot push score. ' +
        'Please ensure the prompt was created via getExperimentPrompt().'
      );
    }

    // Delegate to client.pushScore() with stored metadata
    return await this._client.pushScore(
      this._metadata.experimentId,      // from getExperimentPrompt response
      this._metadata.bucketId,           // from getExperimentPrompt response
      this._metadata.promptVersionId,    // from getExperimentPrompt response (used as prompt_id)
      scores,                            // from user input
      session_id,                        // from user input
      user_id,                           // from user input
      metadata                           // from user input
    );
  }

}

module.exports = { Prompt };
