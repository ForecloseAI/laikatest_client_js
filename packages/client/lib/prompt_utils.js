// lib/prompt_utils.js
// Prompt-related operations for LaikaTest SDK

const { makeHttpRequest } = require('./http');
const { NetworkError,} = require('./errors');
const { parseApiResponse,handleApiError } = require('./global_utils');
// Build API URL for fetching prompt
function buildPromptUrl(baseUrl, promptName, versionId) {
  const encodedName = encodeURIComponent(promptName);

  // Use URLSearchParams for safe query parameter handling
  const params = new URLSearchParams();

  if (versionId) {
    params.append('versionNumber', versionId);
  }
  return `${baseUrl}/api/v1/prompts/by-name/${encodedName}?${params.toString()}`;
}



// Fetch prompt from API
async function fetchPrompt(apiKey, baseUrl, promptName, versionId, timeout) {
  const url = buildPromptUrl(baseUrl, promptName, versionId);

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
    const data = JSON.parse(parsed.data.content);
    return parsed.data.type === 'text' ? data[0].content : data;
  }
  handleApiError(response.statusCode, parsed);
}

module.exports = {
  fetchPrompt
};
