'use strict';

const SuiteRequestError = require('./requestError');
const logger = require('logentries-logformat')('suiterequest');
const debugLogger = require('logentries-logformat')('suiterequest-debug');
const request = require('request-promise-native');

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
    const startTime = this._getTime();

    const method = this.requestOptions.method.toLowerCase();
    const reqOptions = this._getRequestOptions();

    return request[method](reqOptions).then(
      (response) => {
        this._handleResponse(response);

        const endTime = this._getTime();
        logger.success('send', this._getLogParameters({ time: startTime - endTime }));

        return response;
      },
      (error) => {
        this._handleError(error);
      }
    );
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

  _handleError(error) {
    logger.error('fatal_error', error.message, this._getLogParameters());
    throw new SuiteRequestError(error.message, 500);
  }

  _handleResponse(response) {
    if (response.statusCode >= 400) {
      logger.error('server_error', response.body.replyText, this._getLogParameters({
        code: response.statusCode
      }));
      throw new SuiteRequestError(
        'Error in http response (status: ' + response.statusCode + ')',
        response.statusCode,
        response.body
      );
    }

    if (!this.requestOptions.allowEmptyResponse && !response.body) {
      logger.error('server_error', 'empty response data', this._getLogParameters());
      throw new SuiteRequestError('Empty http response', 500, response.statusMessage);
    }

    if (this._isJsonResponse(response)) {
      try {
        response.body = JSON.parse(response.body);
      } catch (ex) {
        logger.error('fatal_error', ex, this._getLogParameters());
        throw new SuiteRequestError(ex.message, 500);
      }
    }
  }
}

module.exports = RequestWrapper;
