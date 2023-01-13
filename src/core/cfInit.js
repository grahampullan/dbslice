import { dbsliceData } from './dbsliceData.js';
import crossfilter from 'crossfilter2';

function cfInit( metaData ) {

	var cfData = {};

	cfData.categoricalProperties = metaData.header.categoricalProperties;

	cfData.continuousProperties = metaData.header.continuousProperties;

    cfData.cf = crossfilter( metaData.data );

    cfData.categoricalDims = [];

    cfData.categoricalUniqueValues = {};

    cfData.categoricalProperties.forEach( ( property, i ) => {

    	cfData.categoricalDims.push( cfData.cf.dimension( d => d[ property ] ) );

        cfData.categoricalUniqueValues[property] = Array.from( new Set(metaData.data.map( d => d[property]) ) );

    } );

    cfData.categoricalDims.forEach( dim => dim.filterAll() );

    cfData.continuousDims = [];

    cfData.continuousProperties.forEach( ( property, i ) => {

    	cfData.continuousDims.push ( cfData.cf.dimension( d => d[ property ] ) );

    } );

    cfData.continuousDims.forEach( dim => dim.filterAll() );

    cfData.filterSelected = [];

    cfData.histogramSelectedRanges = [];

    var taskIds = [];

    metaData.data.forEach( ( task, i ) => {

        taskIds.push( task.taskId );

    });

    dbsliceData.filteredTaskIds = taskIds;

    return cfData;

}

export { cfInit };