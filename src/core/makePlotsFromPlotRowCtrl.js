import { plotHelpers } from '../plot/plotHelpers.js';

function makePlotsFromPlotRowCtrl(ctrl) {
	var plotPromises = [];

	// A decision is made whether the ctrl dictates a 'slice' or 'task' plot should be made. 'Task' creates an individual plot for each task, and 'slice' ummaries many on the same plot.
	 
	switch(ctrl.plotType){
		case "d3LineSeries":
			// Summary plot of all the selected task line plots.
			// The sliceIds are also variable names!
			ctrl.sliceIds.forEach(function (sliceId, sliceIndex) {
				var plotPromise = makePromiseSlicePlot(ctrl, sliceId, sliceIndex);
				plotPromises.push(plotPromise);
			}); // forEach
		  break;
		  
		case "d3Contour2d":
			// Individual task plot. Loop through the tasks and create a promise for each.
			var d = ctrl.data.dataDims[0].top(Infinity);
			
			for (var index = 0; index < ctrl.taskIds.length; ++index) {
				
				var url = d[index][ctrl.sliceIds];
				
				
				var title = d[index].label;
				var plotPromise = makePromiseTaskPlot(ctrl, url, title, ctrl.taskIds[index]);
				plotPromises.push(plotPromise);
			} // for
			
			// Calculate the data limits. Here it is known what the properties are since this branch only executes for 'd3Contour2d'.
			Promise.all(plotPromises).then(function (plots){
				
				
				// The input 'plots' is an array of objects, which all include their relevant data in the .data.surfaces property. In the case of a 2d contour there will only be one surface.
				
				// Find all the properties that are in all the loaded files. First collect the properties of all the files in an array of arrays.
				var allPropertyNames = plotHelpers.collectAllPropertyNames(plots,         function(d){return d.data.surfaces})
				
				// Check which ones are in all of them.
				var commonPropertyNames = plotHelpers.findCommonElements(allPropertyNames);
				
				// Loop over all the common properties and calculate their ranges.
				for(var i = 0; i<commonPropertyNames.length; i++){
					
					var property = commonPropertyNames[i];
					
					ctrl.limits[property] = plotHelpers.getDomain(plots, function(d){return d.data.surfaces[property]})
					
				}; // for 
				
				// ctrl is from dbsliceData.session.plotRows.ctrl.
				
			}) // Promise.all().then
			
			
		  break;
		  
		default:
		  break;
		  // Do nothing.
		
	}; // switch

	// Bundle all the promises together again?
	return Promise.all(plotPromises);
} // makePlotsFromPlotRowCtrl

function makePromiseTaskPlot(ctrl, url, title, taskId) {
	var promise = fetch(url)
	  .then(function (response) {
		  if (ctrl.csv === undefined) {return response.json();} // if
		  if (ctrl.csv == true)       {return response.text();} // if 
	  })
	  .then(function (responseJson) {
		
		  if (ctrl.csv == true) {responseJson = d3.csvParse(responseJson);} // if
		
		  var plot = {};

		  if (ctrl.formatDataFunc !== undefined) {
			  plot.data = ctrl.formatDataFunc(responseJson, taskId);
		  } else {
			  plot.data = responseJson;
		  } // if

		  plot.layout = Object.assign({}, ctrl.layout);
		  plot.plotFunc = ctrl.plotFunc;
		  plot.layout.title = title;
		  plot.data.newData = true;
		
		return plot;
	  }); // then
  
  return promise;
} // makePromiseTaskPlot

function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {
	// This creates all the data retrieval promises required to make a 'slice' plot. 'Slice' plots summarise data of multiple tasks, as opposed to 'task' plots which produce an individual plot for each of the tasks.
  
	var slicePromisesPerPlot = [];
	var tasksOnPlot = [];
  
	// Determine the maximum number of plots if a limit is imposed.
	ctrl.maxTasks = ctrl.maxTasks !== undefined ? Math.min(ctrl.taskIds.length, ctrl.maxTasks) : undefined;

	// The data is selected here. As the filtering has already been applied in 'cfUpdateFilters' all of the data can be selected here, and will respect the filters.
	var d = ctrl.data.dataDims[0].top(Infinity);
	
	
	// Make all the promises required for a single plot.
	for (var index = 0; index < d.length; index++){
	  
		// The URL must be given in the data. The sliceId comes from the variable name in the data.
		var url = d[index][sliceId];
		
		var slicePromise = fetch(url)
		  .then(function (response) {
			  if (ctrl.csv === undefined){
				return response.json();
			  }; // if

			  if (ctrl.csv == true){
				return response.text();
			  }; // if
		  }); // fetch().then()
		
		slicePromisesPerPlot.push(slicePromise);
	} // for



	// Bundle together all the promises required for the plot.
	return Promise.all(slicePromisesPerPlot)
		.then(function (responseJson) {
			if (ctrl.csv == true) {
				var responseCsv = [];
				responseJson.forEach(function (d) {
					responseCsv.push(d3.csvParse(d));
				});
				responseJson = responseCsv;
			} // if

			var plot = {};

			if (ctrl.formatDataFunc !== undefined) {
				plot.data = ctrl.formatDataFunc(responseJson);
			} else {
				plot.data = responseJson;
			}; // if

			plot.layout = Object.assign({}, ctrl.layout);

			if (ctrl.layout.xRange !== undefined) {
				if (ctrl.layout.xRange[1].length !== undefined) {
					plot.layout.xRange = ctrl.layout.xRange[sliceIndex];
				}; // if
			}; // if

			if (ctrl.layout.yRange !== undefined) {
				if (ctrl.layout.yRange[1].length !== undefined) {
					plot.layout.yRange = ctrl.layout.yRange[sliceIndex];
				}; // if
			}; // if

			plot.plotFunc = ctrl.plotFunc;
			plot.layout.title = sliceId;
			plot.data.newData = true;
			
		  return plot;
		}); // then
} // makePromiseSlicePlot

export { makePlotsFromPlotRowCtrl };