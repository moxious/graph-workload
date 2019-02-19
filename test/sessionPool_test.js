const expect = require('chai').expect;
const assert = require('chai').assert;
const sessionPool = require('../src/sessionPool');
const mocks = require('./mocks');

describe('Session Pool', function() {
    const driver = new mocks.MockDriver();
    let pool;

    beforeEach(() => {
        pool = sessionPool.getPool(driver, 10);
        expect(pool).to.be.ok;
    });

    it('can acquire', () => {
        return pool.acquire()
            .then(s => {
                expect(s).to.be.ok;
                expect(s).to.be.instanceOf(mocks.MockSession);
            });
    });

    it('can release', () => {
        return pool.acquire()
            .then(s => pool.release(s));
    });
});