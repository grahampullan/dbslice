function makeNewPlot( plotData, index ) {


	var plotRowIndex = d3.select(this._parent).attr("plot-row-index");
	  
	var plot = d3.select(this)
	  .append("div")
		.attr("class", "col-md-" + plotData.layout.colWidth + " plotWrapper")
		.attr("plottype", plotData.plotFunc.name)
	  .append("div")
		.attr("class", "card");
	  
	  
	var plotHeader = plot
	  .append("div")
		.attr("class", "card-header plotTitle");
	
	
	plotHeader
	  .append("div")
		.attr("style","display:inline")
		.html(plotData.layout.title)
		.attr("spellcheck", "false")
		.attr("contenteditable", true);
		
	  
	var plotBody = plot
	  .append("div")
		.attr("class", "plot")
		.attr("plot-row-index", plotRowIndex)
		.attr("plot-index", index);
		  
	plotData.plotFunc.make(plotBody.node(), plotData.data, plotData.layout);
	 
	// Listen to the changes of the plot card, and update the plot
	$(window).resize(  function(){ 
		// console.log( plot.node().offsetWidth )
		var container = d3.select(plotBody.node());
		plotData.plotFunc.update( plotBody.node(), plotData.data, plotData.layout )
	}  );

} // makeNewPlot

export { makeNewPlot };