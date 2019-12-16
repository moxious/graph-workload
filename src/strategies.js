/**
 * Library of strategies for easy inclusion.
 */
const SimpleQueryStrategy = require('./SimpleQueryStrategy');
const NAryTreeStrategy = require('./write-strategy/NAryTreeStrategy');
const FatNodeAppendStrategy = require('./write-strategy/FatNodeAppendStrategy');
const MergeWriteStrategy = require('./write-strategy/MergeWriteStrategy');
const RawWriteStrategy = require('./write-strategy/RawWriteStrategy');
const StarWriteStrategy = require('./write-strategy/StarWriteStrategy');
const IndexHeavyStrategy = require('./write-strategy/IndexHeavyStrategy');
const LuceneWriteStrategy = require('./write-strategy/LuceneWriteStrategy');
const LockTortureStrategy = require('./write-strategy/LockTortureStrategy');
const RandomLinkageStrategy = require('./write-strategy/RandomLinkageStrategy');
const AggregateReadStrategy = require('./read-strategy/AggregateReadStrategy');
const MetadataReadStrategy = require('./read-strategy/MetadataReadStrategy');
const LongPathReadStrategy = require('./read-strategy/LongPathReadStrategy');
const RandomAccessReadStrategy = require('./read-strategy/RandomAccessReadStrategy');

/**
 * Produces a strategy table by looking through the probability table and assigning
 * only those strategies that are needed.
 * @param {SessionPool} sessionPool 
 * @param {runConfig} a runconfig object
 * @returns {Object} key is strategy name, value is a Strategy instance object.
 */
const builder = (sessionPool, runConfig) => {
    const defaultStratTable = {
        // WRITE STRATEGIES
        naryWrite: new NAryTreeStrategy({ n: 2, sessionPool, runConfig }),
        fatnodeWrite: new FatNodeAppendStrategy({ sessionPool, runConfig }),
        mergeWrite: new MergeWriteStrategy({ n: 1000000, sessionPool, runConfig }),
        rawWrite: new RawWriteStrategy({ n: 10, sessionPool, runConfig }),
        randomLinkage: new RandomLinkageStrategy({ n: 1000000, sessionPool, runConfig }),
        starWrite: new StarWriteStrategy({ sessionPool, runConfig }),
        indexHeavy: new IndexHeavyStrategy({ sessionPool, runConfig }),
        lockTorture: new LockTortureStrategy({ sessionPool, runConfig }),
        luceneWrite: new LuceneWriteStrategy({ sessionPool, runConfig }),

        // READ STRATEGIES
        aggregateRead: new AggregateReadStrategy({ sessionPool, runConfig }),
        metadataRead: new MetadataReadStrategy({ sessionPool, runConfig }),
        longPathRead: new LongPathReadStrategy({ sessionPool, runConfig }),
        randomAccess: new RandomAccessReadStrategy({ sessionPool, runConfig }),
    };

    if (runConfig) {
        // By choosing which strats are in the table (by probability table)
        // We're limiting which setup methods get run too.
        const labels = runConfig.probabilityTable.getLabels();
        const chosenTable = {};

        labels.forEach(label => {
            const strat = defaultStratTable[label];

            if (label === 'custom') {
                chosenTable[label] = new SimpleQueryStrategy({
                    sessionPool,
                    query: runConfig.query,
                    mode: runConfig.mode || 'WRITE',
                });
                return;
            } else if(!strat) {
                throw new Error(`Probability table references strat ${label} which is unknown`);
            }

            chosenTable[label] = strat;
        });

        return chosenTable;
    }

    return defaultStratTable;
};

/**
 * Reports key stats about strategies
 * @param {StrategyTable} strategyTable 
 */
const report = strategyTable => {
    console.log('Strategy report');

    Object.keys(strategyTable).forEach(strategy => {
        const strat = strategyTable[strategy];

        if (strat.countRuns() > 0) {
            strat.summarize();
        }
    });
};

const showLastQuery = strategyTable => {
    Object.keys(strategyTable).forEach(strat => {
        if (strategyTable[strat].lastQuery) {
            console.log(strat, 'last query');
            console.log(strategyTable[strat].lastQuery);
            console.log(strategyTable[strat].lastParams);
        }
    });
};

module.exports = {
    builder, report, showLastQuery,
};