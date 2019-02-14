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
const yargs = require('yargs');
const strategies = require('./strategies');
const runConfiguration = require('./run-configuration');
const _ = require('lodash');
const Workload = require('./workload');

const sigintHandler = workload => {
  workload.interrupted = true;
  console.log('Caught interrupt. Allowing current batch to finish.');
};

const main = () => {
  const runConfig = runConfiguration.generateFromArgs(yargs.argv);
  const workload = new Workload(runConfig);

  console.log(_.pick(workload.runConfig, [
    'address', 'username', 'concurrency', 'n', 'ms', 'checkpointFreq',
  ]));
  
  let exitCode = 0;
  
  const startTime = new Date().getTime();

  return workload.initialize()
    .then(() => {      
      process.on('SIGINT', () => sigintHandler(workload));
      return workload.printStatus();
    })
    .then(() => workload.start())
    .catch(err => console.log(err))
    .finally(() => workload.shutdown())
    .then(() => {
      const endTime = new Date().getTime();
      // Because strategies run in parallel, you can not time this
      // by adding their times.  Rather we time the overall execution
      // process.
      let totalElapsed = (endTime - startTime);
      console.log(`BENCHMARK_ELAPSED=${totalElapsed}\n`);
    })
    .then(() => strategies.report(workload.strategyTable))
    .then(() => console.log(workload.stats.getState()))
    .then(() => process.exit(exitCode));
};

main();
