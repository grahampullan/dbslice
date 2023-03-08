import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';
import { dbsliceData } from './dbsliceData.js';
import { plotRowMakeForD3Each } from './plotRow.js';
import { plotMakeForD3Each, plotRemoveForD3Each, updateAllPlots } from './plot.js';
import * as d3 from 'd3v7';

function update( elementId = dbsliceData.elementId, session = dbsliceData.session ) {

	var element = d3.select( "#" + elementId );

	// Update the exploration session title.
    if (dbsliceData.filteredTaskIds !== undefined){
        element.select(".filteredTaskCount")
            .html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>" );
    } else {
        element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
    }


	// First plot-rows
    const plotRows = element.selectAll( ".plot-row" )
    	.data( session.plotRows, k => k._id );

	plotRows.enter().each(plotRowMakeForD3Each);

	plotRows.exit().remove();

	// Now plots
	const plotRowBodys = element.selectAll( ".plot-row-body" )
		.data( session.plotRows, k => k._id );

	const plots = plotRowBodys.selectAll(".plot")
		.data( d => d.plots, k => k._id);

	plots.enter().each(plotMakeForD3Each);

	plots.exit().each(plotRemoveForD3Each);

	updateAllPlots();
		
			
		
	/*
    var plotRowPlots = plotRows.selectAll( ".plot" )
    	.data( d => d.plots, k => k._id  )
		.filter(function(){
			// Existing plots may have been collapsed, which will impact rendering. Filter them out so they are not being updated when collapsed.
			let parentPlotRow = this.parentElement.parentElement.parentElement;
			return parentPlotRow.style.display != "none"
		})
    	.each( updatePlot );


	// Update the plot titles
   	var plotRowPlotWrappers = plotRows.selectAll( ".plotWrapper")
   		.data( d => d.plots, k => k._id  )
   		.each( function( plotData, index ) {
   			var plotWrapper = d3.select (this);
   			var plotTitleText = plotWrapper.select(".plotTitleText")
    	 	.html( plotData.layout.title );
   		});
	*/
	
	
	
	
	
	
	

    //plotRows.exit().remove();
    //plotRowPlotWrappers.exit().remove();



}











export { update };