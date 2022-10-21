import sinon from 'sinon';
import chai from 'chai';
import chaiSubset from 'chai-subset';
import chaiSinon from 'sinon-chai';

chai.use(chaiSinon);
chai.use(chaiSubset);

afterEach(function() {
  sinon.restore();
});
