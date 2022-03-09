import { threeMeshFromStruct } from './threeMeshFromStruct.js';

function getDataFilterFunc(dataFilterType) {

    const lookup = {
        'threeMeshFromStruct'     : threeMeshFromStruct 
    };
    
    return lookup[dataFilterType];
    
}

export { getDataFilterFunc }