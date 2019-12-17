import { render } from './render.js'
import { dbsliceData } from './dbsliceData.js'

function cfUpdateFilters(crossfilter) {
    // update crossfilter with the filters selected at the bar charts
    crossfilter.filterSelected.forEach(function (filters, i) {
        // if the filters array is empty: ie. all are selected, then reset the dimension
        if (filters.length === 0) {
            //reset filter
            crossfilter.metaDims[i].filterAll();
        } else {
            crossfilter.metaDims[i].filter(function (d) {
                return filters.indexOf(d) > -1;
            }); // filter
        } // if
    }); // forEach
    // update crossfilter with the items selected at the histograms

    crossfilter.histogramSelectedRanges.forEach(function (selectedRange, i) {
        // first reset all filters
        crossfilter.dataDims[i].filterAll();

        if (selectedRange.length !== 0) {
            crossfilter.dataDims[i].filter(function (d) {
                return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
            });
        } // if
    }); // forEach

    var currentMetaData = crossfilter.metaDims[0].top(Infinity);
    dbsliceData.filteredTaskIds = currentMetaData.map(function (d){return d.taskId;});

    if (currentMetaData[0].label !== undefined) {
      dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.label;});
    } else {
        dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.taskId;});
    } // if
} // cfUpdateFilter

export { cfUpdateFilters };