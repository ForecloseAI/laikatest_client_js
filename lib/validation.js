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


module.exports = {
  validateApiKey,
  validatePromptName,
  validateVersionId,
  validateExperimentTitle
};
