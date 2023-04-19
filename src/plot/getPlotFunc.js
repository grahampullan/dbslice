import { cfD3BarChart } from './cfD3BarChart.js';
import { cfD3RankCorrBar } from './cfD3RankCorrBar.js';
import { cfD3Histogram } from './cfD3Histogram.js';
import { cfD3Scatter } from './cfD3Scatter.js';
import { cfD3ResSurfScatter } from './cfD3ResSurfScatter.js';
import { cfD3ResSurfContour } from './cfD3ResSurfContour.js';
import { cfD3GroupedVertBarChart } from './cfD3GroupedVertBarChart.js';
import { cfD3CirclePack } from './cfD3CirclePack.js';
import { cfLeafletMapWithMarkers } from './cfLeafletMapWithMarkers.js';
import { d3ContourStruct2d } from './d3ContourStruct2d.js';
import { d3CutLine } from './d3CutLine.js';
import { d3LineSeries } from './d3LineSeries.js';
import { d3Scatter } from './d3Scatter.js';
import { threeSurf3d } from './threeSurf3d.js';
import { threeTriMesh } from './threeTriMesh.js';
import { triMesh2dRender } from './triMesh2dRender.js';
import { triMesh2dRenderXBar } from './triMesh2dRenderXBar.js';

function getPlotFunc(plotType) {

    const lookup = {

        'cfD3BarChart'            : cfD3BarChart ,
        'cfD3RankCorrBar'         : cfD3RankCorrBar ,
        'cfD3Histogram'           : cfD3Histogram ,
        'cfD3Scatter'             : cfD3Scatter ,
        'cfD3ResSurfScatter'      : cfD3ResSurfScatter ,
        'cfD3ResSurfContour'      : cfD3ResSurfContour ,
        'cfD3GroupedVertBarChart' : cfD3GroupedVertBarChart ,
        'cfD3CirclePack'          : cfD3CirclePack ,
        'cfLeafletMapWithMarkers' : cfLeafletMapWithMarkers ,
        'd3ContourStruct2d'       : d3ContourStruct2d ,
        'd3CutLine'               : d3CutLine ,
        'd3LineSeries'            : d3LineSeries ,
        'd3Scatter'               : d3Scatter ,
        'threeSurf3d'             : threeSurf3d ,
        'threeTriMesh'            : threeTriMesh ,
        'triMesh2dRender'         : triMesh2dRender ,
        'triMesh2dRenderXBar'     : triMesh2dRenderXBar
        
    };

    return lookup[plotType];

}

export { getPlotFunc };