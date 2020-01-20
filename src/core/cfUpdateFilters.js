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



	// HERE THE SELECTED TASKIDS ARE UPDATED
	var currentMetaData = crossfilter.metaDims[0].top(Infinity);
	dbsliceData.filteredTaskIds = currentMetaData.map(function (d){return d.taskId;});

	if (currentMetaData[0].label !== undefined) {
		dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.label;});
	} else {
		dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.taskId;});
	} // if
  
} // cfUpdateFilter


export { cfUpdateFilters };