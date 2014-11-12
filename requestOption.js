var _ = require('lodash');

var SuiteRequestOption = function(environment, options) {
  this.secure = true;
  this.port = 443;
  this.host = environment;
  this.rejectUnauthorized = true;
  this.headers = [ ['content-type', 'application/json'] ];

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
      headers: this.headers
    };

    if (!this.rejectUnauthorized) hash.rejectUnauthorized = false;

    return hash;
  }

};

SuiteRequestOption.getSecureFor = function(environment, rejectUnauthorized) {
  return new SuiteRequestOption(environment, {
    rejectUnauthorized: rejectUnauthorized,
    port: 443
  });
};

SuiteRequestOption.getUnsecureFor = function(environment) {
  return new SuiteRequestOption(environment, {
    secure: false,
    port: 80
  });
};


module.exports = SuiteRequestOption;
