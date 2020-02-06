import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';

const cfD3Scatter = {
        
        name: "cfD3Scatter",
      
        margin: {top: 20, right: 20, bottom: 30, left: 50},
      
        colour: [],
      
        opacity: 1,
        
        make: function make(element, data, layout) {
            
            // Update the plot.
            cfD3Scatter.update(element, data, layout);
        },
      
        update: function update(element, data, layout) {
            
            
            cfD3Scatter.setupSvg(d3.select(element), data, layout);
            
            // Selections for plotting.
            var svg = d3.select(element).select("svg");
            
            
            // Get the points data, and calculate its range.
            var pointData = cfD3Scatter.helpers.getPointData(data);
            
            // Create the scales required for plotting. These convert data values into pixel positions on the screen.
            var xscale = createScale("x");
            var yscale = createScale("y");
            

            // Handle entering/updating/removing points.
            var points = svg.select(".plotArea").selectAll("circle").data(pointData);
            points.enter()
              .append("circle")
                .attr("r", 5)
                .attr("cx", function (d) { return xscale(d[data.xProperty]); })
                .attr("cy", function (d) { return yscale(d[data.yProperty]); })
                .style("fill", function (d) { return returnPointColor(d, data.cProperty); })
                .style("opacity", cfD3Scatter.opacity)
                .attr("clip-path", "url(#" + svg.select("clipPath").attr("id") + ")")
                .attr("task-id", function (d) { return d.taskId; });
                
            points
              .attr("r", 5)
              .attr("cx", function (d) { return xscale(d[data.xProperty]); })
              .attr("cy", function (d) { return yscale(d[data.yProperty]); })
              .style("fill", function (d) { return returnPointColor(d, data.cProperty); })
              .attr("task-id", function (d) { return d.taskId; });
              
            points.exit().remove();
            
            
            // Plot the axes
            createAxes();        

            // ADD INTERACTIVITY
            
            // Add the tooltip interactivity
            cfD3Scatter.addInteractivity.addTooltip(svg);

            // Add zooming.
            cfD3Scatter.addInteractivity.addZooming(svg, data);
            
        
            
            // HELPER FUNCTIONS
            function createScale(axis){
                
                // Create the scales that position the points in the svg area.
                switch(axis){
                    case "x":
                        var xRange_ = cfD3Scatter.helpers.getRange(svg, "x");
                        var scale = d3.scaleLinear()
                            .range([0, svg.attr("plotWidth")])
                            .domain( xRange_ );
                    
                      break;
                      
                    case "y":
                        var yRange_ = cfD3Scatter.helpers.getRange(svg, "y");
                        var scale = d3.scaleLinear()
                            .range([svg.attr("plotHeight"), 0])
                            .domain( yRange_ );
                      break;
                    
                }; // switch
                
                return scale;
                
            }; // createScale
                    
            function returnPointColor(d, cProperty){
                var pointColor = [];
                if (cProperty !== undefined){
                    pointColor = cfD3Scatter.colour(d[cProperty]);
                } else {
                    pointColor = cfD3Scatter.colour(1);
                };
                return pointColor;
            }; // returnPointColor
            
            function createAxes(){
                
                // Something with the axis?
                var xAxis = d3.axisBottom(xscale);
                var yAxis = d3.axisLeft(yscale);
               
                var xAxisContainer = svg.select(".plotArea").select(".axis--x");
                if (xAxisContainer.empty()) {
                  xAxisContainer = svg.select(".plotArea").append("g")
                      .attr("transform", "translate(0," + svg.attr("plotHeight") + ")")
                      .attr("class", "axis--x")
                      .call(xAxis);
                      
                  xAxisContainer.append("text")
                      .attr("fill", "#000")
                      .attr("x", svg.attr("plotWidth"))
                      .attr("y", cfD3Scatter.margin.bottom - 2)
                      .attr("text-anchor", "end")
                      .text(data.xProperty);
                } else {
                  xAxisContainer.transition()
                    .call(xAxis);
                }; // if

                var yAxisContainer = svg.select(".plotArea").select(".axis--y");
                if (yAxisContainer.empty()) {
                  yAxisContainer = svg.select(".plotArea").append("g")
                      .attr("class", "axis--y")
                      .call(yAxis);
                      
                  yAxisContainer.append("text")
                      .attr("fill", "#000")
                      .attr("transform", "rotate(-90)")
                      .attr("x", 0)
                      .attr("y", -cfD3Scatter.margin.left + 15)
                      .attr("text-anchor", "end")
                      .text(data.yProperty);
                } else {
                  yAxisContainer.transition()
                    .call(yAxis);
                }; // if
                
                
            }; // createAxes
            
            
        }, // update
      
        setupSvg: function setupSvg(container, data, layout){
            // Create o clear existing svg to fix the bug of entering different plot types onto exting graphics.
              
              
            // If layout has a margin specified store it as the internal property.
            var margin = cfD3Scatter.margin;
            margin = layout.margin === undefined ? cfD3Scatter.margin : layout.margin;
              
            // Set either the default colour, or the user selected one
            cfD3Scatter.colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap);
              
            // Here the color domain is defined. If a cProperty is specified this is ok,
            // but if it isn't it can cause trouble!
            if (data.cProperty !== undefined){
                cfD3Scatter.colour.domain(dbsliceData.data.metaDataUniqueValues[data.cProperty]);
            } else {
                cfD3Scatter.colour.domain([1]);
            }; // if
              
            // Same for opacity
            var opacity = cfD3Scatter.opacity;
            opacity = opacity = layout.opacity === undefined ? 1.0 : layout.opacity;
              
              
              
            var svg = container.select("svg");          
            if (svg.empty()){
                  
                // Append new svg
                svg = container.append("svg");
                  
                // Update its dimensions.
                curateSvg();
                  
                
            } else {
                    
                // Differentiate between changing plot types, or just changing the data!!
                // If just the data is changing nothing needs to be done here, whereas if the plot type is changing this function needs to remove anything it does not need!
                      
                var plotWrapper = container.select(function() {return this.parentElement.parentElement;});
                    
                    

                var expectedPlotType = plotWrapper.attr("plottype");
                if (expectedPlotType !== "cfD3Scatter" ){
                    // If the plot type has changed, then the svg contents need to be removed completely.
                    plotWrapper.attr("plottype", "cfD3Scatter")
                    
                    svg.selectAll("*").remove();
                    curateSvg();
                        
                    // The interactivity is added in the main update function!
                        
                } else {
                    // The plot is being inherited by another scatter plot. Just update the plot.
                    curateSvg();
                        
                        
                }; // if                  
            }; // if
              
              
            function curateSvg(){
                  
                  
                var svgWidth = container.node().offsetWidth;
                var svgHeight = layout.height;
                var width = svgWidth - margin.left - margin.right;
                var height = svgHeight - margin.top - margin.bottom;
                  
                var pointData = cfD3Scatter.helpers.getPointData(data);
                  
                var xRange = cfD3Scatter.helpers.calculateRange(pointData, data.xProperty);
                var yRange = cfD3Scatter.helpers.calculateRange(pointData, data.yProperty);
                  
                container.select("svg")
                  .attr("width", svgWidth)
                  .attr("height", svgHeight)
                  .attr("plotWidth", width)
                  .attr("plotHeight", height)
                  .attr("xDomMin", xRange[0])
                  .attr("xDomMax", xRange[1])
                  .attr("yDomMin", yRange[0])
                  .attr("yDomMax", yRange[1]);
              
                var plotArea = container.select("svg").select(".plotArea");
                if (plotArea.empty()){
                    container.select("svg")
                      .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .attr("class", "plotArea"); 
                }; // if
                      

                // Add a clipPath: everything outside the size of this area won't be drawn.
                // I think just the size of this element matters, not where it is actually located on the screen.
                var clipId = "clip-" + container.attr("plot-row-index") + "-" + container.attr("plot-index");
                var clip = container.select("svg").select("clipPath")
                if (clip.empty()){
                    container.select("svg")
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
                      
            }; // setupSvg.curateSvg
            

        }, // setupSvg
      
        addInteractivity: {
              
            addTooltip: function addTooltip(svg){
                  
                // This controls al the tooltip functionality.
                  
                var points = svg.selectAll("circle");
                  
                points.on("mouseover", tipOn)
                      .on("mouseout", tipOff);
                  
				// Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
                var tip = d3.tip()
                  .attr('class', 'd3-tip')
                  .offset([-10, 0])
                  .html(function (d) {
                      return "<span>" + d.label + "</span>";
                  });
                  
                
                svg.call( tip );
                      
                      
                function tipOn(d) {
                    // points.style("opacity", 0.2);
                    // d3.select(this).style("opacity", 1.0).attr("r", 7);
                    tip.show(d);
					
					// Here I want to add cross highlighting.
					crossPlotHighlighting.on(d, "cfD3Scatter")
                }; // tipOn

                function tipOff(d) {
                    // points.style("opacity", cfD3Scatter.opacity);
                    // d3.select(this).attr("r", 5);
                    tip.hide();
					
					// Add cross highlighting effect.
					crossPlotHighlighting.off(d, "cfD3Scatter")
                }; // tipOff
                  
                  
            }, // addTooltip
              
            addZooming: function addZooming(svg, data){
                  
                  
                var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
            
                svg.transition().call(zoom.transform, d3.zoomIdentity);
                svg.call(zoom);
                    
                    
                function zoomed() {
                    var t = d3.event.transform;
                      
                    // Get the domains:
                    var xRange = cfD3Scatter.helpers.getRange(svg, "x");
                    var yRange = cfD3Scatter.helpers.getRange(svg, "y");
                      
                    // Recreate original scales.
                    var xscale = d3.scaleLinear()
                      .range([0, svg.attr("plotWidth")])
                      .domain( xRange );
                    var yscale = d3.scaleLinear()
                      .range([svg.attr("plotHeight"), 0])
                      .domain( yRange );
                      
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
                      
                    // Reposition all dots
                    svg.select(".plotArea").selectAll("circle")
                      .attr("cx", function (d) {return xscale(d[data.xProperty]);})
                      .attr("cy", function (d) {return yscale(d[data.yProperty]);});
                }; // zoomed
                  

                  
            } // addZooming
              
              
        }, // addInteractivity
      
        helpers: {
          
            getPointData: function getPointData(data){
              
                // "dim" is a crossfilter.dimension(). It is the functionality that allows the user to perform specific filtering and grouping operations, two of which are "top(n)", and "bottom(n)", which return n top and bottom most elements along the chosen dimension. The returned elements are full data rows!
                // The functionality to select specific dimensions has been pushed to the plotting functions, as the data manipulation occurs here.
                var dimId = dbsliceData.data.dataProperties.indexOf(data.xProperty);
                var dim = dbsliceData.data.dataDims[dimId];
                var pointData = dim.top(Infinity);
              
              return pointData;
              
            }, // getPointData
          
            calculateRange: function calculateRange(p, property){
                var pMin = d3.min(p, function (d) { return d[property]; });
                var pMax = d3.max(p, function (d) { return d[property]; });
                var pDiff = pMax - pMin;
                pMin -= 0.1 * pDiff;
                pMax += 0.1 * pDiff;
                var range = [pMin, pMax];
            
              return range
            }, // calculateRange
                    
            getRange: function getRange(svg, dimName){
              
                var domMin = Number( svg.attr( dimName + "DomMin") );
                var domMax = Number( svg.attr( dimName + "DomMax") );
              return [domMin, domMax]
            } // getRange
          
          
        } // helpers
      
    }; // cfD3Scatter


export { cfD3Scatter };