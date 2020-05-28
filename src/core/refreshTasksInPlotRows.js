import { dbsliceData } from './dbsliceData.js';
import { render } from './render.js';



function refreshTasksInPlotRows() {
        // Collect all files that need to be loaded, create promises for them and store them into plot promise arrays that can be used to signal to the plot functions when they can update themselves.
		
		// It is expected that the individual plot controls have the sliceId specified in 'ctrl.view.sliceId', and that they have the promises stored under 'ctrl.data.promises'.
		
		// 'dbsliceData.flowData' will contain references to all promises created, and will keep track of the individual file promises. 'plotPromise' is an array of promises constructed for individual plots, and should trigger the redraw on completion of promise.
		
		
		// First do an inventory check of the central booking, and clear out unnecessary items.
		
		
		
		// Collect all the files that need to be loaded. Note that the files are individual properties of the records in the crossfilter.
		var filteredTasks = dbsliceData.data.dataDims[0].top(Infinity)
		
		
		// Collect all the required, and loaded files, and identify which, if any, files in the central booking will be redundant, and clear them out.
		var allRequiredUrls = collectAllRequiredFiles(filteredTasks)
		var allLoadedUrls = dbsliceData.flowData.map(function(file){return file.url})
		
		var redundantFiles = dbsliceData.flowData.filter(function(loadedFile){
			// Files are redundant if the refresh does not need them, or if their data could not be loaded, in which case a repeated attempt to laod them should be launched.
			var urlNoLongerRequired = !allRequiredUrls.includes(loadedFile.url)
			var urlWasRejected = loadedFile.data == undefined
			return urlNoLongerRequired || urlWasRejected
		})
		
		
		
		// Clear the redundant files out of central booking.
		redundantFiles.forEach(function(redundantFile){
			var redundantFileInd = indexOfAttr(dbsliceData.flowData, "url", redundantFile.url)
			dbsliceData.flowData.splice(redundantFileInd,1)
		}) // redundantUrls
		
		
		
		
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
						console.log("loading: " + url)
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
			
			file.promise = d3.csv(url).then(function(data){
				// The data contents are kept in the original state by the internal storage, and it is the job of individual plotting functions to adjust the structure if necessary.
				// It has been decided that the data is transformed after all, as internal transformations would be often, and they would require additional memory to be occupied. The transformation function needs to be supplied by the plotting function.
				
				
				// The extents of the series will be valuable information when trying to create a plot containing data from different files. Alternately a dummy scale can be created, that has it's domain updated on plotting the dta, but then the data needs to be readjusted anyway, which duplicates the process.
				
				// Store the data.
				file.data = processor( data )
				
				
			
			}).catch(function(){
				// This catch does nothing for now, but it is here to ensure the rest of the code continues running.
				// On catch the default file object is not updated with data, and is not pushed into the central storage. It is not stored as the file might become available, and therefore dbslice should try to retrieve it again.
				console.log("Loading of a file failed.")
			})
			
			// Store the file into the central booking location.
			dbsliceData.flowData.push( file )
			
			return file
			
		} // makeFilePromise
		
		function addUpdateOnPromiseCompletion(plotCtrl, sliceId, i, j){
		
			
			Promise.all( plotCtrl.data.promises ).then(function(){
				// The data has been loaded, start the plotting. How to pass in special parameters?
				
				console.log("Started plotting slice: "+sliceId+" ( plotRow:"+i+", plot: "+j+")")
				
				// INCORPORATE CALL TO DRAWING FUNCTION HERE
				// Replace the redundant inputs with just the relevant plot control object. The control object should know which function it needs to invoke.
				
				// DUMMY FUNCTIONALITY!
				// In the real version this should call either render, or simply the function update, depending on what happens upon plot configure. If plot configure already creates an empty plot this could just call the update. Otherwise this would call render directly.
				plotCtrl.plotFunc.update_(plotCtrl)
				
				
				
				
				
			})
		
		} // addUpdateOnPromiseCompletion
      
        function collectAllRequiredFiles(filteredTasks){
		
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
		} // collectAllRequiredFiles
		
		function indexOfAttr(array, attr, value) {
			for(var i = 0; i < array.length; i += 1) {
				if(array[i][attr] === value) {
					return i;
				}
			}
			return -1;
		} // indexOfAttr
		
    } // refreshTasksInPlotRows
	



export { refreshTasksInPlotRows };


