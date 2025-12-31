// lib/errors.js
// Custom error classes for LaikaTest SDK

// API or service-related errors (4xx, 5xx responses)
class LaikaServiceError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'LaikaServiceError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

// Network connectivity or timeout errors
class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

// Input validation errors
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Authentication-related errors
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

module.exports = {
  LaikaServiceError,
  NetworkError,
  ValidationError,
  AuthenticationError
};
