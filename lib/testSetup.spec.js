'use strict';

const sinon = require('sinon');
const chai = require('chai');
const chaiSubset = require('chai-subset');
const chaiSinon = require('sinon-chai');

before(function() {
  global.expect = chai.expect;

  chai.use(chaiSinon);
  chai.use(chaiSubset);
});

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
});
