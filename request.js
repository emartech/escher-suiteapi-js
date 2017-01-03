'use strict';

var Escher = require('escher-auth');
var _ = require('lodash');
var Options = require('./requestOption');
var Wrapper = require('./wrapper');
var SuiteRequestError = require('./requestError');
var logger = require('logentries-logformat')('suiterequest');


var SuiteRequest = function(accessKeyId, apiSecret, requestOptions) {
  var escherConfig = _.extend(_.cloneDeep(SuiteRequest.EscherConstants), {
    accessKeyId: accessKeyId,
    apiSecret: apiSecret,
    credentialScope: requestOptions.credentialScope || SuiteRequest.EscherConstants.credentialScope
  });

  this._escher = new Escher(escherConfig);
  this._options = requestOptions;
};

SuiteRequest.prototype = {

  get: function(path) {
    return this._request('GET', path);
  },


  post: function(path, data) {
    return this._request('POST', path, data);
  },


  put: function(path, data) {
    return this._request('PUT', path, data);
  },


  delete: function(path) {
    return this._request('DELETE', path);
  },


  _request: function(method, path, data) {
    var options = this._getOptionsFor(method, path);
    var payload = data ? this._getPayload(data) : '';
    var signedOptions = this._signRequest(options, payload);

    logger.log('send', this._getLogParameters(options));
    return this._getRequestFor(signedOptions, payload).send();
  },


  setOptions: function(requestOptions) {
    this._options = requestOptions;
  },


  getOptions: function() {
    return this._options;
  },


  _getRequestFor: function(requestOptions, payload) {
    var protocol = (this._options.secure) ? 'https:' : 'http:';
    return new Wrapper(requestOptions, protocol, payload);
  },


  _getOptionsFor: function(type, path) {
    var defaultOptions = _.cloneDeep(this._options.toHash());
    var realPath = defaultOptions.prefix + path;

    return _.merge(defaultOptions, {
      method: type,
      url: realPath,
      path: realPath
    });
  },


  _signRequest: function(options, payload) {
    var headerNames = options.headers.map(function(header) {
      return header[0];
    });

    return this._escher.signRequest(options, payload, headerNames);
  },


  _getLogParameters: function(options) {
    return _.pick(options, ['method', 'host', 'url']);
  },

  _getPayload: function(data) {
    if (this._options.getHeader('content-type').indexOf('application/json') === -1) {
      return data;
    }

    return JSON.stringify(data);
  }
};

SuiteRequest.EscherConstants = {
  algoPrefix: 'EMS',
  vendorKey: 'EMS',
  credentialScope: 'eu/suite/ems_request',
  authHeaderName: 'X-Ems-Auth',
  dateHeaderName: 'X-Ems-Date'
};

SuiteRequest.create = function(accessKeyId, apiSecret, requestOptions) {
  return new SuiteRequest(accessKeyId, apiSecret, requestOptions);
};

module.exports = SuiteRequest;
module.exports.Options = Options;
module.exports.Error = SuiteRequestError;
