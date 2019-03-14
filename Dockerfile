FROM node:9-alpine
MAINTAINER David Allen <david.allen@neo4j.com>
RUN mkdir /app
COPY . /app
RUN cd app && npm install
ENV NEO4J_URI "bolt://localhost"
ENV NEO4J_USER "neo4j"
ENV NEO4J_PASSWORD "neo4j"
ENV CONCURRENCY "10"

WORKDIR /app
ENTRYPOINT ["/usr/local/bin/node", "/app/src/run-workload.js"]
