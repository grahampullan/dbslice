import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { addMenu } from '../core/addMenu.js';
import { loadData } from '../core/loadData.js';
import { loadSession } from '../core/loadSession.js';

function render(elementId, session) {
    var element = d3.select("#" + elementId);

    if (dbsliceData.filteredTaskIds !== undefined) {
        element.select(".filteredTaskCount").select("p")
          .html("Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length);
    } else {
        element.select(".filteredTaskCount").select("p")
          .html("<p> Number of Tasks in Filter = All </p>");
    }; // if
      

    var plotRows = element.selectAll(".plotRow").data(session.plotRows);
      
    // HANDLE ENTERING PLOT ROWS!
    var newPlotRows = plotRows.enter()
      .append("div")
        .attr("class", "card bg-light plotRow")
        .attr("style", "margin-bottom:20px")
        .attr("plot-row-index", function (d, i) {return i;});
      
    // Add in the container for the title of the plotting section.
    // Make this an input box so that it can be change on te go!
    var newPlotRowsHeader = newPlotRows
      .append("div")
        .attr("class", "card-header plotRowTitle")
        .attr("type", function (d){return d.type});
    newPlotRowsHeader
      .append("h3")
        .attr("style","display:inline")
        .html( function(data){return data.title} )
        .attr("spellcheck", "false")
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
      
      
      
    // UPDATE EXISTING PLOT ROWS!!
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
          var plotTitle = plotWrapper.select(".plotTitle").select("div")
              .html(plotData.layout.title)
      }); // each
      
      
    // HANDLE EXITING PLOT ROWS!!
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
        d3.select(this).append("button")
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
      
    // ADD PLOT BUTTONS - THESE CONTROLS SHOULD UPDATE. DO THEY?
    newPlotRowsHeader.each(function(){
        addMenu.addPlotControls.make( this );
    }); // each
      
    // REMOVE PLOT BUTTONS - THESE ALLOW PLOTS TO BE REMOVED.
    addMenu.removePlotControls();
      
      
      
      
      
    // ADD DATA BUTTON:
    // This button is already created. Just add the functionaity.
    var dataInput = document.createElement('input');
    dataInput.type = 'file';

    // When the file was selected include it in dbslice. Rerender is done in the loading function, as the asynchronous operation can execute rendering before the data is loaded otherwise.
    dataInput.onchange = function(e){
        // BE CAREFULT HERE: file.name IS JUST THE local name without any path!
        var file = e.target.files[0]; 
        loadData.handler(file);
    }; // onchange
    
    // Actually adding functionality to button.
    d3.select("#getData")
        .on("click", function(){dataInput.click()})
      
      
      
      
      
    // LOAD SESSION Button
    // This button already exists. Just assign functionality.
    var sessionInput = document.createElement('input');
    sessionInput.type = 'file';
      
    sessionInput.onchange = function(e){
        // BE CAREFULT HERE: file.name IS JUST THE local name without any path!
        var file = e.target.files[0]; 
        loadSession.handler(file);
    }; // onchange
      
    d3.select("#getSessionButton")
        .on("click", function(){sessionInput.click()})
      
      
    // Control all button activity;
    addMenu.helpers.enableDisableAllButtons();
      
} // render
    


export { render };