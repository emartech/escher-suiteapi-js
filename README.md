# Escher Suite API client for JavaScript
[![Dependency Status](https://david-dm.org/emartech/escher-suiteapi-js.svg)](https://david-dm.org/emartech/escher-suiteapi-js)
[![devDependency Status](https://david-dm.org/emartech/escher-suiteapi-js/dev-status.svg)](https://david-dm.org/emartech/escher-suiteapi-js#info=devDependencies)

## Usage

```javascript
const SuiteRequest = require('escher-suiteapi-js');

const options = new SuiteRequest.Options('example.host.com', {
  credentialScope: 'eu/service/ems_request'
});
const suiteRequest = EscherRequest.create('escher.key', 'escher.secret', options);

const heroId = 1;
let response = await suiteRequest.get(`/heroes/${heroId}`);
console.log(response);

let response = await suiteRequest.post('/heroes', {
  name: 'Captain America',
  sex: 'male'
});
console.log(response);
```
