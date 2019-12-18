import { render } from './render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';
import { d3LineSeries } from '../plot/d3LineSeries.js';

const addMenu = {

	addPlotControls: {
		
		elementOptionsArray: function(plotRowType){
			
			var options;
			switch(plotRowType){
				case 'metadata':
					options = [
						{val: "undefined", text: " "},
						{val: "cfD3BarChart", text: 'Bar Chart'},
						{val: "cfD3Scatter", text: 'Scatter'},
						{val: "cfD3Histogram", text: 'Histogram'}
					]
					break;
				
				case 'plotter':
					options = [
						{val: "undefined", text: " "},
						{val: "d3LineSeries", text: 'Line'}
					]
					break;
			}; // switch
			
			return options;
			
		},
						
		make: function make(plotRowElement){
			
			
			
			var plotRowIndex = d3.select($(plotRowElement)[0].parentNode).attr("plot-row-index");
			var plotRowType = d3.select(plotRowElement).attr("type");
			
			switch(plotRowType){
				case "metadata":
					var buttonLabel = "Add plot"
				  break;
				case "plotter":
					var buttonLabel = "Configure plot"
			}; // switch
			
			// Append a button to each plot row title, if it does not exist already.
			if(d3.select(plotRowElement).selectAll(".btn-success").empty()){
				// If a button does not exist,make it.
				var buttonId = "addPlotButton" + plotRowIndex;
				d3.select(plotRowElement).append("button")
					.attr("style","display:inline")
					.attr("id", buttonId)
					.attr("class", "btn btn-success float-right")
					.html(buttonLabel);
			}; // if
			
			
			// FUNCTIONALITY!!
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
			
			// The config depends on the plot row type.
			var plotRowType = $("#" + buttonId)[0].parentElement.getAttribute('type');
			
			var a = addMenu.addPlotControls;
			var config = {
				title                : "undefined",
				buttonId             : buttonId,
				containerId          : buttonId + 'MenuContainer',
				plotSelectionMenuId  : buttonId + 'MenuContainer' + "PlotSelectionMenu",
				xPropertyMenuId      : buttonId + 'MenuContainer' + "xPropertyMenu",		
				yPropertyMenuId      : buttonId + 'MenuContainer' + "yPropertyMenu",
					sliceMenuId      : buttonId + 'MenuContainer' +     "sliceMenu",
				menuOkButtonId       : buttonId + 'MenuContainer' + "DialogButtonOk",
				menuCancelButtonId   : buttonId + 'MenuContainer' + "DialogButtonCancel",
				ok                   : a.submitNewPlot,
				cancel               : a.cancelNewPlot,
				userSelectedVariables: ["xProperty", "yProperty", "slice"],
				categoricalVariables : [],
				continuousVariables  : [],
				sliceVariables       : [],
				menuItems            : [{options: a.elementOptionsArray(plotRowType),
										 label  : "Select plot type",
										 id     : buttonId + 'MenuContainer' + "PlotSelectionMenu"}],
				newPlot              : [],
				ownerPlotRowIndex    : $("#" + buttonId)[0].parentElement.parentElement.getAttribute("plot-row-index"),
				ownerPlotRowType     : plotRowType,
				buttonActivationFunction : a.enableDisableSubmitButton
			};
			
			
			// Check and add the available data variables.
			addMenu.helpers.updateDataVariables(config);
			
			// Create the appropriate newPlot object in the config.
			addMenu.addPlotControls.createNewPlot(config);
			
			
			return config;
			
		}, // createConfig
		
		createNewPlot: function createNewPlot(config){
			
			switch(config.ownerPlotRowType){
				case "metadata":
					config.newPlot =  {
						plotFunc : "undefined",
						layout : { title : undefined, colWidth : 4, height : 300 }, 
						data : { xProperty : undefined, 
								 yProperty : undefined, 
								 cProperty : undefined}
					}; // new plot config
					break;
					
				case "plotter":
					// axis labels should come from the data!
					// slices contains any previously added slices.
					config.newPlot = {
						plotFunc : undefined,
						layout : { title: undefined, colWidth : 4, height : 300},
						data : { slice : undefined},
						slices : []
					}; // new plot config
					
					// FORMATDATAFUNC IS DIFFERENT FOR EACH PLOT TYPE!
					
					break;
					
				default:
					// Do nothing?
					break;
				
			}; // switch
			
			
			
		}, // createNewPlot
		
		clearNewPlot: function clearNewPlot(config){
			
			switch(config.ownerPlotRowType){
				case "metadata":
					config.newPlot.plotFunc = undefined;
					config.newPlot.layout.title = undefined;
					config.newPlot.data.xProperty = undefined;
					config.newPlot.data.yProperty = undefined;
					break;
				case "plotter":
					config.newPlot.plotFunc = undefined;
					config.newPlot.data = {};
					break;
				default:
					// Do nothing?
					break;
			}; // switch
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
				  
				case "d3LineSeries":
					// Nothing else is needed, just enable the submit button.
					submitButton.prop("disabled", false);
				
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
					  h.removeMenuItemObject( config, config.sliceMenuId );
					  
					  // Update plot type selection.
					  a.clearNewPlot( config );
					  
					  break;
					  
					// METADATA PLOTS
					  
					case "cfD3BarChart":
					
					  // One variable menu - categorical
					  config.newPlot.plotFunc = cfD3BarChart;
					  
					  // xProperty required.
					  h.addUpdateMenuItemObject( config, config.xPropertyMenuId , config.categoricalVariables);
					  
					  // yProperty must not be present.
					  h.removeMenuItemObject( config, config.yPropertyMenuId );
					  
					  break;
					  
					case "cfD3Histogram":
					  // One variable menu - ordinal
					  config.newPlot.plotFunc = cfD3Histogram;
					  
					  // xProperty required.
					  h.addUpdateMenuItemObject( config, config.xPropertyMenuId , config.continuousVariables);
					  
					  // yProperty must not be present.
					  h.removeMenuItemObject( config, config.yPropertyMenuId );
					  
					  break;
					  
					case "cfD3Scatter":
					  // Two variables menu - ordinal
					  config.newPlot.plotFunc = cfD3Scatter;
					  
					  // xProperty and yProperty required.
					  h.addUpdateMenuItemObject( config, config.xPropertyMenuId, config.continuousVariables);
					  h.addUpdateMenuItemObject( config, config.yPropertyMenuId, config.continuousVariables);
					  break;
					  
					  
					// 2D/3D PLOTS
					case "d3LineSeries":
					  // Menu offering different slices.
					  config.newPlot.plotFunc = d3LineSeries;
					  
					  // slice is required.
					  h.addUpdateMenuItemObject( config, config.sliceMenuId, config.sliceVariables);
					  
					  
					  break;
					  
					default :
					  // Update plot type selection.
					  a.clearNewPlot(config);
					
					  // Remove all variable options.
					  h.removeMenuItemObject( config, config.xPropertyMenuId );
					  h.removeMenuItemObject( config, config.yPropertyMenuId );
					  h.removeMenuItemObject( config, config.sliceMenuId );
											  
					  console.log("Unexpected plot type selected:", selectedPlotType);
					  break;
				}; // switch( selectedPlotType )
				
				
				
				// Since there was a change in the plot type reset the variable selection menus. Also reset the config object selections.
				h.resetVariableMenuSelections(config.xPropertyMenuId);
				h.resetVariableMenuSelections(config.yPropertyMenuId);
				h.resetVariableMenuSelections(config.sliceMenuId);
				
				switch(config.ownerPlotRwoType){
					case "metadata":
						config.newPlot.data.yProperty = undefined;
						config.newPlot.data.xProperty = undefined;
						break;
					case "plotter":
						config.newPlot.data.slice = undefined;
				}; // if
				
				
				// Update.
				h.updateMenus(config);
				
			}); // on change
			
		}, // onPlotTypeChangeEvent
		
		submitNewPlot: function submitNewPlot(config){
			
			// IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
			switch(config.ownerPlotRowType){
				case "metadata":
					var plotToPush = {
						plotFunc : config.newPlot.plotFunc,
						layout : { title : config.newPlot.layout.title, 
								colWidth : config.newPlot.layout.colWidth, 
								  height : config.newPlot.layout.height }, 
						data : {  cfData : dbsliceData.data, 
							   xProperty : config.newPlot.data.xProperty, 
							   yProperty : config.newPlot.data.yProperty, 
							   cProperty : config.newPlot.data.cProperty}
					}; // plotToPush
					
					dbsliceData.session.plotRows[config.ownerPlotRowIndex].plots.push(plotToPush);
					break;
					
				case "plotter":
					// Here a plot is not pushed, but rather a config is passed to the plotRow. The Promises funtionality then creates the plots.				
					
					// Alternately the metadata should include the keys along which the roups can be formed. Then the user canselect how th edata should be grouped. This would allow easy comparison of different spans, or tasks.
					
					// The keys are the variable names in 'metadata', which are prefixed with 's_' for splice. This allows the user to select which data to compare when setting up the metadata. More flexibility is gained this way, as no hardcoded templating needs to be introduced, and no clumsy user interfaces.
					
					// Store the currently selected slice, then push everything forward.
					config.newPlot.slices.push(config.newPlot.data.slice)
					
					var plotCtrl = {
						layout : { colWidth : 4, height : 400, xAxisLabel : "Axial distance",yAxisLabel : "Mach number" },
						data : dbsliceData.data,
						plotFunc : config.newPlot.plotFunc,
						taskIds : null,
						sliceIds : config.newPlot.slices,
						tasksByFilter : true,
						maxTasks : 200,
						urlTemplate : null,
						formatDataFunc : function ( data ) {
							var series = [];
							data.forEach( function( line ) { series.push( line ) } );
							return { series : series };
						}
					};
				
					dbsliceData.session.plotRows[config.ownerPlotRowIndex].ctrl = plotCtrl;
					
					
					break;
			}; // switch
			
			
			// Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
			// var plotRowIndex = d3.select(this).attr("plot-row-index")
			// console.log(element)
			
			

			
			// Redraw the screen.
			dbslice.render(dbsliceData.elementId, dbsliceData.session);
			
			// Clear newPlot to be ready for the next addition.
			addMenu.addPlotControls.clearNewPlot(config);
			
			// Reset the variable menu selections!
			addMenu.helpers.resetVariableMenuSelections(config.plotSelectionMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.sliceMenuId);
			
			// Reset the plot type menu selection.
			document.getElementById(config.plotSelectionMenuId).value = "undefined";
			
			// Remove all variable options.
			addMenu.helpers.removeMenuItemObject( config, config.xPropertyMenuId );
			addMenu.helpers.removeMenuItemObject( config, config.yPropertyMenuId );
			addMenu.helpers.removeMenuItemObject( config, config.sliceMenuId );
			
			// Update the menus so that the view reflects the state of the config.
			addMenu.helpers.updateMenus(config);
			
		}, // submitNewPlot
		
		cancelNewPlot: function cancelNewPlot(config){
			
			addMenu.addPlotControls.clearNewPlot(config);
			
			// Reset the menu selection!
			addMenu.helpers.resetVariableMenuSelections(config.plotSelectionMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
			addMenu.helpers.resetVariableMenuSelections(config.sliceMenuId);
			
			
			// Remove the select menus from the view.
			addMenu.helpers.removeMenuItemObject( config, config.xPropertyMenuId );
			addMenu.helpers.removeMenuItemObject( config, config.yPropertyMenuId );
			addMenu.helpers.removeMenuItemObject( config, config.sliceMenuId );
			
			// Update the menus so that the view reflects the state of the config.
			addMenu.helpers.updateMenus(config);
			
		} // cancelNewPlot
		
		
	}, // addPlotControls
	
	removePlotControls: function removePlotControls(){
		
		var allPlotRows = d3.select("#" + dbsliceData.elementId).selectAll(".plotRowBody");
		allPlotRows.each( function(d,i){
			// This function operates on a plot row instance. It selects all the plots, and adds a button and its functionality to it. This is only done if the plot row is a metadata row.
			var plotRowType = d3.select(this).attr("type"); 
			
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

							// Remove the plot from view.
							dbsliceData.session.plotRows[plotRowIndex].plots.splice(plotIndex,1);

							// If necesary also remove the corresponding ctrl from the plotter rows.
							if('ctrl' in dbsliceData.session.plotRows[plotRowIndex]){
								dbsliceData.session.plotRows[plotRowIndex].ctrl.sliceIds.splice(plotIndex,1);
							}; // if

							render(dbsliceData.elementId, dbsliceData.session)
						}); // on
					
				} else {
					// If it doesn't, do nothing.
					
				}; // if
				
				
			} ); // each 
							
			
		  
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
			
			// If this is a 'plotter' plot row it also requires a 'ctrl' field. This is filled out later by users actions.
			if(plotRowToPush.type === "plotter"){
				plotRowToPush.ctrl = undefined;
			}; // if
			
			// Find the latest plot row index. Initiate with 0 to try allow for initialisation without any plot rows!
			var newRowInd = addMenu.helpers.findLatestPlotRowInd();
			
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
			
			// Slice variables
			var sliceVariables = [{val: "undefined", text: " "}];
			for (var i=0; i<dbsliceData.data.sliceProperties.length; i++){
				sliceVariables.push({val: dbsliceData.data.sliceProperties[i], 
									text: dbsliceData.data.sliceProperties[i]});
			};
			
			config.categoricalVariables = categoricalVariables;
			 config.continuousVariables =  continuousVariables;
				  config.sliceVariables =       sliceVariables;
			
			
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
				  
					// Make the dialog
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
											  
											  // Enable all relevant buttons.
											  addMenu.helpers.enableDisableAllButtons();
													  
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
											  addMenu.helpers.enableDisableAllButtons();
											  
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
			
		addVariableChangeEvent: function addVariableChangeEvent(config, variable){
			
			var idOfMenuToListenTo = config.containerId + variable + "Menu";
			
			d3.select("#" +  idOfMenuToListenTo).on("change", function(){ 
			  // Populate the 'newPlot' object.
			  var selectedVariable = $(this).val();
			  
			  config.newPlot.data[variable] = selectedVariable;
			  config.newPlot.layout.title   = selectedVariable;
			  
			  config.buttonActivationFunction(config);
			  
			});
			
		}, //addVariableChangeEent
	
		enableDisableAllButtons: function enableDisableAllButtons(){
			// This functionality decides which buttons should be enabled.
			var isDataInFilter = dbsliceData.filteredTaskIds.length !== undefined                  && dbsliceData.filteredTaskIds.length > 0;
			
			// "Add data" is always available!
			$("#getData").prop("disabled",false);
			
			// "Plot Selected Tasks" is on only when there are tasks in the filter, and any 'plotter' plot row has been configured.
			var isPlotterPlotRowCtrlDefined = addMenu.helpers.checkIfArrayKeyIsDefined(dbsliceData.session.plotRows, 'ctrl');
			if(isDataInFilter && isPlotterPlotRowCtrlDefined){
				// Enable the button
				$("#refreshTasksButton").prop("disabled",false)
			} else {
				// Disable the button
				$("#refreshTasksButton").prop("disabled",true)		  
			}; // if
			
			// "Load session" only available after some data has been loaded.
			if(isDataInFilter){
				// Enable the button
				$("#getSessionButton").prop("disabled",false)
			} else {
				// Disable the button
				$("#getSessionButton").prop("disabled",true)		  
			}; // if
			
			// "Add plot row" should be available.
			$("#addPlotRowButton").prop("disabled",false);
			
			// "Remove plot row" should always be available.
			var removePlotRowButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-danger")
			removePlotRowButtons.each(function(){$(this).prop("disabled", false)});
			
			// "Add plot" should only be available if the data is loaded.
			var addPlotButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-success");
			if(isDataInFilter){
				addPlotButtons.each(function(){$(this).prop("disabled", false)})
			} else {
				addPlotButtons.each(function(){$(this).prop("disabled", true)})
			}; // if
			
			// "Remove plot" should always be available.
			var removePlotButtons = d3.selectAll(".plotTitle").selectAll(".btn-danger");
			removePlotButtons.each(function(){$(this).prop("disabled", false)})
			
		}, // enableDisableAllButtons
		
		findLatestPlotRowInd: function findLatestPlotRowInd(){
			
			var latestRowInd = [];
			d3.selectAll(".plotRow").each(function(){
				latestRowInd.push(d3.select(this).attr("plot-row-index"));
			})
			if(latestRowInd.length > 0){
				latestRowInd = latestRowInd.map(Number);
				var newRowInd = Math.max( ...latestRowInd ) + 1; // 'spread' operator used!
			} else {
				var newRowInd = 0;
			}; // if
			
			return newRowInd;
			
		}, // findLatestPlotRowInd
		
		checkIfArrayKeyIsDefined: function checkIfArrayKeyIsDefined(array, key){
			
			// This function checks if any objects in the array <array> have a property called <key>, and if that property is not undefined. If there are no objects with the required property the function returns false. If the object has the property, but it isn't defined it returns false. Only if there are some objects with the required property, and it is defined does the function return true.
			
			var isKeyDefined = true;
			
			// First check if there are any objects in the arra. Otherwise return false.
			if(array.length > 0){
				
				// Now check if there are any plot rows with 'ctrl'
				var compliantObjects = []
				for(var i = 0; i<array.length; i++){
					if(key in array[i]){
						compliantObjects.push(array[i]);
					}; // if
				}; // for
				
				// If there are some, then check if their controls are defined.
				if(compliantObjects.length > 0){
					isKeyDefined = true;
					for(var j = 0; j<compliantObjects.length; j++){
						if(compliantObjects[j][key] !== undefined){
							isKeyDefined = isKeyDefined && true;
						} else {
							isKeyDefined = isKeyDefined && false;
						}; // if
					}; // for
					
				} else {
					isKeyDefined = false;
				}; // if
				
			} else {
				isKeyDefined = false;
			}; // if
			
			return isKeyDefined;
			
		} // checkIfArrayKeyIsDefined
	} // helpers

}; // addMenu

export { addMenu };