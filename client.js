var Escher = require('escher-auth'),
    http = require('http'),
    _ = require('lodash'),
    Promise = require("bluebird");

var SuiteRequest = function(environment, accessKeyId, apiSecret) {

  var escherConfig = _.extend(_.cloneDeep(SuiteRequest.EscherConstants), {
    accessKeyId: accessKeyId,
    apiSecret: apiSecret
  });

  this._escher = new Escher(escherConfig);
  this._defaultOptions = {
    host: environment,
    port: 80,
    headers: [ ['content-type', 'application/json'] ]
  };
};

SuiteRequest.EscherConstants = {
  algoPrefix: 'EMS',
  vendorKey: 'EMS',
  credentialScope:'eu/suite/ems_request',
  authHeaderName: 'X-Ems-Auth',
  dateHeaderName: 'X-Ems-Date'
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


  _getRequestFor: function(requestOptions, payload) {
    return new Promise(function(resolve, reject) {
      var req = http.request(requestOptions, function(resp) {
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
    });
  },


  _getOptionsFor: function(type, path) {
    var defaultsOptions = _.cloneDeep(this._defaultOptions);
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

module.exports = SuiteRequest;

