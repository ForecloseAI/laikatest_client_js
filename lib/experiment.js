//lib/experiment.js
//Experiment-related utilities for LaikaTest SDK

const { makeHttpRequest } = require('./http');
const {
	LaikaServiceError,
	NetworkError,
	ValidationError
} = require('./errors');
const { parseApiResponse, handleApiError } = require('./global_utils');
// Normalize base URL by trimming trailing slashes
function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/+$/, '');
}

// Build the experiment evaluation endpoint URL
function buildExperimentUrl(baseUrl) {
	return `${normalizeBaseUrl(baseUrl)}/api/v3/experiments/evaluate`;
}

// Ensure provided context is a plain object or default to empty
function normalizeContext(context) {
	if (context === undefined) {
		return {};
	}

	if (context === null || typeof context !== 'object' || Array.isArray(context)) {
		throw new ValidationError('Context must be a plain object');
	}

	return context;
}



// Convert raw prompt payload into usable content
function extractPromptContent(promptPayload) {
	if (!promptPayload || typeof promptPayload.content !== 'string') {
		throw new LaikaServiceError('Malformed experiment response: missing prompt content', 500, promptPayload);
	}

	let parsedContent;
	try {
		parsedContent = JSON.parse(promptPayload.content);
	} catch (error) {
		throw new LaikaServiceError('Malformed experiment response: invalid prompt content format', 500, promptPayload);
	}

	if (promptPayload.type === 'text' && Array.isArray(parsedContent)) {
		const [first] = parsedContent;
		if (first && typeof first.content === 'string') {
			return first.content;
		}
	}

	return parsedContent;
}


// Execute the experiment evaluation API call
async function evaluateExperiment(apiKey, baseUrl, experimentTitle, context, timeout) {
	const url = buildExperimentUrl(baseUrl);
	const normalizedContext = normalizeContext(context);

	const payload = JSON.stringify({
		experimentTitle,
		context: normalizedContext
	});

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
		throw new NetworkError('Failed to connect to LaikaTest API', error);
	}

	const parsed = parseApiResponse(response.data);

	if (response.statusCode === 200 && parsed.success) {
		const { data } = parsed;

		if (!data || !data.prompt || !data.experimentId || !data.bucketId) {
			throw new LaikaServiceError('Malformed experiment response: missing data', response.statusCode, parsed);
		}

		const content = extractPromptContent(data.prompt);

		return {
			groupName: data.groupName,
			promptContent: content,
			promptType: data.prompt.type,
			experimentId: data.experimentId,
			bucketId: data.bucketId,
			promptMetadata: {
				promptId: data.prompt.promptId,
				promptVersionId: data.prompt.promptVersionId
			}
		};
	}

	handleApiError(response.statusCode, parsed);
}

module.exports = {
	evaluateExperiment
};

