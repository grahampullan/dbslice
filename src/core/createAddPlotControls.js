import { update } from './update.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';

function createAddPlotControls(buttonId){

	// This function creates unique ids for the elements it creates based on the "buttonId" element they belong to.
	var menuContainerId = buttonId + "MenuContainer";
	var plotSelectionMenuId = menuContainerId + "PlotSelectionMenu";
	var xPropertyMenuId = menuContainerId + "xPropertyMenu";
	var yPropertyMenuId = menuContainerId + "yPropertyMenu";
	

	// CREATE THE CONTAINER FOR THE MENU IN THE BUTTONS CONTAINER.
	var buttonElement = d3.select("#" + buttonId);
	var menuContainer = d3.select( buttonElement.node().parentNode )
	  .append("div")
	  .attr("id", menuContainerId)
	  .attr("ownerButton", buttonId)
	  .attr("class", "card ui-draggable-handle");

	$("#" + menuContainerId).hide();

	
	

	// First declare the available options.
	// BAR: metaDataProperties
	// HISTOGRAM: dataProperties
	// SCATTER: dataProperties

	

	// INTERNAL CONFIG OBJECTS:

	// The config object needs to be created for the dbslice renderer. The 'colWidth' and 'height' are hardcoded to limit the amount of options.
	// FOR NOW THE APP NEEDS TO BE INITIALISED WITH THE DATA IN A SESSION OBJECT!
	var cfData = dbsliceData.session.plotRows[0].plots[0].data.cfData;
	var newPlot = {
		plotFunc : "undefined",
		layout : { title : undefined, colWidth : 4, height : 300 }, 
		data : { cfData : cfData, xProperty : undefined, yProperty : undefined, cProperty : undefined}
	};

	// This array is hard-coded as it depends on the code functionality available.
	var plotFuncOptionsArray = [
		{val: "undefined", text: " "},
		{val: "cfD3BarChart", text: 'Bar Chart'},
		{val: "cfD3Scatter", text: 'Scatter'},
		{val: "cfD3Histogram", text: 'Histogram'}
	];

	// Categorical variables must have a val and text.
	var categoricalVariables = [{val: "undefined", text: " "}];
	for (var i=0; i<cfData.metaDataProperties.length; i++){
		categoricalVariables.push({val: cfData.metaDataProperties[i], 
								  text: cfData.metaDataProperties[i]});
	};

	// Continuous variables.
	var continuousVariables = [{val: "undefined", text: " "}];
	for (var i=0; i<cfData.dataProperties.length; i++){
		continuousVariables.push({val: cfData.dataProperties[i], 
								 text: cfData.dataProperties[i]});
	};


	// Internal session object.
	// The container for the menu is specified only here!!
	var dropDownMenuData = {
		title : "Add new plot menu",
		containerId: menuContainerId,
		menuItems: [
			{options: plotFuncOptionsArray, label: "Select plot type", id: plotSelectionMenuId}
		]
	};

	function updateMenus(){

		// This function updates the menu of the pop-up window.

		var d = dropDownMenuData;
		
		// MENUS
		
		// Assign the data.
		var menus = d3.select("#" + d.containerId).selectAll(".selectmenu").data(d.menuItems);

		// Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.
		menus
		  .enter()
		  .append("label")
			.attr("class", "selectmenuLabel")
			.text( function(d){ return d.label })
		  .append("select")
			.attr("class", "selectmenu")
			.attr("id", function(d){ return d.id });
		
		// Update all the menu elements.
		d3.select("#" + d.containerId).selectAll(".selectmenu").data(d.menuItems)    
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
		var labels = d3.select("#" + d.containerId).selectAll(".selectmenuLabel").data(d.menuItems);
		labels.exit().remove()
		  
		
		// Add the event assignment handling for variable menus. These do not have effects that ripple down, and can be implemented here.
		
		d3.select("#" + xPropertyMenuId).on("change", function(){ 
		  // Merely populate the 'newPlot' object.
		  var selectedVariable = $(this).val();
		  newPlot.data.xProperty = selectedVariable;
		  newPlot.layout.title = selectedVariable;
		  
		  enableDisableSubmitButton();
		});
		
		d3.select("#" + yPropertyMenuId).on("change", function(){ 
		  // Merely populate the 'newPlot' object.
		  var selectedVariable = $(this).val();
		  newPlot.data.yProperty = selectedVariable;
		  newPlot.layout.title = selectedVariable;
		  
		  enableDisableSubmitButton();
		});
		
		
		enableDisableSubmitButton();
		
	}; // function updateMenus

	// Create the initial menu.
	updateMenus(dropDownMenuData);

	// Event assignment needs to be done outside of the main menus update loop because they do other specific things. Although this could be included in the config?
	// This one essentially monitors everything, and the others just update some properties of the config object?
	function addUpdateMenuItemObject(menuItemId, variables){

		var menuItems = dropDownMenuData.menuItems;
				  
		// Check if the config object already has an item with the 'xPropertyMenu' id.
		var requiredItem = menuItems.find(x => x.id === menuItemId);
		var doesItemExist = requiredItem !== undefined;

		if (doesItemExist){
		  // If the item exists, just update it.
		  var index = menuItems.map(function(d) { return d.id; }).indexOf(menuItemId);

		  dropDownMenuData.menuItems[index].options =  variables;
		  
		} else {
		  // If it doesn't, create a new one.
		  requiredItem = {options: variables, label: "Select variable", id: menuItemId}
		  
		  dropDownMenuData.menuItems.push(requiredItem);
		};          
	}; // function addUpdateMenuItemObject

	function removeMenuItemObject(menuItemId){
		
		var menuItems = dropDownMenuData.menuItems;
		var index = dropDownMenuData.menuItems.map(function(d) { return d.id; }).indexOf(menuItemId);
		
		if (index>-1){
			menuItems.splice(index,1);
		};
		
		dropDownMenuData.menuItems = menuItems;
	}; // function removeMenuItemObject

	function clearNewPlot(){
		newPlot.plotFunc = undefined;
		newPlot.layout.title = undefined;
		newPlot.data.xProperty = undefined;
		newPlot.data.yProperty = undefined;
	}; // function clearNewPlot

	function resetVariableMenuSelections(){

		var xPropertyMenuHandle = document.getElementById( xPropertyMenuId );
		if (xPropertyMenuHandle !== null){
		  xPropertyMenuHandle.value = undefined;
		};
		
		var yPropertyMenuHandle = document.getElementById( yPropertyMenuId );
		if (yPropertyMenuHandle !== null){
		  yPropertyMenuHandle.value = undefined;
		};
	}; // function resetVariableMenuSelections

	function enableDisableSubmitButton(){
		
		var selectedPlotType = $("#" + plotSelectionMenuId).val();
		switch(selectedPlotType){
			case "undefined":
				// Disable
				$("#" + menuOkButtonId).prop("disabled", true);
			  break;
			  
			case "cfD3BarChart":
				// xProperty enabled, yProperty disabled.
				var isConfigValid = (newPlot.data.xProperty !== undefined) && 
									(newPlot.data.yProperty === undefined);
				if(isConfigValid){$("#" + menuOkButtonId).prop("disabled", false)};
			  break;
			  
			case "cfD3Histogram":
				// xProperty enabled, yProperty disabled.
				var isConfigValid = (newPlot.data.xProperty !== undefined) && 
									(newPlot.data.yProperty === undefined);
				
				if(isConfigValid){$("#" + menuOkButtonId).prop("disabled", false)};
			  break;
			  
			case "cfD3Scatter":
				// xProperty enabled, yProperty  enabled.
				var isConfigValid = (newPlot.data.xProperty !== undefined) && 
									(newPlot.data.yProperty !== undefined);
				if(isConfigValid){$("#" + menuOkButtonId).prop("disabled", false)};
			  break;
			  
			default :
				// Disable
				$("#" + menuOkButtonId).prop("disabled", true);
			  break;
		}; // switch(selectedPlotType)


	}; // function enableDisableSubmitButton

	d3.select("#" + plotSelectionMenuId).on("change", function(){ 
		
		// Use the same switch to populate the appropriate properties in the 'newPlot' object, and to allow further selections.
		var selectedPlotType = $(this).val();
		switch( selectedPlotType ){
			case "undefined":
			  // Update plot type selection.
			  clearNewPlot();
			
			  // Remove all variable options.
			  removeMenuItemObject( xPropertyMenuId );
			  removeMenuItemObject( yPropertyMenuId );
			  break;
			  
			case "cfD3BarChart":
			  // One variable menu - categorical
			  // TEMPORARILY ASSIGN STRING INSTEAD OF FUNCTION!!
			  newPlot.plotFunc = cfD3BarChart;
			  
			  // xProperty required.
			  addUpdateMenuItemObject( xPropertyMenuId , categoricalVariables);
			  
			  // yProperty must not be present.
			  removeMenuItemObject( yPropertyMenuId );
			  break;
			  
			case "cfD3Histogram":
			  // One variable menu - continuous
			  // TEMPORARILY ASSIGN STRING INSTEAD OF FUNCTION!!
			  newPlot.plotFunc = cfD3Histogram;
			  
			  // xProperty required.
			  addUpdateMenuItemObject( xPropertyMenuId , continuousVariables);
			  
			  // yProperty must not be present.
			  removeMenuItemObject( yPropertyMenuId );
			  break;
			  
			case "cfD3Scatter":
			  // Two variables menu - continuous
			  // TEMPORARILY ASSIGN STRING INSTEAD OF FUNCTION!!
			  newPlot.plotFunc = cfD3Scatter;
			  
			  // xProperty and yProperty required.
			  addUpdateMenuItemObject( xPropertyMenuId , continuousVariables);
			  addUpdateMenuItemObject( yPropertyMenuId , continuousVariables);
			  break;
			  
			default :
			  // Update plot type selection.
			  clearNewPlot();
			
			  // Remove all variable options.
			  removeMenuItemObject( xPropertyMenuId );
			  removeMenuItemObject( yPropertyMenuId );
			  
			  console.log("Unexpected plot type selected:", selectedPlotType);
			  break;
		}; // switch( selectedPlotType )
		
		// Update.
		updateMenus();
		
		// Since there was a change in the plot type reset the variable selection menus.
		resetVariableMenuSelections();
		
		
		
		
	}); // d3.select("#" + plotSelectionMenuId).on("change"


	// Functionality on OK. This should be disabled until the appropriate selections are made.
	function submitNewPlot(ownerPlotRowIndex){
		
		// Reset the variable menu selections!
		resetVariableMenuSelections();
		
		// Reset the plot type menu selection.
		document.getElementById(plotSelectionMenuId).value = "undefined";
		
		 
		
		// IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
		var plotToPush = {
		  plotFunc : newPlot.plotFunc,
		  layout : { title : newPlot.layout.title, 
				  colWidth : newPlot.layout.colWidth, 
					height : newPlot.layout.height }, 
		  data : {  cfData : newPlot.data.cfData, 
				 xProperty : newPlot.data.xProperty, 
				 yProperty : newPlot.data.yProperty, 
				 cProperty : newPlot.data.cProperty}
		};
		
		// Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
		// var plotRowIndex = d3.select(this).attr("plot-row-index")
		// console.log(element)
		
		dbsliceData.session.plotRows[ownerPlotRowIndex].plots.push(plotToPush);

		
		// Redraw the screen.
		update(dbsliceData.elementId, dbsliceData.session);
		
		
		// Clear newPlot to be ready for the next addition.
		clearNewPlot();
			
	}; // function submitNewPlot()


	// Functionality on cancel. This should clean up the config object.
	function cancelNewPlot(){
		clearNewPlot();
		// console.log(newPlot);
		
		// Reset the menu selection!
		resetVariableMenuSelections();
	}; // function cancelNewPlot()



	// Add functionality for on button click: show the dialog.
	// NOTE: "draggable: false", and the trailing parent().draggable() were added to make the whole dialog draggable, instead of just the titel.
	var menuOkButtonId = menuContainerId + "DialogButtonOk";
	var menuCancelButtonId = menuContainerId + "DialogButtonCancel";
	$("#" + buttonId).click(function() {
		$( "#" + menuContainerId ).dialog({
		draggable: false,
		autoOpen: true,
		modal: true,
		buttons: {  "Ok":  {text: "Ok",
							id: menuOkButtonId,
							click: function() { 
							  // Find which button this menu belongs to.
							  var ownerElement = this.getAttribute("ownerButton");

							  // Find the index of the plotRow the button belongs to.
							  var ownerPlotRowIndex =  $("#" + ownerElement)[0].parentElement.parentElement.getAttribute("plot-row-index");
							  
							  // Submit the new plot into the owner plot row.
							  submitNewPlot(ownerPlotRowIndex); 
							  
							  // Close the dialogue.
							  $( this ).dialog( "close" )},
								
							disabled: true                                            },
					"Cancel":  {text: "Cancel",
							id: menuCancelButtonId,
							click: function() { cancelNewPlot(); 
												$( this ).dialog( "close" )}  }
				  },
		show: {effect: "fade",duration: 50},
		hide: {effect: "fade", duration: 50}
		}).parent().draggable();
		
		$(".ui-dialog-titlebar").remove();
		$(".ui-dialog-buttonpane").attr("class", "card");
	}); // $("#" + buttonId).click(function()



}; // function createAddPlotControls()



export { createAddPlotControls };