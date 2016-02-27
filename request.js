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
    var options = this._getOptionsFor('GET', path);
    var signedOptions = this._signRequest(options, '');

    logger.log('send', this._getLogParameters(options));
    return this._getRequestFor(signedOptions).send();
  },


  post: function(path, data) {
    var options = this._getOptionsFor('POST', path);
    var payload = this._getPayload(data);
    var signedOptions = this._signRequest(options, payload);

    logger.log('send', this._getLogParameters(options));
    return this._getRequestFor(signedOptions, payload).send();
  },


  put: function(path, data) {
    var options = this._getOptionsFor('PUT', path);
    var payload = this._getPayload(data);
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
    if (this._options.getHeader('content-type') !== 'application/json') {
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
