// lib/prompt.js
// Prompt wrapper with compile utilities

const { injectVariables } = require('./variables');

class Prompt {
  constructor(content, promptVersionId = null, experimentId = null, bucketId = null) {
    this._content = content;
    this._type = Array.isArray(content) ? 'chat' : 'text';
    this._promptVersionId = promptVersionId;

    //to be used for experiment tracking not to be revealed in getContent
    this._experimentId = experimentId;
    this._bucketId = bucketId;
  }

  getContent() {
    return this._content;
  }
  getType() {
    return this._type;
  }

  compile(variables) {
    return new Prompt(
      injectVariables(this._content, variables),
      this._promptVersionId,
      this._experimentId,
      this._bucketId
    );
  }
}

module.exports = { Prompt };
