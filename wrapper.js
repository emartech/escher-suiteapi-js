var Promise = require('bluebird');
var SuiteRequestError = require('./requestError');
var logger = require('logentries-logformat')('suiterequest');
var _ = require('lodash');
var request = require('request');


var TIMEOUT_DELAY = 15000;


var RequestWrapper = function(requestOptions, protocol, payload) {
  this.requestOptions = requestOptions;
  this.protocol = protocol;
  this.payload = payload;
};

RequestWrapper.prototype = {

  send: function() {
    return new Promise(function(resolve, reject) {
      this._sendRequest(resolve, reject);
    }.bind(this));
  },


  _sendRequest: function(resolve, reject) {
    var headers = {};
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
      timeout: TIMEOUT_DELAY
    };

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
        return reject(new SuiteRequestError('Error in http response', 500, {}));
      }

      if (response.statusCode >= 400) {
        logger.error('server_error', response.body.data.replyText, {
          code: response.statusCode
        });
        return reject(new SuiteRequestError('Error in http response', response.statusCode, response.body));
      }

      logger.success('send', this._getLogParameters());

      return resolve(response);
    }.bind(this));

  },


  _getLogParameters: function() {
    return _.pick(this.requestOptions, ['method', 'host', 'url']);
  }

};



module.exports = RequestWrapper;
