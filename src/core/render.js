import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { addMenu } from '../core/addMenu.js';

function render(elementId, session) {
    var element = d3.select("#" + elementId);

    if (dbsliceData.filteredTaskIds !== undefined) {
      element.select(".filteredTaskCount")
        .html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>");
    } else {
      element.select(".filteredTaskCount")
        .html("<p> Number of Tasks in Filter = All </p>");
    }; // if

    var plotRows = element.selectAll(".plotRow").data(session.plotRows);
    var newPlotRows = plotRows.enter()
      .append("div")
        .attr("class", "card bg-light plotRow")
        .attr("style", "margin-bottom:20px")
        .attr("plot-row-index", function (d, i) {return i;});
  
    // Add in the container for the title of the plotting section.
    // Make this an input box so that it can be change on te go!
    var newPlotRowsHeader = newPlotRows
      .append("div")
        .attr("class", "card-header plotRowTitle");
    newPlotRowsHeader
      .append("h3")
        .attr("style","display:inline")
        .html( function(data){return data.title} )
        .attr("contenteditable", true);
  
    // Give all entering plot rows a body to hold the plots.
    var newPlotRowsBody = newPlotRows
      .append("div")
        .attr("class", "row no-gutters plotRowBody")
        .attr("plot-row-index", function (d, i){return i;})
        .attr("type", function (d){return d.type});
  
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
  
    plotRows.exit().remove();
    plotRowPlotWrappers.exit().remove();
  
  
  
  
  
  
    // FUNCTIONALITY
  
  
    // ADD PLOT ROW BUTTON.
    var addPlotRowButtonId = "addPlotRowButton";
    var addPlotRowButton   = d3.select("#" + addPlotRowButtonId);
    if (addPlotRowButton.empty()){
        // Add the button.
        d3.select("#" + dbsliceData.elementId)
          .append("button")
            .attr("id", addPlotRowButtonId)
            .attr("class", "btn btn-info btn-block")
            .html("+");
          
        addMenu.addPlotRowControls.make(addPlotRowButtonId);
    } else {
        // Move the button down
        var b = document.getElementById(addPlotRowButtonId);
        b.parentNode.appendChild(b);
    }; // if
  
  
  
    // REMOVE PLOT ROW
    newPlotRowsHeader.each(function(data){
       // Give each of the plot rows a delete button.
       d3.select(this)
	     .append("button")
           .attr("id", function(d,i){return "removePlotRowButton"+i; })
           .attr("class", "btn btn-danger float-right")
           .html("x")
           .on("click", function(){
               // Select the parent plot row, and get its index.
               var ownerPlotRowInd = d3.select(this.parentNode.parentNode).attr("plot-row-index")
             
               dbsliceData.session.plotRows.splice(ownerPlotRowInd,1);
             
               render(dbsliceData.elementId, dbsliceData.session);
         });
    }); // each
  
  
  
    // ADD PLOT BUTTONS
    newPlotRowsHeader.each(function(data){
        if(data.addPlotButton !== undefined){
            // If a button is defined, add it in.
            d3.select(this)
			  .append("button")
                .attr("id", data.addPlotButton.id)
                .attr("class", "btn btn-success float-right")
                .html(data.addPlotButton.label);
             
            // Add functionality
            // createAddPlotControls( data.addPlotButton.id )
            addMenu.addPlotControls.make( data.addPlotButton.id );
        }; // if
    }); // each
  
    // REMOVE PLOT BUTTONS.
    addMenu.removePlotControls();
  
} // render



export { render };