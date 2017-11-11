'use strict';

class SuiteRequestError extends Error {
  constructor(message, code, response) {
    super(message);

    this.code = code;
    this.name = 'SuiteRequestError';

    if (response) {
      this.data = response.data || response;
    } else {
      this.data = {
        replyText: message
      };
    }
  }
}

module.exports = SuiteRequestError;
