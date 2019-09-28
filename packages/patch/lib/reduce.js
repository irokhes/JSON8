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
module.exports = function reduce(patches) {
    const reducedPatches = {};
    const copyOperations = {};
    patches.forEach((patch, index) => {
        if (!reducedPatches[patch.path]) {
            reducedPatches[patch.path] = [];
        }
        patch.index = index;
        switch (patch.op) {
            case REMOVE:
                removeOperation(reducedPatches, copyOperations, patch);
                break;
            case ADD:
                reducedPatches[patch.path] = [patch];
                break;
            case REPLACE:
                //get copyOperation
                const copied = copyOperations[patch.path];
                reducedPatches[patch.path].filter(e =>e.op === REPLACE && (!copied || e.index > copied.index));
                reducedPatches[patch.path] = [patch];
                break;
            case COPY:
                reducedPatches[patch.path] = [patch];
                if(!copyOperations[patch.from]){
                    copyOperations[patch.from] = [];
                }
                copyOperations[patch.from].push(patch);
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
function removeOperation(reducedPatches, copyOperations, patch) {
    if(copyOperations[patch.path]){
        reducedPatches[patch.path].push(patch);
        return;
    }
    reducedPatches[patch.path].some(e => e.op === ADD) ? reducedPatches[patch.path] = [] : reducedPatches[patch.path] = [patch];
}

