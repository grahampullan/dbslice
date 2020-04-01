import { importExportFunctionality } from '../core/importExportFunctionality.js';




const onDemandDataLoading = {
		
		makePlotsFromPlotRowCtrl: function makePlotsFromPlotRowCtrl(plotRowCtrl) {
			// This reads the orders from the plot row control object, and executes them.
			//
			// Two basic options are possible - there could be a single file for each plot, or tehre could be multiple files for each plot. The first is intended for side-by-side comparisons (e.g. contour plots), whereas the second is intended for one-on-top-of-the-other comparisons (e.g. line plots.)
			//
			// More advanced functionality to group side-by-side plots can be developed later. This can be in terms of satistical plots, or a sliding window as in direct photo comparisons.
			
			var plotPromises = [];

			// A decision is made whether the ctrl dictates a 'slice' or 'task' plot should be made. 'Task' creates an individual plot for each task, and 'slice' ummaries many on the same plot.
			 
			switch(plotRowCtrl.plotType){
				case "d3LineSeriesRrd":
					// Summary plot of all the selected task line plots.
					// The sliceIds are also variable names!
					plotRowCtrl.sliceIds.forEach(function (sliceId, sliceIndex) {
						
						
						var plotPromise = onDemandDataLoading.makePromiseSlicePlot(plotRowCtrl, sliceId, sliceIndex);
						
						plotPromise.then(function(plot){
							
							// plotPromise should retun a plot. At this point it's data can be restructured, as the plot has been recognised as loading in rrd files, whil eat the same time keeping the lower level code abstract.
							var h = importExportFunctionality.importData.helpers.rrdPlcp2json
							plot.data.series.forEach(function(series, index){
								plot.data.series[index] = h.rrdPlcpRestructure(series)
							})
							
						  return plot
							
						})
						
						
						plotPromises.push(plotPromise);
					}); // forEach
					
					
				  break;
				  
				case "d3LineRadialRrd":
					// Summary plot of all the selected task line plots.
					// The sliceIds are also variable names!
					plotRowCtrl.sliceIds.forEach(function (sliceId, sliceIndex) {
						
						
						var plotPromise = onDemandDataLoading.makePromiseSlicePlot(plotRowCtrl, sliceId, sliceIndex);
						
						plotPromise.then(function(plot){
							
							// plotPromise should retun a plot. At this point it's data can be restructured, as the plot has been recognised as loading in rrd files, whil eat the same time keeping the lower level code abstract.
							
							
						  return plot
							
						})
						
						
						plotPromises.push(plotPromise);
					}); // forEach
					
					
				  break;
				  
				  
				default:
				  break;
				  // Do nothing.
				
			}; // switch

			// Bundle all the promises together again?
			return Promise.all(plotPromises);
		}, // makePlotsFromPlotRowCtrl
		
		makePromiseSlicePlot: function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {
			// This creates all the data retrieval promises required to make a 'slice' plot. 'Slice' plots summarise data of multiple tasks, as opposed to 'task' plots which produce an individual plot for each of the tasks.
		  
			var slicePromisesPerPlot = [];
		  
			// Determine the maximum number of plots if a limit is imposed.
			ctrl.maxTasks = ctrl.maxTasks !== undefined ? Math.min(ctrl.taskIds.length, ctrl.maxTasks) : undefined;

			// The data is selected here. As the filtering has already been applied in 'cfUpdateFilters' all of the data can be selected here, and will respect the filters.
			var d = ctrl.data.dataDims[0].top(Infinity);
			
			
			// Make all the promises required for a single plot.
			var slicePromisesPerPlot = [];
			for (var index = 0; index < d.length; index++){
				
				// Make the promise to load the data.
				var taskData = d[index]
				var url = taskData[sliceId]
				
				var slicePromise = makeSlicePromise(url, taskData.taskId)
				slicePromisesPerPlot.push( slicePromise )
				
				
			} // for
			
			
			
			return Promise.all(slicePromisesPerPlot).then(function(response){
				
				// Now I can start plotting something.
				// console.log(response)
				
				
				var plot = {};
				plot.data = {series: response}
				plot.layout = {colWidth: ctrl.layout.colWidth,
				               xAxisLabel: ctrl.layout.xAxisLabel,
							   yAxisLabel: ctrl.layout.yAxisLabel,
							   title: sliceId}
				plot.plotFunc = ctrl.plotFunc
				plot.data.newData = true
				
			  return plot;
			})
			

				
				
			function makeSlicePromise(url, taskId){
				// This is done in the following manner to allow the correct taskId to be added to each of hte loaded data sets. This allows the data in the files to not need the appropriate task id in order to be tracked on the plots.
				
				var slicePromise = d3.csv(url).then(function(data){
					data.taskId = taskId;
				  return data;
				})
				
				
				
			  return slicePromise;
			} // makeSlicePromise

				
		} // makePromiseSlicePlot
		
	} // onDemandDataLoading

	

export { onDemandDataLoading };