"use strict";

const assert = require("assert");
const _reduce = require('../lib/reduce');
const _apply = require('../lib/apply');

describe.only('Reduce patch', () => {
    let originalDocument, expectedOriginalDocument;
    beforeEach(() =>{
        originalDocument = {
            "biscuits": [
              { "name": "Digestive" },
              { "name": "Choco Leibniz" }
            ]
          }
          expectedOriginalDocument = {
            "biscuits": [
              { "name": "Digestive" },
              { "name": "Choco Leibniz" }
            ]
          }
    });
    describe('When patches only contains 1 element', () => {
        it('returns the same element', () => {
            const patches = [{ "op": "remove", "path": "/biscuits/0" }];
            const reducedPatches = _reduce(patches);
            assert.deepEqual(reducedPatches, patches);
            assert.deepEqual(_apply(originalDocument,patches),_apply(expectedOriginalDocument, reducedPatches));
        });
    });
    describe('When patches contains 1 add operation and 1 remove opp over the element', () => {
        it('it should not return the element', () => {
            const patches = [{ "op": "add", "path": "/biscuits/1", "value": { "name": "Ginger Nut" }  },{ "op": "remove", "path": "/biscuits/1" }];
            const reducedPatches = _reduce(patches);
            assert.deepEqual(_reduce(patches), []);
            assert.deepEqual(_apply(originalDocument,patches),_apply(expectedOriginalDocument, reducedPatches));
            
        });
    });
    describe('When patches contains 1 remove operation and 1 add operation over the element', () => {
        it('it should return the element', () => {
            const patches = [{ "op": "remove", "path": "/biscuits" },{ "op": "add", "path": "/biscuits", "value": "yummy" }];
            const reducedPatches = _reduce(patches);
            assert.deepEqual(reducedPatches, [{ "op": "add", "path": "/biscuits", "value": "yummy" }]);
            assert.deepEqual(_apply(originalDocument,patches),_apply(expectedOriginalDocument, reducedPatches));
        });
    });
    describe('When patches contains 1 add operation and 1 copy operation over the element', () => {
        it('it should return the 2 elements', () => {
            const patches = [{ "op": "add", "path": "/biscuits/2",  "value": { "name": "Butter Nut" } },{ "op": "copy", "from": "/biscuits/0", "path": "/best_biscuit" }];
            const reducedPatches = _reduce(patches);
            assert.deepEqual(reducedPatches, [{ "op": "add", "path": "/biscuits/2",  "value": { "name": "Butter Nut" } },{ "op": "copy", "from": "/biscuits/0", "path": "/best_biscuit" }]);
            assert.deepEqual(_apply(originalDocument,patches),_apply(expectedOriginalDocument, reducedPatches));
        });
    });
    describe('When patches contains 1 replace operation and 1 copy operation over the element and 1 delete op over the original path', () => {
        it('it should return the 2 elements', () => {
            const patches = [{ "op": "replace", "path": "/biscuits/1",  "value": { "name": "Butter Nut" } },{ "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" },{ "op": "remove", "path": "/biscuits/1" }];
            const reducedPatches = _reduce(patches);
            assert.deepEqual(reducedPatches, [{ "op": "replace", "path": "/biscuits/1",  "value": { "name": "Butter Nut" } },{ "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" },{ "op": "remove", "path": "/biscuits/1" }]);
            assert.deepEqual(_apply(originalDocument,patches),_apply(expectedOriginalDocument, reducedPatches));
        });
    });
});