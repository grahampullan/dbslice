import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';

function lineSeriesFromCsv( rawData , tasks, config ) {

    const series = [];

    rawData.forEach( function( dataText, index ) { 

        let dataTextLines = dataText.split("\n");

        if ( config.skipFirstLine ) {
            dataTextLines = dataTextLines.slice(1);
        }

        if ( config.skipFirstNLines !== undefined ) {
            dataTextLines = dataTextLines.slice(skipFirstNLines);
        }

        if ( config.skipCommentLines == true ) {
            let commentChar;
            if ( config.skipCommentChar !== undefined ) {
                commentChar = config.skipCommentChar;
            } else {
                commentChar = '#';
            }
            let nSlice = 0;
            for (let i = 0; i < dataTextLines.length; i++) {
                if (dataTextLines[i][0]==commentChar){
                  nSlice++;
                } else {
                  break;
                }
            }
            dataTextLines = dataTextLines.slice(nSlice);
        }

        let dataTextClean;

        if ( config.spaceSeparated ) {
            dataTextClean = dataTextLines.map(l => l.split(" ").filter(d => d.length>0).join()).join("\n");
        } else {
            dataTextLines[0] = dataTextLines[0].split(",").map(d => d.trim() ).join();
            dataTextClean = dataTextLines.join("\n")
        }

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
