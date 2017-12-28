function cfInit( metaData ) {

	var cfData = {};

	//cfData.metaData = metaData;

	cfData.metaDataProperties = metaData.header.metaDataProperties;

	cfData.dataProperties = metaData.header.dataProperties;

    cfData.cf = crossfilter( metaData.data );

    cfData.metaDims = [];

    cfData.metaDataProperties.forEach( ( property, i ) => {

    	cfData.metaDims.push( cfData.cf.dimension( d => d[ property ] ) );

    } );

    cfData.dataDims = [];

    cfData.dataProperties.forEach( ( property, i ) => {

    	cfData.dataDims.push ( cfData.cf.dimension( d => d[ property ] ) );

    } );

    cfData.filterSelected = [];

    cfData.histogramSelectedRanges = [];

    return cfData;

}

export { cfInit };