function updatePlot( plotData, index ) {

    var plot = d3.select( this ) // this is the plotBody selection

    plotData.plotFunc.update(plot.node(),plotData.data,plotData.layout);

} // updatePlot

export { updatePlot };