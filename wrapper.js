var Promise = require('bluebird');
var SuiteRequestError = require('./requestError');

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
    var req = this.protocol.request(this.requestOptions, function(resp) {
      var responseChunks = [];

      resp.on('data', function(chunk) { responseChunks.push(chunk); });

      resp.on('end', function() {
        var data = JSON.parse(responseChunks.join(''));
        if (resp.statusCode >= 400) return reject(new SuiteRequestError('Error in http response', resp.statusCode, data));

        return resolve({
          statusCode: resp.statusCode,
          data: data
        });
      });

    }).on('error', function(e) {
      reject(new SuiteRequestError(e.message, 500));
    });

    if (this.payload) req.write(this.payload);
    req.end();
  }

};



module.exports = RequestWrapper;