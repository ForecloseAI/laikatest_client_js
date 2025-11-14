// lib/score_utils.js
// Score submission utilities for LaikaTest SDK

const { makeHttpRequest } = require('./http');
const { parseApiResponse, handleApiError } = require('./global_utils');
const { NetworkError } = require('./errors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Generate a UUID v4 for idempotency and tracing
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Get SDK version from package.json
 * @returns {string} SDK version or 'unknown'
 */
function getClientVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return pkg.version || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Normalize base URL by trimming trailing slashes
 * @param {string} baseUrl
 * @returns {string} Normalized base URL
 */
function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Build the score submission endpoint URL
 * @param {string} baseUrl
 * @returns {string} Full score endpoint URL
 */
function buildScoreUrl(baseUrl) {
  return `${normalizeBaseUrl(baseUrl)}/api/v1/score`;
}

/**
 * Push score to LaikaTest API
 * @param {string} apiKey - API authentication key
 * @param {string} baseUrl - Base API URL
 * @param {string} exp_id - Experiment ID
 * @param {string} bucket_id - Bucket ID
 * @param {string} prompt_id - Prompt version ID (used as prompt_id)
 * @param {Array} scores - Array of score objects [{name, type, value}]
 * @param {string|null} session_id - Session identifier (optional)
 * @param {string|null} user_id - User identifier (optional)
 * @param {Object} metadata - Additional metadata (optional)
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<Object>} Response object with success status and data
 */
async function pushScore(
  apiKey,
  baseUrl,
  exp_id,
  bucket_id,
  prompt_id,
  scores,
  session_id,
  user_id,
  metadata,
  timeout
) {
  // Auto-generate required SDK fields
  const sdk_event_id = generateUUID();
  const request_id = generateUUID();
  const trace_id = request_id; // Use request_id as trace_id
  const client_version = getClientVersion();

  // Build complete request body matching ScoreSubmission schema
  const requestBody = {
    exp_id,
    bucket_id,
    prompt_id,
    scores,
    session_id: session_id || null,
    user_id: user_id || null,
    metadata: metadata || {},
    source: 'sdk', // Always 'sdk' for SDK submissions
    client_version,
    sdk_event_id,
    request_id,
    trace_id
  };

  const url = buildScoreUrl(baseUrl);
  const payload = JSON.stringify(requestBody);

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  };

  const options = {
    method: 'POST',
    headers,
    body: payload
  };

  let response;
  try {
    response = await makeHttpRequest(url, options, timeout);
  } catch (error) {
    throw new NetworkError('Failed to push score to LaikaTest API', error);
  }

  const parsed = parseApiResponse(response.data);

  if (response.statusCode === 200 && parsed.success) {
    return {
      success: true,
      statusCode: response.statusCode,
      data: parsed.data,
      sdk_event_id, // Return for client reference
      request_id    // Return for debugging/logging
    };
  }

  // Handle error responses
  handleApiError(response.statusCode, parsed);
}

module.exports = {
  pushScore,
  generateUUID,
  getClientVersion
};
