import { threeMeshFromStruct } from './threeMeshFromStruct.js';
import { lineSeriesFromLines } from './lineSeriesFromLines.js';
import { lineSeriesFromCsv } from './lineSeriesFromCsv.js';

function getDataFilterFunc(dataFilterType) {

    const lookup = {

        'threeMeshFromStruct'     : threeMeshFromStruct,
        'lineSeriesFromLines'     : lineSeriesFromLines,
        'lineSeriesFromCsv'       : lineSeriesFromCsv
        
    };
    
    return lookup[dataFilterType];
    
}

export { getDataFilterFunc }