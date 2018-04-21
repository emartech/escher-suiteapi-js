'use strict';

const Escher = require('escher-auth');
const Options = require('./requestOption');
const Wrapper = require('./wrapper');
const SuiteRequestError = require('./requestError');
const logger = require('@emartech/json-logger')('suiterequest');

class SuiteRequest {

  static create(accessKeyId, apiSecret, requestOptions) {
    return new SuiteRequest(accessKeyId, apiSecret, requestOptions);
  }

  constructor(accessKeyId, apiSecret, requestOptions) {
    const escherConfig = Object.assign({}, SuiteRequest.EscherConstants, {
      accessKeyId: accessKeyId,
      apiSecret: apiSecret,
      credentialScope: requestOptions.credentialScope || SuiteRequest.EscherConstants.credentialScope
    });

    this._escher = new Escher(escherConfig);
    this._options = requestOptions;
  }

  get(path) {
    return this._request('GET', path);
  }

  patch(path, data) {
    return this._request('PATCH', path, data);
  }

  post(path, data) {
    return this._request('POST', path, data);
  }

  put(path, data) {
    return this._request('PUT', path, data);
  }

  delete(path) {
    return this._request('DELETE', path);
  }

  _request(method, path, data) {
    const options = this._getOptionsFor(method, path);
    const payload = data ? this._getPayload(data) : '';
    const signedOptions = this._signRequest(options, payload);

    logger.info('send', this._getLogParameters(options));
    return this._getRequestFor(signedOptions, payload).send();
  }

  setOptions(requestOptions) {
    this._options = requestOptions;
  }

  getOptions() {
    return this._options;
  }

  _getRequestFor(requestOptions, payload) {
    const protocol = (this._options.secure) ? 'https:' : 'http:';
    return new Wrapper(requestOptions, protocol, payload);
  }

  _getOptionsFor(method, path) {
    const defaultOptions = this._options.toHash();
    const realPath = defaultOptions.prefix + path;

    return Object.assign({}, defaultOptions, {
      method: method,
      url: realPath,
      path: realPath
    });
  }

  _signRequest(options, payload) {
    const headerNames = options.headers.map(function(header) {
      return header[0];
    });

    return this._escher.signRequest(options, payload, headerNames);
  }

  _getLogParameters(options) {
    const { method, host, url } = options;
    return { method, host, url };
  }

  _getPayload(data) {
    if (this._options.getHeader('content-type').indexOf('application/json') === -1) {
      return data;
    }

    return JSON.stringify(data);
  }
}

SuiteRequest.EscherConstants = {
  algoPrefix: 'EMS',
  vendorKey: 'EMS',
  credentialScope: 'eu/suite/ems_request',
  authHeaderName: 'X-Ems-Auth',
  dateHeaderName: 'X-Ems-Date'
};

module.exports = SuiteRequest;
module.exports.Options = Options;
module.exports.Error = SuiteRequestError;
