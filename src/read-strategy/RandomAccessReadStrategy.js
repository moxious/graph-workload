const Strategy = require('../Strategy');
const neo4j = require('neo4j-driver').v1;

class RandomAccessReadStrategy extends Strategy {
    constructor(props) {
        super(props);
        this.name = 'RandomAccessRead';
        this.prime = neo4j.int(props.prime || 1093);
        this.limit = neo4j.int(props.limit || 50);
    }

    run() {
        const nth = neo4j.int(Math.floor(Math.random() * this.prime) + 1);
        const skip = neo4j.int(Math.floor(Math.random() * 1000) + 1);

        const f = (s) => s.readTransaction(tx => tx.run(`
            MATCH (node)
            WHERE id(node) % $prime = $nth
            RETURN keys(node)
            SKIP $skip LIMIT $limit`,
            {  prime: this.prime, nth, skip, limit: this.limit }));
        
        return this.time(f);
    }
}

module.exports = RandomAccessReadStrategy;