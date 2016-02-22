'use strict';

var _ = require('lodash');

var SuiteRequestOption = function(environment, options) {
  this.secure = options.secure !== false;
  this.port = options.port || 443;
  this.host = environment;
  this.rejectUnauthorized = options.rejectUnauthorized !== false;
  this.headers = [['content-type', 'application/json'], ['host', environment]];
  this.prefix = '';

  if (!options) {
    options = {};
  }
  _.extend(this, options);
};

SuiteRequestOption.prototype = {

  setToSecure: function(port, rejectUnauthorized) {
    this.port = port || 443;
    this.secure = true;
    this.rejectUnauthorized = rejectUnauthorized;
  },

  setToUnsecure: function(port) {
    this.port = port || 80;
    this.secure = false;
  },

  setEnvironment: function(environment) {
    this.host = environment;
  },

  setPort: function(port) {
    this.port = port;
  },

  setHeader: function(header) {
    var existingHeader = this._findExistingHeader(header[0]);
    if (existingHeader) {
      existingHeader[1] = header[1];
    } else {
      this.headers.push(header);
    }
  },

  _findExistingHeader: function(key) {
    var headers = _.filter(this.headers, function(header) {
      return header[0] === key;
    });

    return (headers ? headers[0] : null);
  },

  toHash: function() {
    var hash = {
      port: this.port,
      host: this.host,
      headers: this.headers,
      prefix: this.prefix
    };

    if (!this.rejectUnauthorized) {
      hash.rejectUnauthorized = false;
    }

    return hash;
  }

};

SuiteRequestOption.createForInternalApi = function(environment, rejectUnauthorized) {
  return createSuiteRequestOption('/api/v2/internal', environment, rejectUnauthorized);
};

SuiteRequestOption.createForServiceApi = function(environment, rejectUnauthorized) {
  return createSuiteRequestOption('/api/services', environment, rejectUnauthorized);
};

SuiteRequestOption.create = function(environment, prefix, rejectUnauthorized) {
  return createSuiteRequestOption(prefix, environment, rejectUnauthorized);
};

var createSuiteRequestOption = function(prefix, environment, rejectUnauthorized) {
  var options = {};

  if (typeof environment === 'object') {
    options = environment;
    environment = options.environment;
  } else {
    options.rejectUnauthorized = rejectUnauthorized;
  }

  options.prefix = prefix;

  return new SuiteRequestOption(environment, options);
};


module.exports = SuiteRequestOption;
