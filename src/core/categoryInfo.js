export let categoryInfo = {
		
		catCompatibleTypes: {
			categorical: ["number", "string","line2dFile","contour2dFile"],
			ordinal: ["number"],
			line2dFile: ["line2dFile"],
			contour2dFile: ["contour2dFile"]
		}, // catCompatibleTypes
		
		cat2type: {
			categorical: "string",
				ordinal: "number",
			 line2dFile: "line2dFile",
		  contour2dFile: "contour2dFile"
		}, // cat2type
		
		cat2ind: {
			 categorical: 0,
				 ordinal: 1,
			  line2dFile: 2,
		   contour2dFile: 3,
				  unused: 4
		}, // cat2ind
		
		cat2prop: {
			categorical: "categoricalProperties",
				ordinal: "ordinalProperties",
			 line2dFile: "line2dProperties",
		  contour2dFile: "contour2dProperties",
				 unused: "unusedProperties"
		}, // cat2prop
			
		ind2cat: {
			0: "categorical",
			1: "ordinal",
			2: "line2dFile",
			3: "contour2dFile",
			4: "unused"
		}, // ind2cat
		
		// Move to input testing
		supportedCategories: [
			  "categorical",
			  "ordinal",
			  "line2dFile",
			  "contour2dFile",
			  "Unused"
		], // supportedCategories
		
		
	} // categoryInfo
	