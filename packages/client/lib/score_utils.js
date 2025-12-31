// lib/score_utils.js
const crypto = require('crypto');
const { makeHttpRequest } = require('./http');
const { parseApiResponse, handleApiError } = require('./global_utils');
/**
 * Generate a UUID v4
 * Used for sdkEventId
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Get the SDK version from package.json
 * Used for clientVersion field
 */
function getClientVersion() {
  try {
    const packageJson = require('../package.json');
    return packageJson.version || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Build API URL for pushing score
 */
function buildScoreUrl(baseUrl) {
  return `${baseUrl}/api/v1/scores`;
}

/**
 * Push score to API
 */
async function pushScore(apiKey, baseUrl, expId, bucketId, promptVersionId, scores, options) {
  // Note: Validation is done in index.js (LaikaTest.pushScore) before calling this function
  // expId, bucketId, and promptVersionId come from getExperimentPrompt()
  // and are already validated by the backend

  // Auto-generate SDK fields
  const sdkEventId = generateUUID();
  const clientVersion = getClientVersion();
  const source = 'sdk';

  // Build payload
  const requestBody = {
    expId,
    bucketId,
    promptVersionId,
    scores,
    source,
    clientVersion,
    sdkEventId
  };

  // Add optional fields only if provided
  if (options.sessionId) {
    requestBody.sessionId = options.sessionId;
  }
  if (options.userId) {
    requestBody.userId = options.userId;
  }

  const url = buildScoreUrl(baseUrl);

  const requestOptions = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  };

  const { NetworkError } = require('./errors');

  let response;
  try {
    response = await makeHttpRequest(url, requestOptions, options.timeout);
  } catch (error) {
    throw new NetworkError('Failed to connect to LaikaTest API', error);
  }

  const parsed = parseApiResponse(response.data);

  if ((response.statusCode === 200 || response.statusCode === 201) && parsed.success) {
    return {
      success: true,
      statusCode: response.statusCode,
      data: parsed.data
    };
  }

  handleApiError(response.statusCode, parsed);
}

module.exports = {
  generateUUID,
  getClientVersion,
  pushScore
};
