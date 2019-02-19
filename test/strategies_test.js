const expect = require('chai').expect;
const assert = require('chai').assert;
const strategies = require('../src/strategies');
const Strategy = require('../src/Strategy');
const mocks = require('./mocks');

describe('Strategies', function() {
    const pool = new mocks.MockSessionPool();
    let table;

    beforeEach(() => {
        table = strategies.builder(pool);
    });

    it('should build a strategy table', () => {
        expect(table).to.be.ok;

        Object.values(table).forEach(strat => expect(strat).to.be.instanceOf(Strategy));
    });

    it('can report', () => {
        strategies.report(table);
    });

    it('can show last query', () => {
        strategies.showLastQuery(table);
    });
});