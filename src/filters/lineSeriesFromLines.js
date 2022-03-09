function lineSeriesFromLines( rawData , tasks ) {

    const series = [];

    rawData.forEach( function( line, index ) { 
        
        series.push( { label : index , data : line, taskId:tasks[index] } ) 
    
    } );
    
    return { series : series };
}

export { lineSeriesFromLines }