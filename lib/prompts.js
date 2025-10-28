// lib/prompts.js
// Prompt-related operations for LaikaTest SDK

const { makeHttpRequest } = require('./http');
const { LaikaServiceError, NetworkError, AuthenticationError } = require('./errors');

// Build API URL for fetching prompt
function buildPromptUrl(baseUrl, promptName, projectId, versionId) {
  const encodedName = encodeURIComponent(promptName);

  // Use URLSearchParams for safe query parameter handling
  const params = new URLSearchParams();
  params.append('project_id', projectId);

  if (versionId) {
    params.append('version_id', versionId);
  }

  return `${baseUrl}/api/v1/prompts/by-name/${encodedName}?${params.toString()}`;
}

// Parse API response JSON
function parseApiResponse(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }
}

// Handle API error response
function handleApiError(statusCode, parsed) {
  if (statusCode === 401) {
    throw new AuthenticationError(parsed.error || 'Invalid API key');
  }

  throw new LaikaServiceError(
    parsed.error || 'API request failed',
    statusCode,
    parsed
  );
}

// Fetch prompt from API
async function fetchPrompt(apiKey, baseUrl, projectId, promptName, versionId, timeout) {
  const url = buildPromptUrl(baseUrl, promptName, projectId, versionId);

  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  let response;
  try {
    response = await makeHttpRequest(url, options, timeout);
  } catch (error) {
    throw new NetworkError('Failed to connect to LaikaTest API', error);
  }

  const parsed = parseApiResponse(response.data);

  if (response.statusCode === 200 && parsed.success) {
    return parsed.data.content;
  }

  handleApiError(response.statusCode, parsed);
}

module.exports = {
  fetchPrompt
};
