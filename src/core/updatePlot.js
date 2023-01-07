import * as d3 from 'd3';
import { getPlotFunc } from '../plot/getPlotFunc.js';
import { fetchPlotData } from './fetchPlotData.js';
import { dbsliceData } from './dbsliceData.js';

function updatePlot( plotData, index ) {

    var plot = d3.select( this ); 
    
    let plotFunc = plotData.plotFunc;
	if ( plotData.plotType !== undefined ) {
		plotFunc = getPlotFunc(plotData.plotType); 
	}

    if (  (plotData.fetchData !== undefined && plotData.fetchData._fetchNow )  ||
		(plotData.fetchData !== undefined && plotData.fetchData.autoFetchOnFilterChange && dbsliceData.allowAutoFetch) ){
		fetchPlotData(plotData.fetchData).then( (data) => {
			plotData.data = data;
            plotData.layout.newData = true;
			plotData.fetchData._fetchNow = false;
			plotFunc.update(plot.node(),plotData.data,plotData.layout);
		})
	} else {
    	plotFunc.update(plot.node(),plotData.data,plotData.layout);
	}

}

export { updatePlot };