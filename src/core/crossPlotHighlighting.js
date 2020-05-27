import { dbsliceData } from '../core/dbsliceData.js';

const crossPlotHighlighting = {
		
		
		
		on: function on(d, sourcePlotName){
		
			// Functionality:
			//    - highlight points in scatter plots on other plots too on mouseover.
			//    - same for bar plots and histograms?
			
			// The input is a data object. For scatter plots this is the entire line from metadata.csv corresponding to a particular point.
			
			
			// For this datapoint find all other plots that might be interesting, determine what they are plotting, and which variables they are using, collect the elements belonging to the particular datapoint, and highlight it by updating it's style.
			
			// First go through all plot rows to see if there are data.
			
			// Note that different functionality must be allowed for different source and target plots. For each of the available plot types (bar, histogram, scatter, line, contour) for which the on-mouseover effects are required a different functionality might be needed.
			
			// Find all the data that needs to be highlighted.
			var allDataPoints = crossPlotHighlighting.helpers.findAllData(d, sourcePlotName);
			
			dbsliceData.session.plotRows.forEach(function(plotRow){
				
				
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				plotRow.plots.forEach(function(plotCtrl){
					
					// First all the elements need to be unhiglighted.
					// crossPlotHighlighting.helpers.unHighlightAll(plotDOM, plot);
					plotCtrl.plotFunc.helpers.unhighlight( plotCtrl )
					
					// Now highlight the needed datapoints.
					allDataPoints.forEach(function(d){
						plotCtrl.plotFunc.helpers.highlight(plotCtrl, d);
					}) // forEach
					
				}) // each
				
				
			}); // forEach
		
		}, // on
		
		off: function off(d, sourcePlotName){
		
			
			dbsliceData.session.plotRows.forEach(function(plotRow){
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				plotRow.plots.forEach(function(plotCtrl){
					plotCtrl.plotFunc.helpers.defaultStyle( plotCtrl );
				}) // forEach
				
				
			}); // forEach
		
		}, // off
		
		helpers: {
			
			
			findAllData: function findAllData(d, sourcePlotName){
				
				// This functionality should also be pushed to the plots themselves later on.
				var allDataPoints;
			    switch(sourcePlotName){
					
					case "cfD3Scatter":
					    allDataPoints = [d];
					  break;
					  
					case "cfD3BarChart":
						// Collect all the relevant data points. An additional filter needs to be applied here!! DON'T USE FILTER - IT MESSES UP WITH ORIGINAL FUNCTIONALITY
						var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity)
						allDataPoints = cfDataPoints.filter(function(p){return p[d.keyProperty] == d.key})
					  break;
					  
					case "cfD3Line":
						// Collect all the relevant data points by tskId.
						var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity)
						allDataPoints = cfDataPoints.filter(function(p){return p.taskId == d.task.taskId});
						// console.log(allDataPoints);
					  break;
					  
					  					  
					default:
					  break;
				} // switch
				
			  return allDataPoints;
				
			} // findAllData
		}, // helpers
		
		manuallySelectedTasks: function manuallySelectedTasks(){
			
			// Loop through all the plots, and if they have a function that highlights manually selected tasks, run it.
			
			dbsliceData.session.plotRows.forEach(function(plotRow){
				
				
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				plotRow.plots.forEach(function(plotCtrl){
					
					// Check if manually selected tasks need to be included.
					if(plotCtrl.plotFunc.helpers.updateManualSelections != undefined){
						plotCtrl.plotFunc.helpers.updateManualSelections(plotCtrl)
					} // if
					
					
					
					
				}) // each
				
				
			}); // forEach
			
			
		}, // manuallySelectedTasks
		
	} // crossPlotHighlighting 
		

export { crossPlotHighlighting };