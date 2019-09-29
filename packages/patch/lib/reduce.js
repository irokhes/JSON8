"use strict";


const operations = {
    'remove': removeOperation,
    'add': addOperation,
    'copy': copyOperation,
    'replace': replaceOperation,
    'move': moveOperation,
    'test': testOperation
}
const REMOVE = "remove";
const ADD = "add";
const COPY = "copy";
const REPLACE = "replace";
const MOVE = "move";
const TEST = "test";

/**
 * Reduce a patch collection to the minimum expresion so it's 
 * still containing all the relevan information
 *
 * @param  {Array} patches   - Array containing all the patches
 * @return {Array} reduced patches - Array containing minimun set of patches
 */
module.exports = function reduce(patches) {
    const collections = {
        reducedPatches: {},
        copyOperations: {},
        moveOperations: {}
    }
    patches.forEach((patch, index) => {
        if (!collections.reducedPatches[patch.path]) {
            collections.reducedPatches[patch.path] = [];
        }
        patch.index = index;
        const operation = processPatch(patch);
        operation(patch, collections);
    });
    return prepareResults(collections.reducedPatches);
};
function prepareResults(reducedPatches) {
    const result = flatten(Object.values(reducedPatches)).sort((a, b) => (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0));
    result.forEach(e => delete e.index);
    return result;
}

function processPatch(patch) {
    const operation = operations[patch.op];
    if (!operation)
        throw new Error('Invalid operation');
    return operation;
}

function testOperation(patch, collections) {
    collections.reducedPatches[patch.path].push(patch);
}

function moveOperation(patch, collections) {
    collections.reducedPatches[patch.path].push(patch);
    collections.moveOperations[patch.path] = patch;
}

function replaceOperation(patch, collections) {
    const copied = collections.copyOperations[patch.path];
    collections.reducedPatches[patch.path] = collections.reducedPatches[patch.path].filter(e => (e.op !== REPLACE && e.op !== TEST) || (copied && e.index < copied[copied.length - 1].index));
    collections.reducedPatches[patch.path].push(patch);
}

function addOperation(patch, collections) {
    collections.reducedPatches[patch.path] = [patch];
}

function copyOperation(patch, collections) {
    collections.reducedPatches[patch.path] = [patch];
    if (!collections.copyOperations[patch.from]) {
        collections.copyOperations[patch.from] = [];
    }
    collections.copyOperations[patch.from].push(patch);
}

function removeOperation(patch, collections) {
    removeMoveOperations(collections, patch);
    removeOperationWhenCreatedFromCopy(patch, collections);
    
    const copies = collections.copyOperations[patch.path];
    const hasCopies = copies && copies.length;
    if (hasCopies) {
        const indexOfLastCopy = copies[copies.length - 1].index;
        collections.reducedPatches[patch.path] = collections.reducedPatches[patch.path].filter(e => e.index < indexOfLastCopy);
        collections.reducedPatches[patch.path].push(patch);
        return;
    }else{
        const locationCreatedFromAddOrCopyPatch = collections.reducedPatches[patch.path].some(e => e.op === ADD || e.op === COPY);
        collections.reducedPatches[patch.path] = locationCreatedFromAddOrCopyPatch ? [] : collections.reducedPatches[patch.path] = [...collections.reducedPatches[patch.path].filter(e => e.op === COPY || e.op === MOVE), patch];
    }


}
const removeOperationWhenCreatedFromCopy = (patch, collections) => {
    const originatedFromCopy = hasBeenCopiedFromOtherLocation(patch, collections);
    const areThereMultipleReplaceOperationInOriginalLocation = originatedFromCopy && collections.reducedPatches[originatedFromCopy.from].filter(e => e.op === REPLACE).length > 1;
    if (originatedFromCopy && areThereMultipleReplaceOperationInOriginalLocation) {
        //delete replace operation before copy if multiple replace
        if (areThereMultipleReplaceOperationInOriginalLocation) {
            const indexOfCopyOperation = originatedFromCopy.index - 1;
            //we remove the replece operation before the COPY
            for (let i = indexOfCopyOperation; i >= 0; i--) {
                if (collections.reducedPatches[originatedFromCopy.from][i].op === REPLACE) {
                    collections.reducedPatches[originatedFromCopy.from].splice(i, 1);
                    break;
                }
            }
        }
    }
}
const hasBeenCopiedFromOtherLocation = (patch, collections) => {
    const copyOperationsArray = flatten(Object.values(collections.copyOperations));
    return copyOperationsArray.length && copyOperationsArray.find(copy => copy.path === patch.path);
}

//we could use the array.flat method but that was introduced 
//in node version 11 and package.js only requires >= 7.6.0
//also we could use lodash or ramda but we will introduce a 
//dependency only for this so for now we can do it like this
const flatten = (array) => [].concat.apply([], array);

function removeMoveOperations(collections, patch) {
    const moved = collections.moveOperations[patch.path];
    if (moved) {
        //remove all the edit operations from 
        collections.reducedPatches[moved.from] = collections.reducedPatches[moved.from].filter(e => e.op !== REPLACE);
    }
}

