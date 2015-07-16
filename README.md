# Escher Suite Api js

## Usage

    var suiteRequest = new SuiteRequest('example.environment', 'auth.name', 'auth.secret');
    
    suiteRequest.get('/customerId/administrator').then(function(response){
      console.log(response);
    });
    
    suiteRequest.post('/customerId/field', {
      application_type: 'shorttext',
      name: 'test2'
    }).then(function(response) {
      console.log(response);
    });

## ENV options

* `ESCHER_IS_SECURE` when set to 'false', then the protocol is `http` instead of `https`
