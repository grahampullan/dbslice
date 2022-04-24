import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';

function lineSeriesFromCsv( rawData , tasks, config ) {

    const series = [];

    rawData.forEach( function( dataText, index ) { 

        let dataTextLines = dataText.split("\n");

        if ( config.skipFirstLine == true ) {
            dataTextLines = dataTextLines.slice(1)
        }

        dataTextLines[0] = dataTextLines[0].split(",").map(d => d.trim() ).join();
        let dataTextClean = dataTextLines.join("\n");

        let data = d3.csvParse(dataTextClean);

        let line = data.map( d => ({x: +d[config.xProperty], y: +d[config.yProperty] }));

        let taskId = tasks[index];
        let label = dbsliceData.session.metaData.data.find( d => d.taskId==taskId).label;
        let seriesNow = { label : label , data : line, taskId : taskId };

        if ( config.cProperty != undefined ) {

            seriesNow.cKey = dbsliceData.session.metaData.data.find( d => d.taskId==taskId)[config.cProperty];

        }

        series.push( seriesNow ) 
    
    } );
    
    return { series : series };
}

export { lineSeriesFromCsv }
