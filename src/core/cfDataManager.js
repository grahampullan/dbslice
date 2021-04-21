import {dbsliceData} from "./dbsliceData.js";
import {sessionManager} from "./sessionManager.js";
import {color} from "./color.js";
import {helpers} from "./helpers.js";
import {crossfilter} from "../outside/crossfilter.js";

export var cfDataManager = {
		
		cfInit: function cfInit(){
      
			// Initialise the internal data as empty. So this just gives the general structure of the internal data. The structure of 'dbsliceData' gives the general separation between files, internal data, and session.
	  
			
			
			let cfData = {
				
				categoricalProperties: [],
				ordinalProperties: [],
				line2dProperties: [],
				contour2dProperties: [],
				
				cf: crossfilter([]),
				
				categoricalDims: [],
				ordinalDims: [],
				taskDim : undefined,
				fileDim : undefined,
				
				filterSelected: [],
				histogramSelectedRanges: [],
				manuallySelectedTasks: [],
				
				categoricalUniqueValues: {},
			
			}; // cfData
			

			cfData.fileDim = cfData.cf.dimension(d=>d.filenameId)
			cfData.taskDim = cfData.cf.dimension(d=>d.taskId)
			
			dbsliceData.data = cfData
			
		}, // cfInit
				

		cfChange: function(metadata){
			// Handle the change to the metadata. Simply exchange all the internal data. But, I may need to retain the filter settings?
			
			// Exchange the data.
			dbsliceData.data.cf.remove()
			dbsliceData.data.cf.add(metadata.data)
			
			// Resolve the differences between the old variables and the new variables.
			cfDataManager.resolve.cfData.headerChange(metadata.header)
			
			// Update the color options.
			color.settings.options = dbsliceData.data.categoricalProperties
			
			// Push the UI to adjust to the internal change too.
			sessionManager.resolve.ui.dataAndSessionChange()
		}, // cfChange
				
		
		resolve: {
			
			// cfdata
			cfData: {
				
				headerChange: function(newHeader){
					
					let resolve = cfDataManager.resolve
					let cfData = dbsliceData.data
					
					// Maybe just list them, instead of going through the switch??
					
					// Go through the new header. The changes require also the crossfilter dimensions to be adjusted.
					Object.keys(newHeader).forEach(function(key){
						
						// Find the differences for this category that need to be resolved. 'diff' has items aMinusB (in current, but not in new) and bMinusA ( in new, but not in current)
						let diff = helpers.setDifference(cfData[key], newHeader[key])
						
						switch(key){
							case "categoricalProperties":
							  
								// Dimensions first
								resolve.cfData.dimensions(cfData.categoricalDims, diff)
							  
								// Metadata dimensions have precomputed unique values. Create these ones for new variables, and delete any unnecessary ones.
								resolve.cfData.uniqueValues(cfData.categoricalUniqueValues, diff)
							  break;
							
							case "ordinalProperties":
							
								// Dimensions first
								resolve.cfData.dimensions(cfData.ordinalDims, diff)
							  
								// Data dimensions have corresponding histogram ranges. Delete unnecessary ones, and create necessary ones.
								resolve.cfData.histogramRanges(cfData.histogramSelectedRanges, diff)
							  break;
							  
							case "line2dProperties":
							case "contour2dProperties":
								// Nothing apart from the default change of the options in the header needs to be done.
							  break;
							
						} // switch
						
						// Resolve the header.
						cfData[key] = newHeader[key]
						
					}) // forEach
					
				}, // headerChange
				
				dimensions: function dimensions(dims, diff){
				
					// Those in A, but not in B, must have their cf dimensions removed.
					diff.aMinusB.forEach(function(varName){
						delete dims[varName]
						
					})
				  
					// Those in B, but not in A, must have cf dimensions created.
					diff.bMinusA.forEach(function(varName){
						let newDim = dbsliceData.data.cf.dimension(function (d){return d[varName];})
					  
						dims[varName] = newDim
					})
					
				}, // dimensions
				
				uniqueValues: function(vals, diff){
				
					cfDataManager.resolve.cfData.attributes(vals, diff, function (varName){
						// Find all the unique values for a particular variable.
						return helpers.unique( 
							  dbsliceData.data.cf.all().map(
								function (d){return d[varName]}
							  )
							);
					})
					
					
				}, // uniqueValues
				
				histogramRanges: function(vals, diff){
					
					cfDataManager.resolve.cfData.attributes(vals, diff, function (varName){
						// Find the max range for the histogram.
						
						let tasks = dbsliceData.data.cf.all()
						
						return d3.extent(tasks, d=>d[varName])
					})
					
				}, // histogramRanges
				
				attributes: function (vals, diff, populate){
					// Vals is an object of attributes that  needs to be resolved. The resolution of the attributes is given by diff. Populate is a function that states how that attribute should be populated if it's being created.
					
					// Delete
					diff.aMinusB.forEach(function(varName){
						delete vals[varName]
					})
					
					// Variables that are in 'new', but not in 'old'.
					diff.bMinusA.forEach(function(varName){
						// If a populate function is defined, then create an entry, otherwise create an empty one.
						if(populate){
							vals[varName] = populate(varName)	
						} else {
							vals[varName] = []
						} // if
					})

				}, // attributes
				
			}, // cfData
			
		}, // resolve
		
	} // cfDataManager
	