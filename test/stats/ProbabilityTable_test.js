const expect = require('chai').expect;
const ProbabilityTable = require('../../src/stats/ProbabilityTable');

describe('Stats', function() {
    let pt;
    const SURE_BET = 'Always heads';
    const HEADS = 'heads';
    const TAILS = 'tails';

    const simple = [
        [ 1.0, SURE_BET ],
    ];

    const coinFlip = [
        [ 0.5, HEADS ],
        [ 1.0, TAILS ],
    ];

    it('should be constructable', () => 
        expect(new ProbabilityTable(simple)).to.be.ok);

    describe('Validation', () => {
        it('Requires arrays', () => {
            expect(() => new ProbabilityTable(null)).to.throw(Error);
            expect(() => new ProbabilityTable({heads: 0.5})).to.throw(Error);
        });

        it('requires nested arrays', () => {
            expect(() => new ProbabilityTable([])).to.throw(Error);
            expect(() => new ProbabilityTable([ {foo: 'bar' }])).to.throw(Error);
        });
    });

    it('chooses a sure thing when there is only one option', () => {
        const pt = new ProbabilityTable(simple);
        expect(pt.choose()).to.equal(SURE_BET);
    });

    it('chooses the LAST ITEM when there is no 1.0 probability', () => {
        const pt = new ProbabilityTable([
            [ 0.00000001, 'not gonna happen' ],
            [ 0.00000002, 'last item' ],
        ]);

        expect(pt.choose()).to.equal('last item');
    });

    it('always chooses one or the other in the coin flip scenario', () => {
        const pt = new ProbabilityTable(coinFlip);

        for (let i=0; i<1000; i++) {
            const choice = pt.choose();

            expect(choice).to.be.oneOf([HEADS, TAILS]);
        }
    });
});