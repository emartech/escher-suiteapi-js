var Promise = require('bluebird');
var SuiteRequestError = require('./requestError');
var logger = require('logentries-logformat')('suiterequest');


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
    logger.log('send', this._getLogParameters());
    var req = this.protocol.request(this.requestOptions, function(resp) {
      var responseChunks = [];

      resp.on('data', function(chunk) { responseChunks.push(chunk); });

      resp.on('end', function() {
        var data = JSON.parse(responseChunks.join(''));
        if (resp.statusCode >= 400) {
          logger.error('server_error', data.replyText, { code: resp.statusCode });
          return reject(new SuiteRequestError('Error in http response', resp.statusCode, data));
        }

        logger.success('send', this._getLogParameters());
        return resolve({
          statusCode: resp.statusCode,
          data: data
        });
      }.bind(this));

    }.bind(this));

    req.on('error', function(e) {
      logger.error('fatal_error', e.message);
      reject(new SuiteRequestError(e.message, 500));
    });

    if (this.payload) req.write(this.payload);
    req.end();
  },


  _getLogParameters: function() {
    return {
      host: this.requestOptions.host,
      url: this.requestOptions.url
    };
  }


};



module.exports = RequestWrapper;