function lineSeriesFromDerivedData( derivedData ) {

    const series = [];

    derivedData.forEach( derivedDataEntry => { 

        const itemId = derivedDataEntry.itemId;
        const data = derivedDataEntry.data;
 
        let seriesNow = { label : itemId , data , itemId };

        series.push( seriesNow ) 
    
    } );
    
    return { series : series };
}

export { lineSeriesFromDerivedData };
