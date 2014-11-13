var Escher = require('escher-auth');
var http = require('http');
var https = require('https');
var _ = require('lodash');
var Options = require('./requestOption');
var Wrapper = require('./wrapper');
var SuiteRequestError = require('./requestError');


var SuiteRequest = function(accessKeyId, apiSecret, requestOptions) {
  var escherConfig = _.extend(_.cloneDeep(SuiteRequest.EscherConstants), {
    accessKeyId: accessKeyId,
    apiSecret: apiSecret
  });

  this._escher = new Escher(escherConfig);
  this._options = requestOptions;
};

SuiteRequest.prototype = {

  get: function(path) {
    var options = this._getOptionsFor('GET', path);
    var signedOptions = this._signRequest(options, '');

    return this._getRequestFor(signedOptions).send();
  },

  post: function(path, data) {
    var options = this._getOptionsFor('POST', path);
    var payload = JSON.stringify(data);
    var signedOptions = this._signRequest(options, payload);

    return this._getRequestFor(signedOptions, payload).send();
  },

  setOptions: function(requestOptions) {
    this._options = requestOptions;
  },

  getOptions: function() {
    return this._options;
  },

  _getRequestFor: function(requestOptions, payload) {
    var protocol = (this._options.secure) ? https : http;
    return new Wrapper(requestOptions, protocol, payload);
  },

  _getOptionsFor: function(type, path) {
    var defaultsOptions = _.cloneDeep(this._options.toHash());
    var realPath = '/api/v2/internal' + path;

    return _.merge(defaultsOptions, {
      method: type,
      url: realPath,
      path: realPath
    });
  },

  _signRequest: function(options, payload) {
    return this._escher.signRequest(options, payload);
  }

};

SuiteRequest.EscherConstants = {
  algoPrefix: 'EMS',
  vendorKey: 'EMS',
  credentialScope:'eu/suite/ems_request',
  authHeaderName: 'X-Ems-Auth',
  dateHeaderName: 'X-Ems-Date'
};

module.exports = SuiteRequest;
module.exports.Options = Options;
module.exports.Error = SuiteRequestError;
