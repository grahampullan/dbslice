import { dbsliceData } from './dbsliceData.js'


var color = {
		// The color controls should probably be moved to a single location, i.e. a single button on a toolbar somewhere. Maybe create a floating top toolbat to control all general behaviour.
		
		// To perform the task it seems it is the simplest if this variable holds the color palette for all other plots to share. The color change effects need then only change the color palette here. Specifically: this palette will replace ctrl.tools.cscale.
		
		defaultPalette: function defaultPalette(){
			return "cornflowerblue"
		}, // defaultPalette
		
		colorPalette: d3.scaleOrdinal(d3.schemeCategory10), // colorPalette
		
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