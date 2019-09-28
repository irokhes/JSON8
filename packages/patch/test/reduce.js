"use strict";

const assert = require("assert");
const _reduce = require('../lib/reduce');
const _apply = require('../lib/apply');

describe.only('Reduce patch', () => {
    let originalDocument, expectedOriginalDocument;
    beforeEach(() => {
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
            assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
        });
    });
    describe('When patches contains 1 add operation and 1 remove opp over the element', () => {
        it('it should not return the element', () => {
            const patches = [{ "op": "add", "path": "/biscuits/1", "value": { "name": "Ginger Nut" } }, { "op": "remove", "path": "/biscuits/1" }];
            const reducedPatches = _reduce(patches);
            assert.deepEqual(_reduce(patches), []);
            assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));

        });
    });
    describe('When patches contains 1 add operation and 1 remove opp over the element', () => {
        it('it should not return the element', () => {
            const patches = [
                { "op": "add", "path": "/foo", "value": "bar" },
                { "op": "add", "path": "/bar", "value": "baz" },
                { "op": "remove", "path": "/foo" }
            ]
            const reducedPatches = _reduce(patches);
            assert.deepEqual(_reduce(patches), [{ "op": "add", "path": "/bar", "value": "baz" }]);
            assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));

        });
    });
    describe('When patches contains 1 remove operation and 1 add operation over the element', () => {
        it('it should return the element', () => {
            const patches = [{ "op": "remove", "path": "/biscuits" }, { "op": "add", "path": "/biscuits", "value": "yummy" }];
            const reducedPatches = _reduce(patches);
            assert.deepEqual(reducedPatches, [{ "op": "add", "path": "/biscuits", "value": "yummy" }]);
            assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
        });
    });
    describe('Copy operations', () => {
        describe('When patches contains 1 add operation and 1 copy operation over the element', () => {
            it('it should return the 2 elements', () => {
                const patches = [{ "op": "add", "path": "/biscuits/2", "value": { "name": "Butter Nut" } }, { "op": "copy", "from": "/biscuits/0", "path": "/best_biscuit" }];
                const reducedPatches = _reduce(patches);
                assert.deepEqual(reducedPatches, [{ "op": "add", "path": "/biscuits/2", "value": { "name": "Butter Nut" } }, { "op": "copy", "from": "/biscuits/0", "path": "/best_biscuit" }]);
                assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
            });
        });
        describe('When patches contains replace operation, copy operation and delete op over the original path', () => {
            it('it should keep all the operations', () => {
                const patches = [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } }, { "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" }, { "op": "remove", "path": "/biscuits/1" }];
                const reducedPatches = _reduce(patches);
                assert.deepEqual(reducedPatches, [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } }, { "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" }, { "op": "remove", "path": "/biscuits/1" }]);
                assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
            });
        });
        describe('When patches contains replace operation, copy operation, another replace and delete op over the original path', () => {
            it('it should remove the replace operation after the copy', () => {
                const patches = [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } }, { "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" }, { "op": "replace", "path": "/biscuits/1", "value": { "name": "Choc cookie" } }, { "op": "remove", "path": "/biscuits/1" }];
                const reducedPatches = _reduce(patches);
                assert.deepEqual(reducedPatches, [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } }, { "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" }, { "op": "remove", "path": "/biscuits/1" }]);
                assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
            });
        });
        describe('When patches contains replace operations, multiple copy operation, another replace and delete op over the original path', () => {
            it('it should remove the last replace operation after the last copy', () => {
                const patches = [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } },
                { "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" }, { "op": "replace", "path": "/biscuits/1", "value": { "name": "Choc cookie" } },
                { "op": "copy", "from": "/biscuits/1", "path": "/even_better_biscuit" }, { "op": "replace", "path": "/biscuits/1", "value": { "name": "vanilla cookie" } }, { "op": "remove", "path": "/biscuits/1" }
                ];
                const reducedPatches = _reduce(patches);
                assert.deepEqual(reducedPatches, [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } }, { "op": "copy", "from": "/biscuits/1", "path": "/best_biscuit" },
                { "op": "replace", "path": "/biscuits/1", "value": { "name": "Choc cookie" } }, { "op": "copy", "from": "/biscuits/1", "path": "/even_better_biscuit" }, { "op": "remove", "path": "/biscuits/1" }]);
                assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
            });
        });
    });
    describe('Move operations', () => {
        describe('When patches contains 2 replace and a move operation', () => {
            it('should return only the last replace and the moving', () =>{
                const patches = [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } }, { "op": "replace", "path": "/biscuits/1", "value": { "name": "Choc cookie" } }, { "op": "move", "from": "/biscuits/1", "path": "/best_biscuit" }];
                const reducedPatches = _reduce(patches);
                assert.deepEqual(reducedPatches, [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Choc cookie" } }, { "op": "move", "from": "/biscuits/1", "path": "/best_biscuit" }]);
                assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
            });
        });
        describe('When patches contains 2 replaces, a move operation and a delete over the moved path', () => {
            it('should return the move and delete operations', () =>{
                const patches = [{ "op": "replace", "path": "/biscuits/1", "value": { "name": "Butter Nut" } }, { "op": "replace", "path": "/biscuits/1", "value": { "name": "Choc cookie" } }, { "op": "move", "from": "/biscuits/1", "path": "/best_biscuit" }, { "op": "remove", "path": "/best_biscuit" }];
                const reducedPatches = _reduce(patches);
                assert.deepEqual(reducedPatches, [{ "op": "move", "from": "/biscuits/1", "path": "/best_biscuit" },{ "op": "remove", "path": "/best_biscuit" }]);
                assert.deepEqual(_apply(originalDocument, patches), _apply(expectedOriginalDocument, reducedPatches));
            });
        });
    });
    
    
});