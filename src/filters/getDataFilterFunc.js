import { threeMeshFromStruct } from './threeMeshFromStruct.js';
import { lineSeriesFromLines } from './lineSeriesFromLines.js';

function getDataFilterFunc(dataFilterType) {

    const lookup = {

        'threeMeshFromStruct'     : threeMeshFromStruct,
        'lineSeriesFromLines'     : lineSeriesFromLines
        
    };
    
    return lookup[dataFilterType];
    
}

export { getDataFilterFunc }