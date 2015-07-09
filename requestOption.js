var _ = require('lodash');

var SuiteRequestOption = function(environment, options) {
  this.secure = options.secure !== false;
  this.port = options.port || 443;
  this.host = environment;
  this.rejectUnauthorized = options.rejectUnauthorized !== false;
  this.headers = [['content-type', 'application/json']];
  this.prefix = '';

  if (!options) options = {};
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

  toHash: function() {
    var hash = {
      port: this.port,
      host: this.host,
      headers: this.headers,
      prefix: this.prefix
    };

    if (!this.rejectUnauthorized) hash.rejectUnauthorized = false;

    return hash;
  }

};

SuiteRequestOption.createForInternalApi = function(environment, rejectUnauthorized) {
  return CreateSuiteRequestOption('/api/v2/internal', environment, rejectUnauthorized);
};

SuiteRequestOption.createForServiceApi = function(environment, rejectUnauthorized) {
  return CreateSuiteRequestOption('/api/services', environment, rejectUnauthorized);
};

SuiteRequestOption.create = function(environment, prefix, rejectUnauthorized) {
  return CreateSuiteRequestOption(prefix, environment, rejectUnauthorized);
};

var CreateSuiteRequestOption = function(prefix, environment, rejectUnauthorized) {
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
