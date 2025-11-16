// lib/score_utils.js
const crypto = require('crypto');
const { makeHttpRequest } = require('./http');
const { parseApiResponse } = require('./global_utils');

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
  prompt_version_id,
  scores,
  session_id,
  user_id,
  timeout
) {
  // Note: Validation is done in index.js (LaikaTest.pushScore) before calling this function
  // exp_id, bucket_id, and prompt_version_id come from getExperimentPrompt()
  // and are already validated by the backend

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
    prompt_version_id,
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
    console.error('[Laikatest SDK] Failed to connect to LaikaTest API:', error.message);
    return {
      success: false,
      error: 'Failed to connect to LaikaTest API',
      errorType: 'NetworkError',
      details: error.message
    };
  }

  const parsed = parseApiResponse(response.data);

  if ((response.statusCode === 200 || response.statusCode === 201) && parsed.success) {
    return {
      success: true,
      statusCode: response.statusCode,
      data: parsed.data
    };
  }

  // Handle API errors - return instead of throw
  console.error('[Laikatest SDK] API error:', parsed.error || 'API request failed');
  if (response.statusCode === 401) {
    return {
      success: false,
      error: parsed.error || 'Invalid API key',
      errorType: 'AuthenticationError',
      statusCode: response.statusCode
    };
  }

  return {
    success: false,
    error: parsed.error || 'API request failed',
    errorType: 'LaikaServiceError',
    statusCode: response.statusCode,
    details: parsed
  };
}

module.exports = {
  generateUUID,
  getClientVersion,
  pushScore
};
