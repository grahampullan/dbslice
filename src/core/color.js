import {dbsliceData} from "./dbsliceData.js";
import {sessionManager} from "./sessionManager.js";

export var color = {
		// The color controls should probably be moved to a single location, i.e. a single button on a toolbar somewhere. Maybe create a floating top toolbat to control all general behaviour.
		
		// To perform the task it seems it is the simplest if this variable holds the color palette for all other plots to share. The color change effects need then only change the color palette here. Specifically: this palette will replace ctrl.tools.cscale.
		
		defaultPalette: function defaultPalette(){
			return "cornflowerblue"
		}, // defaultPalette
		
		colorPalette: d3.scaleOrdinal(d3.schemeDark2), // colorPalette
		
		togglePalette: function togglePalette(varName){
			
			// Setup the color function.
			if( color.settings.scheme == undefined){
				// Color scale is set to the default. Initialise a color scale.
			
				// The default behaviour of d3 color scales is that they extend the domain as new items are passed to it. Even if the domain is fixed upfront, the scale will extend its domain when new elements are presented to it.
				color.settings.scheme   = "color"
				color.settings.variable = varName
			} else if (color.settings.variable != varName){
				// The color metadata option has changed. Clear the scale domain so that the scale will be used with the new parameter.
			
				color.colorPalette.domain([])
				color.settings.variable = varName
			} else {
				// The same color option has been selected - return to the default color options.
				color.settings.scheme = undefined
				color.settings.variable = undefined
				color.colorPalette.domain([])
			} // if
			
		}, // togglePalette
		
		// settings holds the flag for the scheme to use, and the variable it is supposed to be used with. 
		settings: { 
		            name: "Colour",
					scheme: undefined,
		          val: undefined,
				  options: undefined,
				  event: function(ctrl, varName){
					  
					// The on-click functionality takes care of the options that are specific to an individual plot. Coloring is cross plot, and therefore must coordinate the menus of several plots. This is done here.
							
					// Update the plot ctrls
					toggleAllColorSubmenuItems()
					
					// If a color option is defined, and this is the option corresponding to it, then make it active.
				  
					
					color.togglePalette(varName)
					
					
					// do the render so that all plots are updated with the color.
					sessionManager.render()
					
					
					function toggleAllColorSubmenuItems(){
						
						
						dbsliceData.session.plotRows.forEach(function(plotRow){
						  plotRow.plots.forEach(function(plot){
							if(plot.view.cVarOption != undefined){
							  
							  // Adjust the plot color value
							  plot.view.cVarOption.val = varName
							
							  // Toggle the html options
							  plot.figure
								.select("div.bottomLeftControlGroup")
								.selectAll("p.submenu-toggle")
								.each(function(){
								  
								  if(this.innerHTML == "Colour"){
									// Color submenu to be adjusted.
									  
									d3.select(this.parentElement)
									  .selectAll("a.submenu-item")
									  .each(function(){
											
										if( this.innerHTML == varName ){
										  this.classList.replace("deselected", "selected")
										} else {
										  this.classList.replace("selected", "deselected")
										} // if
											
									  }) // each
								  } // if
							  }) // each
								  
							} // if
						  }) // forEach
						}) // forEach
						
					} // toggleAllColorSubmenuItems
					  
				  } // event
		},
		
		get: function get(key){
			// Coloring is expected to be done on the categorical variable key basis.
			// Perform any input check on the input key, and return the appropriate color code. So that the colors don't baloon out of control?
			var palette = color.defaultPalette
			
			var colorIsChosen = color.settings.scheme != undefined
			var keyIsValid    = color.settings.val == undefined? false : dbsliceData.data.categoricalUniqueValues[color.settings.val].includes(key)
			
			if( colorIsChosen && keyIsValid ){
				palette = color.colorPalette
			} // if			
			
			return palette(key)
			
		}, // get
		
		
		
	} // crossPlotColoring
