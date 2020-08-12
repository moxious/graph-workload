const _ = require('lodash');
const faker = require('faker');

class MockData {
    /**
     * Create a mock data source.
     * @param {Object} schema a map of field names to data types
     */
    constructor(schema) {
        this.schema = _.cloneDeep(schema);
        this.validateSchema();
        this.columns = Object.keys(schema);
    }

    generate(batchSize=1) {
        const r = [];
        for (let i=0; i<batchSize; i++) {
            const record = _.zipObject(this.columns, _.map(this.columns, col => this.schema[col]()));
            r.push(record);
        }
        return r;
    }

    /**
     * Validate that for each schema field, there is a corresponding faker function.
     * For example, there is a faker.address.city() function.  So if the user specifies
     * 'address.city' we will find that function.  
     * @throws Error when an unidentified function is specified.
     */
    validateSchema() {
        if (_.isNil(this.schema) || _.isEmpty(this.schema)) {
            throw new Error('Empty or invalid schema specified');
        }

        Object.keys(this.schema).forEach(fieldName => {
            const val = this.schema[fieldName];
            if (!val) { throw new Error(`Field name ${fieldName} in schema has no specification`); }
            const parts = val.split('.');

            let f = faker;
            parts.forEach(part => {
                f = f[part];
                if (!f) {
                    throw new Error(`Invalid schema: Unknown function part '${part}' in field type ${fieldName}`);
                }
            });

            // If we've worked through all parts we have our terminal function.
            this.schema[fieldName] = f;
        });
    }
}

module.exports = MockData;