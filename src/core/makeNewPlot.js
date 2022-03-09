import * as d3 from 'd3';
import { getPlotFunc } from '../plot/getPlotFunc.js';

function makeNewPlot( plotData, index ) {

	let plotRowIndex = d3.select(this._parent).attr("plot-row-index");

    var plot = d3.select( this )
    	.append( "div" ).attr( "class", "col-md-"+plotData.layout.colWidth+" plotWrapper" )
    	.append( "div" ).attr( "class", "card" );

    var plotHeader = plot.append( "div" )
        .attr( "class", "card-header plotTitle")
        .style("padding","2px")
        .style("padding-left","5px")
    	.html( plotData.layout.title );

    var plotBody = plot.append( "div" )
    	.attr( "class", "plot")
    	.attr( "plot-row-index", plotRowIndex)
    	.attr( "plot-index", index);

	let plotFunc = plotData.plotFunc;
	if ( plotData.plotType !== undefined ) {
		plotFunc = getPlotFunc(plotData.plotType); 
	}
	
    plotFunc.make(plotBody.node(),plotData.data,plotData.layout);

}

export { makeNewPlot };