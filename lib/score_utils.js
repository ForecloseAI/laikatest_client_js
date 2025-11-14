// lib/score_utils.js
const crypto = require('crypto');
const { makeHttpRequest } = require('./http');
const { parseApiResponse, handleApiError } = require('./global_utils');
const { NetworkError } = require('./errors');
const {
  validateExpId,
  validateBucketId,
  validatePromptId,
  validateScores,
  validateSessionOrUserId
} = require('./validation');

/**
 * Generate a UUID v4
 * Used for sdk_event_id, request_id, trace_id
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Get the SDK version from package.json
 * Used for client_version field
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
async function pushScore(
  apiKey,
  baseUrl,
  exp_id,
  bucket_id,
  prompt_id,
  scores,
  session_id,
  user_id,
  timeout
) {
  // Validate inputs
  validateExpId(exp_id);
  validateBucketId(bucket_id);
  validatePromptId(prompt_id);
  validateScores(scores);
  validateSessionOrUserId(session_id, user_id);

  // Auto-generate SDK fields
  const sdk_event_id = generateUUID();
  const request_id = generateUUID();
  const trace_id = request_id;
  const client_version = getClientVersion();
  const source = 'sdk';

  // Build payload 
  const requestBody = {
    exp_id,
    bucket_id,
    prompt_id,
    scores,
    source,
    client_version,
    sdk_event_id,
    request_id,
    trace_id
  };

  // Add optional fields only if provided
  if (session_id) {
    requestBody.session_id = session_id;
  }
  if (user_id) {
    requestBody.user_id = user_id;
  }

  const url = buildScoreUrl(baseUrl);

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  };

  let response;
  try {
    response = await makeHttpRequest(url, options, timeout);
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
