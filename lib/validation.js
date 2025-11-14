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


// Validate experiment title is a non-empty string
function validateExperimentTitle(experimentTitle) {
  if (!experimentTitle || typeof experimentTitle !== 'string' || !experimentTitle.trim()) {
    throw new ValidationError('Experiment title is required and must be a non-empty string');
  }
}

// Validate scores array structure
function validateScores(scores) {
  if (!Array.isArray(scores)) {
    throw new ValidationError('Scores must be an array');
  }

  if (scores.length === 0) {
    throw new ValidationError('Scores array cannot be empty');
  }

  scores.forEach((score, index) => {
    if (!score || typeof score !== 'object' || Array.isArray(score)) {
      throw new ValidationError(`Score at index ${index} must be a plain object`);
    }

    // Validate 'name' field
    if (!score.name || typeof score.name !== 'string' || !score.name.trim()) {
      throw new ValidationError(`Score at index ${index} must have a non-empty 'name' string`);
    }

    // Validate 'type' field
    if (!score.type || !['int', 'bool', 'string'].includes(score.type)) {
      throw new ValidationError(`Score at index ${index} must have type 'int', 'bool', or 'string'`);
    }

    // Validate 'value' field exists
    if (score.value === undefined || score.value === null) {
      throw new ValidationError(`Score at index ${index} must have a 'value' field`);
    }

    // Type-specific validation
    if (score.type === 'int') {
      if (typeof score.value !== 'number' || !Number.isFinite(score.value)) {
        throw new ValidationError(`Score '${score.name}' has type 'int' but value is not a valid number`);
      }
    }

    if (score.type === 'bool') {
      if (typeof score.value !== 'boolean') {
        throw new ValidationError(`Score '${score.name}' has type 'bool' but value is not a boolean`);
      }
    }

    if (score.type === 'string') {
      if (typeof score.value !== 'string') {
        throw new ValidationError(`Score '${score.name}' has type 'string' but value is not a string`);
      }
    }
  });
}

// Validate that at least one of session_id or user_id is provided
function validateSessionOrUserId(session_id, user_id) {
  const hasSessionId = session_id && typeof session_id === 'string' && session_id.trim();
  const hasUserId = user_id && typeof user_id === 'string' && user_id.trim();

  if (!hasSessionId && !hasUserId) {
    throw new ValidationError('At least one of session_id or user_id must be provided and non-empty');
  }
}

module.exports = {
  validateApiKey,
  validatePromptName,
  validateVersionId,
  validateExperimentTitle,
  validateScores,
  validateSessionOrUserId
};
