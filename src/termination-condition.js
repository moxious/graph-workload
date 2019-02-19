const moment = require('moment');
/**
 * This module represents a termination condition.
 * 
 * You can choose to terminate either after a certain number of runs, or after a certain timeout.
 * 
 * Later if needed custom conditions can be added, such as terminate after too many
 * errors, etc.
 */
module.exports = {
    /**
     * Terminate after n runs.
     * @param {Number} n the number of maximum runs to allow before termination.
     * @returns {Object} with a next and progress function.
     */
    nRuns: n => {
        let range = { from: 0, to: n, counter: 0 };

        return {
            next: () => {
                const value = range.counter++;
                return {
                    done: range.counter > range.to,
                    value,
                };
            },
            progress: () => range.counter / range.to,
        };
    },

    /**
     * Terminate after a certain number of milliseconds.
     * 
     * The timer does not begin until the next function is called for the first
     * time.
     * 
     * @param {Number} ms the number of milliseconds.
     * @returns {Object} with a next and progress function.
     */
    timeoutMilliseconds: ms => {
        let range = { 
            startTime: -1, 
            endTime: -1, 
            counter: 0, 
            timeout: false,
            ms,
        };

        return {
            next: () => {
                if (range.startTime === -1) {
                    range.startTime = moment.utc();
                    range.endTime = moment.utc().add(ms, 'milliseconds');

                    console.log('Starting timer at ',
                        range.startTime.format(),
                        ' to expire at',
                        range.endTime.format() +
                        ' after ', ms, 'ms');
                    setTimeout(() => {
                        range.timeout = true;
                    }, ms);
                }

                if (range.timeout) {
                    console.log('Timeout');
                    return { done: true, value: null };
                }
                return { done: false, value: range.counter++ };
            },
            progress: () => {
                if (range.startTime === -1) { return 0; }

                const diff = moment.utc().diff(range.startTime);
                return diff / ms;
            },
        };
    },
};