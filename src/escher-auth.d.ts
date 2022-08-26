declare module 'escher-auth' {
  export type KeyDB = (key: string) => string;

  export type EscherRequest = {
    method: string;
    host: string;
    port: number;
    url: string;
    body?: string | Buffer;
    headers?: string[][]; // [["Date","Fri, 09 Sep 2011 23:36:00 GMT"],["Host","host.foo.com"]
  };

  export type Config = {
    algoPrefix?: string;
    vendorKey?: string;
    hashAlgo?: 'SHA256' | 'SHA512';
    credentialScope?: string;
    accessKeyId?: string;
    apiSecret?: string;
    authHeaderName?: string;
    dateHeaderName?: string;
    clockSkew?: number;
  } & Record<string, unknown>;

  export default class Escher {
    constructor(configToMerge?: Config);
    static create(configToMerge?: Config): Escher;
    public preSignUrl(url: string, expirationInSec: number): string;
    public signRequest(requestOptions: ExtendedRequestOption, body?: string | Buffer, headersToSign?: string[]): EscherRequest;
    public authenticate(request: EscherRequest, keyDb: KeyDB, mandatorySignedHeaders?: string[]): string;
    public validateRequest(request: EscherRequest, body?: string | Buffer): void;
    public validateMandatorySignedHeaders(mandatorySignedHeaders?: string[]): void;
  }
}
