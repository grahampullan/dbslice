import { threeMeshFromStruct } from './threeMeshFromStruct.js';
import { lineSeriesFromLines } from './lineSeriesFromLines.js';
import { lineSeriesFromCsv } from './lineSeriesFromCsv.js';
import { lineSeriesFromTimeSnapshotCsv } from './lineSeriesFromTimeSnapshotCsv.js'

function getDataFilterFunc(dataFilterType) {

    const lookup = {

        'threeMeshFromStruct'           : threeMeshFromStruct,
        'lineSeriesFromLines'           : lineSeriesFromLines,
        'lineSeriesFromCsv'             : lineSeriesFromCsv,
        'lineSeriesFromTimeSnapshotCsv' : lineSeriesFromTimeSnapshotCsv
        
    };
    
    return lookup[dataFilterType];
    
}

export { getDataFilterFunc }