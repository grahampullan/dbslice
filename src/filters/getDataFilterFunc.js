import { threeMeshFromStruct } from './threeMeshFromStruct.js';
import { lineSeriesFromLines } from './lineSeriesFromLines.js';
import { lineSeriesFromCsv } from './lineSeriesFromCsv.js';
import { lineSeriesFromTimeSnapshotCsv } from './lineSeriesFromTimeSnapshotCsv.js'
import { lineSeriesFromDerivedData } from './lineSeriesFromDerivedData.js'; 

function getDataFilterFunc(dataFilterType) {

    const lookup = {

        'threeMeshFromStruct'           : threeMeshFromStruct,
        'lineSeriesFromLines'           : lineSeriesFromLines,
        'lineSeriesFromCsv'             : lineSeriesFromCsv,
        'lineSeriesFromTimeSnapshotCsv' : lineSeriesFromTimeSnapshotCsv,
        'lineSeriesFromDerivedData'     : lineSeriesFromDerivedData
        
    };
    
    return lookup[dataFilterType];
    
}

export { getDataFilterFunc }