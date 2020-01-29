import { dbsliceData } from './dbsliceData.js'

function cfInit(metaData) {
      
	var cfData = {};
	cfData.metaDataProperties = metaData.header.metaDataProperties;
	cfData.dataProperties = metaData.header.dataProperties;
	cfData.sliceProperties = metaData.header.sliceProperties;
	cfData.contourProperties = metaData.header.contourProperties;
	cfData.cf = crossfilter(metaData.data);
	cfData.metaDims = [];
	cfData.metaDataUniqueValues = {};
	cfData.dataDims = [];
	cfData.filterSelected = [];
	cfData.histogramSelectedRanges = []; 
	
	// Populate the metaDims and metaDataUniqueValues.
	cfData.metaDataProperties.forEach(function (property, i) {
		cfData.metaDims.push(cfData.cf.dimension(function (d){return d[property];}));
		cfData.metaDataUniqueValues[property] = Array.from(new Set( metaData.data.map(
			function (d){return d[property];}
		)));
	}); // forEach
	
	
	// Populate the dataDims. cf.dimension(function(d){return d.<property>}) sets up a dimension, which is an object that can perform some specific tasks based on the data it is give. Two of these are "top(n)", and "bottom(n)", whih return topmost and bottommost n elements respectively.
	cfData.dataProperties.forEach(function (property, i) {
	  cfData.dataDims.push(cfData.cf.dimension(function (d) {
		return d[property];
	  }));
	}); // forEach
	
	
	// Create a standalone array of taskIds
	var taskIds = [];
	metaData.data.forEach(function (task, i) {
	  taskIds.push(task.taskId);
	});
	dbsliceData.filteredTaskIds = taskIds; 
	
	// Return the created cfData object to be assigned to individual plots.
  return cfData;
	
} // cfInit


export { cfInit };