"use strict";

/**
 * Reduce a patch collection to the minimum expresion so it's 
 * still containing all the relevan information
 *
 * @param  {Array} patches   - Array containing all the patches
 * @return {Array} reduced patches - Array containing minimun the set of patches
 */
const REMOVE = "remove";
const ADD = "add";
const COPY = "copy";
const REPLACE = "replace";
const MOVE = "move";
module.exports = function reduce(patches) {
    const reducedPatches = {};
    const copyOperations = {};
    const moveOperations = {};
    patches.forEach((patch, index) => {
        if (!reducedPatches[patch.path]) {
            reducedPatches[patch.path] = [];
        }
        patch.index = index;
        switch (patch.op) {
            case REMOVE:
                removeOperation(reducedPatches, copyOperations, moveOperations, patch);
                break;
            case ADD:
                reducedPatches[patch.path] = [patch];
                break;
            case REPLACE:
                //get copyOperation
                const copied = copyOperations[patch.path];
                reducedPatches[patch.path] = reducedPatches[patch.path].filter(e => e.op !== REPLACE || (copied && e.index < copied[copied.length -1].index));
                reducedPatches[patch.path].push(patch);
                break;
            case COPY:
                copyOperation(reducedPatches, patch, copyOperations);
                break;
            case MOVE:
                reducedPatches[patch.path].push(patch);
                moveOperations[patch.path] = patch;
                break;
            default:
                break;
        }
    });
    let result = Object.values(reducedPatches).flat();
    result.sort((a,b) => (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0))
    result.forEach(e => delete e.index);
    return result;
};
function copyOperation(reducedPatches, patch, copyOperations) {
    reducedPatches[patch.path] = [patch];
    if (!copyOperations[patch.from]) {
        copyOperations[patch.from] = [];
    }
    copyOperations[patch.from].push(patch);
}

function removeOperation(reducedPatches, copyOperations, moveOperations, patch) {
    const hasCopies = copyOperations[patch.path];
    if(hasCopies){
        reducedPatches[patch.path] = reducedPatches[patch.path].filter(e => e.index < hasCopies[hasCopies.length -1].index);
        reducedPatches[patch.path].push(patch);
        return;
    }
    const moved = moveOperations[patch.path];
    if(moved){
        //remove all the edit operations from 
        reducedPatches[moved.from] = reducedPatches[moved.from].filter(e => e.op !== REPLACE);
    }
    const originatedFromCopy = hasBeenCopiedFromOther(copyOperations, patch);
    const areThereMultipleReplaceOperationInOriginalLocation = originatedFromCopy && reducedPatches[originatedFromCopy.from].filter(e => e.op === REPLACE).length > 1;
    if(originatedFromCopy && areThereMultipleReplaceOperationInOriginalLocation){
        //delete replace operation before copy if multiple replace
        if(areThereMultipleReplaceOperationInOriginalLocation){
            const indexOfCopyOperation = originatedFromCopy.index - 1;
            //we remove the replece operation before the COPY
            for(let i = indexOfCopyOperation; i >= 0; i--){
                if(reducedPatches[originatedFromCopy.from][i].op === REPLACE){
                    reducedPatches[originatedFromCopy.from].splice(i, 1);
                    break;
                }
            }
        }
    }
    if(reducedPatches[patch.path].some(e => e.op === ADD || e.op === COPY)){
        reducedPatches[patch.path] = [];
    } else{
        reducedPatches[patch.path] = [...reducedPatches[patch.path].filter(e => e.op !== REPLACE), patch]; 
    };
}
function hasBeenCopiedFromOther(copyOperations, patch){
    return Object.values(copyOperations).flat().find(copy => copy.path === patch.path);
}

