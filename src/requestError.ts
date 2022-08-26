import { AxiosResponse } from 'axios';

export class EscherRequestError extends Error {
  code: number;
  originalCode: string | undefined;
  data: any;

  constructor(message: string, code: number, response?: string | AxiosResponse, originalCode?: string) {
    super(message);

    this.code = code;
    this.originalCode = originalCode;
    this.name = 'EscherRequestError';

    if (response) {
      this.data = (response as AxiosResponse).data || response;
    } else {
      this.data = {
        replyText: message
      };
    }
  }
}
