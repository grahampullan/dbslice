import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';


const cfD3Histogram = {
	  
	name: "cfD3Histogram",
	
	margin: {top: 20, right: 20, bottom: 30, left: 20},
	
	colour: [],
	  
	make: function make(element, data, layout) {
	  
	  
		// First decide where to plot to.
		var container = d3.select(element);
	  
		// Setup the svg.
		cfD3Histogram.setupSvg(container, data, layout);
	  
		// Setup the interactivity of the svg.
		cfD3Histogram.setupInteractivity(container, data);
	  
		// Update the view
		cfD3Histogram.update(element, data, layout);
	  
	},
	
	update: function update(element, data, layout) {

		var container = d3.select(element);
	  
		cfD3Histogram.setupSvg(container, data, layout);
	  
		var svg = container.select("svg");
	  
	  
		// Calculate the required data.
		var dimId = dbsliceData.data.dataProperties.indexOf(data.xProperty);
		var dim = dbsliceData.data.dataDims[dimId];
		var items = dim.top(Infinity);
	  
		var x = d3.scaleLinear()
		  .domain(    [svg.attr("xDomMin"), svg.attr("xDomMax")])
		  .rangeRound([0                  , svg.attr("plotWidth")]);
	  
		// The function in the histogram ensures that only a specific property is extracted from the data input to the function on the 'histogram(data)' call.
		var histogram = d3.histogram()
		  .value(function (d) {return d[data.xProperty];})
		  .domain(x.domain())
		  .thresholds(x.ticks(20));
	  
		var bins = histogram(items);
	  
		var y = d3.scaleLinear()
		  .domain([0, d3.max(bins, function (d){return d.length;})])
		  .range([svg.attr("plotHeight"), 0]);
	
	
	
		// Handle entering/updating/removing the bars.
		var bars = svg.select(".plotArea").selectAll("rect").data(bins);
	
		bars.enter()
		  .append("rect")
			.attr("transform", function (d){
				return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
			.attr("x", 1)
			.attr("width",  function (d){return x(d.x1) - x(d.x0) - 1;})
			.attr("height", function (d){return svg.attr("plotHeight") - y(d.length);})
			.style("fill", cfD3Histogram.colour)
			.attr("opacity", "1");
				
		bars.transition()
		  .attr("transform", function (d){
			  return "translate(" + x(d.x0) + "," + y(d.length) + ")";})
		  .attr("x", 1)
		  .attr("width", function (d){return x(d.x1) - x(d.x0) - 1;})
		  .attr("height", function (d){return svg.attr("plotHeight") - y(d.length);});
		  
		bars.exit().remove();
	
	
		// Handle the axes.
		var xAxis = container.select(".plotArea").select(".xAxis");
		if (xAxis.empty()){
			xAxis = container.select(".plotArea")
				  .append("g")
					.attr("class", "xAxis")
					.attr("transform", "translate(0," + svg.attr("plotHeight") + ")")
					.call(d3.axisBottom(x));
				
			xAxis
			.append("text")
			  .attr("class", "xAxisLabel")
			  .attr("fill", "#000")
			  .attr("x", svg.attr("plotWidth"))
			  .attr("y", cfD3Histogram.margin.bottom)
			  .attr("text-anchor", "end")
			  .text(data.xProperty);
		  
		} else {
			// If the axis is already there it might just need updating.
			container.select(".plotArea").select(".xAxis").call(d3.axisBottom(x));
			
		}; // if
	
		// The axes class holds the axes labels
		var axes = svg.select(".plotArea").select(".axes");
		if (axes.empty()) {
		  svg.select(".plotArea")
			.append("g")
			  .attr("class", "axes")
			  .call(d3.axisLeft(y));
		} else {
		  axes.transition().call(d3.axisLeft(y));
		} // if

		var yAxisLabel = svg.select(".plotArea").select(".axes").select(".yAxisLabel");
		if (yAxisLabel.empty()) {
		  svg.select(".plotArea").select(".axes")
			.append("text")
			  .attr("class", "yAxisLabel")
			  .attr("fill", "#000")
			  .attr("transform", "rotate(-90)")
			  .attr("x", 0)
			  .attr("y", -25)
			  .attr("text-anchor", "end")
			  .text("Number of tasks");
		} // if

	
	}, // update
	
	setupSvg: function setupSvg(container, data, layout){
		// Add the setupSvg function!!
		
		// If layout has a margin specified store it as the internal property.
		cfD3Histogram.margin = layout.margin === undefined ? cfD3Histogram.margin : layout.margin;
		cfD3Histogram.colour = layout.colour === undefined ? "cornflowerblue" : layout.colour;
		
		
		var svg = container.select("svg");
		if (svg.empty()){
			
			// Append new svg
			svg = container.append("svg");
			
			// Update its dimensions.
			curateSvg();
			 
		} else {
			
			// Differentiate between changing plot types, or just changing the data!!
			// If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, is attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
			  
			var plotWrapper = container.select(function() {return this.parentElement.parentElement;});

			var expectedPlotType = plotWrapper.attr("plottype");
			
			if (expectedPlotType !== "cfD3Histogram" ){
				// If the plot type has changed, then the svg contents need to be removed completely.
				plotWrapper.attr("plottype", "cfD3Histogram")
				
				svg.selectAll("*").remove();
				curateSvg();
				
				// Add functionality.
				cfD3Histogram.setupInteractivity(container, data);
				
			} else {
				// Axes might need to be updated, thus the svg element needs to be refreshed.
				curateSvg();
				
			}; // if        
			
		}; // if
	  
	  
		function curateSvg(){
		  
		  
			// Get plot dimensions
			var svgWidth = container.node().offsetWidth;
			var svgHeight = layout.height;
			var width = svgWidth - cfD3Histogram.margin.left - cfD3Histogram.margin.right;
			var height = svgHeight - cfD3Histogram.margin.top - cfD3Histogram.margin.bottom;
		  
			// Calculation the min and max values - based on all the data, otherwise crossfilter will remove some, and the x-axis will be rescaled every time the brush adds or removes data.
			var items = dbsliceData.data.cf.all();
			
			var xDomMin = d3.min(items, function (d) {return d[data.xProperty];}) * 0.9;
			var xDomMax = d3.max(items, function (d) {return d[data.xProperty];}) * 1.1;
			
			// The dimId needs to be assigned here, otherwise there is confusion between the brush and the data if a hitogram plot inherits a histogram plot.
			var dimId = dbsliceData.data.dataProperties.indexOf(data.xProperty);
			
			// Curating the svg.                
			container.select("svg")
				.attr("width", svgWidth)
				.attr("height", svgHeight)
				.attr("plotWidth", width)
				.attr("plotHeight", height)
				.attr("xDomMin", xDomMin)
				.attr("xDomMax", xDomMax)
				.attr("dimId", dimId);
				
			var plotArea = container.select("svg").select(".plotArea");
			if(plotArea.empty()){
				// If there's nonoe, add it.
				container.select("svg")
				.append("g")
				  .attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")")
				  .attr("class", "plotArea");
				
			}; // if
			
		}; // setupSvg.updateSvgAttributes
	  
	}, // setupSvg
  
	setupInteractivity: function setupInteractivity(container, data){
	  
	  
		var svg = container.select("svg");
		  
			
		// Specify and add brush
		var brush = d3.brushX()
		  .extent([[0, 0], [svg.attr("plotWidth"), svg.attr("plotHeight")]])
		  .on("start brush end", brushmoved);
		  
		  
		var gBrush = svg
		  .append("g")
			.attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")")
			.attr("class", "brush")
			.call(brush); // style brush resize handle
		// https://github.com/crossfilter/crossfilter/blob/gh-pages/index.html#L466

		var brushResizePath = function brushResizePath(d) {
		  var e = +(d.type == "e"),
			  x = e ? 1 : -1,
			  y = svg.attr("plotHeight") / 2;
		  return "M" + .5 * x + "," + y + "A6,6 0 0 " + e + " " + 6.5 * x + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + .5 * x + "," + 2 * y + "Z" + "M" + 2.5 * x + "," + (y + 8) + "V" + (2 * y - 8) + "M" + 4.5 * x + "," + (y + 8) + "V" + (2 * y - 8);
		}; // brushResizePath

		var handle = gBrush.selectAll("handleCustom")
		  .data([{type: "w"}, {type: "e"}])
		  .enter()
			.append("path")
			  .attr("class", "handleCustom")
			  .attr("stroke", "#000")
			  .attr("cursor", "ewResize")
			  .attr("d", brushResizePath);
			  

		var brushInit = true;
		gBrush.call(brush.move, [0, Number(svg.attr("plotWidth"))]);
		brushInit = false;

		function brushmoved() {
			// Select the positions of the brush relative to the svg. Then convert it to th actual values. Then update the filters using these values.
			var s = d3.event.selection;
			var sx = [];

			if (s == null) {
				handle.attr("display", "none");
			} else {
				// This scale needs to be updated here!!
				var x = d3.scaleLinear()
				  .domain(    [svg.attr("xDomMin"), svg.attr("xDomMax")  ])
				  .rangeRound([0                  , svg.attr("plotWidth")]);
				
					
				sx = s.map(x.invert);
				handle.attr("display", null)
					  .attr("transform", function (d, i) {
						return "translate(" + [s[i], -svg.attr("plotHeight") / 4] + ")";
					  }); // The number controls vertical position of the brush handles.
			}; // if
			  
			// sx is a pair the min/max values of the filter.
			dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")] = sx;
			cfUpdateFilters( dbsliceData.data );
			if (brushInit == false){
				render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
			}; // if
		  
		} // brushMoved
	  
	  
	} // setupInteractivity
  
}; // cfD3Histogram


export { cfD3Histogram };