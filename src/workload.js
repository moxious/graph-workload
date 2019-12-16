const pool = require('./sessionPool');
const strategies = require('./strategies');
const WorkloadStats = require('./stats');
const neo4j = require('neo4j-driver');
const uuid = require('uuid');
const PromisePool = require('es6-promise-pool');

/**
 * This function produces a promise in a pool.  It basically wraps
 * workload.runStrategy but in a friendly way that can be iterated
 * as controlled by the run strategy's termination condition.
 * @param {*} workload the main workload
 * @returns {Promise} that is a running strategy.
 */
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

/**
 * Controller class that runs a workload.
 */
class Workload {
  /**
   * @param {*} runConfig a run configuration
   */
  constructor(runConfig) {
    this.runConfig = runConfig;
    this.interrupted = false;
    this.started = false;
    this.id = uuid.v4();
  }

  /**
   * Prior to running a workload it must be initialized, to include tasks
   * such as:
   * - Creating a driver to connect to the target database
   * - Setting up resource pools
   * - Doing any pre-creation of data as required by strategy setup()
   * methods.
   * @returns Promise that resolves to an array of strategy setup actions.
   */
  initialize() {
    console.log('Connecting to ', this.runConfig.address);
    this.driver = neo4j.driver(this.runConfig.address,
      neo4j.auth.basic(this.runConfig.username, this.runConfig.password));

    this.sessionPool = pool.getPool(this.driver, this.runConfig);
    this.strategyTable = strategies.builder(this.sessionPool, this.runConfig);
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

  /**
   * Starts the main workload process.
   * @returns {Promise} that resolves to a completed workload.
   */
  start() {
    console.log('Starting main promise pool');
    this.started = true;
    this.interrupted = false;
    return this.promisePool.start();
  }

  /**
   * Shuts down all resources and stops the process.
   * This also closes the driver; the object should not be reused
   * after calling this function.
   */
  shutdown() {
    if (!this.started) {
      throw new Error('Workload not yet started');
    }

    console.log('Shutting down');
    this.started = false;
    this.interrupted = true;

    if (!this.promisePool) {
      throw new Error('Cannot shut down; not yet initialized.');
    }

    return this.sessionPool.drain()
      .then(() => this.sessionPool.clear())
      .catch(err => console.error('Some error draining/clearing pool', err))
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

  /**
   * Run a single randomly chosen strategy from the probability table
   * in the run configuration.
   * @returns {Promise} of the strategy running.
   */
  runStrategy() {
    if (this.interrupted) {
      return Promise.resolve(null);
    }

    const key = this.runConfig.probabilityTable.choose();
    const strat = this.strategyTable[key];

    this.stats.startStrategy(key);
    return strat.run(this.driver);
  };
};

module.exports = Workload;