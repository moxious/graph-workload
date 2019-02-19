const Promise = require('bluebird');

class MockTx {
    run() {
        return Promise.resolve(true);
    }
}

class MockSession {
    run() {
        return Promise.resolve(true);
    }

    run(stmt, params) {
        return Promise.resolve({});
    }

    writeTransaction(fn) {
        return fn(new MockTx());
    }

    readTransaction(fn) {
        return fn(new MockTx());
    }

    close() {
        return Promise.resolve(true);
    }
}

class MockDriver {
    constructor() {
        this.sessions = 0;
        this.open = true;
    }

    session() {
        this.sessions++;
        return new MockSession();
    }

    close() {
        this.open = false;
    }
}

class MockSessionPool {
    constructor() {
        this.inUse = 0;
    }

    acquire() {
        this.inUse++;
        return Promise.resolve(new MockSession());
    }

    release() {
        this.inUse--;
        return Promise.resolve(true);
    }
}

module.exports = {
    MockSessionPool, MockDriver, MockSession,
};