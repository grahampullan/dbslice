import { dbsliceData } from './dbsliceData.js'


var color = {
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
		settings: { scheme: undefined,
		          variable: undefined,
		},
		
		get: function get(key){
			// Coloring is expected to be done on the categorical variable key basis.
			// Perform any input check on the input key, and return the appropriate color code. So that the colors don't baloon out of control?
			var palette = color.defaultPalette
			
			var colorIsChosen = color.settings.scheme != undefined
			var keyIsValid    = color.settings.variable == undefined? false : dbsliceData.data.metaDataUniqueValues[color.settings.variable].includes(key)
			
			if( colorIsChosen && keyIsValid ){
				palette = color.colorPalette
			} // if			
			
			return palette(key)
			
		}, // get
		
		
		
	} // crossPlotColoring


export { color };