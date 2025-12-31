// lib/variables.js
// Variable injection utilities for LaikaTest SDK

const { ValidationError } = require('./errors');

// Inject variables into a string using {{variable}} syntax
function injectVariablesIntoString(text, variables) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const regex = /\{\{([^}]+)\}\}/g;

  return text.replace(regex, (match, variableName) => {
    const trimmedName = variableName.trim();

    if (variables && trimmedName in variables) {
      return String(variables[trimmedName]);
    }

    // Return original placeholder if variable not found
    return match;
  });
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function injectVariablesIntoValue(value, variables) {
  if (typeof value === 'string') {
    return injectVariablesIntoString(value, variables);
  }

  if (Array.isArray(value)) {
    return value.map(item => injectVariablesIntoValue(item, variables));
  }

  if (isPlainObject(value)) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = injectVariablesIntoValue(value[key], variables);
      return acc;
    }, {});
  }

  return value;
}

// Inject variables into chat-type prompts (array of message objects)
function injectVariablesIntoChat(messages, variables) {
  if (!Array.isArray(messages)) {
    return messages;
  }

  return messages.map(message => injectVariablesIntoValue(message, variables));
}

// Main function to inject variables into content (handles both text and chat types)
function injectVariables(content, variables) {
  // If no variables provided, return content as-is
  if (!variables || Object.keys(variables).length === 0) {
    return content;
  }
  // Validate variables is an object
  if (typeof variables !== 'object' || Array.isArray(variables)) {
    throw new ValidationError('Variables must be an object');
  }

  // Handle text-type prompts (string)
  if (typeof content === 'string') {
    return injectVariablesIntoString(content, variables);
  }

  // Handle chat-type prompts (array)
  if (Array.isArray(content)) {
    return injectVariablesIntoValue(content, variables);
  }

  if (isPlainObject(content)) {
    return injectVariablesIntoValue(content, variables);
  }

  return content;
}

module.exports = {
  injectVariables,
  injectVariablesIntoString,
  injectVariablesIntoChat
};
