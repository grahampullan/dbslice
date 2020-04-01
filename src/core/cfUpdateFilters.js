import { render } from './render.js'
import { dbsliceData } from './dbsliceData.js'


function cfUpdateFilters(crossfilter) {
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
        
        // Bar charts
        crossfilter.filterSelected.forEach(function (filters, i) {
            // if the filters array is empty: ie. all values are selected, then reset the dimension
            if (filters.length === 0) {
                //Reset all filters
                crossfilter.metaDims[i].filterAll();
            } else {
                crossfilter.metaDims[i].filter(function (d) {
                    return filters.indexOf(d) > -1;
                }); // filter
            }; // if
        }); // forEach
      
        // Histograms
        crossfilter.histogramSelectedRanges.forEach(function (selectedRange, i) {
            // Reset all filters
            crossfilter.dataDims[i].filterAll();

            if (selectedRange.length !== 0) {
                crossfilter.dataDims[i].filter(function (d) {
                  return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
                }); // filter
            }; // if
        }); // forEach



		// Manual selections - but this should happen only if the manual switch is on!! 
		var isManualFilterApplied = checkIfManualFilterIsApplied()
		if( isManualFilterApplied ){
			var filters = crossfilter.scatterManualSelectedTasks
			if (filters.length === 0) {
				// if the filters array is empty: ie. all values are selected, then reset the dimension
				crossfilter.taskDim.filterAll();
			} else {
				crossfilter.taskDim.filter(function (d) {
					return filters.indexOf(d) > -1;
				}); // filter
			}; // if
        } else {
			crossfilter.taskDim.filterAll();
		} // if
		


        // HERE THE SELECTED TASKIDS ARE UPDATED
        var currentMetaData = crossfilter.metaDims[0].top(Infinity);
        dbsliceData.filteredTaskIds = currentMetaData.map(function (d){return d.taskId;});

		
		if(currentMetaData.length > 0){
			if (currentMetaData[0].label !== undefined) {
				dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.label;});
			} else {
				dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.taskId;});
			} // if
		} else {	
			dbsliceData.filteredTaskLabels = [];
        } // if
		
		
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
    } // cfUpdateFilter


export { cfUpdateFilters };