const expect = require('chai').expect;
const mocks = require('../mocks');

const NAryTreeStrategy = require('../../src/write-strategy/NAryTreeStrategy');
const FatNodeAppendStrategy = require('../../src/write-strategy/FatNodeAppendStrategy');
const MergeWriteStrategy = require('../../src/write-strategy/MergeWriteStrategy');
const RawWriteStrategy = require('../../src/write-strategy/RawWriteStrategy');
const StarWriteStrategy = require('../../src/write-strategy/StarWriteStrategy');
const IndexHeavyStrategy = require('../../src/write-strategy/IndexHeavyStrategy');
const LuceneWriteStrategy = require('../../src/write-strategy/LuceneWriteStrategy');
const LockTortureStrategy = require('../../src/write-strategy/LockTortureStrategy');
const RandomLinkageStrategy = require('../../src/write-strategy/RandomLinkageStrategy');

describe('Write Strategies', function() {
    const strats = {
        NAryTree: NAryTreeStrategy,
        FatNodeAppend: FatNodeAppendStrategy,
        RawWrite: RawWriteStrategy,
        StarWrite: StarWriteStrategy,
        IndexHeavy: IndexHeavyStrategy,
        LuceneWrite: LuceneWriteStrategy,
        LockTorture: LockTortureStrategy,
        RandomLinkage: RandomLinkageStrategy,
        MergeWrite: MergeWriteStrategy,
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

            it('runs exactly 1 write query', () => {
                return s.run(driver)
                    .then(results => {
                        expect(sp.inUse).to.equal(0);
                        expect(sp.session.reads).to.equal(0);
                        expect(sp.session.writes).to.equal(1);
                    });
            });
        });
    });
});