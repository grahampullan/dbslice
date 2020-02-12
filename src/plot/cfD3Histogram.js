import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { plotHelpers } from '../plot/plotHelpers.js';

const cfD3Histogram = {
          
        name: "cfD3Histogram",
        
        margin: {top: 20, right: 20, bottom: 30, left: 50},
        
        colour: [],
          
        make: function make(element, data, layout) {
         
            // Update the controls as required
			cfD3Histogram.addInteractivity.updatePlotTitleControls(element)
          
            // Update the view
            cfD3Histogram.update(element, data, layout);
          
        },
        
        update: function update(element, data, layout) {
          
            cfD3Histogram.setupSvg(element, data, layout);
          
            var svg = d3.select(element).select("svg");
          
          
            // Get the required data.
            var items = dbsliceData.data.dataDims[0].top(Infinity);
          
            // Get the scale. All properties requried are in the svg.
			var x = cfD3Histogram.helpers.getXScale(svg);
          
            // Get the bins to plot
            var bins = cfD3Histogram.helpers.getBins(x, data.xProperty, items);
		  
		    // Make either a fixed scale or reactive scale (false/true)
            var y = cfD3Histogram.helpers.getYScale(svg, bins, false);
			  
			  
            // Handle entering/updating/removing the bars.
            var bars = svg.select(".plotArea").selectAll("rect").data(bins);
        
            bars.enter()
              .append("rect")
                .attr("transform", function (d){
                    return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
                .attr("x", 1)
                .attr("width",  calculateWidth )
                .attr("height", function (d){return svg.attr("plotHeight") - y(d.length);})
                .style("fill", cfD3Histogram.colour)
                .attr("opacity", 1);
                    
            bars.transition()
              .attr("transform", function (d){
                  return "translate(" + x(d.x0) + "," + y(d.length) + ")";})
              .attr("x", 1)
              .attr("width", calculateWidth )
              .attr("height", function (d){return svg.attr("plotHeight") - y(d.length);});
              
            bars.exit().remove();
        
		
			// Make some axes
			cfD3Histogram.helpers.createAxes(svg, x, y, data.xProperty, "Number of tasks")
		
		
			function calculateWidth(d_){
				var width = x(d_.x1) - x(d_.x0) - 1;
				width = width < 0 ? 0 : width
				return width	
			} // calculateWidth
		
			
        
        }, // update
        
        setupSvg: function setupSvg(element, data, layout){
            // Add the setupSvg function!!
            
			var container = d3.select(element);
			
            // If layout has a margin specified store it as the internal property.
            cfD3Histogram.margin = layout.margin === undefined ? cfD3Histogram.margin : layout.margin;
            cfD3Histogram.colour = layout.colour === undefined ? "cornflowerblue" : layout.colour;
            
            
            var svg = container.select("svg");
            if (svg.empty()){
                
                // Append new svg
                svg = container.append("svg");
                
                // Update its dimensions.
                curateSvg();
				
				// Add functionality.
				cfD3Histogram.addInteractivity.addBrush(svg);
                 
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
					cfD3Histogram.addInteractivity.addBrush(svg);
					
					plotHelpers.removePlotTitleControls(element)
					
                    
                } else {
                    // Axes might need to be updated, thus the svg element needs to be refreshed.
                    curateSvg();
                    
					// Only update the brush if the window is resized - otherwise the functionality should remain the same
					if(layout.isWindowResized){
						cfD3Histogram.addInteractivity.addBrush(svg);
					} // if
					
					if(layout.isPlotBeingRemoved){
						cfD3Histogram.addInteractivity.addBrush(svg);
					} // if
					
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
                var svg = container.select("svg")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight)
                    .attr("plotWidth", width)
                    .attr("plotHeight", height)
                    .attr("xDomMin", xDomMin)
                    .attr("xDomMax", xDomMax)
                    .attr("dimId", dimId);
					
				// Create original bins to compare against during exploration.
				var x = cfD3Histogram.helpers.getXScale(svg);
				var bins = cfD3Histogram.helpers.getBins(x, data.xProperty, items);
				var yDomMax = d3.max(bins, function(d) {return d.length} )
				svg.attr("yDomMax", yDomMax)
                    
                var plotArea = svg.select(".plotArea");
                if(plotArea.empty()){
                    // If there's nonoe, add it.
                    svg
                      .append("g")
                        .attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")")
                        .attr("class", "plotArea");
                    
                }; // if
                
            }; // setupSvg.updateSvgAttributes
          
        }, // setupSvg
      
        addInteractivity: {
			
			addBrush: function addBrush(svg){
				// The hardcoded values need to be declared upfront, and abstracted.
				
				
				// Get the scale. All properties requried are in the svg.
				var x = cfD3Histogram.helpers.getXScale(svg)
				
				
				// There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again
				// Why is there no brush here on redraw??
				var brush = svg.select(".brush")
				if(brush.empty()){
					
					brush = svg
					  .append("g")
						.attr("class","brush")
						.attr("xDomMin", svg.attr("xDomMin"))
						.attr("xDomMax", svg.attr("xDomMax"))
						.attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")")
						
					var xMin = svg.attr("xDomMin")
					var xMax = svg.attr("xDomMax")
					
					// Initialise the filter if it isn't already.
					var filter = dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")]
					if(filter !== undefined){
						xMin = filter[0]
						xMax = filter[1]
					} else {
						dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")] = [xMin, xMax]
					} // if
					
				} else {
					// Setup th efilter bounds in the cfInit??
					var filter = dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")]
					var xMin = filter[0]
					var xMax = filter[1]
					
					
					brush.selectAll("*").remove();
					
				}// if
				

					
				var rect = brush
				  .append("rect")
					.attr("class", "selection")
					.attr("cursor", "move")
					.attr("width", x(xMax) - x(xMin))
					.attr("height", svg.attr("plotHeight"))
					.attr("x", x(xMin))
					.attr("y", 0)
					.attr("opacity", 0.2)
					.attr("xMin", xMin)
					.attr("xMax", xMax)
					
				
				// Make the rect draggable
				rect.call( d3.drag().on("drag", dragmove  ) )
				
				
				// Make the rect scalable, and add rects to the left and right, and use them to resize the rect.
				brush
				  .append("rect")
					.attr("class", "handle handle--e")
					.attr("cursor", "ew-resize")
					.attr("x", Number(rect.attr("x")) + Number(rect.attr("width"))   )
					.attr("y", Number(rect.attr("y")) + Number(rect.attr("height"))/4 )
					.attr("width", 10)
					.attr("height", Number(rect.attr("height"))/2)
					.attr("opacity", 0)
					.call( d3.drag().on("drag", dragsize) )
				brush
				  .append("rect")
					.attr("class", "handle handle--w")
					.attr("cursor", "ew-resize")
					.attr("x", Number(rect.attr("x")) - 10)
					.attr("y", Number(rect.attr("y")) + Number(rect.attr("height"))/4 )
					.attr("width", 10)
					.attr("height", Number(rect.attr("height"))/2)
					.attr("opacity", 0)
					.call( d3.drag().on("drag", dragsize) )
				

				// Decorative handles.
				var handleData = [{x0: [Number(rect.attr("x")) + Number(rect.attr("width")),
				                       Number(rect.attr("y")) + Number(rect.attr("height"))/4],
								  height: Number(rect.attr("height"))/2, 
								  side: "e"}, 
								  {x0: [Number(rect.attr("x")),
				                       Number(rect.attr("y")) + Number(rect.attr("height"))/4],
								  height: Number(rect.attr("height"))/2, 
								  side: "w"}]
				
				
				brush.selectAll("path").data(handleData).enter()
				  .append("path")
				    .attr("d", drawHandle )
					.attr("stroke", "#000")
					.attr("fill", "none")
					.attr("class", function(d){ return "handle handle--decoration-" + d.side})
					
				function drawHandle(d){
					// Figure out if the west or east handle is needed.
					var flipConcave = d.side == "e"? 1:0
					var flipDir = d.side == "e"? 1:-1
					
					var lambda = 30/300
					var r = lambda*d.height
					
					var start = "M" + d.x0[0] + " " + d.x0[1]
					var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir*r, r].join(" ")
					var leftLine = "h0 v" + (d.height - 2*r)
					var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir*r, r].join(" ")
					var closure = "Z"
					var innerLine = "M" + [d.x0[0] + flipDir*r/2, d.x0[1] + r].join(" ") + leftLine
					
					return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ")
					
				}// drawHandle
				
				
				function dragmove(){
					var x = cfD3Histogram.helpers.getXScale(svg)
					
					var rect = d3.select(this)
					var brush = d3.select(this.parentNode)

					
					// Update teh position of the left edge by the difference of the pointers movement.
					var oldWest = Number(rect.attr("x"))
					var oldEast = Number(rect.attr("x")) + Number(rect.attr("width"))
					var newWest = oldWest + d3.event.dx; 
					var newEast = oldEast + d3.event.dx;
					
					// Check to make sure the boundaries are within the axis limits.
					if (x.invert(newWest) <  svg.attr("xDomMin")){
						newWest = x(svg.attr("xDomMin"))
					} else if (x.invert(newEast) >  svg.attr("xDomMax")){
						newEast = x(svg.attr("xDomMax"))
					} // if
					
					
					// Update the xMin and xMax values.
					rect.attr("xMin", x.invert(newWest))
					rect.attr("xMax", x.invert(newEast))
					
					
					// Update the selection rect.
					cfD3Histogram.addInteractivity.updateBrush(svg);
					
					// Update the data selection
					updateSelection(brush)
					
					// Rerender to allow other elements to respond.
					render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
					
				} // dragmove
				
				function dragsize(){
					// Update teh position of the left edge by the difference of the pointers movement.
					var x = cfD3Histogram.helpers.getXScale(svg)
					
					var handle = d3.select(this)
					var brush = d3.select(this.parentNode)
					
					var oldWidth = Number(rect.attr("width"))
					var oldWest = Number(rect.attr("x"))
					var oldEast = oldWest + oldWidth
					
					
					
					switch(handle.attr("class")){
						case "handle handle--e":
							// Change the width.
							var newWidth = oldWidth + d3.event.dx
							var newWest = oldWest
						  break
						  
						case "handle handle--w":
							// Change the width, and x both
							var newWidth = oldWidth - d3.event.dx
							var newWest = oldWest + d3.event.dx
						  break
						  
					} // switch
					var newEast = newWest + newWidth
					
					
					
					// Check to make sure the boundaries are within the axis limits.
					if (x.invert(newWest) <  svg.attr("xDomMin")){
						newWest = x(svg.attr("xDomMin"))
					} else if (x.invert(newEast) >  svg.attr("xDomMax")){
						newEast = x(svg.attr("xDomMax"))
					} // if
					
					// Handle the event in which a handle has been dragged over the other.
					if (newWest > newEast){
						newWidth = newWest - newEast
						newWest = newEast
						newEast = newWest + newWidth
					
						// In this case just reclass both the handles - this takes care of everything.
						var he = d3.select(".brush").select(".handle--e")
						var hw = d3.select(".brush").select(".handle--w")
						
						hw.attr("class", "handle handle--e")
						he.attr("class", "handle handle--w")
					} // if
					
					
					// Update all brushes corresponding to the same dimId. This will take an overhaul of the process here. The update will have to read the min and max values straight from the filter, but this causes accelerated movement of the brush...
					
					
					// Update the xMin and xMax values.
					brush.select(".selection").attr("xMin", x.invert(newWest))
					brush.select(".selection").attr("xMax", x.invert(newEast))
					
					// Update the brush rectangle
					cfD3Histogram.addInteractivity.updateBrush(svg);
					
					
					// Update the data selection
					updateSelection(brush)
					
					// Rerender to allow other elements to respond.
					render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
					
				} // dragsize
				
				function updateSelection(brush){
					
					var rect = brush.select(".selection")
					var lowerBound = Number(rect.attr("x"))
					var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"))
					
					var selectedRange = [x.invert(lowerBound), x.invert(upperBound)]
					
					dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")] = selectedRange;
					
					// Update the filter
					cfUpdateFilters( dbsliceData.data );
					
				} // updateSelection
				
			}, // addBrush
			
			updateBrush: function updateBrush(svg){
				
				// First get the scale
				var x = cfD3Histogram.helpers.getXScale(svg)
				
				// Now get the values that are supposed to be selected.
				var xMin = Number(svg.select(".selection").attr("xMin"))
				var xMax = Number(svg.select(".selection").attr("xMax"))
				
				
				// Update teh rect.
				svg.select(".selection")
				  .attr("x", x(xMin))
				  .attr("width", x(xMax) - x(xMin))
				
				// Update the handles				
				svg.select(".brush").select(".handle--e").attr("x", x(xMax))
				svg.select(".brush").select(".handle--w").attr("x", x(xMin) - 10)
				
				// CLEAN THIS UP:
				// Update the handle decorations
				var rect = svg.select(".selection")
				var de = {x0: [Number(rect.attr("x")) + Number(rect.attr("width")),
				               Number(rect.attr("y")) + Number(rect.attr("height"))/4],
						  height: Number(rect.attr("height"))/2, 
						  side: "e"}
				var dw = {x0: [Number(rect.attr("x")),
			                   Number(rect.attr("y")) + Number(rect.attr("height"))/4],
					  height: Number(rect.attr("height"))/2, 
						side: "w"}
				
				svg.select(".brush").select(".handle--decoration-e")
				  .attr("d", drawHandle(de))
				svg.select(".brush").select(".handle--decoration-w")
				  .attr("d", drawHandle(dw))
				  
				function drawHandle(d){
					// Figure out if the west or east handle is needed.
					var flipConcave = d.side == "e"? 1:0
					var flipDir = d.side == "e"? 1:-1
					
					var lambda = 30/300
					var r = lambda*d.height
					
					var start = "M" + d.x0[0] + " " + d.x0[1]
					var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir*r, r].join(" ")
					var leftLine = "h0 v" + (d.height - 2*r)
					var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir*r, r].join(" ")
					var closure = "Z"
					var innerLine = "M" + [d.x0[0] + flipDir*r/2, d.x0[1] + r].join(" ") + leftLine
					
					return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ")
					
				}// drawHandle

				
			}, // updateBrush
			
			updatePlotTitleControls: function updatePlotTitleControls(element){
				
				plotHelpers.removePlotTitleControls(element)
				
			} // updatePlotTitleControls
			
		}, // setupInteractivity
		
		helpers: {
			
			getXScale: function getXScale(svg){
				
				var x = d3.scaleLinear()
				  .domain(    [svg.attr("xDomMin"), svg.attr("xDomMax")  ])
				  .rangeRound([0                  , svg.attr("plotWidth")]);
				return x;
				
			}, // getXScale
			
			getYScale: function getYScale(svg, bins, reactive){
				
				if(reactive){
					var y = d3.scaleLinear()
					  .domain([0, d3.max(bins, function (d){return d.length;})])
					  .range([svg.attr("plotHeight"), 0]);
				} else {
					var y = d3.scaleLinear()
					  .domain([0, svg.attr("yDomMax")])
					  .range([svg.attr("plotHeight"), 0]);
				}// if
				
			  return y
				
			}, // getYScale
			
			getBins: function getBins(x, property, items){
				
				// The function in the histogram ensures that only a specific property is extracted from the data input to the function on the 'histogram(data)' call.
				var histogram = d3.histogram()
				  .value(function (d) {return d[property];})
				  .domain(x.domain())
				  .thresholds(x.ticks(20));
			  
				var bins = histogram(items);
				
			  return bins
			}, // getBins
			
			createAxes: function createAxes(svg, x, y, xLabel, yLabel){
				

				
				// Handle the axes.
				var xAxis = svg.select(".plotArea").select(".xAxis");
				if (xAxis.empty()){
					xAxis = svg.select(".plotArea")
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
					  .text(xLabel);
				  
				} else {
					// If the axis is already there it might just need updating.
					svg.select(".plotArea").select(".xAxis").call(d3.axisBottom(x));
					
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
					  .text(yLabel);
				} // if

			} // createAxes
			
			
			
		} // helpers
		
      
    }; // cfD3Histogram


export { cfD3Histogram };