import { dbsliceData } from '../core/dbsliceData.js';

function lineSeriesFromLines( rawData , tasks, config ) {

    const series = [];

    rawData.forEach( function( line, index ) { 

        let taskId = tasks[index];
        let label = dbsliceData.session.metaData.data.find( d => d.taskId==taskId).label;
        let seriesNow = { label : label , data : line, taskId : taskId };

        if ( config != undefined ) {

            if ( config.cProperty != undefined ) {

                seriesNow.cKey = dbsliceData.session.metaData.data.find( d => d.taskId==taskId)[config.cProperty];

            }

        }

        series.push( seriesNow ) 
    
    } );
    
    return { series : series };
}

export { lineSeriesFromLines }
