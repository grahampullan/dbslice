import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { createAddPlotControls } from '../core/createAddPlotControls.js';

function update(elementId, session) {
  var element = d3.select("#" + elementId);

  if (dbsliceData.filteredTaskIds !== undefined) {
	element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>");
  } else {
	element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
  }

  var plotRows = element.selectAll(".plotRow").data(session.plotRows);
  var newPlotRows = plotRows.enter()
	.append("div")
	  .attr("class", "card bg-light plotRow")
	  .attr("style", "margin-bottom:20px")
	  .attr("plot-row-index", function (d, i) {return i;});
  
  // Add in the container for the title of the plotting section.
  var newPlotRowsHeader = newPlotRows
	.append("div")
	  .attr("class", "card-header plotRowTitle");
  newPlotRowsHeader
	.append("h3")
	  .attr("style","display:inline")
	  .html( function(data){return data.title} );
  
  // Add button.
  newPlotRowsHeader.each(function(data){
	 if(data.headerButton !== undefined){
		 // If a button is defined, add it in.
		 d3.select(this).append("button")
			 .attr("id", data.headerButton.id)
			 .attr("class", "btn btn-success float-right")
			 .html(data.headerButton.label);
			 
		// Add functionality
		createAddPlotControls( data.headerButton.id )
	 }; // if
  }); // each
  
  
  // Give all entering plot rows a body to hold the plots.
  var newPlotRowsBody = newPlotRows
	.append("div")
	  .attr("class", "row no-gutters plotRowBody")
	  .attr("plot-row-index", function (d, i){return i;});
  
  // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.
  var newPlots = newPlotRowsBody.selectAll(".plot")
	.data(function (d){return d.plots;})
	.enter()
	.each(makeNewPlot);
  
  // Based on the existing plotRowBodies, select all the plots in them, retrieve all the plotting data associated with this particular plot row, and assign it to the plots in the row. Then make any entering ones.
  plotRows.selectAll(".plotRowBody").selectAll(".plot")
	.data(function (d){return d.plots;})
	.enter()
	.each(makeNewPlot);
  
  // Update the previously existing plots.
  var plotRowPlots = plotRows.selectAll(".plot")
	.data(function (d){return d.plots;})
	.each(updatePlot);
  
  
  // This updates the headers of the plots because the titles might have changed.
  var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper")
	.data(function (d) { return d.plots; })
	.each(function (plotData, index) {
		var plotWrapper = d3.select(this);
		var plotTitle = plotWrapper.select(".plotTitle")
			.html(plotData.layout.title)
	}); // each
  
  // Handle the button functionality completely separately!! Select all the plot rows. Move through them, and for each of them add the buttons in the plotTitle elements. Then add the functionality.
  var allPlotRows = element.selectAll(".plotRow");
  allPlotRows.each( function(d,i){
	  // This function operates on a plot row instance. It selects all the plots, and adds a button and its functionality to it.
	  var plotRowIndex = i;
	
	  var allPlotTitles = d3.select(this).selectAll(".plotTitle");
	  allPlotTitles.each( function (d,i){
		// Append the button, and its functionality.
		d3.select(this).append("button")
			.attr("class", "btn btn-danger float-right")
			.html("x")
			.on("click", function(){
				// This function recalls the position of the data it corresponds to, and subsequently deletes that entry.
				var plotIndex = i;

				dbsliceData.session.plotRows[plotRowIndex].plots.splice(plotIndex,1);

				update(dbsliceData.elementId, dbsliceData.session)
			}); // on
	} ); // each 
  } ) // each
  
  
  plotRows.exit().remove();
  plotRowPlotWrappers.exit().remove();
}



export { update };