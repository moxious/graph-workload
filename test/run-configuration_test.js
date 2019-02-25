const expect = require('chai').expect;
const assert = require('chai').assert;
const runConfig = require('../src/run-configuration');
const ProbabilityTable = require('../src/stats/ProbabilityTable');
const _ = require('lodash');

describe('Run Configuration', function() {
    const args = {
        n: 10, p: 'admin', a: 'bolt://localhost', concurrency: 27,
    };

    beforeEach(() => {
        process.env = {};
    });

    it('throws Error when missing n or ms', () => {
        expect(() => runConfig.generateFromArgs({})).to.throw(Error);
    });

    it('throws Error when URI is missing', () => 
        expect(() => runConfig.generateFromArgs({ n: 1 })).to.throw(Error));

    it('throws Error when password is missing', () => 
        expect(() => runConfig.generateFromArgs({ n: 1, a: 'bolt://localhost' })).to.throw(Error));

    it('returns a good config with minimal input', () => {
        const c = runConfig.generateFromArgs(args);
        expect(c.username).to.equal('neo4j');
        expect(c.password).to.equal(args.p);
        expect(c.address).to.equal(args.a);
        expect(c.runType).to.equal('counted');
        expect(c.failFast).to.equal(false);
        expect(c.concurrency).to.equal(args.concurrency);
        expect(c.iterateUntil).to.be.ok;
        expect(c.probabilityTable).to.be.ok;
        expect(c.probabilityTable).to.be.instanceOf(ProbabilityTable);
        expect(c.checkpointFreq).to.be.ok;
    });

    it('supports timed run types', () => {
        const newArgs = _.merge({ ms: 1000 }, _.pick(args, ['p', 'a']));
        const c = runConfig.generateFromArgs(newArgs);
        expect(c.runType).to.equal('timed');
        expect(c.ms).to.equal(newArgs.ms);
    });
});