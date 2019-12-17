function makePlotsFromPlotRowCtrl(ctrl) {
	var plotPromises = [];


	if (ctrl.sliceIds === undefined) {
		// 'sliceIds' are undefined. These will be single task plots.
		
		var nTasks = ctrl.taskIds.length;
		if (ctrl.maxTasks !== undefined) nTasks = Math.min(nTasks, ctrl.maxTasks);

		for (var index = 0; index < nTasks; ++index) {
			if (ctrl.urlTemplate == null) {
				var url = ctrl.taskIds[index];
			} else {
				var url = ctrl.urlTemplate.replace("${taskId}", ctrl.taskIds[index]);
			} // if
			
			var title = ctrl.taskLabels[index];
			var plotPromise = makePromiseTaskPlot(ctrl, url, title, ctrl.taskIds[index]);
			plotPromises.push(plotPromise);
		} // for
	} else {
		// CURRENTLY WORKING ON THIS PART ONLY
		
		// 'sliceIds' were defined. These plots will be comparisons.
		// For each of the slices required create all the data promises.
		
		
		ctrl.sliceIds.forEach(function (sliceId, sliceIndex) {
			var plotPromise = makePromiseSlicePlot(ctrl, sliceId, sliceIndex);
			plotPromises.push(plotPromise);
		}); // forEach
	} // if

	return Promise.all(plotPromises);
} // makePlotsFromPlotRowCtrl


function makePromiseTaskPlot(ctrl, url, title, taskId) {
	return fetch(url).then(function (response) {
	    if (ctrl.csv === undefined) {
	        return response.json();
	    } // if

	    if (ctrl.csv == true) {
	        return response.text();
	    } // if
	}).then(function (responseJson) {
	    if (ctrl.csv == true) {
	        responseJson = d3.csvParse(responseJson);
	    } // if
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
	}); // fetch().then().then()
	} // makePromiseTaskPlot

function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {
	  
	var slicePromisesPerPlot = [];
	var tasksOnPlot = [];
  
	// Determine the maximum number of plots if a limit is imposed.
	ctrl.maxTasks = ctrl.maxTasks !== undefined ? Math.min(ctrl.taskIds.length, ctrl.maxTasks) : undefined;

	// Collect all tasks that are on the plot. It should just collect all the file names that need to be read for this slice plot. But for that the slice needs to be selected already.
	// THE USER SHOULD SELECT THE APPROPRIATE SLICE TO BE ADDED!! THE SLICE LOTTING WILL BE A SEPARATE PLOT ROW TYPE CALLED SUMMARY 2D.
	var d = ctrl.data.dataDims[0].top(Infinity);
	
	// Make all the promises required for a single plot.
	for (var index = 0; index < ctrl.taskIds.length; index++) {
		
		// Currently just returns some, not the selected ones!!!
		var url = d[index][sliceId];
		
		var slicePromise = fetch(url).then(function (response) {
		  if (ctrl.csv === undefined) {
			return response.json();
		  }; // if

		  if (ctrl.csv == true) {
			return response.text();
		  }; // if
		}); // fetch().then()
		slicePromisesPerPlot.push(slicePromise);
	} // for



	// Evaluate the promises toget the plot.
	return Promise.all(slicePromisesPerPlot).then(function (responseJson) {
		if (ctrl.csv == true) {
		  var responseCsv = [];
		  responseJson.forEach(function (d) {
			responseCsv.push(d3.csvParse(d));
		  });
		  responseJson = responseCsv;
		}

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
	});
} // makePromiseSlicePlot

export { makePlotsFromPlotRowCtrl };