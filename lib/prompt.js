// lib/prompt.js
// Prompt wrapper with compile utilities

const { injectVariables } = require('./variables');

class Prompt {
  constructor(content) {
    this._content = content;
    this._type = Array.isArray(content) ? 'chat' : 'text';
  }

  get_content() {
    return this._content;
  }
  get_type() {
    return this._type;
  }

  compile(variables) {
    return new Prompt(injectVariables(this._content, variables));
  }

}

module.exports = { Prompt };
