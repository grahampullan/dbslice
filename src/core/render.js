import { dbsliceData } from '../core/dbsliceData.js';
import { addMenu } from '../core/addMenu.js';
import { importExportFunctionality } from '../core/importExportFunctionality.js';
import { plotHelpers } from '../plot/plotHelpers.js';

function render() {
        var element = d3.select( "#" + dbsliceData.elementId );

        if (dbsliceData.filteredTaskIds !== undefined) {
            element.select(".filteredTaskCount").select("p")
              .html("Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length);
        } else {
            element.select(".filteredTaskCount").select("p")
              .html("<p> Number of Tasks in Filter = All </p>");
        }; // if
      
        // Remove all d3-tip elements because they end up cluttering the DOM.
		// d3.selectAll(".d3-tip").remove();
        console.log(dbsliceData)
	  
	    // THIS CAN CURRENTLY RESOLVE PROBLEMS F THE DATA IS INCOMPATIBLE.
		// This should work both when new data is loaded and when a new session is loaded.
	    // importExportFunctionality.helpers.onDataAndSessionChangeResolve()
		
	  
	  
	  
        var plotRows = element.selectAll(".plotRow").data(dbsliceData.session.plotRows);
      
        // HANDLE ENTERING PLOT ROWS!
        var newPlotRows = plotRows.enter()
          .append("div")
            .attr("class", "card bg-light plotRow")
            .attr("style", "margin-bottom:20px")
            .attr("plot-row-index", function (d, i) {return i;})
			.each(function(d){
				d.element = this
			})
      
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
            .attr("contenteditable", true)
			
		newPlotRowsHeader.selectAll("h3")
		  .each(function(){
			  this.addEventListener("input", function() {
				  var newTitle = this.innerText
				  d3.select(this).each(function(plotRow){ plotRow.title = newTitle })
			  }, false);
		  }) // each
			
      
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
          .each(plotHelpers.setupPlot.general.makeNewPlot);
      
      
      
        // UPDATE EXISTING PLOT ROWS!!
        // Based on the existing plotRowBodies, select all the plots in them, retrieve all the plotting data associated with this particular plot row, and assign it to the plots in the row. Then make any entering ones.
        var plots = plotRows.selectAll(".plotRowBody").selectAll(".plot")
          .data(function (d){return d.plots;})
		  
		plots
          .enter()
          .each(plotHelpers.setupPlot.general.makeNewPlot);
		  
		// Update the previously existing plots.
        plots
          .each(function(plotCtrl){plotCtrl.plotFunc.update(plotCtrl)});
		  
		// Handle exiting plots before updating the existing ones.
		plots.exit().remove()
		
        
      
        
      
      
        // This updates the headers of the plots because the titles might have changed.
        var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper")
          .data(function (d) { return d.plots; })
          .each(function (plotCtrl, index) {
              var plotWrapper = d3.select(this);
              var plotTitle = plotWrapper.select(".plotTitle").select("div")
                .html(plotCtrl.format.title)
          }); // each
      
	  
	    // HANDLE EXITING PLOT ROWS!!
        plotRows.exit().remove();
        plotRowPlotWrappers.exit().remove();
        
      
      

	  
	  
        // FUNCTIONALITY
	  
	  
        // ADD PLOT ROW BUTTON.
        var addPlotRowButtonId = "addPlotRowButton"
        createAddPlotRowButton(addPlotRowButtonId)
      
        // REMOVE PLOT ROW
		createRemovePlotRowButtons(newPlotRowsHeader)
      
        // ADD PLOT BUTTONS
        newPlotRowsHeader.each(function(){
            addMenu.addPlotControls.make( this );
        }); // each
      
        // REMOVE PLOT BUTTONS
        addMenu.removePlotControls();
      
      
      

	    // DROPDOWN MENU FUNCTIONALITY - MOVE TO SEPARATE FUNCTION??
      
      
        // REPLACE CURRENT DATA OPTION:
		var dataReplace = createFileInputElement( importExportFunctionality.importing.metadata, "replace")
        d3.select("#replaceData")
          .on("click", function(){dataReplace.click()})
		  
		// ADD TO CURRENT DATA OPTION:
		var dataInput = createFileInputElement( importExportFunctionality.importing.metadata, "add")
        d3.select("#addData")
          .on("click", function(){dataInput.click()})
		  
		// REMOVE SOME CURRENT DATA OPTION:
		// This requires a popup. The popup needs to be opened on clicking the option. Upon submitting a form the underlying functionality is then called.
		addMenu.removeDataControls.make("removeData")
     
        // LOAD SESSION Button
	    var sessionInput = createFileInputElement( importExportFunctionality.importing.session )
        d3.select("#loadSession")
          .on("click", function(){sessionInput.click()})
      
		
		
		
		
		
		
        // Control all button and menu activity;
        addMenu.helpers.enableDisableAllButtons();
		
		
		// HELPER FUNCTIONS:
		function createFileInputElement(loadFunction, dataAction){
			
			
			
			
			// This button is already created. Just add the functionaity.
			var dataInput = document.createElement('input');
			dataInput.type = 'file';

			// When the file was selected include it in dbslice. Rerender is done in the loading function, as the asynchronous operation can execute rendering before the data is loaded otherwise.
			dataInput.onchange = function(e){
				// BE CAREFULT HERE: file.name IS JUST THE local name without any path!
				var file = e.target.files[0]; 
				// importExportFunctionality.importing.handler(file);
				loadFunction(file, dataAction)
			}; // onchange
			
		  return dataInput
			
		} // createGetDataFunctionality
 
	    function createAddPlotRowButton(addPlotRowButtonId){
			
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
			
		} // createAddPlotRowButton
		
		function createRemovePlotRowButtons(newPlotRowsHeader){
			
			newPlotRowsHeader.each(function(data){
				// Give each of the plot rows a delete button.
				d3.select(this).append("button")
				  .attr("class", "btn btn-danger float-right removePlotButton")
				  .html("x")
				  .on("click", function(){
					  
					  // Remove the plot row from the state
					  var ownerPlotRow = d3.select(this.parentNode.parentNode)
					  .each(function(clickedPlotRowCtrl){
						  
						  dbsliceData.session.plotRows = dbsliceData.session.plotRows.filter(function(plotRowCtrl){
							  return plotRowCtrl != clickedPlotRowCtrl
						  }) // filter  
					  }) // each
					  
					 
					  // Remove from DOM
					  ownerPlotRow.remove()
					 
					  // render();
					 
				  }); // on
			}); // each
			
		} // createRemovePlotRowButtons
		
		
    } // render

    


export { render };