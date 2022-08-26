import Escher from 'escher-auth';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { EscherRequestOption } from './requestOption';
export { EscherRequestOption } from './requestOption';
import { RequestWrapper, ExtendedRequestOption, TransformedResponse } from './wrapper';
export { TransformedResponse } from './wrapper';
import { EscherRequestError } from './requestError';
export { EscherRequestError } from './requestError';
import { createLogger } from '@emartech/json-logger';
const logger = createLogger('suiterequest');

export class EscherRequest {
  static EscherConstants = {
    algoPrefix: 'EMS',
    vendorKey: 'EMS',
    credentialScope: 'eu/suite/ems_request',
    authHeaderName: 'X-Ems-Auth',
    dateHeaderName: 'X-Ems-Date'
  };
  _escher: Escher;
  _options: EscherRequestOption;
  httpAgent?: HttpAgent;
  httpsAgent?: HttpsAgent;

  static create(accessKeyId: string, apiSecret: string, requestOptions: EscherRequestOption) {
    return new EscherRequest(accessKeyId, apiSecret, requestOptions);
  }

  constructor(accessKeyId: string, apiSecret: string, requestOptions: EscherRequestOption) {
    const escherConfig = Object.assign({}, EscherRequest.EscherConstants, {
      accessKeyId: accessKeyId,
      apiSecret: apiSecret,
      credentialScope: requestOptions.credentialScope || EscherRequest.EscherConstants.credentialScope
    });

    this._escher = new Escher(escherConfig);
    this._options = requestOptions;

    if (requestOptions.keepAlive) {
      this.httpAgent = new HttpAgent({ keepAlive: true });
      this.httpsAgent = new HttpsAgent({ keepAlive: true });
    }
  }

  get<T = any>(path: string, data: any): Promise<TransformedResponse<T>> {
    return this._request('GET', path, data);
  }

  patch<T = any>(path: string, data: any): Promise<TransformedResponse<T>> {
    return this._request('PATCH', path, data);
  }

  post<T = any>(path: string, data: any): Promise<TransformedResponse<T>> {
    return this._request('POST', path, data);
  }

  put<T = any>(path: string, data: any): Promise<TransformedResponse<T>> {
    return this._request('PUT', path, data);
  }

  delete<T = any>(path: string): Promise<TransformedResponse<T>> {
    return this._request('DELETE', path);
  }

  setOptions(requestOptions: EscherRequestOption): void {
    this._options = requestOptions;
  }

  getOptions(): EscherRequestOption {
    return this._options;
  }

  _request(method: string, path: string, data?: any) {
    const options = this._getOptionsFor(method, path);
    const payload = data ? this._getPayload(data) : '';
    const signedOptions = this._signRequest(options, payload);

    logger.info('send', this._getLogParameters(options));
    return this._getRequestFor(signedOptions, payload).send();
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
