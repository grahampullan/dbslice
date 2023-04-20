import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';
import { dbsliceData } from './dbsliceData.js';
import { plotRowMakeForD3Each } from './plotRow.js';
import { plotMakeForD3Each, plotRemoveForD3Each, plotUpdateForD3Each } from './plot.js';
import * as d3 from 'd3v7';

function update( elementId = dbsliceData.elementId, session = dbsliceData.session ) {

	var element = d3.select( "#" + elementId );

	let tasksName = "Tasks";
	if ( dbsliceData.session.uiConfig.replaceTasksNameWith !== undefined ) {
		tasksName = dbsliceData.session.uiConfig.replaceTasksNameWith;
	}

	// Update the exploration session title.
    if (dbsliceData.filteredTaskIds !== undefined){
        element.select(".filteredTaskCount")
            .html(`<p> Number of ${tasksName} in Filter = ${dbsliceData.filteredTaskIds.length} </p>` );
    } else {
        element.select(".filteredTaskCount").html(`<p> Number of ${tasksName} in Filter = All </p>`);
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

	plots.each(plotUpdateForD3Each);

}











export { update };