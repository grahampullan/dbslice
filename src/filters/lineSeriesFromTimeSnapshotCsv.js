import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';

function lineSeriesFromTimeSnapshotCsv( dataText , config ) {

    const series = [];

    let dataTextLines = dataText.split("\n");

    if ( config.skipFirstLine == true ) {
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

    dataTextLines[0] = dataTextLines[0].split(",").map(d => d.trim() ).join();
    let dataTextClean = dataTextLines.join("\n");

    let data = d3.csvParse(dataTextClean);

    if ( config.yProperty !== undefined ) {
        let nSteps = d3.max(Object.keys(data[0]).filter(d => d !== config.yProperty).map(d => +d));
        for ( let iStep=0; iStep<nSteps; iStep++) {
            let line = data.map( d => ({x: +d[iStep], y: +d[config.yProperty] }));
            let label = 'iStep = '+iStep;
            let taskId = iStep;
            series.push({label, taskId, data:line});
        }
    }
    
    return { series : series };
}

export { lineSeriesFromTimeSnapshotCsv }
