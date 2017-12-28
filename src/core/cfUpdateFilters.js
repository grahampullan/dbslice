import { render } from './render.js'
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

    console.log(currentMetaData);

    dbsliceData.session.filteredTaskIds = currentMetaData.map(function(d){return d.taskId});

    console.log(currentMetaData[0].label);

    if ( currentMetaData[0].label !== undefined ) {
        dbsliceData.session.filteredTaskLabels = currentMetaData.map(function(d){return d.label});
    } else {
        dbsliceData.session.filteredTaskLabels = currentMetaData.map(function(d){return d.taskId});
    }



    render( dbsliceData.elementId, dbsliceData.session, false, false, false);

    // refresh bar charts
    //_crossfilter.barCharts.forEach( ( barChart, i ) => {
    //  barChart.refresh( _crossfilter.dimensions[ i ].group() );
    //} );

    // refresh histograms
    //_crossfilter.histograms.forEach( ( histogram, i ) => {
    //  histogram.refresh( _crossfilter.histogramDimensions[ i ] );
    //} );

    // refresh task counts
    //d3.select( "#_taskCountSpan" ).html( ` ${ _crossfilter.dimensions[0].top(Infinity).length } / ${ _crossfilter.cf.size() } Tasks selected ` );


}

export { cfUpdateFilters };