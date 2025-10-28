// lib/validation.js
// Input validation utilities for LaikaTest SDK

const { ValidationError } = require('./errors');

// Validate API key format
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API key is required and must be a string');
  }
}

// Validate project ID is a valid UUID
function validateProjectId(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    throw new ValidationError('Project ID is required and must be a string');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    throw new ValidationError('Project ID must be a valid UUID');
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

  // Allow alphanumeric, hyphens, underscores (safe characters to prevent injection)
  const safeIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!safeIdRegex.test(versionId)) {
    throw new ValidationError('Version ID contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.');
  }

  if (versionId.length > 128) {
    throw new ValidationError('Version ID is too long. Maximum length is 128 characters.');
  }
}

module.exports = {
  validateApiKey,
  validateProjectId,
  validatePromptName,
  validateVersionId
};
