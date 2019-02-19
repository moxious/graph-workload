const expect = require('chai').expect;
const assert = require('chai').assert;
const WorkloadStats = require('../../src/stats/');

describe('Stats', function() {
    let s;

    beforeEach(() => {
        s = new WorkloadStats();
    });

    it('should be constructable', () => expect(s).to.be.ok);

    it('should return a state', () => {
        expect(s.getState()).to.deep.equal({
            complete: 0, running: 0, errors: 0,
        });
    });

    it('should be able to start a strategy', () => {
        s.startStrategy('foo');
        expect(s.running).to.equal(1);
        expect(s.foo).to.equal(1);
    });

    it('should be able to end a strategy', () => {
        s.startStrategy('foo');
        const data = { bar: 1 };
        const results = s.endStrategy(data);
        expect(s.complete).to.equal(1);
        expect(results).to.deep.equal(data);
    });

    it('should allow flagging errors', () => {
        const err = new Error('Bad stuff');
        s.errorSeen(err);
        expect(s.errors).to.equal(1);
    });
});