const pool = require('./sessionPool');
const strategies = require('./strategies');
const WorkloadStats = require('./stats');
const neo4j = require('neo4j-driver').v1;
const uuid = require('uuid');
const PromisePool = require('es6-promise-pool');

const promiseProducer = workload => () => {
  if (workload.interrupted) { return null; }
  const rc = workload.getRunConfiguration();
  const stats = workload.getStats();

  const v = rc.iterateUntil.next();
  if (v.done) {
    // Signal to the pool that we're done.
    return null;
  }

  return workload.runStrategy()
    .catch(err => {
      console.error('RunStrat error', err);
      stats.errorSeen(err);
      if (rc.failFast) {
        // Don't recover.
        throw err;
      }

      return null;
    })
    .then(data => stats.endStrategy(data));
};

module.exports = class Workload {
  constructor(runConfig) {
    this.runConfig = runConfig;
    this.interrupted = false;
    this.started = false;
    this.id = uuid.v4();
  }

  initialize() {
    console.log('Connecting to ', this.runConfig.address);
    this.driver = neo4j.driver(this.runConfig.address,
      neo4j.auth.basic(this.runConfig.username, this.runConfig.password));

    this.sessionPool = pool.getPool(this.driver, this.runConfig.concurrency);
    this.strategyTable = strategies.builder(this.sessionPool);
    this.stats = new WorkloadStats(this.runConfig);
  
    this.promisePool = new PromisePool(promiseProducer(this), this.runConfig.concurrency);
    this.promisePool.addEventListener('rejected',
      event => this.stats.internalError(event));
    
    const runStrategySetupPromises = Object.keys(this.strategyTable)
      .map(stratName => this.strategyTable[stratName].setup(this.driver));

    return Promise.all(runStrategySetupPromises);
  }

  getRunConfiguration() { return this.runConfig; }
  getStats() { return this.stats; }

  start() {
    console.log('Starting main promise pool');
    this.started = true;
    return this.promisePool.start();
  }

  shutdown() {
    if (!this.started) {
      throw new Error('Workload not yet started');
    }

    console.log('Shutting down');
    this.started = false;
    if (!this.promisePool) {
      throw new Error('Cannot shut down; not yet initialized.');
    }

    return this.sessionPool.drain()
      .then(() => this.sessionPool.clear())
      .catch(err => {
        console.error('Some error draining/clearing pool', err);
      })
      .then(() => this.driver.close());
  }

  printStatus() {
    const pctDone = parseFloat(Math.round(this.runConfig.iterateUntil.progress() * 100)).toFixed(2);
    const s = this.stats.getState();
    console.log(`Progress: ${pctDone}% ${s.complete} completed; ${s.running} running ${s.errors} error`);

    if (!this.interrupted) {
      // Schedule myself again.
      setTimeout(() => this.printStatus(), this.runConfig.checkpointFreq);
    }
  }

  runStrategy() {
    if (this.interrupted) {
      return Promise.resolve(null);
    }

    const roll = Math.random();

    let strat;
    let key;

    for (let i = 0; i < this.runConfig.probabilityTable.length; i++) {
      const entry = this.runConfig.probabilityTable[i];
      if (roll <= entry[0]) {
        key = entry[1];
        break;
      }
    }

    strat = this.strategyTable[key];
    this.stats.startStrategy(key);
    return strat.run(this.driver);
  };
};