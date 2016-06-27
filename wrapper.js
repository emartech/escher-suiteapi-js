'use strict';

var Promise = require('bluebird');
var SuiteRequestError = require('./requestError');
var logger = require('logentries-logformat')('suiterequest');
var debugLogger = require('logentries-logformat')('suiterequest-debug');
var _ = require('lodash');
var request = require('request');
var Timer = require('timer-machine');

var DEFAULT_TIMEOUT = 15000;


var RequestWrapper = function(requestOptions, protocol, payload) {
  this.requestOptions = requestOptions;
  this.protocol = protocol;
  this.payload = payload;
  debugLogger.log('request_options', requestOptions);
  debugLogger.log('protocol', protocol);
  debugLogger.log('payload', payload);
};

RequestWrapper.prototype = {

  send: function() {
    return new Promise(function(resolve, reject) {
      this._sendRequest(resolve, reject);
    }.bind(this));
  },


  _sendRequest: function(resolve, reject) {
    var headers = {};
    var timer = new Timer();
    timer.start();
    this.requestOptions.headers.forEach(function(header) {
      headers[header[0]] = header[1];
    });

    var method = this.requestOptions.method.toLowerCase();

    var reqOptions = {
      uri: {
        hostname: this.requestOptions.host,
        port: this.requestOptions.port,
        protocol: this.protocol,
        pathname: this.requestOptions.path
      },
      headers: headers,
      timeout: this.requestOptions.timeout || DEFAULT_TIMEOUT
    };
    debugLogger.log('wrapper_options', reqOptions);

    if (this.payload) {
      reqOptions.body = this.payload;
    }

    request[method](reqOptions, function(err, response) {
      if (err) {
        logger.error('fatal_error', err.message);
        return reject(new SuiteRequestError(err.message, 500));
      }

      if (!response.body) {
        logger.error('server_error', 'empty response data');
        return reject(new SuiteRequestError('Empty http response', 500));
      }

      if (response.headers['content-type'] === 'application/json') {
        try {
          response.body = JSON.parse(response.body);
        } catch (ex) {
          logger.error('fatal_error', ex);
          return reject(new SuiteRequestError(ex.message, 500));
        }
      }

      if (response.statusCode >= 400) {
        logger.error('server_error', response.body.replyText, {
          code: response.statusCode
        });
        return reject(new SuiteRequestError(
          'Error in http response (status: ' + response.statusCode + ')',
          response.statusCode,
          response.body
        ));
      }

      timer.stop();
      logger.success('send', this._getLogParameters({ time: timer.time() }));

      return resolve(response);
    }.bind(this));

  },


  _getLogParameters: function(extraParametersToLog) {
    var requestParametersToLog = _.pick(this.requestOptions, ['method', 'host', 'url']);
    return _.extend({}, requestParametersToLog, extraParametersToLog);
  }

};



module.exports = RequestWrapper;
