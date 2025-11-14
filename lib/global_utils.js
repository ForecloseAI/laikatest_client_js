const { LaikaServiceError, AuthenticationError } = require('./errors');
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
module.exports = {
  parseApiResponse,
  handleApiError
};