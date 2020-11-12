import { dbsliceData } from '../core/dbsliceData.js';
import { addMenu } from '../core/addMenu.js';
import { importExportFunctionality } from '../core/importExportFunctionality.js';
import { plotHelpers } from '../plot/plotHelpers.js';

function render() {
        var element = d3.select( "#" + dbsliceData.elementId );

		// Update the selected task counter
		builder.updateSessionHeader(element)
		

	  
        var plotRows = element
		  .selectAll(".plotRow")
		  .data(dbsliceData.session.plotRows);
      
        // HANDLE ENTERING PLOT ROWS!
		var newPlotRows = builder.makePlotRowContainers(plotRows)
        
      
        // Add in the container for the title of the plotting section.
        // Make this an input box so that it can be change on te go!
		builder.makePlotRowHeaders(newPlotRows)
		

			
      
        // Give all entering plot rows a body to hold the plots.
        builder.makePlotRowBodies(newPlotRows)
      
        // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.
        builder.makeUpdatePlotRowPlots(newPlotRows)
      
      
      
        // UPDATE EXISTING PLOT ROWS!!
		builder.makeUpdatePlotRowPlots(plotRows)


	  
	  
	  
        // ADD PLOT ROW BUTTON.
		builder.makeAddPlotRowButton()
        
        


	    // DROPDOWN MENU FUNCTIONALITY - MOVE TO SEPARATE FUNCTION??
      // Control all button and menu activity;
        addMenu.helpers.enableDisableAllButtons();
      
        
 
		// Add plot button must always be at the bottom
		var buttonDOM = document.getElementById("addPlotRowButton")
		var buttonParentDOM = buttonDOM.parentElement
		buttonDOM.remove()
		buttonParentDOM.appendChild(buttonDOM)
		
		
		
    } // render

export { render };