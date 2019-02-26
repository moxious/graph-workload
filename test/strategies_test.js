const expect = require('chai').expect;
const assert = require('chai').assert;
const strategies = require('../src/strategies');
const ProbabilityTable = require('../src/stats/ProbabilityTable');
const Strategy = require('../src/Strategy');
const mocks = require('./mocks');

describe('Strategies', function() {
    const pool = new mocks.MockSessionPool();
    let table;
    let mockRunConfig = {
        probabilityTable: new ProbabilityTable([
            [ 1.0, 'custom'],
        ]),
        query: "RETURN 1",
    };

    beforeEach(() => {
        table = strategies.builder(pool);
    });

    it('should build a strategy table', () => {
        expect(table).to.be.ok;

        Object.values(table).forEach(strat => expect(strat).to.be.instanceOf(Strategy));
    });

    it('should build a strategy table with only things in the probability table', () => {
        const tbl = strategies.builder(pool, mockRunConfig);
        expect(Object.keys(tbl).length).to.equal(1);
        expect(tbl['custom']).to.be.instanceOf(Strategy);
    });

    it('can report', () => {
        strategies.report(table);
    });

    it('can show last query', () => {
        strategies.showLastQuery(table);
    });
});