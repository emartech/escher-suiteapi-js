'use strict';

const MEGA_BYTE = 1000 * 1000;

class SuiteRequestOption {

  static createForInternalApi(environment, rejectUnauthorized) {
    return this.create(environment, '/api/v2/internal', rejectUnauthorized);
  }

  static createForServiceApi(environment, rejectUnauthorized) {
    return this.create(environment, '/api/services', rejectUnauthorized);
  }

  static create(host, prefix, rejectUnauthorized) {
    let options = {};

    if (typeof host === 'object') {
      options = host;
      host = options.environment;
    } else {
      options.rejectUnauthorized = rejectUnauthorized;
    }

    options.prefix = prefix;
    return new SuiteRequestOption(host, options);
  }

  constructor(host, options) {
    this.secure = options.secure !== false;
    this.port = options.port || 443;
    this.host = host;
    this.rejectUnauthorized = options.rejectUnauthorized !== false;
    this.headers = [['content-type', 'application/json'], ['host', host]];
    this.prefix = '';
    this.timeout = 'timeout' in options ? options.timeout : 15000;
    this.allowEmptyResponse = false;
    this.maxContentLength = options.maxContentLength || 10 * MEGA_BYTE;

    if (!options) {
      options = {};
    }

    Object.assign(this, options);
  }

  setToSecure(port, rejectUnauthorized) {
    this.port = port || 443;
    this.secure = true;
    this.rejectUnauthorized = rejectUnauthorized;
  }

  setToUnsecure(port) {
    this.port = port || 80;
    this.secure = false;
  }

  setEnvironment(environment) {
    this.host = environment;
  }

  setPort(port) {
    this.port = port;
  }

  setHeader(headerToSet) {
    this.headers = this.headers
      .filter(this._headersExcept(headerToSet[0]))
      .concat([headerToSet]);
  }

  getHeader(name) {
    const result = this.headers.find((header) => {
      return header[0].toLowerCase() === name.toLowerCase();
    });

    return result ? result[1] : null;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
  }

  getTimeout() {
    return this.timeout;
  }

  toHash() {
    const hash = {
      port: this.port,
      host: this.host,
      headers: this.headers,
      prefix: this.prefix,
      timeout: this.timeout
    };

    if (!this.rejectUnauthorized) {
      hash.rejectUnauthorized = false;
    }

    if (this.allowEmptyResponse) {
      hash.allowEmptyResponse = true;
    }

    return hash;
  }

  _headersExcept(headerKeyToSkip) {
    return function(existingHeader) {
      return existingHeader[0] !== headerKeyToSkip;
    };
  }
}

module.exports = SuiteRequestOption;
