// lib/http.js
// HTTP request utilities for LaikaTest SDK

const https = require('https');
const http = require('http');

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
function makeHttpRequest(url, options, timeout) {
  return new Promise((resolve, reject) => {
    const protocol = getProtocol(url);
    const timeoutId = setupTimeout(null, timeout, reject);

    const req = protocol.request(url, options, async (res) => {
      clearTimeout(timeoutId);
      const result = await collectResponseData(res);
      resolve(result);
    });

    // Update timeout reference with actual request
    clearTimeout(timeoutId);
    const actualTimeoutId = setupTimeout(req, timeout, reject);

    req.on('error', (error) => {
      clearTimeout(actualTimeoutId);
      reject(error);
    });

    req.end();
  });
}

module.exports = {
  makeHttpRequest
};
