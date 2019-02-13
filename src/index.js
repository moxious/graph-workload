/*
 * Quick stress testing script to apply lots of concurrent writes to the cluster.
 * 
 * Usage:
 * export NEO4J_URI=bolt+routing://localhost
 * export NEO4J_USERNAME=neo4j
 * export NEO4J_PASSWORD=super-secret
 * 
 * npm install
 * 
 * node stress.js
 * 
 * To customize the workload, consult the probabilityTable.
 */
const Promise = require('bluebird');
const yargs = require('yargs');
const pool = require('./sessionPool');
const strategies = require('./strategies');
const runConfiguration = require('./run-configuration');
const PromisePool = require('es6-promise-pool');
const _ = require('lodash');
const WorkloadStats = require('./stats');

const shutdownConnections = (runConfig, pool) => {
  return pool.drain()
    .then(() => pool.clear())
    .catch(err => {
      console.error('Some error draining/clearing pool', err);
    })
    .then(() => runConfig.driver.close());
};

const printStatus = (runConfig, stats) => {
  const pctDone = parseFloat(Math.round(runConfig.iterateUntil.progress() * 100)).toFixed(2);
  const s = stats.getState();
  console.log(`Progress: ${pctDone}% ${s.complete} completed; ${s.running} running ${s.errors} error`);

  if (!runConfig.interrupted) {
    // Schedule myself again.
    setTimeout(() => printStatus(runConfig, stats), runConfig.checkpointFreq);
  }
};

const sigintHandler = () => {
  runConfig.interrupted = true;
  console.log('Caught interrupt. Allowing current batch to finish.');
};

const runStrategy = (runConfig, stats) => {
  if (runConfig.interrupted) { return Promise.resolve(null); }
  const roll = Math.random();

  let strat;
  let key;

  for (let i = 0; i < runConfig.probabilityTable.length; i++) {
    const entry = runConfig.probabilityTable[i];
    if (roll <= entry[0]) {
      key = entry[1];
      break;
    }
  }

  strat = strategyTable[key];
  stats.startStrategy(key);
  return strat.run(runConfig.driver);
};

const promiseProducer = (runConfig, stats) => () => {
  if (runConfig.interrupted) { return null; }

  const v = runConfig.iterateUntil.next();
  if (v.done) {
    // Signal to the pool that we're done.
    return null;
  }
  
  return runStrategy(runConfig, stats)
    .catch(err => {
      stats.errorSeen(err);
      if (runConfig.failFast) {
        // Don't recover.
        throw err;
      }

      return null;
    })
    .then(data => stats.endStrategy(data));
};

const phase = (runConfig, phase, fn) => {
  console.log('Beginning phase', phase);
  runConfig.phase = phase;
  return fn();
};

const main = () => {
  const runConfig = runConfiguration.generateFromArgs(yargs.argv);

  const sessionPool = pool.getPool(runConfig.driver, runConfig.concurrency);
  const strategyTable = strategies.builder(sessionPool);
  const stats = new WorkloadStats(runConfig);
  
  console.log(_.pick(runConfig, [
    'address', 'username', 'concurrency', 'n', 'ms', 'checkpointFreq',
  ]));
  
  let exitCode = 0;
  
  const promisePool = new PromisePool(promiseProducer(runConfig, stats), runConfig.concurrency);
  promisePool.addEventListener('rejected', event => stats.internalError(event));
  
  const startTime = new Date().getTime();

  const setupPromises = phase(runConfig, 'SETUP',
    () => strategies.setup(strategyTable, runConfig));

  return Promise.all(setupPromises)
    .then(() => {      
      process.on('SIGINT', sigintHandler);
      printStatus(runConfig, stats);
    })
    .then(() => phase(runConfig, 'STRATEGIES', () => promisePool.start()))
    .catch(err => {
      console.error(err);
      strategies.showLastQuery(strategyTable);
      exitCode = 1;
    })
    .finally(() => phase(runConfig, 'SHUTDOWN', () => shutdownConnections(runConfig, sessionPool)))
    .then(() => {
      const endTime = new Date().getTime();
      // Because strategies run in parallel, you can not time this
      // by adding their times.  Rather we time the overall execution
      // process.
      let totalElapsed = (endTime - startTime);
      console.log(`BENCHMARK_ELAPSED=${totalElapsed}\n`);
    })
    .then(() => phase(runConfig, 'REPORT', () => strategies.report(strategyTable)))
    .then(() => console.log(stats.getState()))
    .then(() => process.exit(exitCode));
};

main();
