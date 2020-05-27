import { dbsliceData } from '../core/dbsliceData.js';
import { cfUpdateFilters } from '../core/cfUpdateFilters.js';

const cfDataManagement = {
		
	cfInit: function cfInit(metadata){
  
		var cfData = {};
		cfData.metaDataProperties = metadata.header.metaDataProperties;
		cfData.dataProperties = metadata.header.dataProperties;
		cfData.sliceProperties = metadata.header.sliceProperties;
		cfData.contourProperties = metadata.header.contourProperties;
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
			cfData.metaDims.push(cfData.cf.dimension(function (d){return d[property];}));
			cfData.metaDataUniqueValues[property] = Array.from(new Set( metadata.data.map(
				function (d){return d[property];}
			)));
		}); // forEach
		
		
		// Populate the dataDims. cf.dimension(function(d){return d.<property>}) sets up a dimension, which is an object that can perform some specific tasks based on the data it is give. Two of these are "top(n)", and "bottom(n)", whih return topmost and bottommost n elements respectively.
		cfData.dataProperties.forEach(function (property, i) {
		  cfData.dataDims.push(cfData.cf.dimension(function (d) {
			return d[property];
		  }));
		}); // forEach
		
		

		cfData.fileDim = cfData.cf.dimension(function (d){return d.file;})
		cfData.taskDim = cfData.cf.dimension(function (d){return d.taskId;})
		
		
		// Create a standalone array of taskIds
		dbsliceData.filteredTaskIds = cfDataManagement.helpers.getTaskIds(metadata);
		
		
		// Check if any histogram selected ranges have already been set up. This is important when the data is being replaced.
		if(dbsliceData.data !== undefined){
			if(dbsliceData.data.histogramSelectedRanges !== undefined){
				cfData.histogramSelectedRanges = dbsliceData.data.histogramSelectedRanges
			} // if
		} // if
		
		
		// Store data internally
		dbsliceData.data = cfData;
		
		
		
		
		
		
		
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
					
					// Update the filtered taskIds - note that these could fall into some filters, and therefore not be active straight away...
					var currentMetaData = dbsliceData.data.metaDims[0].top(Infinity);
					dbsliceData.filteredTaskIds = currentMetaData.map(function (d){return d.taskId;});
					
				} // if
			} // if
			
			
		} else {
			cfDataManagement.cfInit(metadata)
		} // if
		
		
	}, // cfAdd
	
	
	cfRemove: function cfRemove(dataFilesToRemove){
		// This function will remove the data from the crossfilter.
					
		// Loop though all the dimensions and remove the filters.
		dbsliceData.data.metaDims.forEach(function(metaDim){
			metaDim.filterAll()
		}) // forEach
		
		dbsliceData.data.dataDims.forEach(function(dataDim){
			dataDim.filterAll()
		}) // forEach
		
		// Apply the new filter. - I think this isn't working.
		dbsliceData.data.fileDim.filter(function(d){
			return dataFilesToRemove.indexOf(d) > -1
		})
		
		
		// Remove the data.
		dbsliceData.data.cf.remove()
		
		
		// Remove the filter.
		dbsliceData.data.fileDim.filterAll()
		
		// Reinstate other data filters.
		cfUpdateFilters( dbsliceData.data )
		
		
		
	}, // cfRemove
	
	
	helpers : {
		
		getTaskIds: function getTaskIds(metadata){
			var taskIds = [];
			metadata.data.forEach(function (task, i) {
			  taskIds.push(task.taskId);
			});
		  return taskIds
		}, // getTaskIds
		
		crossCheckProperties: function crossCheckProperties(existingData, newData){
			
			
			// oldData.header.dataProperties.filter(function(d){  return !newData.includes(d) })
			var missingDataProperties = existingData.dataProperties.filter(function(d){  return !newData.header.dataProperties.includes(d) })
			
			var missingMetadataProperties = existingData.metaDataProperties.filter(function(d){  return !newData.header.metaDataProperties.includes(d) })
			
			var missingSliceProperties = existingData.sliceProperties.filter(function(d){  return !newData.header.sliceProperties.includes(d) })
				
			var missingContourProperties = existingData.contourProperties.filter(function(d){  return !newData.header.contourProperties.includes(d) })
			
			var allPropertiesIncluded =     (missingDataProperties.length == 0) && 
										(missingMetadataProperties.length == 0) &&
										   (missingSliceProperties.length == 0) &&
										 (missingContourProperties.length == 0)
										 
			
			
			if(allPropertiesIncluded){
				return true
			} else {
				// Which ones are not included?
				var warningText = "Selected data has been rejected. It requires additional variables:\n" + 
				"Data variables:     " +     missingDataProperties.join(", ") + "\n" +
				"Metadata variables: " + missingMetadataProperties.join(", ") + "\n" +
				"Slice variables:    " +    missingSliceProperties.join(", ") + "\n" +
				"Contour variables:  " +  missingContourProperties.join(", ") + "\n"
				
				
				window.alert(warningText)
				return false
			} // if
			
		} // checkProperties
		
	} // helpers
	
} // cfDataManagement


	

export { cfDataManagement };