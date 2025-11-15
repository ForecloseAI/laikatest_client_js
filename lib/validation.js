// lib/validation.js
// Input validation utilities for LaikaTest SDK

const { ValidationError } = require('./errors');

// Validate API key format
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API key is required and must be a string');
  }
}


// Validate prompt name is a non-empty string
function validatePromptName(promptName) {
  if (!promptName || typeof promptName !== 'string' || !promptName.trim()) {
    throw new ValidationError('Prompt name is required and must be a non-empty string');
  }
}

// Validate experiment title is a non-empty string
function validateExperimentTitle(experimentTitle) {
  if (!experimentTitle || typeof experimentTitle !== 'string' || !experimentTitle.trim()) {
    throw new ValidationError('Experiment title is required and must be a non-empty string');
  }
}
// Validate version ID is a safe string (if provided)
function validateVersionId(versionId) {
  if (!versionId) {
    return; // versionId is optional
  }

  if (typeof versionId !== 'string') {
    throw new ValidationError('Version ID must be a string');
  }

  if (versionId.length > 128) {
    throw new ValidationError('Version ID is too long. Maximum length is 128 characters.');
  }

  // Allow either digits only (e.g., "10") or "v" followed by digits (e.g., "v10")
  const versionIdRegex = /^(?:v?\d+)$/;
  if (!versionIdRegex.test(versionId)) {
    throw new ValidationError('Version ID must be digits only (e.g., "10") or "v" followed by digits (e.g., "v10").');
  }
  return versionId.replace(/^v/, '');
  }


// Validate experiment ID
function validateExpId(exp_id) {
  if (!exp_id || typeof exp_id !== 'string' || !exp_id.trim()) {
    throw new ValidationError('Experiment ID is required and must be a non-empty string');
  }
}

// Validate bucket ID
function validateBucketId(bucket_id) {
  if (!bucket_id || typeof bucket_id !== 'string' || !bucket_id.trim()) {
    throw new ValidationError('Bucket ID is required and must be a non-empty string');
  }
}

// Validate prompt ID
function validatePromptId(prompt_id) {
  if (!prompt_id || typeof prompt_id !== 'string' || !prompt_id.trim()) {
    throw new ValidationError('Prompt ID is required and must be a non-empty string');
  }
}

// Validate individual score item structure
function validateScoreItem(scoreItem, index) {
  if (!scoreItem || typeof scoreItem !== 'object') {
    throw new ValidationError(`Score item at index ${index} must be an object`);
  }

  // Validate 'name' field
  if (!scoreItem.name || typeof scoreItem.name !== 'string') {
    throw new ValidationError(`Score item at index ${index} must have a 'name' field (string)`);
  }

  // Validate 'type' field
  const validTypes = ['int', 'bool', 'string'];
  if (!validTypes.includes(scoreItem.type)) {
    throw new ValidationError(
      `Score item at index ${index} must have a 'type' field ('int', 'bool', or 'string')`
    );
  }

  // Validate 'value' field matches type
  if (scoreItem.value === undefined || scoreItem.value === null) {
    throw new ValidationError(`Score item at index ${index} must have a 'value' field`);
  }

  // Type-specific validation
  if (scoreItem.type === 'int' && typeof scoreItem.value !== 'number') {
    throw new ValidationError(`Score item at index ${index} has type 'int' but value is not a number`);
  }
  if (scoreItem.type === 'bool' && typeof scoreItem.value !== 'boolean') {
    throw new ValidationError(`Score item at index ${index} has type 'bool' but value is not a boolean`);
  }
  if (scoreItem.type === 'string' && typeof scoreItem.value !== 'string') {
    throw new ValidationError(`Score item at index ${index} has type 'string' but value is not a string`);
  }
}

// Validate scores array
function validateScores(scores) {
  if (!Array.isArray(scores)) {
    throw new ValidationError('Scores must be an array');
  }

  if (scores.length === 0) {
    throw new ValidationError('Scores array must contain at least one score item');
  }

  // Validate each score item
  scores.forEach((scoreItem, index) => {
    validateScoreItem(scoreItem, index);
  });
}

// Validate that at least one of session_id or user_id is provided
function validateSessionOrUserId(session_id, user_id) {
  const hasSessionId = session_id && typeof session_id === 'string' && session_id.trim();
  const hasUserId = user_id && typeof user_id === 'string' && user_id.trim();

  if (!hasSessionId && !hasUserId) {
    throw new ValidationError('At least one of session_id or user_id must be provided');
  }
}

module.exports = {
  validateApiKey,
  validatePromptName,
  validateVersionId,
  validateExperimentTitle,
  validateExpId,
  validateBucketId,
  validatePromptId,
  validateScores,
  validateSessionOrUserId
};
