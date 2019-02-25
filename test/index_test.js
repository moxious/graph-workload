const gl = require('../src/index');
const expect = require('chai').expect;

describe('Module Public API', function () {
    it('exports main', () => expect(gl.main).to.be.instanceOf(Function));

    ['Workload', 'sessionPool', 'terminationCondition', 'ProbabilityTable',
        'WorkloadStats', 'strategies'].forEach(key => {
            it(`exports ${key}`, () => expect(gl[key]).to.be.ok);
        });
});