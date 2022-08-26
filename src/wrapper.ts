import { SuiteRequestError } from './requestError';
import { RequestOptions } from './requestOption';
import { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders, CancelTokenSource } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import axios from 'axios';
import createLogger from '@emartech/json-logger';
const logger = createLogger('suiterequest');
const debugLogger = createLogger('suiterequest-debug');

export interface ExtendedRequestOption extends RequestOptions {
  method: string;
  url: string;
  path: string;
  httpAgent?: HttpAgent;
  httpsAgent?: HttpsAgent;
}

interface TransformedResponse<T = any> {
  body: T,
  statusCode: number;
  statusMessage: string;
  headers: AxiosResponseHeaders
}

export class RequestWrapper {
  protocol: string;
  payload: any;
  requestOptions: ExtendedRequestOption;

  constructor(requestOptions : ExtendedRequestOption, protocol: string, payload: any = undefined) {
    this.requestOptions = requestOptions;
    this.protocol = protocol;
    this.payload = payload;
    debugLogger.info('request_options', {
      request_options: requestOptions,
      protocol: protocol,
      payload: payload
    });
  }

  send() {
    const timer = logger.timer();

    const method = this.requestOptions.method.toLowerCase();
    const reqOptions = this._getRequestOptions();
    const source = axios.CancelToken.source();

    const axiosOptions: AxiosRequestConfig = {
      method,
      url: reqOptions.url,
      headers: reqOptions.headers,
      data: reqOptions.data,
      timeout: reqOptions.timeout,
      transformResponse: [body => body],
      maxContentLength: this.requestOptions.maxContentLength,
      validateStatus: () => true,
      cancelToken: source.token
    };

    if (this.requestOptions.httpAgent && this.requestOptions.httpsAgent) {
      axiosOptions.httpAgent = this.requestOptions.httpAgent;
      axiosOptions.httpsAgent = this.requestOptions.httpsAgent;
    }

    return axios
      .request(axiosOptions)
      .then(
        response => this._transformResponse(response),
        error => this._handleResponseError(error, source)
      )
      .then((response: any) => {
        timer.info('send', this._getLogParameters());

        return this._handleResponse(response);
      });
  }

  _transformResponse(response: AxiosResponse): TransformedResponse {
    return {
      body: response.data,
      statusCode: response.status,
      statusMessage: response.statusText,
      headers: response.headers
    };
  }

  _handleResponseError(error: AxiosError, source: CancelTokenSource) {
    if (!axios.isCancel(error)) {
      source.cancel();
      logger.info('Canceled request');
    }
    logger.fromError('fatal_error', error, this._getLogParameters());

    const recoverableErrorCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNABORTED'];
    const code = recoverableErrorCodes.includes(error.code || '') ? 503 : 500;

    throw new SuiteRequestError(error.message, code, undefined, error.code);
  }

  _handleResponse(response: TransformedResponse) {
    if (response.statusCode >= 400) {
      logger.error('server_error', this._getLogParameters({
        code: response.statusCode,
        reply_text: response.body.replyText
      }));
      throw new SuiteRequestError(
        'Error in http response (status: ' + response.statusCode + ')',
        response.statusCode,
        this._parseBody(response)
      );
    }

    if (!this.requestOptions.allowEmptyResponse && !response.body) {
      logger.error('server_error empty response data', this._getLogParameters());
      throw new SuiteRequestError('Empty http response', 500, response.statusMessage);
    }

    return {
      body: this._parseBody(response),
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: response.headers
    };
  }

  _isJsonResponse(response: TransformedResponse) {
    return response.headers['content-type'] &&
      response.headers['content-type'].indexOf('application/json') !== -1;
  }

  _getLogParameters(extraParametersToLog = {}) {
    const { method, host, url } = this.requestOptions;
    const requestParametersToLog = { method, host, url };
    return Object.assign({}, requestParametersToLog, extraParametersToLog);
  }

  _getRequestOptions() {
    const headers: Record<string, string> = {};

    if (this.requestOptions.headers) {
      this.requestOptions.headers.forEach(function(header) {
        headers[header[0]] = header[1];
      });
    }

    const reqOptions: AxiosRequestConfig = {
      url: `${this.protocol}//${this.requestOptions.host}:${this.requestOptions.port}${this.requestOptions.path}`,
      headers: headers,
      timeout: this.requestOptions.timeout
    };
    debugLogger.info('wrapper_options', reqOptions);

    if (this.payload) {
      reqOptions.data = this.payload;
    }

    return reqOptions;
  }

  _parseBody(response: TransformedResponse) {
    if (!this._isJsonResponse(response)) {
      return response.body;
    }

    try {
      return JSON.parse(response.body);
    } catch (ex) {
      logger.fromError('fatal_error', ex, this._getLogParameters());
      throw new SuiteRequestError((ex as Error).message, 500);
    }
  }
}
