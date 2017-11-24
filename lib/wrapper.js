'use strict';

const SuiteRequestError = require('./requestError');
const logger = require('logentries-logformat')('suiterequest');
const debugLogger = require('logentries-logformat')('suiterequest-debug');
const request = require('request');

class RequestWrapper {

  constructor(requestOptions, protocol, payload) {
    this.requestOptions = requestOptions;
    this.protocol = protocol;
    this.payload = payload;
    debugLogger.log('request_options', requestOptions);
    debugLogger.log('protocol', protocol);
    debugLogger.log('payload', payload);
  }

  send() {
    return new Promise((resolve, reject) => {
      this._sendRequest(resolve, reject);
    });
  }

  _sendRequest(resolve, reject) {
    const startTime = this._getTime();

    const method = this.requestOptions.method.toLowerCase();
    const reqOptions = this._getRequestOptions();

    request[method](reqOptions, (err, response) => {
      try {
        this._handleResponse(err, response);
      } catch (e) {
        return reject(e);
      }

      const endTime = this._getTime();
      logger.success('send', this._getLogParameters({ time: startTime - endTime }));

      return resolve(response);
    });
  }

  _isJsonResponse(response) {
    return response.headers['content-type'] &&
      response.headers['content-type'].indexOf('application/json') !== -1;
  }

  _getLogParameters(extraParametersToLog) {
    const { method, host, url } = this.requestOptions;
    const requestParametersToLog = { method, host, url };
    return Object.assign({}, requestParametersToLog, extraParametersToLog);
  }

  _getTime() {
    return +new Date();
  }

  _getRequestOptions() {
    const headers = {};

    this.requestOptions.headers.forEach(function(header) {
      headers[header[0]] = header[1];
    });

    const reqOptions = {
      uri: {
        hostname: this.requestOptions.host,
        port: this.requestOptions.port,
        protocol: this.protocol,
        pathname: this.requestOptions.path
      },
      headers: headers,
      timeout: this.requestOptions.timeout
    };
    debugLogger.log('wrapper_options', reqOptions);

    if (this.payload) {
      reqOptions.body = this.payload;
    }

    return reqOptions;
  }

  _handleResponse(err, response) {
    if (err) {
      logger.error('fatal_error', err.message, this._getLogParameters());
      throw new SuiteRequestError(err.message, 500);
    }

    if (response.statusCode >= 400) {
      logger.error('server_error', response.body.replyText, this._getLogParameters({
        code: response.statusCode
      }));
      throw new SuiteRequestError(
        'Error in http response (status: ' + response.statusCode + ')',
        response.statusCode,
        this._parseBody(response)
      );
    }

    if (!this.requestOptions.allowEmptyResponse && !response.body) {
      logger.error('server_error', 'empty response data', this._getLogParameters());
      throw new SuiteRequestError('Empty http response', 500, response.statusMessage);
    }

    response.body = this._parseBody(response);
  }

  _parseBody(response) {
    if (!this._isJsonResponse(response)) {
      return response.body;
    }

    try {
      return JSON.parse(response.body);
    } catch (ex) {
      logger.error('fatal_error', ex, this._getLogParameters());
      throw new SuiteRequestError(ex.message, 500);
    }
  }
}

module.exports = RequestWrapper;
