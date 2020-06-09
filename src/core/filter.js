import { render } from './render.js'
import { dbsliceData } from './dbsliceData.js'


var filter = {
		
		remove: function remove(){
			// Remove all filters if grouping information etc is required for the whole dataset.
			var cf = dbsliceData.data
			
			// Bar charts
			Object.keys(cf.metaDims).forEach(function(property){
					cf.metaDims[property].filterAll()
			}) // forEach
			
			// Histograms
			Object.keys(cf.dataDims).forEach(function(property){
					cf.dataDims[property].filterAll()
			}) // forEach
			
			
			// Plots with individual tasks shown.
			cf.taskDim.filterAll()
			
		}, // remove
		
		apply: function apply(){
			// Crossfilter works by applying the filtering operations, and then selecting the data.
			// E.g.:
			//
			// var dim = dataArrayCfObject.dimension(function(d) { return d.[variable]; });
			// dim.filter(“Design A”)
			//
			// This created a 'crossfilter' dimension obeject on the first line, which operates on the poperty named by the string 'variable'. his objecathen be used to perform filtering operations onthe data.
			// On the second line a filter is added. In this case the filter selects only 'facts' (individual items of data), for which the 'variable' is equal to "Design A". The selection is applied directly on the dataArrayCfObject, so trying to retrive the top 10 data points using dataArrayCfObject.top(10) will return the first 10 points of "Design A".
			//
			// Thus the filters can be applied here, and will be observed in the rest of the code.
			
			// UPDATE THE CROSSFILTER DATA SELECTION:
			var cf = dbsliceData.data
			
			// Bar charts. Maybe this should be split between two separate functions? This would also make it clearer for the user, as well as making hte object clearer. First make it work though.
			updateBarChartFilters()
			 applyBarChartFilters()
		  
			// Histograms
			updateHistogramChartFilters()
			 applyHistogramChartFilters()
		
			// Manual selections - but this should happen only if the manual switch is on!! 
			applyManualSelections()
			
			
			// Checking for bar charts.
			function updateBarChartFilters(){
				// 'updateBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. This is required as the user could select a bar, and then change variables. In this case the filter would be retained, and the variable not seen anymore, which would potentially mislead the user. Therefore it has been decided that filters should be visible at all times, and if the user desires to hide some information from the screen then they should be given the option to minimise the plot rows.
				
				// 'keys' vs 'getOwnPropertyNames' returns only the enumerable properties, in this case the property 'length' of array is not returned by 'keys'.
				var filteredVariables = Object.keys(cf.filterSelected)
				
				// Check which of the filters stored still correspond to the on screen bar charts.
				filteredVariables.forEach(function(variable){
					
					// Loop through the bar charts to see if this variable is still on screen.
					var isVariableActive = false
					dbsliceData.session.plotRows.forEach(function(plotRow){
						
						plotRow.plots.forEach(function(plot){
							if(plot.plotFunc.name == "cfD3BarChart"){
								// The flag is cumulative over all the bar charts, and if it is present in any of them the variable is active. Therefore an or statement is used.
								isVariableActive = isVariableActive || plot.view.yVarOption.val == variable
							} // if
							
						}) // forEach
					}) // forEach
					
					// If the variable is no longer active, then remove the filter by deleting the appropriate object property.
					if(!isVariableActive){
						delete cf.filterSelected[variable]
					} // if
					
					
				}) // forEach
			} // updateBarChartFilters
			
			function applyBarChartFilters(){
				// 'applyBarChartFilters' applies the filters selected based on metadata variables to the crossfilter object.
				
				// First deselect all filters, and then subsequently apply only those that are required.
				
				// Deselect all metadata filters.
				Object.keys(cf.metaDims).forEach(function(variable){
					cf.metaDims[variable].filterAll()
				}) // forEach
				
				// Apply required filters. Reselect the filtered variables, as some might have been removed.
				var filteredVariables = Object.keys(cf.filterSelected)
			
				filteredVariables.forEach(function (variable) {
					
					var filterItems = cf.filterSelected[variable]
					
					// if the filters array is empty: ie. all values are selected, then reset the dimension
					if ( filterItems.length === 0) {
						// Reset the filter
						cf.metaDims[variable].filterAll();
					} else {
						// Apply the filter
						cf.metaDims[variable].filter(function (d) {
							return filterItems.indexOf(d) > -1;
						}); // filter
					}; // if
				}); // forEach
				
			} // applyBarChartFilters
			
			
			// Checking for histograms
			function updateHistogramChartFilters(){
				// 'updateBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. This is required as the user could select a bar, and then change variables. In this case the filter would be retained, and the variable not seen anymore, which would potentially mislead the user. Therefore it has been decided that filters should be visible at all times, and if the user desires to hide some information from the screen then they should be given the option to minimise the plot rows.
				
				// 'keys' vs 'getOwnPropertyNames' returns only the enumerable properties, in this case the property 'length' of array is not returned by 'keys'.
				var filteredVariables = Object.keys(cf.histogramSelectedRanges)
				
				// Check which of the filters stored still correspond to the on screen bar charts.
				filteredVariables.forEach(function(variable){
					
					// Loop through the bar charts to see if this variable is still on screen.
					var isVariableActive = false
					dbsliceData.session.plotRows.forEach(function(plotRow){
						
						plotRow.plots.forEach(function(plot){
							if(plot.plotFunc.name == "cfD3Histogram"){
								// The flag is cumulative over all the bar charts, and if it is present in any of them the variable is active. Therefore an or statement is used.
								isVariableActive = isVariableActive || plot.view.xVarOption.val == variable
							} // if
							
						}) // forEach
					}) // forEach
					
					// If the variable is no longer active, then remove the filter by deleting the appropriate object property.
					if(!isVariableActive){
						delete cf.histogramSelectedRanges[variable]
					} // if
					
					
				}) // forEach
			} // updateHistogramChartFilters
			
			function applyHistogramChartFilters(){
				// 'updateApplyBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. Same logic as for the bar chart.
				
				
				
				// Deselect all metadata filters.
				Object.keys(cf.metaDims).forEach(function(variable){
					cf.metaDims[variable].filterAll()
				}) // forEach
				
				// Get the fitlered variables. These are selected differently than for filter deselection as an additional safety net - all filters are definitely removed this way.
				var filteredVariables = Object.keys(cf.histogramSelectedRanges)
				
				// Apply required filters. Reselect the filtered variables, as some might have been removed.
				filteredVariables.forEach(function (variable) {
					
					var selectedRange = cf.histogramSelectedRanges[variable]
					
				
					if (selectedRange.length !== 0) {
						// If the selected range has some bounds prescribed attempt to apply them. Note that the filter here is NOT the array.filter, but crossfitler.dimension.fitler.
						cf.dataDims[variable].filter(function (d) {
						  return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
						}); // filter
					}; // if
				}); // forEach
				
			} // applyHistogramChartFilters
			
			
			// Individual selection plots
			function applyManualSelections(){
				
				var isManualFilterApplied = checkIfManualFilterIsApplied()
				if( isManualFilterApplied ){
					var filters = cf.manuallySelectedTasks
					if (filters.length === 0) {
						// if the filters array is empty: ie. all values are selected, then reset the dimension
						cf.taskDim.filterAll();
					} else {
						cf.taskDim.filter(function (d) {
							return filters.indexOf(d) > -1;
						}); // filter
					}; // if
				} else {
					cf.taskDim.filterAll();
				} // if
				
			} // applyManualSelections
			
			
			
			// Helpers
			function checkIfManualFilterIsApplied(){
				var isManualFilterApplied = false
				
				var scatterPlots = d3.selectAll(".plotWrapper[plottype='cfD3Scatter']")
				if( !scatterPlots.empty() ){
					var toggle = scatterPlots.select("input[type='checkbox']")
					if ( !toggle.empty() ){
						isManualFilterApplied = toggle.node().checked
					} // if
				} // if
				
			  return isManualFilterApplied
				
			} // checkIfManualFilterIsApplied
			
		}, // apply
		
		addUpdateMetadataFilter: function addUpdateMetadataFilter(property, value){
			
			// Initialise filter if necessary
			if (dbsliceData.data.filterSelected[property] === undefined){
				dbsliceData.data.filterSelected[property] = [];
			} // if


			// check if current filter is already active
			var currentFilter = dbsliceData.data.filterSelected[property]
			if ( currentFilter.indexOf(value) !== -1){
				// This value is already in the filter, therefore the user decided to remove it from the filter on it's repeated selection.
				var ind = currentFilter.indexOf(value);
				currentFilter.splice(ind, 1);
			} else {
				// Filter not active, add the item to the filter.
				currentFilter.push(value);
			} // if
			
			
			
		}, // addUpdateMetadataFilter
		
		addUpdateDataFilter: function addUpdateDataFilter(property, limits){
			/*
			var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val)
			var filter = dbsliceData.data.histogramSelectedRanges[dimId]
			if(filter !== undefined){
				xMin = filter[0]
				xMax = filter[1]
			} else {
				dbsliceData.data.histogramSelectedRanges[dimId] = [xMin, xMax]
			} // if
			*/
			
			dbsliceData.data.histogramSelectedRanges[property] = limits
			
			
		}, // addUpdateDataFilter
		
		
    } // filter


export { filter };