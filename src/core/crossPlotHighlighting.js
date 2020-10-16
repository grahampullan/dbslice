import { dbsliceData } from '../core/dbsliceData.js';

var crossPlotHighlighting = {
			
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
					plotCtrl.plotFunc.helpers.highlight(plotCtrl, allDataPoints);
					
					
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
				
				
				var allDataPoints;
			    switch(sourcePlotName){
					
					case "cfD3Scatter":
					    allDataPoints = [d];
					  break;
					  
					case "cfD3BarChart":
						// Collect all the relevant data points. An additional filter needs to be applied here!! DON'T USE crossfilter.filter - IT MESSES UP WITH ORIGINAL FUNCTIONALITY
						//var allPoints = dbsliceData.data.cf.all()
						
						// This should return the data in the filter, as well as the data corresponding to the outline that has the cursor over it. It relies on the fact that when all items are in the filter the filter is in fact empty.
						
						// 
						
						var highlight = true
						
						var varFilter = dbsliceData.data.filterSelected[d.key]
						if(varFilter != undefined){
							
							// FOR NOW: when mousing over rectangles that are not selected only display the data that is already in hte filter. In the future implement a preview, but to do this functionalities of all plots need to be adjusted to contain points for all tasks at all times.
							
							// if:
							// Rect not chosen, but moused over: do nothing
							// Rect chosen,     but moused over: show data corresponding to it
							
							
							
							// mouse over selected item: d.val in filter
							
							// If the filter has some values then some rectangles are active! Highlight the data is the moused over rectangle is one of the active ones.
							var filterHasValues = varFilter.length > 0
							var filterHasRect   = varFilter.includes(d.val)
							
							if( filterHasValues && filterHasRect ){
								highlight = true
							} // if	
						} // if
						
						
						// If highlighting is desired, then find the items in hte current filter that should be highlighted. Otherwise return all the filter contents.
						var allDataPoints = dbsliceData.data.taskDim.top(Infinity)
						if(highlight){
							allDataPoints = allDataPoints.filter(function(p){
								return p[d.key] == d.val
							}) // filter
						} // if
						
						
					  break;
					  
					case "cfD3Line":
						// Collect all the relevant data points by tskId.
						var cfDataPoints = dbsliceData.data.taskDim.top(Infinity)
						allDataPoints = cfDataPoints.filter(function(p){return p.taskId == d.task.taskId});
						
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