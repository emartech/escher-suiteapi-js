var Escher = require('escher-auth');
var http = require('http');
var https = require('https');
var _ = require('lodash');
var Promise = require("bluebird");
var Options = require('./requestOption');

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

    return this._getRequestFor(signedOptions);
  },

  post: function(path, data) {
    var options = this._getOptionsFor('POST', path);
    var payload = JSON.stringify(data);
    var signedOptions = this._signRequest(options, payload);

    return this._getRequestFor(signedOptions, payload);
  },

  setOptions: function(requestOptions) {
    this._options = requestOptions;
  },

  getOptions: function() {
    return this._options;
  },

  _getRequestFor: function(requestOptions, payload) {
    return new Promise(function(resolve, reject) {
      var protocol = (this._options.secure) ? https : http;
      var req = protocol.request(requestOptions, function(resp) {

        var fullResponseBody = '';

        resp.on('data', function(chunk) {
          fullResponseBody += chunk;
        });

        resp.on('end', function() {
          resolve(fullResponseBody);
        });

      }).on("error", reject);

      if (payload) req.write(payload);
      req.end();
    }.bind(this));
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