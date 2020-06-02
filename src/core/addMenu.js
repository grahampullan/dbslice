import { render } from './render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';
import { cfD3Line } from '../plot/cfD3Line.js';
import { cfDataManagement } from '../core/cfDataManagement.js';

const addMenu = {

        addPlotControls: {
            
            elementOptionsArray: function(plotRowType){
                
                var options;
                switch(plotRowType){
                    case "metadata":
                        options = [
                            {val: "undefined"    , text: " "},
                            {val: "cfD3BarChart" , text: "Bar Chart"},
                            {val: "cfD3Scatter"  , text: "Scatter"},
                            {val: "cfD3Histogram", text: "Histogram"}
                        ]
                        break;
                    
                    case "plotter":
                        options = [
                            {val: "undefined"    , text: " "},
                            {val: "cfD3Line"     , text: "Line"}
                        ]
                        break;
                }; // switch
                
                return options;
                
            },
                            
            make: function make(containerDOM, containerCtrl){
                
                // The container is expected to be the plot row title.
                var plotRowTitle = d3.select( containerDOM )
                
				
				// Create the config element with all required data.
                var config = addMenu.addPlotControls.createConfig(containerDOM, containerCtrl);
			
				// Make the button.
                addMenu.addPlotControls.makeButton(config)

                // First create the ids of the required inputs
                addMenu.helpers.makeMenuContainer(config);
                
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);
                
                // Add the on click event: show menu
                addMenu.helpers.addButtonClickEvent(config);

                        
                
            }, // make
            
            createConfig: function createConfig(containerDOM, containerCtrl){
                // ownerButton    - the button that prompts the menu
				// ownerContainer - container to add the menu and button to
				// ownerCtrl      - plot row ctrl to update with user selection
                
                var a = addMenu.addPlotControls;
                var config = {
					h                        : a,
                    ok                       : a.submitNewPlot,
                    cancel                   : a.clearMenu,
                    userSelectedVariables    : ["xProperty", "yProperty", "slice"],
					menuContainer            : undefined,
                    menuItems                : [
						{ variable : "plottype",
						  options  : a.elementOptionsArray(containerCtrl.type),
                          label    : "Select plot type",
						  event    : a.onPlotTypeChangeEvent}
						],
                    newCtrl                  : [],
					ownerButton              : undefined,
					ownerContainer           : d3.select( containerDOM ),
					ownerCtrl	             : containerCtrl
                };
                
                
                
                
                // Create the appropriate newPlot object in the config.
                addMenu.addPlotControls.createNewPlot(config);
                
                
                return config;
                
            }, // createConfig
            
            createNewPlot: function createNewPlot(config){
                
				config.newCtrl =  {
					plottype  : undefined,
					xProperty : undefined, 
					yProperty : undefined,
					slice     : undefined
				}

            }, // createNewPlot
            
            copyNewPlot:   function copyNewPlot(config){
                // Based on the type of plot selected a config ready to be submitted to the plotting functions is assembled.

                
                
                var plotCtrl = {};
                switch( config.newCtrl.plottype ){
                    
                    case "cfD3BarChart":
					
						
						plotCtrl = cfD3BarChart.helpers.createDefaultControl()
						
						plotCtrl.view.yVarOption.val = config.newCtrl.yProperty
						
					
					  break;
					
                    case "cfD3Histogram":
						
						plotCtrl = cfD3Histogram.helpers.createDefaultControl()
						
						plotCtrl.view.xVarOption.val = config.newCtrl.xProperty
						
						
                      break;
                      
                    case "cfD3Scatter":
						
						
						
						
						// Custom functionality for the d3interactive2axes imposter function is here. The idea is that the ctrl is hidden in 'layout'.
						
						plotCtrl = cfD3Scatter.helpers.createDefaultControl()
						
						plotCtrl.view.xVarOption.val = config.newCtrl.xProperty
						plotCtrl.view.yVarOption.val = config.newCtrl.yProperty
						
						
                      break;
                      
                    case "cfD3Line":
                    
                        // The user selected variable to plot is stored in config.newCtrl, with all other user selected variables. However, for this type of plot it needs to be one level above, which is achieved here.
                        // Store the currently selected slice, then push everything forward.
                        
                    
                        plotCtrl = cfD3Line.helpers.createDefaultControl()
						
						plotCtrl.view.sliceId = config.newCtrl.slice
						
                      break;
					  
					  
					
                      

                    default:
                        break;
                    
                }; // switch

                
                return plotCtrl;
                
            }, // copyNewPlot
            
            clearNewPlot: function clearNewPlot(config){
                
                        config.newCtrl.plottype = undefined;
                        config.newCtrl.xProperty = undefined;
                        config.newCtrl.yProperty = undefined;
                        config.newCtrl.slice = undefined;

            }, // clearNewPlot
			
			clearOptionalMenus: function clearOptionalMenus(config){
				
				var h = addMenu.helpers;
				
				h.resetVariableMenuSelections(config, "xProperty");
				h.resetVariableMenuSelections(config, "yProperty");
				h.resetVariableMenuSelections(config, "slice");
				
				config.newCtrl.xProperty = undefined;
				config.newCtrl.yProperty = undefined;
				config.newCtrl.slice = undefined;
				
			}, // clearOptionalMenus
            
            enableDisableSubmitButton: function enableDisableSubmitButton(config){
        
                
        
				var disabledFlag = true
                switch( config.newCtrl.plottype ){
                    case "undefined":
                        // Disable
                        
                        disabledFlag = true;
                      break;
                      
                    case "cfD3BarChart":
                    
                        // xProperty enabled, yProperty disabled.
                        var isConfigValid = (config.newCtrl.xProperty === undefined) && 
                                            (config.newCtrl.yProperty !== undefined);
                        if(isConfigValid){disabledFlag = false}
                        else             {disabledFlag = true};
                        
                      break;
                      
                    case "cfD3Histogram":
                        // xProperty enabled, yProperty disabled.
                        var isConfigValid = (config.newCtrl.xProperty !== undefined) && 
                                            (config.newCtrl.yProperty === undefined);
                        
                        if(isConfigValid){disabledFlag = false}
                        else             {disabledFlag = true};
                      break;
                      
                    case "cfD3Scatter":
                        // xProperty enabled, yProperty  enabled.
                        var isConfigValid = (config.newCtrl.xProperty !== undefined) && 
                                            (config.newCtrl.yProperty !== undefined);
                        
                        if(isConfigValid){disabledFlag = false}
                        else             {disabledFlag = true};
                      break;
                      
                    case "cfD3Line":
                        // Nothing else is needed, just enable the submit button.
                        disabledFlag = false;
                    
                      break;
                      
                    default :
                        // Disable
                        disabledFlag = true;
                      break;
                }; // switch(selectedPlotType)


				// Set button enabled or disabled. Note that from the menu container we need to go one step up to reach the button, as the custom menu container is simply docked into the dialog.
                d3.select(config.menuContainer.node().parentElement)
				  .selectAll("button[type='submit']")
				  .each(function(){
					  this.disabled = disabledFlag
				  });


            }, // enableDisableSubmitButton
            
            onPlotTypeChangeEvent: function onPlotTypeChangeEvent(config, selectDOM, variable){
                
				// Update the config.
				config.newCtrl.plottype = selectDOM.value;
				
				// Based on the selection control the other required inputs.
                var a = addMenu.addPlotControls;
                var h = addMenu.helpers;
                
				switch( config.newCtrl.plottype ){
					case "undefined":
					  
					  // Remove all variable options.
					  h.removeMenuItemObject( config, "xProperty" );
					  h.removeMenuItemObject( config, "yProperty" );
					  h.removeMenuItemObject( config, "slice" );

					  break;
					  
					// METADATA PLOTS
					  
					case "cfD3BarChart":
					
					  // yProperty required.
					  h.addUpdateMenuItemObject( config, 'yProperty' , dbsliceData.data.metaDataProperties, "Select variable");
					  
					  // xProperty must not be present.
					  h.removeMenuItemObject( config, "xProperty" );
					  
					  break;
					  
					case "cfD3Histogram":
					  
					  
					  // xProperty required.
					  h.addUpdateMenuItemObject( config, "xProperty" , dbsliceData.data.dataProperties, "Select variable");
					  
					  // yProperty must not be present.
					  h.removeMenuItemObject( config, "yProperty" );
					  
					  break;
					  
					case "cfD3Scatter":
					  
					  
					  // xProperty and yProperty required.
					  h.addUpdateMenuItemObject( config, "xProperty", dbsliceData.data.dataProperties, "Select variable");
					  h.addUpdateMenuItemObject( config, "yProperty", dbsliceData.data.dataProperties, "Select variable");
					  break;
					  
					  
					// 2D/3D PLOTS
					case "cfD3Line":
					  
					  
					  // slice is required.
					  h.addUpdateMenuItemObject( config, "slice", dbsliceData.data.sliceProperties, "Select variable");
					  break;
					  
					  
					default :
					 
					
					  // Remove all variable options.
					  h.removeMenuItemObject( config, "xProperty" );
					  h.removeMenuItemObject( config, "yProperty" );
					  h.removeMenuItemObject( config, "slice" );
												
					  console.log("Unexpected plot type selected:", config.newCtrl.plottype);
					  break;
				}; // switch
				
				
				
				// Since there was a change in the plot type reset the variable selection menus. Also reset the config object selections.
				a.clearOptionalMenus(config)
				
				
				// Update.
				h.updateMenus(config);
                    

                
            }, // onPlotTypeChangeEvent
            
			onVariableChangeEvent: function onVariableChangeEvent(config, selectDOM, variable){
				
				// Selected value is updated in the corresponding config.
				config.newCtrl[variable] = selectDOM.value;
						  
				// Check if menu buttons need to be active.
				addMenu.addPlotControls.enableDisableSubmitButton(config)
				
			}, // onVariableChangeEvent
			
            submitNewPlot: function submitNewPlot(config){
                
                // IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
                
				var plotToPush = addMenu.addPlotControls.copyNewPlot(config);
				var plotRow = dbsliceData.session.plotRows.filter(function(plotRowCtrl){
					return plotRowCtrl == config.ownerCtrl
				})[0]
				
				plotRow.plots.push(plotToPush)
                
                
                // Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
                // var plotRowIndex = d3.select(this).attr("plot-row-index")
                // console.log(element)
                
                // Redraw the screen.
                render();
                
                // Clear newPlot to be ready for the next addition.
                addMenu.addPlotControls.clearMenu(config);
                
                
                
            }, // submitNewPlot
            
            clearMenu: function clearMenu(config){
                
                addMenu.addPlotControls.clearNewPlot(config);
                
                // Reset the menu selection!
                addMenu.helpers.resetVariableMenuSelections(config, "plottype");
                addMenu.helpers.resetVariableMenuSelections(config, "xProperty");
                addMenu.helpers.resetVariableMenuSelections(config, "yProperty");
                addMenu.helpers.resetVariableMenuSelections(config, "slice");
                
                
                // Remove the select menus from the view.
                addMenu.helpers.removeMenuItemObject( config, "xProperty" );
                addMenu.helpers.removeMenuItemObject( config, "yProperty" );
                addMenu.helpers.removeMenuItemObject( config, "slice" );
                
                // Update the menus so that the view reflects the state of the config.
                addMenu.helpers.updateMenus(config);
                
            }, // clearMenu
            
			// NEW!!!
			makeButton: function makeButton(config){
				
				// Make the button that will prompt the dialogue.
                switch( config.ownerCtrl.type ){
                    case "metadata":
                        var buttonLabel = "Add plot";
                      break;
                    case "plotter":
                        var buttonLabel = "Configure plot";
                }; // switch
                

				config.ownerButton = config.ownerContainer.append("button")
					.attr("style","display:inline")
					.attr("class", "btn btn-success float-right")
					.html(buttonLabel);
				
				
			}, // makeButton
            
			makeMenuItem: function makeMenuItem(config, variable, options, label){
				// 'makeMenuItem' creates the menu item option in order to allow different functionalities to add their own events to the menus without having to declare them specifically in otehr functions.
				return {
						  variable: variable,
						  options : options, 
						  label: label,
						  event: config.h.onVariableChangeEvent
					  }
				
			}, // makeMenuItem
			
        }, // addPlotControls
        
        removePlotControls: function removePlotControls(){
            
            var allPlotRows = d3.select("#" + dbsliceData.elementId).selectAll(".plotRowBody");
            allPlotRows.each( function(){
                // Select all the plots, and add a remove plot button and its functionality to it.
                
                var allPlotTitles = d3.select(this).selectAll(".plotTitle");
                allPlotTitles.each( function (){
                // Append the button, and its functionality, but only if it does no talready exist!
				
				
                    var removePlotButton = d3.select(this).select(".btn-danger")
                    
                    if (removePlotButton.empty()){
                        // If it dosn't exist, add it. It should be the last element!
						var ctrlGroup = d3.select(this).select(".ctrlGrp")
						
						
                        var btn = ctrlGroup.append("button")
                            .attr("class", "btn btn-danger float-right")
                            .html("x")
                            
						// Move the button in front of other elements.
						ctrlGroup.node().insertBefore( btn.node(), ctrlGroup.node().childNodes[0]  )
						
                        
                    } else {
                        // If it doesn't, do nothing.
                        
                    }; // if
					
					// Add/update the functionality.
					d3.select(this).select(".btn-danger")
                            .on("click", function(){
								
                                // This function recalls the position of the data it corresponds to, and subsequently deletes that entry.

                                

								// Find the ctrl of this plot. this = button -> ctrlGrp -> plotTitle -> card.
								var plotCardDOM = this.parentElement.parentElement.parentElement
								var thisPlot = d3.select( plotCardDOM ).select(".plot")
								
								// plotCardDOM -> plotWrapper -> plotRowBody -> plotRow
								var thisPlotRow = d3.select( plotCardDOM.parentElement.parentElement.parentElement )
                                
								thisPlot.each(function(thisPlotCtrl){
									
									thisPlotRow.each(function(plotRowCtrl){
										plotRowCtrl.plots = plotRowCtrl.plots.filter(function(plotCtrl){
											// Only return the plots that are not this one.
											return plotCtrl != thisPlotCtrl
										}) // filter
									}) // each
									
								}) // each
								
								
								
								// Remove also the htmls element accordingly.
                                plotCardDOM.remove()
								
								render()

                            }); // on
                    
                    
                } ); // each 
                                
                
              
            } ) // each
			
			

            
        }, // removePlotControls

        addPlotRowControls: { 
        
            elementOptionsArray: [
                    {val: "undefined", text: " "},
                    {val: "metadata", text: 'Metadata overview'},
                    {val: "plotter", text: 'Flow field plots'}
                ],
        
            make : function make(containerId, buttonId){

                // Create the config element with all required data.
                var config = addMenu.addPlotRowControls.createConfig(containerId, buttonId);
				
				// Add or move the actual button.
				addMenu.addPlotRowControls.makeButton(config)
                
                // First create the ids of the required inputs
                addMenu.helpers.makeMenuContainer(config);
            
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);


                
            }, // make
            
            createConfig: function createConfig(containerId, buttonId){
                
                var a = addMenu.addPlotRowControls;
                var config = {
					h                       : a,
					ok                      : a.submitNewPlotRow,
                    cancel                  : a.clearNewPlotRow,
                    menuContainer           : undefined,
                    menuItems               : [{
						variable: "type",
						options : a.elementOptionsArray,
                        label   : "Select plot row type",
						event   : a.onPlotRowTypeChangeEvent,
                        }],
                    
                    newCtrl                  : {title: "New row", 
                                                plots: [], 
                                                 type: "undefined",
                              addPlotButton: {label : "Add plot"}},
                    ownerButtonId             : buttonId,
					ownerContainerId          : containerId,
					ownerContainer            : d3.select("#" + containerId)
                };
                
                // The addPlotButton id needs to be updated when the row is submitted!
                
                return config;
            }, // createConfig
            
            clearNewPlotRow: function clearNewPlotRow(config){
                config.newCtrl.title = "New row";
                config.newCtrl.plots = [];
                config.newCtrl.type  = "undefined";
                config.newCtrl.addPlotButton = {id : "undefined", label : "Add plot"};
            }, // clearNewPlotRow
            
            submitNewPlotRow: function submitNewPlotRow(config){
                
                
                var plotRowToPush = {title: config.newCtrl.title, 
                                     plots: config.newCtrl.plots, 
                                      type: config.newCtrl.type,
                            addPlotButton : config.newCtrl.addPlotButton
                };
                
                
                

                
                
                // Push and plot the new row.
                dbsliceData.session.plotRows.push( plotRowToPush );
				
				//
                render();
                
                // Reset the plot row type menu selection.
                addMenu.helpers.resetVariableMenuSelections(config, "type");
                
                // Clear the config
                addMenu.addPlotRowControls.clearNewPlotRow(config);
                
            }, // submitNewPlotRow
            
            
            enableDisableSubmitButton: function enableDisableSubmitButton(config){
                
				// If either 'metadata' or 'plotter' were chosen then enable the button.
                var disabledFlag = true
				switch ( config.newCtrl.type ){
                    case "metadata":
                    case "plotter":
                        disabledFlag = false
                      break;
                }; // switch
				
				
                var submitButtonDOM = d3.select( config.menuContainer.node().parentElement )
				  .select("button[type='submit']")
				  .each(function(){
					  this.disabled = disabledFlag
				  })
				
            }, // enableDisableSubmitButton
            
            onPlotRowTypeChangeEvent: function onPlotRowTypeChangeEvent(config, selectDOM, variable){
                
                // When the plot row type is changed just check if the button should be enabled.
				config.newCtrl.type = selectDOM.value;
				
				addMenu.addPlotRowControls.enableDisableSubmitButton(config);

                
                
            }, // onPlotRowTypeChangeEvent
            
			// NEW!!!
			makeButton: function makeButton(config){
				
				var addPlotRowButton   = d3.select("#" + config.ownerButtonId);
				if (addPlotRowButton.empty()){
					// Add the button.
					config.ownerButton = config.ownerContainer
					  .append("button")
						.attr("id", config.ownerButtonId)
						.attr("class", "btn btn-info btn-block")
						.html("+");
					  
					// Add the interactivity
					addMenu.helpers.addButtonClickEvent(config);
				} else {
					// Move the button down
					var b = addPlotRowButton.node()
					b.parentNode.appendChild(b);
				}; // if
				
				
				
				
			}, // makeButton
			
			makeMenuItem: function makeMenuItem(config, variable, options, label){
				// addPlotRowControls does not expect any items to be created.
				
				
			}, // makeMenuItem
			
			
        }, // addPlotRowControls

		removeDataControls: {
			
			make: function make(elementId){
			
				// Create the container required
				addMenu.removeDataControls.createRemoveDataContainer(elementId);
			  
			  
				// Add teh functonaliy to the option in the "sesson options" menu.
				d3.select("#" + elementId)
					.on("click", function(){
						
						// Get the options required
						var options = dbsliceData.data.fileDim.group().all()

						
						// Create the appropriate checkboxes.
						addMenu.removeDataControls.addCheckboxesToTheForm(elementId, options);
							  

						// Bring up the prompt
						addMenu.removeDataControls.createDialog(elementId);
						
					   
					   })
			}, // make
			
			createRemoveDataContainer: function createRemoveDataContainer(elementId){
				
				var removeDataMenuId = elementId + "Menu"
				var removeDataMenu = d3.select("#" + removeDataMenuId)
				if (removeDataMenu.empty()){
					
					removeDataMenu = d3.select( ".sessionHeader" )
							  .append("div")
								.attr("id", removeDataMenuId )
								.attr("class", "card ui-draggable-handle")
							  .append("form")
								.attr("id", removeDataMenuId + "Form")

							$("#" + removeDataMenuId ).hide();
				} // if
				
			}, // createRemoveDataContainer
			
			addCheckboxesToTheForm: function addCheckboxesToTheForm(elementId, options){
				
				// Create teh expected target for the checkboxes.
				var checkboxFormId = elementId + "MenuForm"
				
				// Create the checkboxes
				var checkboxes = d3.select("#" + checkboxFormId).selectAll(".checkbox").data(options)
				checkboxes.enter()
					.append("div")
					  .attr("class", "checkbox")
					.append("input")
					  .attr("type", "checkbox")
					  .attr("name", function(d, i){ return "dataset"+i })
					  .attr("value", function(d){ return d.key })
					  .attr("checked", true)
				
				// Append the labels after it
				checkboxes = d3.select("#" + checkboxFormId).selectAll(".checkbox")
        		checkboxes.selectAll("label").remove()
				checkboxes
					.append("label")
					  .html(function(d){ return d.key })
				
			}, // addCheckboxesToTheForm
			
			createDialog: function createDialog(elementId){
				
				// Create the dialog box, and it's functionality.
				$("#" + elementId + "Menu" )
					.dialog({
						draggable: false,
						autoOpen: true,
						modal: true,
						show: {effect: "fade",duration: 50},
						hide: {effect: "fade", duration: 50},
						buttons: {  "Ok"    :{text: "Submit",
											  id: "submitRemoveData",
											  disabled: false,
											  click: onSubmitClick
											 }, // ok
									"Cancel":{text: "Cancel",
											  id: "cancelRemoveData",
											  disabled: false,
											  click: onCancelClick
											 } // cancel
								 }  })
					.parent()
					.draggable();
			   
			   
				$(".ui-dialog-titlebar").remove();
				$(".ui-dialog-buttonpane").attr("class", "card");
				
				function onSubmitClick(){
					// Figure out which options are unchecked.
					var checkboxInputs = d3.select(this).selectAll(".checkbox").selectAll("input")
					
					var uncheckedInputs = checkboxInputs.nodes().filter(function(d){return !d.checked})
					
					
					var uncheckedDataFiles = uncheckedInputs.map(function(d){return d.value})
					
					
					// Pass these to the data remover.
					cfDataManagement.cfRemove(uncheckedDataFiles)
					
					
					// Close the dialog.
					$( this ).dialog( "close" )
					
					// Redraw the view.
					render();
					
				} // onSubmitClick
				
				function onCancelClick(){
					// Just close the dialog.
					$( this ).dialog( "close" )
					
				} // onSubmitClick
				
			} // createDialog
			
		}, // removeDataControls

        helpers: {
            
            
        
            makeMenuContainer: function makeMenuContainer(config){
            
                // CREATE THE CONTAINER FOR THE MENU IN THE BUTTONS CONTAINER.
                // But do this only if it does not already exist.
                if ( config.menuContainer == undefined ){
                
                    config.menuContainer = config.ownerContainer
                      .append("div")
                      .attr("class", "card ui-draggable-handle");

                    config.menuContainer.node().style.display = "none";
                }//
            
            }, // makeMenuContainer
        
            updateMenus: function updateMenus(config){
				// Handles all selection menus, including the plot selection!
				// A 'label' acts as a wrapper and contains html text, and the 'select'.

                // This function updates the menu of the pop-up window.
                var menus = config.menuContainer.selectAll("label").data(config.menuItems);
                
                // Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.
                menus.enter()
                  .append("label")
				    .text(function(d){return d.label})
                  .append("select")
                    .attr("type", function(d){return d.variable})
					
                    
                // Remove exiting menus.
                menus.exit().remove();
				
				
                
                // Update all the menu elements.
                config.menuContainer.selectAll("label")   
                  .each( function(menuItem){
                      // This function handles the updating of the menu options for each 'select' element.
					  
					  // Update the label text as well.
					  this.childNodes[0].value = menuItem.label
                  
                      // Update the menu and it's functionality.
					  var menu = d3.select(this)
					     .select("select")
						 
					  
						 
                      var options = menu
						 .selectAll("option")
						 .data(menuItem.options);
						 
                      options
                        .enter()
                          .append("option")
                            .text( function(d){ return d.text; } )
                            .attr("value", function(d){ return d.val; } );
                            
                      
                      options.attr("value", function(d){ return d.val; })
                             .text( function(d){ return d.text; } );
                      
                      options.exit().remove();
					  
					  // Add the functionality to update dependent properties of the new element we're adding to the view. E.g. x and y variable names. THIS HAS TO BE HERE, AS THE MENUS ENTER AND EXIT THE VIEW UPON UPDATE, AND THEIR ON CHANGE EVENTS NEED TO BE UPDATED. An 'on("change")' is used instead of addEventListener as it will replace instead of add functionality.
					  menu.on("change", function(){
						  // This is a special function to allow the appropriate inputs to be piped into the desired event.
						  menuItem.event(config, this, menuItem.variable)
					  })
					  
                  }); // d3.select ... each


            }, // updateMenus

            addUpdateMenuItemObject: function addUpdateMenuItemObject(config, variable, options, label){

				// Transform the options into a form expected by the select updating functionality. Also introduce an empty option.
				options = options.map(function(d){return {val: d, text:d }})
				options.unshift({val: "undefined", text: " "})

                // First remove any warnings. If they are needed they are added later on.
                config.ownerContainer.selectAll(".warning").remove();

                // Only add or update the menu item if some selection variables exist.
                // >1 is used as the default option "undefined" is added to all menus.
                if (options.length>1){

                    var menuItems = config.menuItems;
                              
                    // Check if the config object already has a comparable option.
                    var requiredItem = menuItems.filter(function(menuItem){
						return menuItem.variable == variable
					})[0];
                    

                    if (requiredItem !== undefined){
                      // If the item exists, just update it.
                      requiredItem.options = options;
					  requiredItem.label = label;

                    } else {
                      // If it doesn't, create a new one.
                      requiredItem = config.h.makeMenuItem(config, variable, options, label)
                      
                      config.menuItems.push(requiredItem);
                    };      

                
                } else {
                      // There are no variables. No point in having an empty menu.
                      addMenu.helpers.removeMenuItemObject(config, variable);
                      
                      
                      // Tell the user that the data is empty.
                      var warning = config.ownerContainer.selectAll(".warning");
                      if (warning.empty()){
                          config.ownerContainer
                            .append("div")
                              .attr("class", "warning")
                              .html("No data has been loaded!")
                              .attr("style", "background-color:pink;font-size:25px;color:white")  
                      }; // if
                        
                }; // if
                
            }, // addUpdateMenuItemObject

            removeMenuItemObject: function removeMenuItemObject(config, variable){
                // Removes the menu item with that controls <variable>.
                config.menuItems = config.menuItems.filter(function(menuItem){
					return menuItem.variable != variable
				});
                
            }, // removeMenuItemObject

            resetVariableMenuSelections: function resetVariableMenuSelections(config, variable){

				config.menuContainer
				  .selectAll("select[type='" + variable + "']")
				  .each(function(){
					  this.value = undefined
				  })

            }, // resetVariableMenuSelections

            addButtonClickEvent: function addButtonClickEvent(config){
                // The dialogue is only created when the button is clicked!
				
                // JQUERY!!!
                
                config.ownerButton.on("click",function(){
                    
                        // Disable all buttons:
                        d3.selectAll("button").each(function(){ this.disabled = true});
                      
                        // Make the dialog
                        $( config.menuContainer.node() ).dialog({
                        draggable: false,
                        autoOpen: true,
                        modal: true,
                        buttons: {  "Ok"    :{text: "Ok",
						                      type: "submit",
                                              disabled: true,
                                              click: function(){
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
									          type: "cancel",
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
                
            enableDisableAllButtons: function enableDisableAllButtons(){
                // This functionality decides which buttons should be enabled.
                var isDataInFilter = dbsliceData.filteredTaskIds.length !== undefined                  && dbsliceData.filteredTaskIds.length > 0;
				
				// For the data to be loaded some records should have been assigned to the crossfilter.
				var isDataLoaded = false
				if(dbsliceData.data !== undefined){
					isDataLoaded = dbsliceData.data.cf.size() > 0
				} // if
				
				
				
				
				// GROUP 1: SESSION OPTIONS
				// Button controlling the session options is always available!
                document.getElementById("sessionOptions").disabled = false;
				
				// "Load session" only available after some data has been loaded.
				// Data: Replace, add, remove, Session: save, load
				// These have to have their class changed, and the on/click event suspended!!
				listItemEnableDisable( "replaceData" , true )
				listItemEnableDisable( "addData"     , true )
				listItemEnableDisable( "removeData"  , isDataLoaded )
				listItemEnableDisable( "saveSession" , true )
				listItemEnableDisable( "loadSession" , isDataLoaded )
				
				
				
				
				
				
				// GROUP 2: ON DEMAND FUNCTIONALITY
                // "Plot Selected Tasks" is on only when there are tasks in the filter, and any 'plotter' plot row has been configured.
				var refreshTasksButton = d3.select("#refreshTasksButton")
                arrayEnableDisable(refreshTasksButton, isDataInFilter)
				
				
                
				
                // GROUP 3: ADDING/REMOVING PLOTS/ROWS
                // "Add plot row" should be available when the data is loaded. Otherwise errors will occur while creating the apropriate menus.
				document.getElementById("addPlotRowButton").disabled = !isDataLoaded;
                
                
                // "Remove plot row" should always be available.
                var removePlotRowButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-danger")
                arrayEnableDisable(removePlotRowButtons, true)
                
				
                // "Add plot" should only be available if the data is loaded.
                var addPlotButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-success");
				arrayEnableDisable(addPlotButtons, isDataInFilter)
				                
                // "Remove plot" should always be available.
                var removePlotButtons = d3.selectAll(".plotTitle").selectAll(".btn-danger");
				arrayEnableDisable(removePlotButtons, true)
				
				
				// GROUP 4: Plot interactive controls.
				var plotInteractionButtons = d3.selectAll(".plot").selectAll(".btn")
				arrayEnableDisable(plotInteractionButtons, true)
				
				
				
				function arrayEnableDisable(d3ButtonSelection, conditionToEnable){
					
					if(conditionToEnable){
						// Enable the button
						d3ButtonSelection.each(function(){ this.disabled = false })
					} else {
						// Disable the button
						d3ButtonSelection.each(function(){ this.disabled = true })         
					}; // if					
					
				} // arrayEnableDisable
				
				
				function listItemEnableDisable(elementId, conditionToEnable){
					
					if(conditionToEnable){
						// Enable the button
						d3.select("#" + elementId).attr("class", "dropdown-item")
						document.getElementById(elementId).style.pointerEvents = 'auto'
					} else {
						// Disable the button
						d3.select("#" + elementId).attr("class", "dropdown-item disabled")
						document.getElementById(elementId).style.pointerEvents = 'none'
					}; // if
					
				} // listItemEnableDisable
				
                
            }, // enableDisableAllButtons
            
            
            
        } // helpers

    }; // addMenu
    

export { addMenu };