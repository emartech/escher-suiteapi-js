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

  addHeader: function(header) {
    var exists = false;

    this.headers.forEach(function(addedHeader) {
      if (addedHeader[0] === header[0]) {
        addedHeader[1] = header[1];
        exists = true;
      }
    });

    if (!exists) {
      this.headers.push(header);
    }
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
