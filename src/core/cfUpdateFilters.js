import { dbsliceData } from './dbsliceData.js';
import * as d3 from 'd3v7';

function cfUpdateFilters( crossfilter ) {

	// update crossfilter with the filters selected at the bar charts
    crossfilter.filterSelected.forEach( ( filters, i ) => {

      // if the filters array is empty: ie. all are selected, then reset the dimension
      if ( filters.length === 0 ) {
        //reset filter
        crossfilter.categoricalDims[ i ].filterAll();
      } else {
        crossfilter.categoricalDims[ i ].filter( ( d ) => filters.indexOf( d ) > -1 );
      }
    } );

    // update crossfilter with the items selected at the histograms
    crossfilter.histogramSelectedRanges.forEach( ( selectedRange, i ) => {
      // first reset all filters
      crossfilter.continuousDims[ i ].filterAll();
      if ( selectedRange.length !== 0 ) {
        crossfilter.continuousDims[ i ].filter( d => d >= selectedRange[ 0 ] && d <= selectedRange[ 1 ] ? true : false );
      }
    } );


    var currentMetaData = crossfilter.categoricalDims[0].top(Infinity);


    dbsliceData.filteredTaskIds = currentMetaData.map(function(d){return d.taskId});

    if ( dbsliceData.session.addRefTaskId !== undefined && dbsliceData.session.addRefTaskId == true ) {

      dbsliceData.filteredTaskIds = [ dbsliceData.session.refTaskId, ...dbsliceData.filteredTaskIds ];

    }

    if ( currentMetaData[0].label !== undefined ) {

        dbsliceData.filteredTaskLabels = currentMetaData.map(function(d){return d.label});

    } else {

        dbsliceData.filteredTaskLabels = currentMetaData.map(function(d){return d.taskId});
    }

    if ( dbsliceData.session.addRefTaskId !== undefined && dbsliceData.session.addRefTaskId == true ) {

      dbsliceData.filteredTaskLabels = [ dbsliceData.session.refTaskId, ...dbsliceData.filteredTaskLabels ];

    }

    let element = d3.select( "#" + dbsliceData.elementId );
    element.property('value', dbsliceData.filteredTaskIds).dispatch('input');

}

export { cfUpdateFilters };