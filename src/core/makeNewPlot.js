import * as d3 from 'd3';
import { getPlotFunc } from '../plot/getPlotFunc.js';
import { fetchPlotData } from './fetchPlotData.js';


// Importing dbsliceData gives access to it here. Because dbsliceData is adjusted in other parts of the application the changes, including any added plot data, are available here.
// Update is required to execute the remove plot interaction.
import { dbsliceData } from '../core/dbsliceData.js';
import { update } from './update.js';


/* HTML BACKBONE
<div class="col-md-${colWidth} plotWrapper">
  <div class="card">
    <div class="card-header plotTitle">
	</div>
	<div class="plot">
	</div>
  </div>
</div>
*/


/*

*/



function makeNewPlot( plotData, index ) {

	let plotRowIndex = d3.select(this._parent).attr("plot-row-index");
	let plotRow = dbsliceData.session.plotRows[plotRowIndex];

    var plot = d3.select( this )
    	.append( "div" ).attr( "class", "col-md-"+plotData.layout.colWidth+" plotWrapper" )
    	.append( "div" ).attr( "class", "card" );

    var plotHeader = plot.append( "div" )
        .attr( "class", "card-header plotTitle")
        .style("padding","2px")
        .style("padding-left","5px")
		
	// Separate div for title so that it can be changed in isolation
	plotHeader.append("div")
		.attr("class", "plotTitleText")
	    .style("float", "left")
    	.html( plotData.layout.title );
		
	// Remove plot button option can be explicitly stated by the user as true/false, if not specified thedecision falls back on whether the plot row is metadata or on-demand.
	if( plotData.layout.removePlotButton == undefined ? !plotRow.ctrl : plotData.layout.removePlotButton ){
	  plotHeader.append("button")
	    .attr("class", "btn removePlot")
		.style("float", "right")
		.style("cursor", "pointer")
		.style("padding", "2px 1.5px 0px 2px")
		.html('<box-icon name="trash" size="xs"></box-icon>')
		.on("click", function(){

			// data has to come from div.plot, which is the one that gets its data actually updated.
			let d = this.parentElement.parentElement.querySelector("div.plot").__data__;
			let plotInd = plotRow.plots.indexOf(d);
			
			// indexOf will return -1 if plot is not found, and splice will remove from the end. This is a safety feature so that this doesn't happen.
			if(plotInd>-1){
				plotRow.plots.splice(plotInd, 1)
			}
			
						
			update( dbsliceData.elementId , dbsliceData.session );
			
		});
	} // if
	
	
	
	if( plotData.layout.configurePlotButton == undefined ? !plotRow.ctrl : plotData.layout.configurePlotButton ){
		// Button to change the plot config.
		plotHeader.append("button")
			.attr("class", "btn configurePlot")
			.style("float", "right")
			.style("cursor", "pointer")
			.style("padding", "2px 1.5px 0px 2px")
			.html('<box-icon name="cog" size="xs"></box-icon>')
			.on("click", function(){

				// data has to come from div.plot, which is the one that gets its data actually updated.
				let d = this.parentElement.parentElement.querySelector("div.plot").__data__;
				
				
				// Try using the existing add plot modal, but just fill it in with the current selections.
				// A dummy plotRow object is added to the modal for this operation to capture the config.
				let dummyPlotRowObj = {plots: [], _maxPlotId: undefined};
				let configureConfig = {
					plotType: false,
					data: true,
					layout: true
				}
				
				dbsliceData.modal.currentPlotRow = dummyPlotRowObj;
				dbsliceData.modal.populateFrom(d);
				dbsliceData.modal.disableEnableOptionGroups(configureConfig);
				dbsliceData.modal.show();

				dbsliceData.modal.onsubmit = function(){
					// On submission hte returned config needs to populate the existing object.
					dbsliceData.modal.populateTo(d);
					dbsliceData.modal.disableEnableOptionGroups({});
					
					// Then delete the onsubmit function added here.
					dbsliceData.modal.onsubmit = function(){}; //
					update(  dbsliceData.elementId , dbsliceData.session );
				} // onsubmit
				
			});
	} // if
	
	
	
	
	
	
	

    var plotBody = plot.append( "div" )
    	.attr( "class", "plot")
    	.attr( "plot-row-index", plotRowIndex)
    	.attr( "plot-index", index);

	let plotFunc = plotData.plotFunc;
	if ( plotData.plotType !== undefined ) {
		plotFunc = getPlotFunc(plotData.plotType); 
	}
	
	if ( plotData.fetchData !== undefined ) {
		fetchPlotData(plotData.fetchData).then( (data) => {
			plotData.data = data;
			plotFunc.make(plotBody.node(),plotData.data,plotData.layout);
		})
	} else {
    	plotFunc.make(plotBody.node(),plotData.data,plotData.layout);
	}

}

export { makeNewPlot };