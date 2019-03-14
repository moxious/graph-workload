const expect = require('chai').expect;
const SimpleQueryStrategy = require('../src/SimpleQueryStrategy');
const Promise = require('bluebird');
const mocks = require('./mocks');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe('Simple Query Strategy', () => {
    let s;
    const props = { 
        mode: 'READ',
        query: 'RETURN 1',
        name: 'PING',
        sessionPool: new mocks.MockSessionPool(),
    };
    const name = 'FooStrategy';

    beforeEach(() => {
        s = new SimpleQueryStrategy(props);
    });

    it('requires a mode of READ or WRITE', () => {
        const badProps = {
            query: 'RETURN 1',
            mode: 'eh'
        };

        expect(() => new SimpleQueryStrategy(badProps)).to.throw(Error);
        badProps.mode = null;
        expect(() => new SimpleQueryStrategy(badProps)).to.throw(Error);
        const goodProps = {
            query: 'RETURN 1',
            mode: 'WRITE'
        };

        expect(() => new SimpleQueryStrategy(goodProps)).to.not.throw(Error);
    });

    it('calls readTransaction on mode READ', () => {
        props.mode = 'READ';
        props.sessionPool = new mocks.MockSessionPool();
        const sq = new SimpleQueryStrategy(props);

        return sq.run()
            .then(() => {
                console.log(props.sessionPool.session);
                expect(props.sessionPool.session.reads).to.equal(1);
                expect(props.sessionPool.session.writes).to.equal(0);
            });
    });

    it('calls writeTransaction on mode WRITE', () => {
        props.mode = 'WRITE';
        props.sessionPool = new mocks.MockSessionPool();
        const sq = new SimpleQueryStrategy(props);

        return sq.run()
            .then(() => {
                console.log(props.sessionPool.session);
                expect(props.sessionPool.session.reads).to.equal(0);
                expect(props.sessionPool.session.writes).to.equal(1);
            });
    });
});