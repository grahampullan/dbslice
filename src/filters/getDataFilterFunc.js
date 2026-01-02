import { threeMeshFromStruct } from './threeMeshFromStruct.js';
import { lineSeriesFromDerivedData } from './lineSeriesFromDerivedData.js'; 
import { triMeshFromComponents } from './triMeshFromComponents.js';

function getDataFilterFunc(dataFilterType) {

    const lookup = {

        'threeMeshFromStruct'           : threeMeshFromStruct,
        'lineSeriesFromDerivedData'     : lineSeriesFromDerivedData,
        'triMeshFromComponents'         : triMeshFromComponents
        
    };
    
    return lookup[dataFilterType];
    
}

export { getDataFilterFunc }
