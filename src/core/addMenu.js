import { render } from './render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';


const addMenu = {

	addPlotControls: {
		
		elementOptionsArray: [
				{val: "undefined", text: " "},
				{val: "cfD3BarChart", text: 'Bar Chart'},
				{val: "cfD3Scatter", text: 'Scatter'},
				{val: "cfD3Histogram", text: 'Histogram'}
			],
						
		make: function make(buttonId){
			
			// Create the config element with all required data.
			var config = addMenu.addPlotControls.createConfig(buttonId);
			
			// First create the ids of the required inputs
			addMenu.helpers.makeMenuContainer(config);
			
			// Update the menus with appropriate options
			addMenu.helpers.updateMenus(config);
			
			// Add the on click event: show menu
			addMenu.helpers.addButtonClickEvent(config);
			
			// Add listening to on plot type selection change
			addMenu.addPlotControls.onPlotTypeChangeEvent(config);
			
		}, // make
		
		createConfig: function createConfig(buttonId){
			
			var a = addMenu.addPlotControls;
			var config = {
				title                : "undefined",
				buttonId             : buttonId,
				containerId          : buttonId + 'MenuContainer',
				plotSelectionMenuId  : buttonId + 'MenuContainer' + "PlotSelectionMenu",
				xPropertyMenuId      : buttonId + 'MenuContainer' + "xPropertyMenu",		
				yPropertyMenuId      : buttonId + 'MenuContainer' + "yPropertyMenu",
				menuOkButtonId       : buttonId + 'MenuContainer' + "DialogButtonOk",
				menuCancelButtonId   : buttonId + 'MenuContainer' + "DialogButtonCancel",
				ok                   : a.submitNewPlot,
				cancel               : a.cancelNewPlot,
				userSelectedVariables: ["xProperty", "yProperty"],
				categoricalVariables : [],
				continuousVariables  : [],
				menuItems            : [{options: a.elementOptionsArray,
										 label  : "Select plot type",
										 id     : buttonId + 'MenuContainer' + "PlotSelectionMenu"}],
				newPlot              : [],
				ownerPlotRowIndex    : $("#" + buttonId)[0].parentElement.parentElement.getAttribute("plot-row-index"),
				buttonActivationFunction : a.enableDisableSubmitButton
			};
			
			
			// Check which data variables there are.
			addMenu.helpers.updateDataVariables(config);
			
			config.newPlot =  {
				plotFunc : "undefined",
				layout : { title : undefined, colWidth : 4, height : 300 }, 
				data : { cfData    : dbsliceData.data, 
						 xProperty : undefined, 
						 yProperty : undefined, 
						 cProperty : undefined}
			}; // new plot config
			
			
			return config;
			
		}, // createConfig
		
		clearNewPlot: function clearNewPlot(config){
			config.newPlot.plotFunc = undefined;
			config.newPlot.layout.title = undefined;
			config.newPlot.data.xProperty = undefined;
			config.newPlot.data.yProperty = undefined;
		}, // clearNewPlot
		
		enableDisableSubmitButton: function enableDisableSubmitButton(config){
	
			var submitButton = $("#" + config.menuOkButtonId);
	
			var selectedPlotType = $("#" + config.plotSelectionMenuId).val();
			switch(selectedPlotType){
				case "undefined":
					// Disable
					
					submitButton.prop("disabled", true);
				  break;
				  
				case "cfD3BarChart":
				
					// xProperty enabled, yProperty disabled.
					var isConfigValid = (config.newPlot.data.xProperty !== undefined) && 
										(config.newPlot.data.yProperty === undefined);
					if(isConfigValid){submitButton.prop("disabled", false)}
					else             {submitButton.prop("disabled", true)};
					
				  break;
				  
				case "cfD3Histogram":
					// xProperty enabled, yProperty disabled.
					var isConfigValid = (config.newPlot.data.xProperty !== undefined) && 
										(config.newPlot.data.yProperty === undefined);
					
					if(isConfigValid){submitButton.prop("disabled", false)}
					else             {submitButton.prop("disabled", true)};
				  break;
				  
				case "cfD3Scatter":
					// xProperty enabled, yProperty  enabled.
					var isConfigValid = (config.newPlot.data.xProperty !== undefined) && 
										(config.newPlot.data.yProperty !== undefined);
					
					if(isConfigValid){submitButton.prop("disabled", false)}
					else             {submitButton.prop("disabled", true)};
				  break;
				  
				default :
					// Disable
					submitButton.prop("disabled", true);
				  break;
			}; // switch(selectedPlotType)


		}, // enableDisableSubmitButton
		
		onPlotTypeChangeEvent: function onPlotTypeChangeEvent(config){
			
			var a = addMenu.addPlotControls;
			var h = addMenu.helpers;
			
			d3.select("#" + config.plotSelectionMenuId).on("change", function(){ 
	
				// Check if the data variables have changed.
				h.updateDataVariables(config);
	
				// Use the same switch to populate the appropriate properties in the 'newPlot' object, and to allow further selections.
				var selectedPlotType = $(this).val();
				switch( selectedPlotType ){
					case "undefined":
					  
					  // Remove all variable options.
					  h.removeMenuItemObject( config, config.xPropertyMenuId );
					  h.removeMenuItemObject( config, config.yPropertyMenuId );
					  
					  // Update plot type selection.
					  a.clearNewPlot( config );
					  
					  break;
					  
					case "cfD3BarChart":
					
					  // One variable menu - categorical
					  config.newPlot.plotFunc = cfD3BarChart;
					  
					  // xProperty required.
					  h.addUpdateMenuItemObject( config, config.xPropertyMenuId , config.categoricalVariables);
					  
					  // yProperty must not be present.
					  h.removeMenuItemObject( config, config.yPropertyMenuId );
					  
					  break;
					  
					case "cfD3Histogram":
					  // One variable menu - normative
					  config.newPlot.plotFunc = cfD3Histogram;
					  
					  // xProperty required.
					  h.addUpdateMenuItemObject( config, config.xPropertyMenuId , config.continuousVariables);
					  
					  // yProperty must not be present.
					  h.removeMenuItemObject( config, config.yPropertyMenuId );
					  
					  break;
					  
					case "cfD3Scatter":
					  // Two variables menu - normative
					  config.newPlot.plotFunc = cfD3Scatter;
					  
					  // xProperty and yProperty required.
					  h.addUpdateMenuItemObject( config, config.xPropertyMenuId, config.continuousVariables);
					  h.addUpdateMenuItemObject( config, config.yPropertyMenuId, config.continuousVariables);
					  break;
					  
					default :
					  // Update plot type selection.
					  a.clearNewPlot();
					
					  // Remove all variable options.
					  h.removeMenuItemObject( config, config.xPropertyMenuId );
					  h.removeMenuItemObject( config, config.yPropertyMenuId );
											  
					  console.log("Unexpected plot type selected:", selectedPlotType);
					  break;
				}; // switch( selectedPlotType )
				
				
				
				// Since there was a change in the plot type reset the variable selection menus. Also reset the config object selections.
				h.resetVariableMenuSelections(config.xPropertyMenuId);
				h.resetVariableMenuSelections(config.yPropertyMenuId);
				
				config.newPlot.data.yProperty = undefined;
				config.newPlot.data.xProperty = undefined;
				
				// Update.
				h.updateMenus(config);
				
			}); // on change
			
		}, // onPlotTypeChangeEvent
		
		submitNewPlot: function submitNewPlot(config){
			
			// IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
			var plotToPush = {
			  plotFunc : config.newPlot.plotFunc,
			  layout : { title : config.newPlot.layout.title, 
					  colWidth : config.newPlot.layout.colWidth, 
						height : config.newPlot.layout.height }, 
			  data : {  cfData : config.newPlot.data.cfData, 
					 xProperty : config.newPlot.data.xProperty, 
					 yProperty : config.newPlot.data.yProperty, 
					 cProperty : config.newPlot.data.cProperty}
			};
			
			// Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
			// var plotRowIndex = d3.select(this).attr("plot-row-index")
			// console.log(element)
			
			dbsliceData.session.plotRows[config.ownerPlotRowIndex].plots.push(plotToPush);

			
			// Redraw the screen.
			dbslice.render(dbsliceData.elementId, dbsliceData.session);
			
			// Clear newPlot to be ready for the next addition.
			addMenu.addPlotControls.clearNewPlot(config);
			
			// Reset the variable menu selections!
			addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
			
			// Reset the plot type menu selection.
			document.getElementById(config.plotSelectionMenuId).value = "undefined";
			
			// Remove all variable options.
			addMenu.helpers.removeMenuItemObject( config, config.xPropertyMenuId );
			addMenu.helpers.removeMenuItemObject( config, config.yPropertyMenuId );
			
		}, // submitNewPlot
		
		cancelNewPlot: function cancelNewPlot(config){
			
			addMenu.addPlotControls.clearNewPlot(config);
			
			// Reset the menu selection!
			addMenu.helpers.resetVariableMenuSelections(config.plotSelectionMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
			
			
			// Remove the select menus from the view.
			addMenu.helpers.removeMenuItemObject( config, config.xPropertyMenuId );
			addMenu.helpers.removeMenuItemObject( config, config.yPropertyMenuId );
			
			// Update the menus so that the view reflects the state of the config.
			addMenu.helpers.updateMenus(config);
			
		} // cancelNewPlot
		
		
	}, // addPlotControls
	
	removePlotControls: function removePlotControls(){
		
		var allPlotRows = d3.select("#" + dbsliceData.elementId).selectAll(".plotRowBody");
		allPlotRows.each( function(d,i){
		  // This function operates on a plot row instance. It selects all the plots, and adds a button and its functionality to it. This is only done if the plot row is a metadata row.
		  var plotRowType = d3.select(this).attr("type"); 
		  if (plotRowType == "metadata"){
			
			
			  var plotRowIndex = i;
			
			  var allPlotTitles = d3.select(this).selectAll(".plotTitle");
			  allPlotTitles.each( function (d,i){
				// Append the button, and its functionality, but only if it does no talready exist!
				var addPlotButton = d3.select(this).select(".btn-danger")
				
				if (addPlotButton.empty()){
					// If it dosn't exist, add it.
					d3.select(this).append("button")
						.attr("class", "btn btn-danger float-right")
						.html("x")
						.on("click", function(){
							// This function recalls the position of the data it corresponds to, and subsequently deletes that entry.
							var plotIndex = i;

							dbsliceData.session.plotRows[plotRowIndex].plots.splice(plotIndex,1);

							render(dbsliceData.elementId, dbsliceData.session)
						}); // on
					
				} else {
					// If it does, do nothin.
					
				}; // if
				
				
			  } ); // each 
							
		  }; // if
		  
		} ) // each
		
	}, // removePlotControls

	addPlotRowControls: { 
	
		elementOptionsArray: [
				{val: "undefined", text: " "},
				{val: "metadata", text: 'Metadata overview'},
				{val: "plotter", text: 'Flow field plots'}
			],
	
		make : function make(buttonId){

			// Create the config element with all required data.
			var config = addMenu.addPlotRowControls.createConfig(buttonId);
			
			// First create the ids of the required inputs
			addMenu.helpers.makeMenuContainer(config);
		
			// Update the menus with appropriate options
			addMenu.helpers.updateMenus(config);

			// Show the menu on button click
			addMenu.helpers.addButtonClickEvent(config);
			
			// Add listeners for plot row type changes
			addMenu.addPlotRowControls.onPlotRowTypeChangeEvent(config);
			
			
		}, // make
		
		createConfig: function createConfig(buttonId){
			
			var a = addMenu.addPlotRowControls;
			var config = {
				buttonId                : buttonId,
				containerId             : buttonId + 'MenuContainer',
				plotRowSelectionMenuId  : buttonId + 'MenuContainer' + "PlotRowSelectionMenu",
				menuItems               : [{options: a.elementOptionsArray,
											label  : "Select plot row type",
											id     : buttonId + 'MenuContainer' + "PlotRowSelectionMenu"}],
				menuOkButtonId          : buttonId + 'MenuContainer' + "DialogButtonOk",
				menuCancelButtonId      : buttonId + 'MenuContainer' + "DialogButtonCancel",
				userSelectedVariables   : [],
				newPlotRow              : {title: "New row", 
										   plots: [], 
											type: "undefined",
								   addPlotButton: {id : "undefined", label : "Add plot"}},
				ok                      : a.submitNewPlotRow,
				cancel                  : a.cancelNewPlotRow,
				buttonActivationFunction: a.enableDisableSubmitButton
			};
			
			// The addPlotButton id needs to be updated when the row is submitted!
			
			return config;
		}, // createConfig
		
		clearNewPlotRow: function clearNewPlotRow(config){
			config.newPlotRow.title = "New row";
			config.newPlotRow.plots = [];
			config.newPlotRow.type  = "undefined";
			config.newPlotRow.addPlotButton = {id : "undefined", label : "Add plot"};
		}, // clearNewPlotRow
		
		submitNewPlotRow: function submitNewPlotRow(config){
			
			var plotRowToPush = {title: config.newPlotRow.title, 
								 plots: config.newPlotRow.plots, 
								  type: config.newPlotRow.type,
						addPlotButton : config.newPlotRow.addPlotButton
			};
			
			
			// Find the latest plot row index. Initiate with 0 to try allow for initialisation without ay plot rows!
			var latestRowInd = [0];
			d3.selectAll(".plotRow").each(function(){
				latestRowInd.push(d3.select(this).attr("plot-row-index"));
			})
			latestRowInd = latestRowInd.map(Number);
			var newRowInd = Math.max( ...latestRowInd )+1; // 'spread' operator used!
			
			plotRowToPush.addPlotButton.id = "addPlotButton" + newRowInd;
			
			
			// Push and plot the new row.
			dbsliceData.session.plotRows.push( plotRowToPush );
			dbslice.render(dbsliceData.elementId, dbsliceData.session);
			
			// Reset the plot row type menu selection.
			document.getElementById(config.plotRowSelectionMenuId).value = "undefined";
			
			// Clearthe config
			addMenu.addPlotRowControls.clearNewPlotRow(config);
			
		}, // submitNewPlotRow
		
		cancelNewPlotRow: function cancelNewPlotRow(config){
			addMenu.addPlotRowControls.clearNewPlotRow(config);
		}, // cancelNewPlotRow
		
		enableDisableSubmitButton: function enableDisableSubmitButton(config){
			
			
			var submitButton = $("#" + config.menuOkButtonId);
	
			var selectedPlotRowType = $("#" + config.plotRowSelectionMenuId).val();
			
			
			// If either 'metadata' or 'plotter' were chosen then enable the button.
			switch (selectedPlotRowType){
				case "metadata":
				case "plotter":
					submitButton.prop("disabled", false)
				  break;
				
				case "undefined":
					submitButton.prop("disabled", true)
				  break;
				  
				default:
					submitButton.prop("disabled", true)
				  break;
				
				
			}; // switch
			
		}, // enableDisableSubmitButton
		
		onPlotRowTypeChangeEvent: function onPlotRowTypeChangeEvent(config){
			
			// When the plot row type is changed just check if the button should be enabled.
			d3.select("#" + config.plotRowSelectionMenuId).on("change", function (){
				config.newPlotRow.type = $(this).val();
				
				addMenu.addPlotRowControls.enableDisableSubmitButton(config);
			});
			
			
		} // onPlotRowTypeChangeEvent
		
	}, // addPlotRowControls

	helpers: {
		
		updateDataVariables: function updateDataVariables(config){
			
			// Categorical variables must have a val and text.
			var categoricalVariables = [{val: "undefined", text: " "}];
			for (var i=0; i<dbsliceData.data.metaDataProperties.length; i++){
				categoricalVariables.push({val: dbsliceData.data.metaDataProperties[i], 
										  text: dbsliceData.data.metaDataProperties[i]});
			};

			// Continuous variables.
			var continuousVariables = [{val: "undefined", text: " "}];
			for (var i=0; i<dbsliceData.data.dataProperties.length; i++){
				continuousVariables.push({val: dbsliceData.data.dataProperties[i], 
										 text: dbsliceData.data.dataProperties[i]});
			};
			
			config.categoricalVariables = categoricalVariables;
			config.continuousVariables = continuousVariables;
			
		}, // updateDataVariables
	
		makeMenuContainer: function makeMenuContainer(config){
		
			// CREATE THE CONTAINER FOR THE MENU IN THE BUTTONS CONTAINER.
			// But do this only if it does not already exist.
			if (d3.select("#" + config.containerId).empty()){
			
				var buttonElement = d3.select("#" + config.buttonId);
				var menuContainer = d3.select( buttonElement.node().parentNode )
				  .append("div")
				  .attr("id", config.containerId )
				  .attr("ownerButton", config.buttonId)
				  .attr("class", "card ui-draggable-handle");

				$("#" + config.containerId ).hide();
			}//
		
		}, // makeMenuContainer
	
		updateMenus: function updateMenus(config){

			// This function updates the menu of the pop-up window.
			var menus = d3.select("#" + config.containerId).selectAll(".selectmenu").data(config.menuItems);
			
			// Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.
			menus.enter()
			  .append("label")
				.attr("class", "selectmenuLabel")
				.text( function(d){ return d.label })
			  .append("select")
				.attr("class", "selectmenu")
				.attr("id", function(d){ return d.id });
			
			
			// Update all the menu elements.
			d3.select("#" + config.containerId).selectAll(".selectmenu")   
			  .each( function(d){
				  // This function handles the updating of the menu options for each 'select' element.
			  
				  // Select the 'option' elements and use d3 to update them.
				  var options = d3.select(this).selectAll("option").data(d.options);
				  options
					.enter()
					  .append("option")
						.text( function(d){ return d.text; } )
						.attr("value", function(d){ return d.val; } );
						
				  options = d3.select(this).selectAll("option").data(d.options);
				  options.attr("value", function(d){ return d.val; })
						 .text( function(d){ return d.text; } );
				  
				  
				  // Remove redundant entries.
				  options.exit().remove();
			  }); // d3.select ... each

			
			// Remove exiting menus.
			menus.exit().remove();
			
			
			// LABELS
			// Label creation is handled in the creation of the menus. Removal takes place here.
			var labels = d3.select("#" + config.containerId).selectAll(".selectmenuLabel").data(config.menuItems);
			labels.exit().remove();
			
			
			
			// Add the functionality to update dependent properties of the new element we're adding to the view. E.g. x and y variable names. THIS HAS TO BE HERE, AS THE MENUS ENTER AND EXIT THE VIEW UPON UPDATE, AND THEIR ON CHANGE EVENTS NEED TO BE UPDATED.
			var variables = config.userSelectedVariables;
			for (var i=0; i<variables.length; i++){
				addMenu.helpers.addVariableChangeEvent(config, variables[i]);
			};
					  
			
			config.buttonActivationFunction(config);
			  

		}, // updateMenus

		addUpdateMenuItemObject: function addUpdateMenuItemObject(config, menuItemId, variables){

			// Only add or update the menu item if some selection variables exist.
			// >1 is used as the default option "undefined" is added to all menus.
			if (variables.length>1){

				var menuItems = config.menuItems;
						  
				// Check if the config object already has an item with the 'xPropertyMenu' id.
				var requiredItem = menuItems.find(x => x.id === menuItemId);
				var doesItemExist = requiredItem !== undefined;

				if (doesItemExist){
				  // If the item exists, just update it.
				  var index = menuItems.map(function(d) { return d.id; }).indexOf(menuItemId);

				  config.menuItems[index].options =  variables;

				} else {
				  // If it doesn't, create a new one.
				  requiredItem = {options: variables, label: "Select variable", id: menuItemId}
				  
				  config.menuItems.push(requiredItem);
				};      

			
			} else {
				  // There are no variables. No point in having an empty menu.
				  addMenu.helpers.removeMenuItemObject(config, menuItemId);
				  
				  // Tell the user that the data is empty.
				  
				  var warning = d3.select("#" + config.containerId).selectAll(".warning");
				  if (warning.empty()){
					  d3.select("#" + config.containerId)
						.append("div")
						  .attr("class", "warning")
						  .html("No data has been loaded!")
						  .attr("style", "background-color:pink;font-size:25px;color:white")  
				  }; // if
					
			}; // if
			
		}, // addUpdateMenuItemObject

		removeMenuItemObject: function removeMenuItemObject(config, menuItemId){
	
			var menuItems = config.menuItems;
			var index = config.menuItems.map(function(d) { return d.id; }).indexOf(menuItemId);
			
			if (index>-1){
				menuItems.splice(index,1);
			};
			
			config.menuItems = menuItems;
			
		}, // removeMenuItemObject

		resetVariableMenuSelections: function resetVariableMenuSelections(menuId){

			var propertyMenuHandle = document.getElementById( menuId );
			if (propertyMenuHandle !== null){
			  propertyMenuHandle.value = undefined;
			};
		}, // resetVariableMenuSelections

		addButtonClickEvent: function addButtonClickEvent(config){
			
			// First
			
			$("#" + config.buttonId).click(
				function() {
				
					// Disable all buttons:
					d3.selectAll("button").each(function(){$(this).prop("disabled", true)});
				  
					$( "#" + config.containerId ).dialog({
					draggable: false,
					autoOpen: true,
					modal: true,
					buttons: {  "Ok"    :{text: "Ok",
										  id: config.menuOkButtonId,
										  disabled: true,
										  click: function() {
											  // Add the plot row to the session.
											  config.ok(config);
										  
											  // Close the dialogue.
											  $( this ).dialog( "close" )
											  
											  // Enable all buttons.
											  d3.selectAll("button")
												.each(function(){
														$(this).prop("disabled", false)
													  })
													  
											  // Delete the warning if present.
											  d3.select(this).selectAll(".warning").remove();
											  } // click
										 }, // ok
								"Cancel":{text: "Cancel",
										  id: config.menuCancelButtonId,
										  disabled: false,
										  click: function() { 
											  // Clearup the internal config objects
											  config.cancel(config)
										
											  $( this ).dialog( "close" ) 
											  
											  // Enable all buttons.
											  d3.selectAll("button").each(function(){$(this).prop("disabled", false)})
											  
											  // Delete the warning if present.
											  d3.select(this).selectAll(".warning").remove();
											  } // click
										 } // cancel
							 }, // buttons
					show: {effect: "fade",duration: 50},
					hide: {effect: "fade", duration: 50}
					}).parent().draggable();
					
					$(".ui-dialog-titlebar").remove();
					$(".ui-dialog-buttonpane").attr("class", "card");
				}
			); // on click
		
		
		}, // addButtonClickEvent
			
		addVariableChangeEvent: function addVariableChangeEent(config, variable){
			
			var idOfMenuToListenTo = config.containerId + variable + "Menu";
			
			d3.select("#" +  idOfMenuToListenTo).on("change", function(){ 
			  // Populate the 'newPlot' object.
			  var selectedVariable = $(this).val();
			  
			  config.newPlot.data[variable] = selectedVariable;
			  config.newPlot.layout.title   = selectedVariable;
			  
			  config.buttonActivationFunction(config);
			  
			});
			
		} //addVariableChangeEent
	
	} // helpers

}; // addMenu

export { addMenu };