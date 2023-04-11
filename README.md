# @emartech/escher-request

## Usage

### Javascript

```javascript
const { EscherRequest, EscherRequestOption } = require('@emartech/escher-request');

const options = new EscherRequestOption('example.host.com', {
  credentialScope: 'eu/service/ems_request'
});
const request = EscherRequest.create('escher.key', 'escher.secret', options);

const heroId = 1;
const hero = await request.get(`/heroes/${heroId}`);
console.log(hero);

const heroes = await request.post('/heroes', {
  name: 'Captain America',
  sex: 'male'
});
console.log(heroes);
```

### Typescript

```typescript
import { EscherRequest, EscherRequestOption } from '@emartech/escher-request';

const options = new EscherRequestOption('example.host.com', {
  credentialScope: 'eu/service/ems_request'
});
const request = EscherRequest.create('escher.key', 'escher.secret', options);

const heroId = 1;
const hero = await request.get<{ name: string; }>(`/heroes/${heroId}`);
console.log(hero);

const heroes = await request.post<{ name: string; }[]>('/heroes', {
  name: 'Captain America',
  sex: 'male'
});
console.log(heroes);
```

### Retry

You can specify an optional retry config in the constructor of the EscherRequestOption's second parameter:
```typescript
const options = new EscherRequestOption('example.host.com', {
  credentialScope: 'eu/service/ems_request',
  retryConfig: {
      retries: 5
  }
});
```
The type of the `retryConfig` property is `IAxiosRetryConfig`, you can find the detailed list of available parameters here: https://github.com/softonic/axios-retry#options
