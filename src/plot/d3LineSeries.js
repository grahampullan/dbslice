import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';

const d3LineSeries = {
	
	name: "d3LineSeries",
  
	margin: {top: 20, right: 20, bottom: 30, left: 50},
	
	layout: { colWidth : 4, height : 400},
  
	colour: [],

	make : function ( element, data, layout ) {
		
		d3LineSeries.update( element, data, layout );

	}, // make

	update : function ( element, data, layout ) {


		// End execution if there is no new data.
		if (data.newData == false) {
			return
		} // if

		// Setup the svg.
		d3LineSeries.setupSvg(element, data, layout);
			
		// Some convenient handles.
		var svg = d3.select(element).select("svg");
		
		// Create the required scales.
		var xscale = d3.scaleLinear()
			.range( [0, svg.attr("plotWidth")] )
			.domain( d3LineSeries.helpers.getDomain(data, 'x') );

		var yscale = d3.scaleLinear()
			.range( [svg.attr("plotHeight"), 0] )
			.domain( d3LineSeries.helpers.getDomain(data, 'y') );


		// Create a plotting function
		var line = d3.line()
			.x( function( d ) { return xscale( d.x ); } )
			.y( function( d ) { return yscale( d.y ); } );


		// Assign the data
		var allSeries = svg.select(".plotArea").selectAll( ".plotSeries" ).data( data.series );
		

		// Enter/update/exit 
		allSeries.enter()
		  .each( function() {
			  var series = d3.select( this );
			  var seriesLine = series.append( "g" )
				  .attr( "class", "plotSeries")
				  .attr( "series-name", function(d){ return d.label; })
				  .attr( "clip-path", "url(#" + svg.select("clipPath")
				  .attr("id") + ")")
				.append( "path" )
				  .attr( "class", "line" )
				  .attr( "d", function(d){ return line( d.data ); } )
				  .style( "stroke", function(d){ return d3LineSeries.colour( d.cKey ); } )    
				  .style( "fill", "none" )
				  .style( "stroke-width", "2.5px" );
		});

		allSeries.each( function() {
			var series = d3.select( this );
			var seriesLine = series.select( "path.line" );
			seriesLine.transition()
			  .attr( "d", function(d){return line( d.data );})
			  .style( "stroke", function(d){ return d3LineSeries.colour( d.cKey ); })  ;
		});

		allSeries.exit().remove();


		// Create some axes
		createAxes();
	
		
		// ADD SOME INTERACTIVITY
		d3LineSeries.addInteractivity.addTooltip(svg);
		
		d3LineSeries.addInteractivity.addZooming(svg, data);
		
		// Update marker.
		data.newData = false;
		
		// HELPER FUNCTIONS
		function createAxes(){
			
			// Create the axes objects
			var xAxis = d3.axisBottom( xscale ).ticks(5);
			var yAxis = d3.axisLeft( yscale );

			var gX = svg.select(".plotArea").select(".axis--x");
			if ( gX.empty() ) {
				gX = svg.select(".plotArea").append("g")
				  .attr( "transform", "translate(0," + svg.attr("plotHeight") + ")" )
				  .attr( "class", "axis--x")
				  .call( xAxis );
				gX.append("text")
				  .attr("fill", "#000")
				  .attr("x", svg.attr("plotWidth"))
				  .attr("y", d3LineSeries.margin.bottom)
				  .attr("text-anchor", "end")
				  .text(layout.xAxisLabel);
			} else {
				gX.transition().call( xAxis );
			} // if

			var gY = svg.select(".plotArea").select(".axis--y");
			if ( gY.empty() ) {
				gY = svg.select(".plotArea").append("g")
				  .attr( "class", "axis--y")
				  .call( yAxis );
				gY.append("text")
				  .attr("fill", "#000")
				  .attr("transform", "rotate(-90)")
				  .attr("x", 0)
				  .attr("y", -d3LineSeries.margin.left + 15)
				  .attr("text-anchor", "end")
				  .text(layout.yAxisLabel)
				  .attr("spellcheck", "false");
			} else {
				gY.transition().call( yAxis );
			} // if
			
		} // createAxes
		
	}, // update
	
	setupSvg : function setupSvg(element, data, layout){
		
		
		d3LineSeries.margin = layout.margin === undefined ? d3LineSeries.margin : layout.margin;
		d3LineSeries.colour = layout.colourMap === undefined ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );

		var container = d3.select(element);

		// Check if there is a svg first.
		var svg = container.select("svg");
		if (svg.empty()){
		  
			// Append new svg
			svg = container.append("svg");
			
			// Update its dimensions.
			curateSvg();
			 
		} else {
			
			// Differentiate between changing plot types, or just changing the data!!
			// If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, its attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
			  
			var plotWrapper = container.select(function() {return this.parentElement.parentElement;});

			var expectedPlotType = plotWrapper.attr("plottype");
			
			if (expectedPlotType !== "d3LineSeries" ){
				// If the plot type has changed, then the svg contents need to be removed completely.
				plotWrapper.attr("plottype", "d3LineSeries")
				
				svg.selectAll("*").remove();
				curateSvg();
				
			} else {
				// Axes might need to be updated, thus the svg element needs to be refreshed.
				curateSvg();
				
			}; // if    
		  
		}; // if

				
				
		function curateSvg(){
			
			// Also try to resize the plot to fit the data nicer.
			// d3.select(element.parentNode.parentNode).attr("class", "col-md-" + d3LineSeries.layout.colWidth);
			// For some reason this causes a bug which leaves redundant plots in the plot rows.
			
			var svgWidth = container.node().offsetWidth;
			var svgHeight = d3LineSeries.layout.height;

			var width = svgWidth - d3LineSeries.margin.left - d3LineSeries.margin.right;
			var height = svgHeight - d3LineSeries.margin.top - d3LineSeries.margin.bottom;
			
			// Curating the svg.                
			container.select("svg")
				.attr("width", svgWidth)
				.attr("height", svgHeight)
				.attr("plotWidth", width)
				.attr("plotHeight", height);
				
			var plotArea = container.select("svg").select(".plotArea");
			if(plotArea.empty()){
				// If there's none, add it.
				container.select("svg")
					.append("g")
					  .attr("transform", "translate(" + d3LineSeries.margin.left + "," + d3LineSeries.margin.top + ")")
					  .attr("class", "plotArea");
				
			}; // if
			
			// The same with the clip path for zooming.
			var clipId = "clip-"+container.attr("plot-row-index")+"-"+container.attr("plot-index");
			var clip = container.select("svg").select("clipPath")
			if (clip.empty()){
				container.select("svg")
				  .append("defs")
				  .append("clipPath")
					.attr("id", clipId)
				  .append("rect")
					.attr("width", svg.attr("plotWidth"))
					.attr("height", svg.attr("plotHeight"));
				
			} else {
				clip.select("rect")
					.attr("width", svg.attr("plotWidth"))
					.attr("height", svg.attr("plotHeight"))
				
				
			}; // if
			
			
		}; // curateSvg
		
	}, // setupSvg
	
	addInteractivity : {
		
		addTooltip: function addTooltip(svg){
		  
			// This controls al the tooltip functionality.
		  
			var lines = svg.selectAll(".line");
		  
			lines.on("mouseover", tipOn)
				 .on("mouseout", tipOff);
		  
		  
			// Do the tooltip
			var tip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-12, 0])
				.html(function (d) {
					return "<span>" + d.label + "</span>";
				});
				
			// Add an anchorPoint for the tooltip.
			var anchorPoint = svg.select(".plotArea")
				.append("g")
					.style("display","none")
				.append("circle")
						.attr("r",1);
		
			svg.call( tip );
			  
			  
			function tipOn(d) {
				lines.style("opacity", 0.2);
				d3.select(this)
					.style("opacity", 1.0)
					.style( "stroke-width", "4px" );
				
				// To control tip location another element must be added onto the svg. This can then be used as an anchor for the tooltip.
				anchorPoint
					.attr( "cx" , d3.mouse(this)[0] )
					.attr( "cy" , d3.mouse(this)[1] );
				
				tip.show(d, anchorPoint.node());
			}; // tipOn

			function tipOff() {
				lines.style("opacity", 1.0);
				d3.select(this)
					.style( "stroke-width", "2.5px" );
				
				tip.hide();
			}; // tipOff
		  
		  
		}, // addTooltip
		
		addZooming: function addZooming(svg, data){
		  
		  
			var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
	
			svg.transition().call(zoom.transform, d3.zoomIdentity);
			svg.call(zoom);
			
			

			function zoomed() {
				var t = d3.event.transform;
			  
				// Get the domains:
				var xRange = d3LineSeries.helpers.getDomain(data, "x");
				var yRange = d3LineSeries.helpers.getDomain(data, "y");
			  
				// Recreate original scales.
				var xscale = d3.scaleLinear()
					.range([0, svg.attr("plotWidth")])
					.domain( xRange );
				var yscale = d3.scaleLinear()
					.range([svg.attr("plotHeight"), 0])
					.domain( yRange );
					
				// In scales the range is the target, and the domain the source.
			  
				// Create new axes based on the zoom, which altered the domain.
				// d3.event.transform.rescaleX(xScale2).domain() to get the exact input of the location showing in the zooming aera and brush area.
				var newXRange = t.rescaleX(xscale).domain();
				var newYRange = t.rescaleY(yscale).domain();
				
				// Create new scales in the zoomed area.
				xscale.domain(newXRange);
				yscale.domain(newYRange);
			  
				// Redo the axes.
				svg.select(".plotArea").select(".axis--x").call( d3.axisBottom(xscale) );
				svg.select(".plotArea").select(".axis--y").call( d3.axisLeft(yscale) );
			  
				// Reposition all lines
				var line = d3.line()
					.x( function( d ) { return xscale( d.x ); } )
					.y( function( d ) { return yscale( d.y ); } );
			  
				
				svg.select(".plotArea").selectAll(".line")
					.attr( "d", function(d){return line( d.data );} );
					
				
			}; // zoomed
		  

		  
		} // addZooming
		
	}, // addInteractivity
	
	helpers: {
		
		getDomain: function getDomain(data, variable){
			
			// Finding the axis limits.
			var minVal = d3.min( data.series[0].data, function(d) { return d[variable]; } );
			var maxVal = d3.max( data.series[0].data, function(d) { return d[variable]; } );
			
			for (var n = 1; n < data.series.length; ++n) {
				var minVal_ =  d3.min( data.series[n].data, function(d){ return d[variable];} );
				minVal = ( minVal_ < minVal ) ? minVal_ : minVal;
				var maxVal_ =  d3.max( data.series[n].data, function(d){ return d[variable];} );
				maxVal = ( maxVal_ > maxVal ) ? maxVal_ : maxVal;
			}; // for
			
			return [minVal, maxVal]
			
		} // getDomain
		
		
		
	} // helpers
	
} // d3LineSeries

export { d3LineSeries };