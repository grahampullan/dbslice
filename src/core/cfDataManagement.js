import { dbsliceData } from '../core/dbsliceData.js';
import { filter } from '../core/filter.js';

var cfDataManagement = {
		
		cfInit: function cfInit(metadata){
      
			var cfData = {};
			cfData.metaDataProperties = metadata.header.metaDataProperties;
			cfData.dataProperties = metadata.header.dataProperties;
			cfData.line2dProperties = metadata.header.line2dProperties;
			cfData.contour2dProperties = metadata.header.contour2dProperties;
			cfData.cf = crossfilter(metadata.data);
			cfData.metaDims = [];
			cfData.metaDataUniqueValues = {};
			cfData.dataDims = [];
			cfData.taskDim = []
			cfData.fileDim = [];
			cfData.filterSelected = [];
			cfData.histogramSelectedRanges = [];
			cfData.manuallySelectedTasks = [];
			
			// Populate the metaDims and metaDataUniqueValues.
			cfData.metaDataProperties.forEach(function (property, i) {
				// Dimension object
				cfData.metaDims[property] = 
					cfData.cf.dimension(function (d){return d[property];})
				
				// It's unique values
				cfData.metaDataUniqueValues[property] = helpers.unique( metadata.data.map(
					function (d){return d[property]}
				));
			}); // forEach
			
			
			// Populate the dataDims. cf.dimension(function(d){return d.<property>}) sets up a dimension, which is an object that can perform some specific tasks based on the data it is give. Two of these are "top(n)", and "bottom(n)", whih return topmost and bottommost n elements respectively.
			cfData.dataProperties.forEach(function (property, i) {
			  cfData.dataDims[property] = 
				cfData.cf.dimension(function (d){return d[property];});
			}); // forEach
			
			

			cfData.fileDim = cfData.cf.dimension(function (d){return d.file;})
			cfData.taskDim = cfData.cf.dimension(function (d){return d.taskId;})
			

			// Check if any histogram selected ranges have already been set up. This is important when the data is being replaced.
			if(dbsliceData.data !== undefined){
				if(dbsliceData.data.histogramSelectedRanges !== undefined){
					cfData.histogramSelectedRanges = dbsliceData.data.histogramSelectedRanges
				} // if
			} // if
			
			
			// Store data internally
		    dbsliceData.data = cfData;
			
			// Update the color options.
			color.settings.options = dbsliceData.data.metaDataProperties
			
			
		
			
		}, // cfInit
				
		cfAdd: function cfAdd(metadata){
			// This function attempts to add data to the already existing dataset. It allows a compromise between searching for all available data and loading it in, and personally creating additional combinations of the metadata in csv files.
			// The ideal solution would be for each individual task to have it's own small metadata file, which could then by parsed by a search engine. This is unpractical for a localised application - this functionality is usable however.
			
			// If no data is currently loaded then call cfInit instead - this allows the dimensions to be overrun.
			if (dbsliceData.data !== undefined){
				
				
				// If no data is currently loaded then call cfInit instead - this allows the dimensions to be overrun.
				if (dbsliceData.data.cf.all().length < 1){
					cfDataManagement.cfInit(metadata)
			
				} else {
			
					// Here the compatibility of data needs to be assessed. If the new dataset has the same variables as the existing datasets, then add those in. If it does not do nothing.
					var canMerge = cfDataManagement.helpers.crossCheckProperties(dbsliceData.data, metadata)
					
					if(canMerge){
						
						// Add these records into the dataset.
						dbsliceData.data.cf.add(metadata.data)

					} // if
				} // if
				
				
			} else {
				cfDataManagement.cfInit(metadata)
			} // if
			
			
		}, // cfAdd
			
		cfRemove: function cfRemove(dataFilesToRemove){
			// This function will remove the data from the crossfilter.
			
			// Remove the current user selected filter.
			filter.remove()
			
			// Apply a temporary filter: which files are to be removed..
			dbsliceData.data.fileDim.filter(function(d){
				return dataFilesToRemove.indexOf(d) > -1
			})
			
			
			// Remove the data.
			dbsliceData.data.cf.remove()
			
			
			// Remove the temporary filter.
			dbsliceData.data.fileDim.filterAll()
			
			
			// Refresh the data info
			cfDataManagement.helpers.refreshMetadataInfo()
			
			// Reinstate user specified data filters.
			filter.apply()
			
			
		}, // cfRemove
		
		
		// On-demand file library:
		refreshTasksInPlotRows: function refreshTasksInPlotRows() {
			// Collect all files that need to be loaded, create promises for them and store them into plot promise arrays that can be used to signal to the plot functions when they can update themselves.
			
			// It is expected that the individual plot controls have the sliceId specified in 'ctrl.view.sliceId', and that they have the promises stored under 'ctrl.data.promises'.
			
			// 'dbsliceData.flowData' will contain references to all promises created, and will keep track of the individual file promises. 'plotPromise' is an array of promises constructed for individual plots, and should trigger the redraw on completion of promise.
			
			
			// First do an inventory check of the central booking, and clear out unnecessary items.
			
			
			
			// Collect all the files that need to be loaded. Note that the files are individual properties of the records in the crossfilter.
			cfDataManagement.removeRedundantFiles()
			
			
			var filteredTasks = dbsliceData.data.taskDim.top(Infinity)
			
			
			
			// Create the actual promises to be stored in the central booking. This is a duplicative loop over the existing promises because the plot ctrl assigns the data processor function, which 'collectAllRequiredFiles' does not collect.
			dbsliceData.session.plotRows.forEach(function(plotRowCtrl, i){
			
				// Only consider plots for loading if the plot row is a "plotter". In future this could be moved to the actual plot ctrl's themselves and they could say whether they're expecting data from outside or not.
				if(plotRowCtrl.type == "plotter"){
					
				plotRowCtrl.plots.forEach(function(plotCtrl, j){
			  
				
					// Loop over all the files that will be required for this plot.
					var sliceId = plotCtrl.view.sliceId
					var requiredFiles = filteredTasks.map(function(d){return d[sliceId] })
					
					// For this particular plot all promises must be made, and a record tracked.
					var plotPromise = []
					var file = undefined
					
					requiredFiles.forEach(function(url, k){
					
						// The loaded files must be updated to prevent duplicate loading.
						file = undefined
						var loadedFiles = dbsliceData.flowData.map(function(d){return d.url})
					
					
						// Check if a promise to this file has already been created.
						var fileIndex = loadedFiles.indexOf( url )
						if( fileIndex < 0 ){
							//console.log("loading: " + url)
							// Promise for this file does not yet exist. Create it, store a reference in 'dbsliceData.flowData', and another in the 'plotCtrl.data.promises'. The storing into 'dbsliceData.flowData' is done in the makeFilePromise already. The storing in the plot ctrl is done to allow the plotting function itself to identify any differences between the plotted state and the tasks selected in hte filter. This is useful if the plots should communicate to the user that they need to be updated.
							file = makeFilePromise( url, plotCtrl.data.processor )
							
						} else {
						
							file = dbsliceData.flowData[fileIndex]
							
						} // if
						
						plotCtrl.data.promises.push( file.promise )
					
					}) // forEach
				
				
					// If a file is not found a rejected promise is stored. Therefore, if dbslice couldn't find the file, it will not look for it again. If it would instead search for it every time the refresh button is clicked, missing file issues could be resolved on the fly. However, if data is missing in the files the app must be reloaded so that the promises are cleared, so that on next load the new data is loaded too.
					// It is important that the promises log themselves immediately, and remain in place in order to ensure no additional loading is scheduled. Therefore the central booking must clear out the rejected files AFTER all the promises have been processed. This is done when the "Plot Selected Tasks" button is pressed again. 
					
					
					// Now that all the plot promises have been assembled, attach the event to run after their completion.
					addUpdateOnPromiseCompletion(plotCtrl, sliceId, i, j)
				
			  
				}) // forEach
				
				} // if
			
			}) // forEach
			
			function makeFilePromise( url, processor ){
				// Has to return an object {url: url, promise: Promise(url)}. Furthermore, the completion of the promise should store the data into this same object.
				
				var file = {  url: url,
						  promise: undefined,
							 data: undefined}
				
				// Create teh promise to load and process the data.
				file = processor.createFilePromise(file)
				
				// Store the file into the central booking location.
				dbsliceData.flowData.push( file )
				
				return file
				
			} // makeFilePromise
			
			function addUpdateOnPromiseCompletion(plotCtrl, sliceId, i, j){
			
				
				Promise.all( plotCtrl.data.promises ).then(function(){
					// The data has been loaded, start the plotting. How to pass in special parameters?
					
					// console.log("Started plotting slice: "+sliceId+" ( plotRow:"+i+", plot: "+j+")")
					
					
					plotCtrl.plotFunc.updateData(plotCtrl)
					
				})
			
			} // addUpdateOnPromiseCompletion

		}, // refreshTasksInPlotRows
		
		collectAllRequiredUrls: function collectAllRequiredUrls(filteredTasks){
		
			var requiredUrls = []
			dbsliceData.session.plotRows.forEach(function(plotRowCtrl){
			
				plotRowCtrl.plots.forEach(function(plotCtrl){
			  
				
					// Loop over all the files that will be required for this plot.
					if(plotCtrl.view.sliceId != undefined){
						
						requiredUrls = requiredUrls.concat( filteredTasks.map(function(d){
							return d[ plotCtrl.view.sliceId ] 
						}))
					} // if
			  
			    }) // forEach
			
			}) // forEach
		
			return requiredUrls
		}, // collectAllRequiredUrls
		
		removeRedundantFiles: function removeRedundantFiles(){
			
			// Collect all the files that need to be loaded. Note that the files are individual properties of the records in the crossfilter.
			var filteredTasks = dbsliceData.data.taskDim.top(Infinity)
			
			
			// Collect all the required, and loaded files, and identify which, if any, files in the central booking will be redundant, and clear them out.
			var allRequiredUrls = cfDataManagement.collectAllRequiredUrls(filteredTasks)
			var allLoadedUrls = dbsliceData.flowData.map(function(file){return file.url})
			
			var redundantFiles = dbsliceData.flowData.filter(function(loadedFile){
				// Files are redundant if the refresh does not need them, or if their data could not be loaded, in which case a repeated attempt to laod them should be launched.
				var urlNoLongerRequired = !allRequiredUrls.includes(loadedFile.url)
				var urlWasRejected = loadedFile.data == undefined
				return urlNoLongerRequired || urlWasRejected
			})
			
			
			
			// Clear the redundant files out of central booking.
			redundantFiles.forEach(function(redundantFile){
				var redundantFileInd = helpers.indexOfObjectByAttr(dbsliceData.flowData, "url", redundantFile.url)
				dbsliceData.flowData.splice(redundantFileInd,1)
			}) // redundantUrls
			
			
			
			
			
			
				
		}, // removeRedundantFiles
		
		// Accessing on-demand data files.
		getFileAvailabilityInfo: function getFileAvailabilityInfo(ctrl){
			
			  
			
			var getUrl = function(task){return task[ctrl.view.sliceId]}
			var requiredTasks = dbsliceData.data.taskDim.top(Infinity)
			var requiredUrls = requiredTasks.map( getUrl )
			
			// This is the set of urls of all files that have been loaded into internal storage that are required for this plot. The loaded files are not returned as that would mean they are logged into memory again.
			// Furthermore, also check which have failed upon loading. Those are the files that were not found, therefore the promise was rejected.
			var availableUrls = dbsliceData.flowData.filter(function(file){
				var isUrlRequired = requiredUrls.includes( file.url )
				var wasPromiseResolved = file.data != undefined
				return isUrlRequired && wasPromiseResolved
			}).map(function(file){return file.url})
			
			// Reverse reference the loaded files to find which required files are not available in the central storage. 
			var missingUrls = requiredUrls
			  .filter( function(url){return !availableUrls.includes(url)})	

			
			// Create 'file' responses detailing which files of which tasks were : 
			// 1.) requested:
			var requestedFiles = requiredTasks.map(returnFile)
			
			// 2.) available:
			var availableFiles = requiredTasks.filter(function(task){
				return availableUrls.includes( getUrl(task) )
			}).map(returnFile)
			
			// 3.) missing:
			var missingFiles = requiredTasks.filter(function(task){
				return missingUrls.includes( getUrl(task) )
			}).map(returnFile)
			
			// 4.) duplicated:
			var duplicatedFiles = requiredTasks.filter(function(task){
			  
			  // Assume duplicate by default.
			  var flag = true
			  if( requiredUrls.indexOf(     getUrl(task) ) == 
				  requiredUrls.lastIndexOf( getUrl(task) ) ){
				// The first element is also the last occurence of this value, hence it is a unique value. This is therefore not a duplicating element.
				flag = false
			  } // if
			  
			  return flag
			}).map(returnFile)
			

			return {
				 requested: requestedFiles,
				 available: availableFiles,
				duplicates: duplicatedFiles,
				   missing: missingFiles
			}
			
			function returnFile(task){
				// 'returnFile' changes the input single task from the metadata, and returns the corresponding selected 'file'. The 'file' contains the url selected as per the slice selection made by the user, and the corresponding task. The task is required to allow cross plot tracking of all the data connected to this task, and the optional coloring by the corresponding metadata values.
				
				// This here should also package up all the metadata properties that would enable the coloring to fill them in.
				
				// dbsliceData.flowData.filter(function(file){return file.url == task[ctrl.view.sliceId]})[0].data
				var file = helpers.findObjectByAttribute(dbsliceData.flowData, "url", [task[ctrl.view.sliceId]], true)
				
				return {  task: task, 
						   url: task[ctrl.view.sliceId],
						  data: file.data}
				
			} // returnFile
			
		}, // getFileAvailabilityInfo
		
		
		// Info on hte data in the files
		getLineFileDataInfo: function getLineFileDataInfo(ctrl){
			
			var files = cfDataManagement.getFileAvailabilityInfo(ctrl)
			
			// Compatibility of nests!
			// The nests will have to be exactly the SAME, that is a prerequisite for compatibility. The options for these nests can be different, and the variables in these nests can be different. From these is the intersect calculated.
			var compatibilityAccessors = [
				function(f){return f.data["userOptions"].map(function(o){return o.name})},
				function(f){return f.data["commonOptions"].map(function(o){return o.name})}]
			var c = helpers.chainCompatibilityCheck(files.available, compatibilityAccessors)
			
			// Compatibility ensures that all the files have exactly the same user tags available. Retrieve their intersect.
			var intersect = c.compatibleFiles.length > 0 ?  helpers.getIntersectOptions( c.compatibleFiles ) : undefined
			
			// The data properties are only available after a particular subset of the data has been selected. Only then will the dropdown menus be updated.
			ctrl.data.promises     = ctrl.data.promises
			ctrl.data.requested    = files.requested
			ctrl.data.available    = files.available
			ctrl.data.duplicates   = files.duplicated
			ctrl.data.missing      = files.missing
			ctrl.data.compatible   = c.compatibleFiles
			ctrl.data.incompatible = c.incompatibleFiles
			ctrl.data.intersect    = intersect
			

		  
		}, // getLineFileDataInfo
		
		getContour2dFileDataInfo: function getContour2dFileDataInfo(ctrl){
			
			// The files must all be 
			
			var files = cfDataManagement.getFileAvailabilityInfo(ctrl)
			
			// The contours are expected to only contain data of a single slice (2d) / slice scene (3d). Only the properties need to be compatible. For now this is just hard-coded here.
			
			var intersect = {
				varOptions: files.available[0].data.properties
			}

			
			
			// The data properties are only available after a particular subset of the data has been selected. Only then will the dropdown menus be updated.
			ctrl.data.promises  = ctrl.data.promises
			ctrl.data.requested = files.requested
			ctrl.data.available = files.available
			ctrl.data.duplicates= files.duplicated
			ctrl.data.missing   = files.missing
			ctrl.data.compatible = files.available
			ctrl.data.incompatible = []
			ctrl.data.intersect = intersect
			

			
		}, // getContour2dFileDataInfo
		
		// Accessing on-demand data
		getLineDataVals: function getLineDataVals(file, ctrl){
			// Make a distinction between accessing explicit and implicit data files.
			
			
			// Fix for accessing the json files.
			
			// Assemble the names of the properties to plot.
			var plotData
			switch( file.data.type ){
				case "implicit":
					// The options in the ctrl cannot be associated with the actual variable names in the files. The same menu options may correspond to different file variables if the sub-part of the file selected changes.

					// IS IT POSSIBLE TO REPLACE THIS WITH ACCESSORS??
					// No - it is possible that the user is trying to combine data from different file specification types.
					
					plotData = file.data.properties.map(function(d){
						return {x: Number(d[ctrl.view.xVarOption.val]), 
						        y: Number(d[ctrl.view.yVarOption.val])}
					})
					break;
					
				case "explicit":
				
					// json files also resolve to here, in which case they should just
				
					var f = helpers.findObjectByAttribute
			
					// Available properties after applying all the options.
					// Retrieve the properties
					var properties = file.data.properties
				
					// Apply all user selected options.	
					ctrl.view.options.forEach(function(option){
						properties = f( properties, option.name, [option.val], false)
					})
					
					// Pick the appropriate flow variable
					let flowProperty = f( properties, "varName", ctrl.view.yVarOption.val, true)
					
					
					plotData = flowProperty.vals
					
					break;
			
			} // switch
			
			plotData.task = file.task
			
			return plotData
		
		
			
			
		}, // getLineDataVals
		
		
		
		// HELPERS
		helpers : {
			
			getTaskIds: function getTaskIds(){
				var metadata = dbsliceData.data.taskDim.top(Infinity)
				var taskIds = metadata.data.map(function (task){
				  return task.taskId
				});
			  return taskIds
			}, // getTaskIds
			
			crossCheckProperties: function crossCheckProperties(existingData, newData){
				
				
				// oldData.header.dataProperties.filter(function(d){  return !newData.includes(d) })
				var missingDataProperties = existingData.dataProperties.filter(function(d){  return !newData.header.dataProperties.includes(d) })
				
				var missingMetadataProperties = existingData.metaDataProperties.filter(function(d){  return !newData.header.metaDataProperties.includes(d) })
				
				var missingLine2dProperties = existingData.line2dProperties.filter(function(d){  return !newData.header.line2dProperties.includes(d) })
					
				var missingContour2dProperties = existingData.contour2dProperties.filter(function(d){  return !newData.header.contourProperties.includes(d) })
				
				var allPropertiesIncluded =     (missingDataProperties.length == 0) && 
										    (missingMetadataProperties.length == 0) &&
										      (missingline2dProperties.length == 0) &&
										   (missingContour2dProperties.length == 0)
											 
				
				
				if(allPropertiesIncluded){
					return true
				} else {
					// Which ones are not included?
					var warningText = "Selected data has been rejected. It requires additional variables:\n" + 
					"Data variables:     " +      missingDataProperties.join(", ") + "\n" +
				    "Metadata variables: " +  missingMetadataProperties.join(", ") + "\n" +
					"Slice variables:    " +    missingLine2dProperties.join(", ") + "\n" +
					"Contour variables:  " + missingContour2dProperties.join(", ") + "\n"
					
					
					window.alert(warningText)
					return false
				} // if
				
			}, // checkProperties
			
			refreshMetadataInfo: function refreshMetadataInfo(){
				
				// IMPORTANT!!!!!!!!!!!!
				// The metadata properties need to be refershed whn the data changes!!!
				
				// Just check if the dim returns any data!!
				var d_ = dbsliceData.data
				
				// First check if there is still any data left.
				var data = d_.fileDim.top(Infinity)
				if(data.length < 1){
					// No data available,  remove all dims and associate info.
					
					d_.metaDataProperties = [];
					d_.dataProperties = [];
					d_.line2dProperties = [];
					d_.contour2dProperties = [];
					
					d_.metaDims = [];
					d_.dataDims = [];
				
					d_.metaDataUniqueValues = {};
					d_.histogramSelectedRanges = [];
				} else {
					
					// Some data is available. Find which properties are still available.
					var task = data[0]
					var properties = Object.getOwnPropertyNames( task )
					
					// Check if the dbsliceData properties are in the example task properties.
					
					// CLEAN THIS UP!!!!!!
					d_.metaDataProperties = d_.metaDataProperties.filter(function(metaDataProperty){
						var isMetaDataAvailable = properties.includes(metaDataProperty)
						if( !properties.includes(metaDataProperty) ){
							// Remove the property that corresponds to no data properties.
							delete d_.metaDims[metaDataProperty]
							delete d_.metaDataUniqueValues[metaDataProperty]
						} else {
							d_.metaDataUniqueValues[metaDataProperty] = helpers.unique( data.map(
						function (d){return d[metaDataProperty]} ))
						} // if
						return isMetaDataAvailable
					}) // filter
					
					d_.dataProperties = d_.dataProperties.filter(function(dataProperty){
						var isDataAvailable = properties.includes(dataProperty)
						if( !properties.includes(dataProperty) ){
							// Remove the property that corresponds to no data properties.
							delete d_.dataDims[dataProperty]
							delete d_.histogramSelectedRanges[dataProperty]
						} // if
						return isDataAvailable
					}) // filter
					
					
					d_.line2dProperties = d_.line2dProperties.filter(function(sliceId){
						return properties.includes(sliceId)
					});
					
					d_.contour2dProperties = d_.contour2dProperties.filter(function(sliceId){
						return properties.includes(sliceId)
					});
					
				} // if
				

				
			}, // refreshMetadataInfo
			
			isPropertyInDbsliceData: function isPropertyInDbsliceData(property){
				
					var isInData = [ 
						dbsliceData.data.metaDataProperties.includes(property),
						dbsliceData.data.dataProperties.includes(property),
						dbsliceData.data.line2dProperties.includes(property),
						dbsliceData.data.contour2dProperties.includes(property)
					]
					
				
				return isInData.some(d=>d)
				
			}, // isPropertyInDbsliceData
			
		} // helpers
		
	} // cfDataManagement
       

	

export { cfDataManagement };