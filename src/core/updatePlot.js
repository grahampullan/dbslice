function updatePlot( plotData, index ) {

    var plot = d3.select( this ) // this is the plotBody selection

    //var plotHeader = plot.append( "div" ).attr( "class", "card-header plotTitle")
    //	 .html( `${plotData.layout.title}` );

    //var plotBody = plot.append( "div" ).attr( "class", "plot");

    plotData.plotFunc.update(plot.node(),plotData.data,plotData.layout);

}

export { updatePlot };