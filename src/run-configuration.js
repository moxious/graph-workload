const terminateAfter = require('./termination-condition');
const ProbabilityTable = require('./stats/ProbabilityTable');
const _ = require('lodash');

const usageStr = `
Usage: run-workload.js -p password
   [-a address]
   [-u username]
   [-n hits] how many total queries to run
   [--ms milliseconds] how many milliseconds to test for
   [--workload /path/to/workload.json] probability table spec
   [--concurrency c] how many concurrent queries to run (default: 10)
   [--checkpoint cn] how often to print results in milliseconds (default: 5000)
   [--fail-fast] if specified, the work will stop after encountering one failure.

You may only specify one of the options --n or --ms.
`;

const defaultProbabilityTable = [
    [0.1, 'fatnodeWrite'],
    [0.2, 'naryWrite'],
    [0.3, 'mergeWrite'],
    [0.4, 'randomLinkage'],
    [0.45, 'starWrite'],
    [0.55, 'indexHeavy'],
    [0.60, 'aggregateRead'],
    [0.695, 'randomAccess'],
    [0.70, 'longPathRead'],
    [1, 'rawWrite'],
];

/**
 * @param {*} args a yargs object
 * @returns { iterateUntil, runType } of when to stop.
 */
const chooseTerminationType = (args) => {
    let iterateUntil;
    let runType;

    if (args.n) {
        iterateUntil = terminateAfter.nRuns(args.n);
        runType = 'counted';
    } else if (args.ms) {
        iterateUntil = terminateAfter.timeoutMilliseconds(args.ms);
        runType = 'timed';
    } else {
        console.log('no n in ', args);
        iterateUntil = terminateAfter.nRuns(10000);
        runType = 'counted';
    }

    return { iterateUntil, runType };
};

/**
 * @param {*} args a yargs object
 * @returns { username, password, address } of where to connect
 */
const chooseConnectionDetails = (args) => {
    const addressify = str => 
        str.indexOf('://') === -1 ? `bolt://${str}` : str;

    return {
        username: args.u || process.env.NEO4J_USER || 'neo4j',
        password: args.p || process.env.NEO4J_PASSWORD,
        address: addressify(args.a || process.env.NEO4J_URI),
    };
};

const chooseWorkload = (args) => {

}

const chooseConcurrency = (args) => {
    const p = Number(args.concurrency) || Number(process.env.CONCURRENCY);
    return {
        concurrency: (!Number.isNaN(p) && p > 0) ? p : 10,
    };
};

const chooseProbabilityTable = (args) => {
    const ptData = args.workload ? require(args.workload) : defaultProbabilityTable;
    
    return {
        probabilityTable: new ProbabilityTable(ptData)
    };
};

const generateFromArgs = (args) => {
    const badlyConfigured = (
        // User is being inconsistent about when to stop.
        (args.n && args.ms) ||
        // We don't know where to connect...
        (!process.env.NEO4J_URI && !args.a) ||
        // Don't know what password to use...
        (!process.env.NEO4J_PASSWORD && !args.p)
    );

    if (badlyConfigured) {
        usage();
    }

    const terminationType = chooseTerminationType(args);
    const connectionDetails = chooseConnectionDetails(args);
    const concurrency = chooseConcurrency(args);
    const probabilityTable = chooseProbabilityTable(args);

    const failFast = ('fail-fast' in args) ? args['fail-fast'] : false;

    // Merge sub-objects.
    const obj = _.merge({
        checkpointFreq: args.checkpoint || process.env.CHECKPOINT_FREQUENCY || 5000,
        failFast,
        phase: 'NOT_STARTED',
    }, terminationType, probabilityTable, connectionDetails, concurrency);

    if (obj.runType === 'counted') {
        obj.n = args.n || 10000;
    } else {
        obj.ms = args.ms || 1000 * 60 * 5; // 5 minutes
    }

    return obj;
};

module.exports = {
    generateFromArgs,
    yargs: () => {
        return require('yargs')
            .usage(usageStr)
            .example('$0 -a localhost -u neo4j -p secret -n 10', 'Run 10 hits on the local database')
            .default('a', 'localhost')
            .default('u', 'neo4j')
            .describe('a', 'address to connect to')
            .describe('u', 'username')
            .describe('p', 'password')
            .describe('n', 'number of hits on the database')
            .describe('ms', 'number of milliseconds to execute')
            .describe('workload', 'absolute path to JSON probability table/workload')
            .default('concurrency', 10)
            .default('checkpoint', 5000)
            .demandOption(['p'])
            .argv;
    },
};