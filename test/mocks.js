const Promise = require('bluebird');

class MockTx {
    run() {
        return Promise.resolve(true);
    }
}

class MockSession {
    constructor() {
        this.reads = 0;
        this.writes = 0;
        this.runs = 0;
    }

    run(stmt, params) {
        this.runs++;
        return Promise.resolve({});
    }

    writeTransaction(fn) {
        this.writes++;
        return fn(new MockTx());
    }

    readTransaction(fn) {
        this.reads++;
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
        this.session = new MockSession();
    }

    acquire() {
        this.inUse++;
        return Promise.resolve(this.session);
    }

    release(s) {
        if (s !== this.session) {
            throw new Error('Releasing a session which is not what was acquired!');
        }

        this.inUse--;
        return Promise.resolve(true);
    }
}

module.exports = {
    MockSessionPool, MockDriver, MockSession,
};