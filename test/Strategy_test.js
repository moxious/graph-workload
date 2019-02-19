const expect = require('chai').expect;
const assert = require('chai').assert;
const Strategy = require('../src/Strategy');
const Promise = require('bluebird');
const mocks = require('./mocks');

describe('Strategy', () => {
    let s;
    const props = { x: 1, y: 2, sessionPool: new mocks.MockSessionPool() };
    const name = 'FooStrategy';

    beforeEach(() => {
        s = new Strategy(props);
        s.name = name;
    })

    it('can be constructed, and stores props', () => {
        expect(s.props).to.deep.equal(props);
    });

    it('knows its name', () => expect(s.getName()).to.equal(name));

    it('should be able to roll a random number', () => {
        for(let i=0; i<100; i++) {
            const z = s.randInt(100);
            expect(z).to.be.greaterThan(-1);
            expect(z).to.be.lessThan(100);
        }
    });

    it('should support timings', () => {
        expect(s.getTimings()).to.be.instanceOf(Array);
    });

    it('should count runs', () => {
        expect(s.countRuns()).to.equal(0);
    });

    it('can be turned into CSV', () => {
        const csv = s.csv();
        expect(csv).to.be.a.string;
        expect(csv.split(',')[0]).to.equal(name);
    });

    it('has a summarize method', () => {
        s.summarize();
    });

    it('tracks total time spent', () => {
        expect(s.totalTimeSpent()).to.equal(0);
    });

    it('can time a function', done => {
        const promiseFn = () =>
            new Promise((resolve, reject) => {
                setTimeout(() => resolve(true), 1000);
            });
        const timingPromise = s.time(promiseFn, {});

        expect(timingPromise).to.be.instanceOf(Promise);
        timingPromise.then(() => {
            expect(s.countRuns()).to.equal(1);
            expect(s.getTimings().length).to.equal(1);
            expect(s.totalTimeSpent()).to.be.greaterThan(0);
            done();
        }).catch(err => done(err));
    });
});