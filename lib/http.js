// lib/http.js
// HTTP request utilities for LaikaTest SDK

const https = require('https');
const http = require('http');

// Validate URL uses HTTPS (except localhost for testing)
function validateSecureUrl(url) {
  if (url.startsWith('http://')) {
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    if (!isLocalhost) {
      throw new Error('HTTP protocol is not allowed for security reasons. Please use HTTPS.');
    }
  }
}

// Select protocol handler based on URL
function getProtocol(url) {
  return url.startsWith('https') ? https : http;
}

// Setup request timeout handler
function setupTimeout(req, timeout, reject) {
  return setTimeout(() => {
    req.destroy();
    reject(new Error('Request timeout'));
  }, timeout);
}

// Collect response data from stream
function collectResponseData(res) {
  return new Promise((resolve) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => resolve({ statusCode: res.statusCode, data }));
  });
}

// Make HTTP request with timeout and error handling
function makeHttpRequest(url, options = {}, timeout) {
  return new Promise((resolve, reject) => {
    validateSecureUrl(url);
    const protocol = getProtocol(url);

    const { body, ...requestOptions } = options;

    const req = protocol.request(url, requestOptions, async (res) => {
      clearTimeout(timeoutId);
      const result = await collectResponseData(res);
      resolve(result);
    });

    // Setup timeout after request is created
    const timeoutId = setupTimeout(req, timeout, reject);

    req.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    if (body !== undefined && body !== null) {
      req.write(body);
    }

    req.end();
  });
}

module.exports = {
  makeHttpRequest
};
