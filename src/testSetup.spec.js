const sinon = require('sinon');
const chai = require('chai');
const chaiSubset = require('chai-subset');
const chaiSinon = require('sinon-chai');

before(function() {
  chai.use(chaiSinon);
  chai.use(chaiSubset);
});

afterEach(function() {
  sinon.restore();
});
