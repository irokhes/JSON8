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
                reducedPatches[patch.path] = [patch];
                if(!copyOperations[patch.from]){ 
                    copyOperations[patch.from] = [];
                }
                copyOperations[patch.from].push(patch);
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
function removeOperation(reducedPatches, copyOperations, moveOperations, patch) {
    const copied = copyOperations[patch.path];
    if(copied){
        reducedPatches[patch.path] = reducedPatches[patch.path].filter(e => e.index < copied[copied.length -1].index);
        reducedPatches[patch.path].push(patch);
        return;
    }
    const moved = moveOperations[patch.path];
    if(moved){
        //remove all the edit operations from 
        reducedPatches[moved.from] = reducedPatches[moved.from].filter(e => e.op !== REPLACE);
    }
    if(reducedPatches[patch.path].some(e => e.op === ADD)){
        reducedPatches[patch.path] = [];
    } else{
        reducedPatches[patch.path] = [...reducedPatches[patch.path].filter(e => e.op !== REPLACE), patch]; 
    };
}

