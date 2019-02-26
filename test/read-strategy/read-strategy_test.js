const expect = require('chai').expect;
const mocks = require('../mocks');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const AggregateReadStrategy = require('../../src/read-strategy/AggregateReadStrategy');
const MetadataReadStrategy = require('../../src/read-strategy/MetadataReadStrategy');
const LongPathReadStrategy = require('../../src/read-strategy/LongPathReadStrategy');
const RandomAccessReadStrategy = require('../../src/read-strategy/RandomAccessReadStrategy');

describe('Read Strategies', function() {
    const strats = {
        AggregateRead: AggregateReadStrategy,
        MetadataRead: MetadataReadStrategy,
        LongPathRead: LongPathReadStrategy,
        RandomAccessRead: RandomAccessReadStrategy,
    };

    Object.keys(strats).forEach(stratName => {
        const Strat = strats[stratName];
        describe(`${stratName} Strategy`, () => {
            let s;
            let sp;
            let driver;

            beforeEach(() => {
                sp = new mocks.MockSessionPool();
                s = new Strat({ sessionPool: sp });
                driver = new mocks.MockDriver();
            });

            it('can be created', () => {
                expect(s).to.be.ok;
            });

            it('is appropriately named', () => expect(s.name).to.equal(stratName));

            it('has a setup method', () => expect(s.setup(driver)).to.be.fulfilled);

            it('runs exactly 1 read query, and that run is timed.', () =>
                s.run()
                    .then(results => {
                        expect(sp.inUse).to.equal(0);
                        expect(sp.session.reads).to.equal(1);
                        expect(sp.session.writes).to.equal(0);
                        expect(s.getTimings().length).to.be.greaterThan(0);
                    }));
        });
    });
});