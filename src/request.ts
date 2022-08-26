import Escher from 'escher-auth';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { SuiteRequestOption } from './requestOption';
import { RequestWrapper, ExtendedRequestOption } from './wrapper';
import { SuiteRequestError } from './requestError';
import createLogger from '@emartech/json-logger';
const logger = createLogger('suiterequest');

export class SuiteRequest {
  static Options = SuiteRequestOption;
  static Error = SuiteRequestError;
  static EscherConstants = {
    algoPrefix: 'EMS',
    vendorKey: 'EMS',
    credentialScope: 'eu/suite/ems_request',
    authHeaderName: 'X-Ems-Auth',
    dateHeaderName: 'X-Ems-Date'
  };
  _escher: Escher;
  _options: SuiteRequestOption;
  httpAgent?: HttpAgent;
  httpsAgent?: HttpsAgent;

  static create(accessKeyId: string, apiSecret: string, requestOptions: SuiteRequestOption) {
    return new SuiteRequest(accessKeyId, apiSecret, requestOptions);
  }

  constructor(accessKeyId: string, apiSecret: string, requestOptions: SuiteRequestOption) {
    const escherConfig = Object.assign({}, SuiteRequest.EscherConstants, {
      accessKeyId: accessKeyId,
      apiSecret: apiSecret,
      credentialScope: requestOptions.credentialScope || SuiteRequest.EscherConstants.credentialScope
    });

    this._escher = new Escher(escherConfig);
    this._options = requestOptions;

    if (requestOptions.keepAlive) {
      this.httpAgent = new HttpAgent({ keepAlive: true });
      this.httpsAgent = new HttpsAgent({ keepAlive: true });
    }
  }

  get(path: string, data: any) {
    return this._request('GET', path, data);
  }

  patch(path: string, data: any) {
    return this._request('PATCH', path, data);
  }

  post(path: string, data: any) {
    return this._request('POST', path, data);
  }

  put(path: string, data: any) {
    return this._request('PUT', path, data);
  }

  delete(path: string) {
    return this._request('DELETE', path);
  }

  _request(method: string, path: string, data?: any) {
    const options = this._getOptionsFor(method, path);
    const payload = data ? this._getPayload(data) : '';
    const signedOptions = this._signRequest(options, payload);

    logger.info('send', this._getLogParameters(options));
    return this._getRequestFor(signedOptions, payload).send();
  }

  setOptions(requestOptions: SuiteRequestOption) {
    this._options = requestOptions;
  }

  getOptions() {
    return this._options;
  }

  _getRequestFor(requestOptions: ExtendedRequestOption, payload: any) {
    const protocol = (this._options.secure) ? 'https:' : 'http:';
    return new RequestWrapper(requestOptions, protocol, payload);
  }

  _getOptionsFor(method: string, path: string): ExtendedRequestOption {
    const defaultOptions = this._options.toHash();
    const realPath = defaultOptions.prefix + path;

    return Object.assign({}, defaultOptions, {
      method: method,
      url: realPath,
      path: realPath,
      httpAgent: this.httpAgent,
      httpsAgent: this.httpsAgent
    });
  }

  _signRequest(options: ExtendedRequestOption, payload: any) {
    const headerNames = options.headers ? options.headers.map(function(header) {
      return header[0];
    }) : [];

    return (this._escher.signRequest(options, payload, headerNames) as ExtendedRequestOption);
  }

  _getLogParameters(options: ExtendedRequestOption) {
    const { method, host, url } = options;
    return { method, host, url };
  }

  _getPayload(data: any) {
    if (this._options?.getHeader('content-type')?.indexOf('application/json') === -1) {
      return data;
    }

    return JSON.stringify(data);
  }
}

module.exports = SuiteRequest;
export default SuiteRequest;
