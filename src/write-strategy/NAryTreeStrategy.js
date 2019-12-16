const Strategy = require('../Strategy');
const Promise = require('bluebird');
const neo4j = require('neo4j-driver');

class NAryTreeStrategy extends Strategy {
    constructor(props) {
        super(props);
        this.n = props.n || 2;
        this.name = 'NAryTree';
        this.tracker = -10;
    }

    setup(driver) {
        super.setup(driver);

        const queries = [
            "CREATE INDEX ON :NAryTree(val)",
            "CREATE INDEX ON :Leaf(val)",
            "CREATE (a:NAryTree:Leaf { label: 'ROOT', val: 2 })",
        ];

        return Promise.all(queries.map(q => {
            const session = driver.session(this.sessionOptions());
            return session.run(q)
                .catch(e => this.ignore(e, 'An equivalent index already exists'))
                .then(() => session.close());
        }));
    }

    run() {
        // this.tracker++;
        this.lastParams = { tracker: this.tracker };

        this.lastQuery = `
            MATCH (p:Leaf)
            WHERE p.val >= $tracker
            WITH p ORDER BY p.val DESC, rand()
            LIMIT ${neo4j.int(this.n)}
            WHERE NOT (p)-[:child]->(:NAryTree)
            WITH p
            REMOVE p:Leaf
            ${
                Array.apply(null, { length: this.n }).map((z, idx) => {
                    return `
                        CREATE (p)-[:child]->(i${idx}:NAryTree:Leaf { val: p.val + ${idx + 1} })
                    `
                }).join('\n')
            }
            RETURN count(p) as value;
        `;

        const f = (s) => s.writeTransaction(tx => tx.run(this.lastQuery, this.lastParams));
        return this.time(f);
    }
}

module.exports = NAryTreeStrategy;