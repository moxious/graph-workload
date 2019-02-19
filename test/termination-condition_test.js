const expect = require('chai').expect;
const assert = require('chai').assert;
const tc = require('../src/termination-condition');

describe('Termination Conditions', function () {
    it('can make an nRuns termination condition', () => {
        const n = tc.nRuns(3);

        expect(n).to.be.ok;

        // Run 1
        let v = n.next();
        expect(v.done).to.equal(false);

        // Run 2
        v = n.next();
        expect(v.done).to.equal(false);
        console.log(n.progress());
        expect(n.progress()).to.equal(2/3);

        // Run 3
        v = n.next();
        expect(v.done).to.equal(false);

        v = n.next();
        expect(v.done).to.equal(true);
    });

    it('can make a timeoutMilliseconds termination condition', () => {
        const n = tc.timeoutMilliseconds(1000);

        return new Promise((resolve, reject) => {
            const p = n.next();
            expect(p.done).to.equal(false);
            
            setTimeout(() => {
                const p = n.next();
                expect(p.done).to.equal(false);
            }, 200);
            
            setTimeout(() => {
                const p = n.next();
                expect(p.done).to.equal(true);
                resolve(true);
            }, 1005);
        });
    });
});