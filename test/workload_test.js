const expect = require('chai').expect;
const assert = require('chai').assert;
const Workload = require('../src/workload');
const runConfig = require('../src/run-configuration');
const WorkloadStats = require('../src/stats/index');
const neo4j = require('neo4j-driver').v1;
const sinon = require('sinon');
const mocks = require('./mocks');

sinon.replace(neo4j, 'driver', () => new mocks.MockDriver());

describe('Workload', function() {
    const args = {
        a: 'bolt://localhost', p: 'admin', n: 10, concurrency: 1,
    };
    const rc = runConfig.generateFromArgs(args);

    let w;

    beforeEach(() => {
        w = new Workload(rc);        
    });

    it('should have basics', () => {
        expect(w.id).to.be.ok;
        expect(w.runConfig).to.deep.equal(rc);
        expect(w.interrupted).to.equal(false);
        expect(w.started).to.equal(false);
    });

    it('should get runConfig', () => expect(w.getRunConfiguration()).to.deep.equal(rc));

    it('can be initialized', () => {
        return w.initialize()
            .then(ready => {
                expect(w.getStats()).to.be.instanceOf(WorkloadStats);
                expect(w.promisePool).to.be.ok;
                expect(w.strategyTable).to.be.ok;
                expect(w.sessionPool).to.be.ok;
            });
    });

    it('can be started and run', () => {
        return w.initialize()
            .then(() => w.start())
            .then(results => {
                const stats = w.getStats();
                expect(stats.complete).to.equal(args.n);
                expect(stats.running).to.equal(0);
            });
    });
});