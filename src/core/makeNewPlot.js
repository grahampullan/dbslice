function makeNewPlot( plotData, index ) {

    var plot = d3.select( this )
    	.append( "div" ).attr( "class", "col-md-"+plotData.layout.colWidth+" plotWrapper" )
    	.append( "div" ).attr( "class", "card" );

    var plotHeader = plot.append( "div" ).attr( "class", "card-header plotTitle")
    	 .html( plotData.layout.title );

    var plotBody = plot.append( "div" ).attr( "class", "plot");

    plotData.plotFunc.make(plotBody.node(),plotData.data,plotData.layout);

}

export { makeNewPlot };