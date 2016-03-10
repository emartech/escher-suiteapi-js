Escher Suite Api js
==================
[![Dependency Status](https://david-dm.org/emartech/escher-suiteapi-js.svg)](https://david-dm.org/emartech/escher-suiteapi-js)
[![devDependency Status](https://david-dm.org/emartech/escher-suiteapi-js/dev-status.svg)](https://david-dm.org/emartech/escher-suiteapi-js#info=devDependencies)

Usage
---------

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

