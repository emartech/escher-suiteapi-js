declare module 'escher-auth' {
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
    // eslint-disable-next-line no-unused-vars
    constructor(configToMerge: Config);
    // eslint-disable-next-line no-unused-vars
    static create(configToMerge?: Config): Escher;
    public signRequest(
      // eslint-disable-next-line no-unused-vars,no-undef
      requestOptions: ExtendedRequestOption,
      // eslint-disable-next-line no-unused-vars
      body?: string | Buffer,
      // eslint-disable-next-line no-unused-vars
      headersToSign?: string[]
    ): EscherRequest;
  }
}
