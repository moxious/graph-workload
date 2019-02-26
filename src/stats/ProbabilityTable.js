const _ = require('lodash');

/**
 * Represents a table of probabilities, and different chosen outcomes.
 * A table is an array of arrays, where the first cell is a float from 0-1,
 * and the second cell is a string token.
 * 
 * The final cell should always be 1.0, and all other cells should
 * be strictly ordered and <= 1.0.
 * 
 * Example:
 * 
 * [
 *   [ 0.5, "heads" ],
 *   [ 1.0, "tails" ]
 * ]
 */
module.exports = class ProbabilityTable {
    constructor(nestedArray) {
        this.data = nestedArray;
        this.validate();
    }

    validate() {
        if (!(this.data instanceof Array) || this.data.length === 0) {
            throw new Error('A probability table must be an array of arrays');
        }

        for (let i=0; i<this.data.length; i++) {
            if (!(this.data[i] instanceof Array)) {
                throw new Error('Inner probability table row is not an array');
            }

            if (this.data[i].length !== 2) {
                throw new Error('Inner probability table row must have 2 elements');
            }
        }
    }

    getLabels() {
        return _.uniq(this.data.map(row => row[1]));
    }

    choose() {
        const roll = Math.random();

        for (let i = 0; i < this.data.length; i++) {
            const entry = this.data[i];
            if (roll <= entry[0]) {
                return entry[1];
            }
        }

        return this.data[this.data.length-1][1];
    }
}