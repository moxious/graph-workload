const uuid = require('uuid');
const randomstring = require('randomstring');
const _ = require('lodash');

class Strategy {
    constructor(props) {
        this.name = 'Undefined';
        this.props = props;
        this.timings = [];
    }

    sessionOptions() {
        const opts = {};

        if (this.props.runConfig && this.props.runConfig.database) {
            opts.database = this.props.runConfig.database;
        } else if (!this.props.runConfig) {
            throw new Error('Strategy initialized without runConfig');
        }

        return opts;
    }

    setup(driver) { 
        this.driver = driver;
        return Promise.resolve(true); 
    }

    getName() { return this.name; }
    run() { 
        return Promise.reject('Override me in subclass');
    }

    randInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    getTimings() {
        return this.timings;
    }

    countRuns() { return this.getTimings().length; }

    csv() {
        const runs = this.timings.length;
        const elapsedArr = this.timings.map(t => t.elapsed);
        const avgV = elapsedArr.reduce((a, b) => a + b, 0) / runs || 0;
        const minV = elapsedArr.reduce((min, p) => p < min ? p : min, elapsedArr[0] || 0);
        const maxV = elapsedArr.reduce((max, p) => p > max ? p : max, elapsedArr[0] || 0);

        return [
            this.name, runs, avgV, minV, maxV
        ].join(',') + '\n';
    }

    totalTimeSpent() {
        const elapsedArr = this.timings.map(t => t.elapsed);
        const total = elapsedArr.reduce((a, b) => a + b, 0);
        return total;
    }

    summarize() {
        const runs = this.timings.length;
        const elapsedArr = this.timings.map(t => t.elapsed);
        const total = this.totalTimeSpent();
        const avgV = total / runs || 0;
        const minV = elapsedArr.reduce((min, p) => p < min ? p : min, elapsedArr[0] || 0);
        const maxV = elapsedArr.reduce((max, p) => p > max ? p : max, elapsedArr[0] || 0);
        
        const key = `BENCHMARK_${this.name}`.replace(/strategy/gi, '');

        console.log(`${key}_ELAPSED=${total}`);
        console.log(`${key}_AVG=${avgV}`);
        console.log(`${key}_MIN=${minV}`);
        console.log(`${key}_MAX=${maxV}`);
        console.log(`${key}_RUNS=${runs}`);
        console.log(`${this.name}: ${runs} runs avg ${avgV.toFixed(2)} ms min ${minV} ms max ${maxV} ms\n`);
    }

    ignore(e, match) {
        const str = `${e}`;

        if (str.indexOf(match) > -1) {
            return true;
        }

        throw e;
    }

    time(somePromiseFunc, data={}) {
        const start = new Date().getTime();

        if (!this.props.sessionPool) {
            throw new Error('Missing sessionPool');
        }

        const closure = () => {
            let s;

            // console.log('Acuquiring from ', this.props.sessionPool);
            return this.props.sessionPool.acquire()
                .then(session => {
                    s = session;
                    return somePromiseFunc(session);
                })
                .then(result => {
                    const end = new Date().getTime();
                    const elapsed = end - start;
                    this.timings.push(_.merge({ elapsed }, data));
                })
                .finally(() => this.props.sessionPool.release(s));
        };

        return closure();
    }

    randString(len) {
        return randomstring.generate(len);
    }
}

module.exports = Strategy;