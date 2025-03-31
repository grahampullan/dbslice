function lineSeriesFromDerivedData( derivedData, config ) {

    const series = [];

    derivedData.forEach( derivedDataEntry => { 

        const itemId = derivedDataEntry.itemId;
        const data = derivedDataEntry.data;

        let seriesNow;
        if (config.joinSegments) {
            const pointSet = new Set();
            data.forEach( d => {
                pointSet.add(`${d[0][0]},${d[0][1]}`);
                pointSet.add(`${d[1][0]},${d[1][1]}`);
            });
            const uniquePoints = Array.from(pointSet).map( d => d.split(",").map(Number) );
            const line = uniquePoints.map( d => ({x: d[0], y: d[1] }));
            line.sort( (a,b) => a.x - b.x );
            seriesNow = { label : itemId , data : line, itemId };
        } else {
            seriesNow = { label : itemId , data , itemId };
        }

        series.push( seriesNow ) 
    
    } );
    
    return { series : series };
}

export { lineSeriesFromDerivedData };
