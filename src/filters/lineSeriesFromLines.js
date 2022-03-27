import { dbsliceData } from '../core/dbsliceData.js';

function lineSeriesFromLines( rawData , tasks ) {

    const series = [];

    rawData.forEach( function( line, index ) { 

        let taskId = tasks[index];
        let label = dbsliceData.session.metaData.data.find( d => d.taskId==taskId).label;
        series.push( { label : label , data : line, taskId : taskId } ) 
    
    } );
    
    return { series : series };
}

export { lineSeriesFromLines }
