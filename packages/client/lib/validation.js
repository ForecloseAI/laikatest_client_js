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
  const validTypes = ['int', 'float', 'bool', 'string'];
  if (!validTypes.includes(scoreItem.type)) {
    throw new ValidationError(`Score item at index ${index} must have a 'type' field ('int', 'float', 'bool', or 'string')`);
  }

  // Validate 'value' field matches type
  if (scoreItem.value === undefined || scoreItem.value === null) {
    throw new ValidationError(`Score item at index ${index} must have a 'value' field`);
  }

  // Type-specific validation
  if (scoreItem.type === 'int') {
    if (typeof scoreItem.value !== 'number') {
      throw new ValidationError(`Score item at index ${index} has type 'int' but value is not a number`);
    }
    if (!Number.isFinite(scoreItem.value)) {
      throw new ValidationError(`Score item at index ${index} has type 'int' but value is not finite (NaN or Infinity)`);
    }
    if (!Number.isInteger(scoreItem.value)) {
      throw new ValidationError(`Score item at index ${index} has type 'int' but value is not an integer`);
    }
  }
  if (scoreItem.type === 'float') {
    if (typeof scoreItem.value !== 'number') {
      throw new ValidationError(`Score item at index ${index} has type 'float' but value is not a number`);
    }
    if (!Number.isFinite(scoreItem.value)) {
      throw new ValidationError(`Score item at index ${index} has type 'float' but value is not finite (NaN or Infinity)`);
    }
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

// Validate that options match one of the allowed patterns:
// 1. { sessionId: string, userId: never } - Only sessionId
// 2. { userId: string, sessionId: never } - Only userId
// 3. { sessionId: string, userId: string } - Both allowed
function validateSessionOrUserId(options) {
  if (!options || typeof options !== 'object') {
    throw new ValidationError('Options must be an object');
  }

  const { sessionId, userId } = options;
  const hasSessionId = sessionId !== undefined && sessionId !== null;
  const hasUserId = userId !== undefined && userId !== null;

  // Must have at least one
  if (!hasSessionId && !hasUserId) {
    throw new ValidationError('Either sessionId or userId is required');
  }

  // Validate sessionId if provided
  if (hasSessionId) {
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      throw new ValidationError('sessionId must be a non-empty string');
    }
  }

  // Validate userId if provided
  if (hasUserId) {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new ValidationError('userId must be a non-empty string');
    }
  }

  // Both IDs are now allowed - no mutual exclusivity check
}

module.exports = {
  validateApiKey,
  validatePromptName,
  validateVersionId,
  validateExperimentTitle,
  validateScores,
  validateSessionOrUserId
};
