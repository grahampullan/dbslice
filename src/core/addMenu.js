var addMenu = {

        addPlotControls: {
            
            elementOptionsArray: function(plotRowType){
                
				let d = dbsliceData.data
				
                var options = [{val: "undefined"    , text: " "}];
                switch(plotRowType){
                    case "metadata":
					
						if( existsAndHasElements(d.categoricalProperties) ){
							options.push( {val: "cfD3BarChart" , text: "Bar Chart"} )
						}
						
						if( existsAndHasElements(d.ordinalProperties) ){
							options.push( {val: "cfD3Scatter"  , text: "Scatter"} )
							options.push( {val: "cfD3Histogram", text: "Histogram"} )
						}
                        break;
                    
                    case "plotter":
					
						if( existsAndHasElements(d.line2dProperties) ){
							options.push( {val: "cfD3Line"     , text: "Line"} )
						}
					
						if( existsAndHasElements(d.contour2dProperties) ){
							options.push( {val: "cfD3Contour2d", text: "2D Contour"} )
						}
					
                        break;
                }; // switch
                
                return options;
				
				
				
				function existsAndHasElements(A){
					let response = false
					if(A){
						response = A.length > 0
					}
					return response
				}
                
            },
                            
            make: function make(ownerButton, containerCtrl){
                
				// Container ctrl is required bcause the plot needs to be pushed into it!!
                
				
				// Create the config element with all required data.
                var config = addMenu.addPlotControls.createConfig(ownerButton, containerCtrl);
			
                // Make the corresponding dialog.
                addMenu.helpers.makeDialog(config);
                
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);
				
				// Add the buttons
				addMenu.helpers.addDialogButtons(config)

				// Add the on click event to the dialog owner button
				config.ownerButton.on("click", function(){
					addMenu.helpers.showDialog(config)
				}) // on

                        
                
            }, // make
            
			// Config handling
            createConfig: function createConfig(ownerButton, containerCtrl){
                // ownerButton    - the button that prompts the menu
				// ownerContainer - container to add the menu and button to
				// ownerCtrl      - plot row ctrl to update with user selection
                
                var config = {
					
					f: addMenu.addPlotControls,
					
					position: {
						left: undefined, 
						 top: undefined, 
					   delta: undefined
					},
					
					buttons: [
						{text: "ok"    , onclick: ok    , class: "btn btn-success"},
						{text: "cancel", onclick: cancel, class: "btn btn-danger"}
					],
					
                    userSelectedVariables: ["xProperty", "yProperty", "slice"],
                    
					menuItems: [
						{ variable : "plottype",
						  options  : addMenu.addPlotControls.elementOptionsArray(containerCtrl.type),
                          label    : "Select plot type",
						  event    : addMenu.addPlotControls.onPlotTypeChangeEvent
						}
					],
						
                    newCtrl: {
						plottype  : undefined,
						xProperty : undefined, 
						yProperty : undefined,
						slice     : undefined
					},

					ownerButton: ownerButton,
					ownerCtrl: containerCtrl
                };
				
				// MOVE THESE OUTSIDE
				function ok(dialogConfig){
					
				
					// Hide the dialog
					addMenu.helpers.hideDialog(dialogConfig)

					// Add the plot row.
					addMenu.addPlotControls.submitNewPlot(dialogConfig)
					
					// Clear the dialog selection
					addMenu.addPlotControls.clearNewPlot(dialogConfig)
					
					
					// Clear newPlot to be ready for the next addition.
					addMenu.addPlotControls.clearMenu(config);
					
					 // Redraw the screen.
					sessionManager.render();
					
					
					
				} // ok

				function cancel(dialogConfig){
					
					addMenu.addPlotControls.clearNewPlot(dialogConfig)
				
					addMenu.helpers.hideDialog(dialogConfig)
					
					// Clear newPlot to be ready for the next addition.
					addMenu.addPlotControls.clearMenu(config);
					
				} // ok
                

                return config;
                
            }, // createConfig
            
            clearNewPlot: function clearNewPlot(config){
                
                        config.newCtrl.plottype = undefined;
                        config.newCtrl.xProperty = undefined;
                        config.newCtrl.yProperty = undefined;
                        config.newCtrl.sliceId = undefined;

            }, // clearNewPlot
			
			submitNewPlot: function submitNewPlot(config){
                
                // IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
                
				var plotToPush = plotRow.instantiatePlot(config.newCtrl);
				var plotRowObj = dbsliceData.session.plotRows.filter(function(plotRowCtrl){
					return plotRowCtrl == config.ownerCtrl
				})[0]
				
				// Position the new plot row in hte plot container.
				positioning.newPlot(plotRowObj, plotToPush)
				
				
				plotRowObj.plots.push(plotToPush)
                
                
            }, // submitNewPlot
			
			// Menu functionality
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
					  h.removeMenuItemObject( config, "sliceId" );

					  break;
					  
					// METADATA PLOTS
					  
					case "cfD3BarChart":
					
					  // yProperty required.
					  h.addUpdateMenuItemObject( config, 'yProperty' , dbsliceData.data.categoricalProperties, "Select y variable");
					  
					  // xProperty must not be present.
					  h.removeMenuItemObject( config, "xProperty" );
					  
					  break;
					  
					case "cfD3Histogram":
					  
					  
					  // xProperty required.
					  h.addUpdateMenuItemObject( config, "xProperty" , dbsliceData.data.ordinalProperties, "Select x variable");
					  
					  // yProperty must not be present.
					  h.removeMenuItemObject( config, "yProperty" );
					  
					  break;
					  
					case "cfD3Scatter":
					  
					  
					  // xProperty and yProperty required.
					  h.addUpdateMenuItemObject( config, "xProperty", dbsliceData.data.ordinalProperties, "Select x variable");
					  h.addUpdateMenuItemObject( config, "yProperty", dbsliceData.data.ordinalProperties, "Select y variable");
					  break;
					  
					  
					// 2D/3D PLOTS
					case "cfD3Line":
					  
					  
					  // sliceId is required.
					  h.addUpdateMenuItemObject( config, "sliceId", dbsliceData.data.line2dProperties, "Select slice");
					  break;
					  
					case "cfD3Contour2d":
					  
					  
					  // slice is required.
					  h.addUpdateMenuItemObject( config, "sliceId", dbsliceData.data.contour2dProperties, "Select 2d contour");
					  break;
					  
					
					  
					default :
					 
					
					  // Remove all variable options.
					  h.removeMenuItemObject( config, "xProperty" );
					  h.removeMenuItemObject( config, "yProperty" );
					  h.removeMenuItemObject( config, "sliceId" );
												
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
					  
					case "cfD3Contour2d":
                        // Nothing else is needed, just enable the submit button.
                        disabledFlag = false;
                    
                      break;
                      
                    default :
                        // Disable
                        disabledFlag = true;
                      break;
                }; // switch(selectedPlotType)


				// Set button enabled or disabled. Note that from the menu container we need to go one step up to reach the button, as the custom menu container is simply docked into the dialog.
                config.dialogWrapper
				  .select("button.btn-success")
				  .each(function(){
					  this.disabled = disabledFlag
				  });


            }, // enableDisableSubmitButton
            
            
			// Shorthands
			clearOptionalMenus: function clearOptionalMenus(config){
				
				var h = addMenu.helpers;
				
				h.resetVariableMenuSelections(config, "xProperty");
				h.resetVariableMenuSelections(config, "yProperty");
				h.resetVariableMenuSelections(config, "sliceId");
				
				config.newCtrl.xProperty = undefined;
				config.newCtrl.yProperty = undefined;
				config.newCtrl.sliceId = undefined;
				
			}, // clearOptionalMenus
            
            clearMenu: function clearMenu(config){
                
                addMenu.addPlotControls.clearNewPlot(config);
                
                // Reset the menu selection!
                addMenu.helpers.resetVariableMenuSelections(config, "plottype");
                addMenu.helpers.resetVariableMenuSelections(config, "xProperty");
                addMenu.helpers.resetVariableMenuSelections(config, "yProperty");
                addMenu.helpers.resetVariableMenuSelections(config, "sliceId");
                
                
                // Remove the select menus from the view.
                addMenu.helpers.removeMenuItemObject( config, "xProperty" );
                addMenu.helpers.removeMenuItemObject( config, "yProperty" );
                addMenu.helpers.removeMenuItemObject( config, "sliceId" );
                
                // Update the menus so that the view reflects the state of the config.
                addMenu.helpers.updateMenus(config);
                
            }, // clearMenu
            
			makeMenuItem: function makeMenuItem(config, variable, options, label){
				// 'makeMenuItem' creates the menu item option in order to allow different functionalities to add their own events to the menus without having to declare them specifically in otehr functions.
				return {
						  variable: variable,
						  options : options, 
						  label: label,
						  event: config.f.onVariableChangeEvent
					  }
				
			}, // makeMenuItem
			
        }, // addPlotControls
        
        removePlotControls:  function removePlotControls(clickedPlotCtrl){
								
			// Find the ctrl of this plot. 
			// this = button -> ctrlGrp -> plotTitle -> card.
			var plotWrapperDOM = this.parentElement.parentElement.parentElement.parentElement
			
			
			// plotWrapperDOM -> plotRowBody
			var thisPlotRowBody = d3.select( plotWrapperDOM.parentElement )
			

			// Remove the plot from the object.
			thisPlotRowBody.each(function(plotRowCtrl){
				plotRowCtrl.plots = plotRowCtrl.plots.filter(function(plotCtrl){
					// Only return the plots that are not this one.
					return plotCtrl != clickedPlotCtrl
				}) // filter
			}) // each
				

			// Remove from DOM
			plotWrapperDOM.remove()
			
			// Remove any filters that have been removed.
			filter.remove()
			filter.apply()
			
			// Re-render the view
			sessionManager.render()

			
		}, // removePlotRowControls

        addPlotRowControls: { 
        
            elementOptionsArray: [
                    {val: "undefined", text: " "},
                    {val: "metadata", text: 'Metadata overview'},
                    {val: "plotter", text: 'Flow field plots'}
                ],
        
            make : function make(ownerButton){

                // Create the config element with all required data.
                var config = addMenu.addPlotRowControls.createConfig(ownerButton);
                
                // First create the ids of the required inputs
                addMenu.helpers.makeDialog(config);
            
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);
				
				// Add the buttons
				addMenu.helpers.addDialogButtons(config)

				// Add the on click event to the dialog owner button
				config.ownerButton.on("click", function(){
				
					addMenu.helpers.showDialog(config)
					
				}) // on
                
            }, // make
            
            createConfig: function createConfig(ownerButton){
                
                var config = {
					f: addMenu.addPlotRowControls,
					
					position: {
						left: undefined, 
						 top: undefined, 
					   delta: undefined
					},
					
					buttons: [
						{text: "ok"    , onclick: ok    , class: "btn btn-success"},
						{text: "cancel", onclick: cancel, class: "btn btn-danger"}
					],
                    
                    menuItems: [
						{
							variable: "type",
							options : addMenu.addPlotRowControls.elementOptionsArray,
							label   : "Select plot row type",
							event   : addMenu.addPlotRowControls.onPlotRowTypeChangeEvent,
                        }
					],
                    
                    newCtrl: {  
                        type: "undefined",
                    },
					  
					ownerButton: ownerButton,
                    
					ownerCtrl: {addPlotButton: {}}
                };
				
				
				function ok(dialogConfig){
					
				
					// Hide the dialog
					addMenu.helpers.hideDialog(dialogConfig)

					// Add the plot row.
					addMenu.addPlotRowControls.submitNewPlotRow(dialogConfig)
					
					// Reset the menu DOM elements.
					addMenu.helpers.resetVariableMenuSelections(config, "type");
				
					// Redraw to show changes.
					sessionManager.render();				
					
				} // ok

				function cancel(dialogConfig){
					
					addMenu.addPlotRowControls.clearNewPlotRow(dialogConfig)
				
					addMenu.helpers.hideDialog(dialogConfig)
					
					// ALSO READJUST THE MENUS!!
				
					console.log("Cancel")
				} // ok


				
                // The addPlotButton id needs to be updated when the row is submitted!
                
                return config;
            }, // createConfig
            
            clearNewPlotRow: function clearNewPlotRow(config){
                config.newCtrl.title = "New row";
                config.newCtrl.plots = [];
                config.newCtrl.type  = "undefined";
                config.newCtrl.addPlotButton = {label : "Add plot"};
				
				// Here also readjust the menu.
				config.dialogWrapper.selectAll("select").each(function(){
					this.value = "undefined"
				})
            }, // clearNewPlotRow
            
            submitNewPlotRow: function submitNewPlotRow(config){
                // Submits the dialog selections to dbsliceData, and clears the dialog object selections.
                
                var plotRowToPush = new plotRow(config.newCtrl)
                
                // Push and plot the new row.
                dbsliceData.session.plotRows.push( plotRowToPush );
				
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
				
				// Why would thi sremove the data??
                config.dialogWrapper
				  .select(".btn-success")
				  .each(function(d){
					  this.disabled = disabledFlag
				  })
				
            }, // enableDisableSubmitButton
            
            onPlotRowTypeChangeEvent: function onPlotRowTypeChangeEvent(config, selectDOM, variable){
                
                // When the plot row type is changed just check if the button should be enabled.
				config.newCtrl.type = selectDOM.value;
				
				addMenu.addPlotRowControls.enableDisableSubmitButton(config);

                
                
            }, // onPlotRowTypeChangeEvent
            
			
			
			
			
        }, // addPlotRowControls

        helpers: {
            
            makeDialog: function makeDialog(config){
	
				var drag = d3.drag()
				.on("start", function(d){
					let mousePos = d3.mouse(this)
					d.position.delta = {x: mousePos[0], y: mousePos[1]}
				})
				.on("drag", function(d){ 
					
					d3.select(this)
					  .style("left", (d3.event.sourceEvent.clientX - d.position.delta.x) + "px")
					  .style("top", (d3.event.sourceEvent.clientY - d.position.delta.y ) + "px")

				})
				.on("end", function(d){
					d.position.delta = undefined
				})
				

			
				// Place the dialog directly into the body! Position it off screen
				// position: fixed is used to position the dialog relative to the view as opposed to absolute which positions relative to the document.
				config.dialogWrapper = d3.select("body")
				  .append("div")
					.datum( config )
					.style("position", "fixed")
					.style("height", "auto")
					.style("width", "auto")
					.style("top", -window.innerWidth +"px")
					.style("left", -window.innerHeight +"px")
					.style("display", "none")
					.call( drag )
					
				config.dialogCard = config.dialogWrapper
				  .append("div")
					.attr("class", "card border-dark")
					.style("width", "auto")
					.style("height", "auto")
					.style("min-height", 94 + "px")
					
				config.gMenu = config.dialogCard.append("g")
			
				// Assign the dialog wrapper to the container config too.
				config.ownerCtrl.addPlotButton.dialogWrapper = config.dialogWrapper
			
			}, // makeDialog
        
			addDialogButtons: function addDialogButtons(config){
	
				var buttonsDiv = config.dialogCard
				  .append("div")
				  .style("margin-left", "10px")
				  .style("margin-bottom", "10px")
				
				
				config.buttons.forEach(function(b){
					buttonsDiv
					  .append("button")
						.html(b.text)
						.attr("class", b.class)
						.on("click", b.onclick )
				})
			
			}, // addDialogButtons
		
			hideDialog: function hideDialog(config){
	
				// By default the dialog is not visible, and is completely off screen.
				// 1 - make it visible
				// 2 - move it to the right position
				var dialogDOM = config.dialogWrapper.node() 
				
				dialogDOM.style.display = "none"
				
				
				// Move it to the middle of the screen
				dialogDOM.style.left = - window.innerWidth + "px"
				dialogDOM.style.top =  - window.innerHeight + "px"
			
			}, // hideDialog

			showDialog: function showDialog(config){
			
				// By default the dialog is not visible, and is completely off screen.
				// 1 - make it visible
				// 2 - move it to the right position
				var dialogDOM = config.dialogWrapper.node()
				
				// Make dialoge visible
				dialogDOM.style.display = ""
				
				// To get the appropriate position first get the size:
				var dialogRect = dialogDOM.getBoundingClientRect()
				
				
				
				// Move it to the middle of the screen
				dialogDOM.style.left = ( window.innerWidth - dialogRect.width ) /2 + "px"
				dialogDOM.style.top =  ( window.innerHeight - dialogRect.height ) /2 + "px"
			
			
				// Check which buttons should be on.
				config.f.enableDisableSubmitButton(config)
			
			}, // showDialog

            updateMenus: function updateMenus(config){
				// Handles all selection menus, including the plot selection!
				// A 'label' acts as a wrapper and contains html text, and the 'select'.

                // This function updates the menu of the pop-up window.
                var menus = config.gMenu.selectAll("g").data(config.menuItems);
                
                // Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.
                menus.enter()
				  .append("g")
				  .each(function(d){
					  d3.select(this)
					    .append("label")
						  .attr("class", "dialogContent unselectable")
				           .text(d.label)
						.append("select")
						  .attr("type", d.variable)
					      .style("margin-left", "10px")
					  d3.select(this).append("br")
				  })
                  
					
                    
                // Remove exiting menus.
                menus.exit().remove();
				
				
                
                // Update all the menu elements.
                config.gMenu.selectAll("label")   
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

			resetVariableMenuSelections: function resetVariableMenuSelections(config, variable){
				// Needs to only reset the appropriate select!!
				config.dialogWrapper
				  .selectAll("select[type='" + variable + "']")
				  .each(function(){
					  this.value = "undefined"
				  })

            }, // resetVariableMenuSelections
			
            addUpdateMenuItemObject: function addUpdateMenuItemObject(config, variable, options, label){

				// Transform the options into a form expected by the select updating functionality. Also introduce an empty option.
				options = options.map(function(d){return {val: d, text:d }})
				options.unshift({val: "undefined", text: " "})

                // First remove any warnings. If they are needed they are added later on.
                config.dialogWrapper.selectAll(".warning").remove();

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
                      requiredItem = config.f.makeMenuItem(config, variable, options, label)
                      
                      config.menuItems.push(requiredItem);
                    };      

                
                } else {
                      // There are no variables. No point in having an empty menu.
                      addMenu.helpers.removeMenuItemObject(config, variable);
                      
                        
                }; // if
                
            }, // addUpdateMenuItemObject

            removeMenuItemObject: function removeMenuItemObject(config, variable){
                // Removes the menu item with that controls <variable>.
                config.menuItems = config.menuItems.filter(function(menuItem){
					return menuItem.variable != variable
				});
                
            }, // removeMenuItemObject

            
            
            
            
        } // helpers

    }; // addMenu
 