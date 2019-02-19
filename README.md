# Graph Workloads

[![CircleCI](https://circleci.com/gh/moxious/graph-workload.svg?style=svg)](https://circleci.com/gh/moxious/graph-workload)

Tools for generating workloads on Neo4j.

# Running Stand-Alone

```
yarn install
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=supersecret
export NEO4J_URI=bolt+routing://my-cloud-host:7687
node src/index.js
```

Alternatively, you can pass some arguments, like this:

```
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=supersecret
export NEO4J_URI=bolt+routing://my-cloud-host:7687

node src/index.js --concurrency 10 --n 20 --workload /path/to/read-workload.json
```

This would run the read workload in batches of 20, with 10 concurrent queries.

See the `workloads` directory for the format of the probability table.

You can use the script `npm run graph-workload` as a synonym for running the index.js file, but keep in mind npm requires an extra `--` argument prior to passing
program arguments, as in, `npm run graph-workload -- --n 20`

# Tests

```
yarn run test
```

# Building Graph Workloads as a Docker Container

```
docker build -t graph-workload:latest -f Dockerfile . 
```

# Running

```
docker run \
	-e "NEO4J_URI=bolt://foo-host/" \
	-e "NEO4J_USER=neo4j" \
	-e "NEO4J_PASSWORD=secret" \
	-e "CONCURRENCY=10" \
	graph-workload:latest 
```

# Adjusting Workload

This is not that friendly or configurable from the outside yet.  But essentially:

- Stress tester has a number of 'read strategies' and 'write strategies'
- There is a probability table; the stress tester rolls random numbers and picks a strategy
based on the probability table.
- By tweaking which strategies are available and what their probability is,  you can generate
whichever kind of load you like
- You can write a new strategy to simulate any specific kind of load you like.

See workload.js for details.