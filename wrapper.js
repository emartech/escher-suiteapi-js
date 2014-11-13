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
    logger.log('send', { host: this.requestOptions.host, url: this.requestOptions.url });
    var req = this.protocol.request(this.requestOptions, function(resp) {
      var responseChunks = [];

      resp.on('data', function(chunk) { responseChunks.push(chunk); });

      resp.on('end', function() {
        var data = JSON.parse(responseChunks.join(''));
        if (resp.statusCode >= 400) {
          logger.error('server error', data.replyText, { code: resp.statusCode });
          return reject(new SuiteRequestError('Error in http response', resp.statusCode, data));
        }

        return resolve({
          statusCode: resp.statusCode,
          data: data
        });
      });

    }).on('error', function(e) {
      logger.error('fatal error', e.message);
      reject(new SuiteRequestError(e.message, 500));
    });

    if (this.payload) req.write(this.payload);
    req.end();
  }

};



module.exports = RequestWrapper;