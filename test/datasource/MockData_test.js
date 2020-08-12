const expect = require('chai').expect;
const mocks = require('../mocks');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const MockData = require('../../src/datasource/MockData');

describe('Mock Data', function() {
    const goodSchema = {
        streetAddress: 'address.streetAddress',
        city: 'address.city',
        state: 'address.state',
        country: 'address.country',
    };

    it('can create something with a good schema', () => {
        const md = new MockData(goodSchema);
        expect(md).to.be.ok;
    });

    it('refuses empty schema', () => {
        expect(() => new MockData()).to.throw(Error);
    });

    it('refuses wrong schema', () => {
        expect(() => new MockData({
            foo: 'i.do.not.exist',
        })).to.throw(Error);
    });

    it('can generate a batch', () => {
        const md = new MockData(goodSchema);

        console.log('generating');
        const r = md.generate(10);
        console.log(r);
        // expect(r).to.be.an(Array);
        expect(r.length).to.equal(10);
        for (let i=0; i<r.length; i++) {
            Object.keys(goodSchema).forEach(field => {
                expect(r[i][field]).to.be.ok;
            });
        }
    });
});