import { dbsliceData } from './dbsliceData.js'

function cfUpdateFilters( crossfilter ) {

	// update crossfilter with the filters selected at the bar charts
    crossfilter.filterSelected.forEach( ( filters, i ) => {

      // if the filters array is empty: ie. all are selected, then reset the dimension
      if ( filters.length === 0 ) {
        //reset filter
        crossfilter.metaDims[ i ].filterAll();
      } else {
        crossfilter.metaDims[ i ].filter( ( d ) => filters.indexOf( d ) > -1 );
      }
    } );

    // update crossfilter with the items selected at the histograms
    crossfilter.histogramSelectedRanges.forEach( ( selectedRange, i ) => {
      // first reset all filters
      crossfilter.dataDims[ i ].filterAll();
      if ( selectedRange.length !== 0 ) {
        crossfilter.dataDims[ i ].filter( d => d >= selectedRange[ 0 ] && d <= selectedRange[ 1 ] ? true : false );
      }
    } );


    var currentMetaData = crossfilter.metaDims[0].top(Infinity);


    dbsliceData.filteredTaskIds = currentMetaData.map(function(d){return d.taskId});

    if ( currentMetaData[0].label !== undefined ) {

        dbsliceData.filteredTaskLabels = currentMetaData.map(function(d){return d.label});

    } else {

        dbsliceData.filteredTaskLabels = currentMetaData.map(function(d){return d.taskId});
    }

    let element = d3.select( "#" + dbsliceData.elementId );
    element.property('value', dbsliceData.filteredTaskIds).dispatch('input');

}

export { cfUpdateFilters };