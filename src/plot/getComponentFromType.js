import { PlotGroup } from './PlotGroup.js';
import { TriMesh3D } from './TriMesh3D.js';
import { GLTFViewer } from './GLTFViewer.js';
import { LineSeries } from './LineSeries.js';
import { LineSeriesGL } from './LineSeriesGL.js';
import { DimensionSliders } from './DimensionSliders.js';
import { MetaDataBarChart } from './MetaDataBarChart.js';
import { MetaDataRankCorrBarChart } from './MetaDataRankCorrBarChart.js';
import { MetaDataScatter } from './MetaDataScatter.js';
import { MetaDataHistogram } from './MetaDataHistogram.js';


function getComponentFromType(type) {

    const lookup = {
        'PlotGroup'                : PlotGroup ,
        'TriMesh3D'                : TriMesh3D ,
        'GLTFViewer'               : GLTFViewer ,
        'LineSeries'               : LineSeries ,
        'LineSeriesGL'             : LineSeriesGL ,
        'DimensionSliders'         : DimensionSliders ,
        'MetaDataBarChart'         : MetaDataBarChart ,
        'MetaDataRankCorrBarChart' : MetaDataRankCorrBarChart ,
        'MetaDataScatter'          : MetaDataScatter ,
        'MetaDataHistogram'        : MetaDataHistogram 
    };

    return lookup[type];

}

export { getComponentFromType };