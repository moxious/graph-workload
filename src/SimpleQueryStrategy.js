const Strategy = require('./Strategy');
const _ = require('lodash');

/**
 * Represents a container class for a strategy that is just running some
 * simple query with no setup.
 */
module.exports = class SimpleQueryStrategy extends Strategy {
    constructor(props) {
        super(props);
        this.name = props.name || 'SimpleQuery';
        this.query = props.query;
        this.params = props.params || {};
        this.generator = props.generator;
        this.batchSize = props.batchSize;

        if (!(props.mode === 'READ') && !(props.mode === 'WRITE')) {
            throw new Error('Mode must be READ or WRITE');
        }

        this.mode = props.mode;
    }

    run() {
        const f = (s) => {
            const txRunner = tx => {
                if (this.generator) {
                    const batch = this.generator.generate(this.batchSize);
                    console.log('batchrun with ', batch.length, 'elements');
                    return tx.run(
                        `UNWIND $batch AS event ${this.query}`,
                        _.merge({ batch }, this.params)
                    );
                }
                return tx.run(this.query, this.params);
            };

            if (this.props.mode === 'READ') {
                return s.readTransaction(txRunner);
            } 

            return s.writeTransaction(txRunner);
        };

        return this.time(f);
    }
}