const genericPool = require('generic-pool');
let sessionPool = null;

/**
 * A session pool is just what it sounds like.  In bolt, there is overhead associated
 * with sessions (particularly network round trips) that can increase latency.
 * For this reason we aggressively reuse sessions as much as we can without trying to run
 * more than one transaction on a given session.
 * 
 * This pool object lets users lease/release a session.  In general the strategies are the
 * ones who are pulling these sessions.
 */
module.exports = {
    getPool: (driver, options) => {
        if (sessionPool) {
            return sessionPool;
        }

        // How to create/destroy sessions.
        // See the generic-pool module for more details.
        const factory = {
            create: () => {
                const config = {};
                if (options.database) {
                    config.database = options.database;
                }
                const s = driver.session(config);
                return s;
            },
            destroy: session => {
                return session.close();
            },
            validate: session =>
                session.run('RETURN 1;', {})
                    .then(results => true)
                    .catch(err => false),
        };

        const sessionPoolOpts = { min: 1, max: options.concurrency || 10 };
        console.log('Creating session pool with ', sessionPoolOpts);
        sessionPool = genericPool.createPool(factory, sessionPoolOpts);
        sessionPool.on('factoryCreateError', err => console.log('SESSION POOL ERROR', err));
        sessionPool.on('factoryDestroyError', err => console.error('SESSION POOL DESTROY ERROR', err));
        sessionPool.start();

        return sessionPool;
    },
};