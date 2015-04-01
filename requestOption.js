var _ = require('lodash');

var SuiteRequestOption = function(environment, options) {
  this.secure = true;
  this.port = 443;
  this.host = environment;
  this.rejectUnauthorized = true;
  this.headers = [ ['content-type', 'application/json'] ];
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
  return new SuiteRequestOption(environment, {
    prefix: '/api/v2/internal',
    rejectUnauthorized: rejectUnauthorized,
    secure: true,
    port: 443
  });
};

SuiteRequestOption.createForServiceApi = function (environment, rejectUnauthorized) {
  return new SuiteRequestOption(environment, {
    prefix: '/api/services',
    rejectUnauthorized: rejectUnauthorized,
    secure: true,
    port: 443
  });
};


module.exports = SuiteRequestOption;
