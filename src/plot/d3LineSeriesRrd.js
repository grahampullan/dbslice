import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { plotHelpers } from '../plot/plotHelpers.js';

const d3LineSeriesRrd = {
        
        name: "d3LineSeriesRrd",
      
        margin: {top: 20, right: 10, bottom: 30, left: 25},
        
        layout: { colWidth : 4, height : 400},
      
        colour: [],

        make : function ( element, data, layout ) {
			
			// Remove any controls in the plot title.
			d3LineSeriesRrd.addInteractivity.updatePlotTitleControls(element)
            
			
            d3LineSeriesRrd.update( element, data, layout );
			
			d3LineSeriesRrd.setupSvg(element, data, layout);
                
            // Some convenient handles.
            var svg = d3.select(element).select("svg");
			
			d3LineSeriesRrd.addInteractivity.addZooming(svg, data);

        }, // make

        update : function ( element, data, layout ) {
			
			// This functions the data in a RRD configuration. This can be clarified out more.
			
            // Setup the svg.
            d3LineSeriesRrd.setupSvg(element, data, layout);
                
            // Some convenient handles.
            var svg = d3.select(element).select("svg");
			
			
			// Specify the options selected. Figure out a way to change these by the user later on. Don't move them into object properties though!
			var selectedOption = svg.attr("selectedOption")
			var selectedVariable = svg.attr("selectedVariable")
			
			function labelCreator(d){
				var label = [d.taskId, selectedOption, selectedVariable].join(' ')
				return label
			} // labelCreator
			
            
            // Create the required scales.
            var xscale = d3.scaleLinear()
                .range( [0, svg.attr("plotWidth")] )
                .domain( d3LineSeriesRrd.helpers.getDomain(data, selectedOption, selectedVariable, 'x') );

            var yscale = d3.scaleLinear()
                .range( [svg.attr("plotHeight"), 0] )
                .domain( d3LineSeriesRrd.helpers.getDomain(data, selectedOption,selectedVariable, 'y') );


            // Create a plotting function
            var line = d3.line()
                .x( function( d ) { return xscale( d.x ); } )
                .y( function( d ) { return yscale( d.y ); } );

			
			
			
			
			
			// Create the axes first, as the plot depends on the controls chosen.
            createAxes();
			
			
			
			
            // Assign the data
            var allSeries = svg.select(".plotArea").selectAll( ".plotSeries" ).data( data.series );

            // Enter/update/exit
            allSeries.enter()
              .each( function() {
                  var series = d3.select( this );
                  var seriesLine = series.append( "g" )
                      .attr( "class", "plotSeries")
                      .attr( "series-name", labelCreator )
					  .attr( "task-id", function(d){ return d.taskId; })
                      .attr( "clip-path", "url(#" + svg.select("clipPath").attr("id") + ")")
                    .append( "path" )
                      .attr( "class", "line" )
                      .attr( "d", function(d){ return line( d[selectedOption][selectedVariable] ); } )
                      .style( "stroke", function(d){ return d3LineSeriesRrd.colour( d.cKey ); } ) 
                      .style( "fill", "none" )
                      .style( "stroke-width", "2.5px" );
				
            });

			// update
            allSeries.each( function() {
                var series = d3.select( this )
				    .attr( "series-name", labelCreator )
					.attr( "task-id",     function(d){ return d.taskId; });
			})	
				
				
            allSeries.selectAll( "path.line" )
				  .transition()
				  .duration(1000)
                  .attr( "d", function(d){return line( d[selectedOption][selectedVariable] );})
                  
         

            allSeries.exit().remove();

			// It seems like it woks fine coming out to here. But why does it thn revert to other option?
            
        
            
            // ADD SOME INTERACTIVITY
            d3LineSeriesRrd.addInteractivity.addTooltip(svg);
            
            
            
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
                      .attr("y", d3LineSeriesRrd.margin.bottom)
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
                    
					
					d3LineSeriesRrd.addInteractivity.addInteractiveYAxisControls(element, data, layout)
					
					
                } else {
                    gY.transition().call( yAxis );
                } // if
                
            } // createAxes
            
			
        }, // update
        
        setupSvg : function setupSvg(element, data, layout){
            
            
            d3LineSeriesRrd.margin = layout.margin === undefined ? d3LineSeriesRrd.margin : layout.margin;
            d3LineSeriesRrd.colour = layout.colourMap === undefined ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );

            var container_ = d3.select(element).select(".separatorContainer");
			
			
			// An additional div structure must be present here, to accomodate the functionality of the y-axis.
			if( container_.empty() ){
				
				container_ = d3.select(element)
				  .append("div")
				    .attr("class", "separatorContainer")
					.attr("style", "width: 100%")
					
					
				container_
				  .append("div")
				    .attr("class", "yAxisControlDiv")
					.attr("style", "width: "+ d3LineSeriesRrd.margin.left +"px; height: " + d3LineSeriesRrd.layout.height + "; float: left")
					
				var container = container_
				  .append("div")
				  .attr("class", "plotDiv")
				  .attr("style", "margin-left: 40px")
				  
				
				
			} else {
				
				var container = container_.select(".plotDiv")
				
			} // if
			
			
			
			
			
			

            // Check if there is a svg first.
            var svg = container.select("svg");
            if (svg.empty()){
              
                // Append new svg
                svg = container.append("svg");
                
                // Update its dimensions.
                curateSvg();
				
				
				assignDefaultInteractiveValues();
                 
            } else {
                
                // Differentiate between changing plot types, or just changing the data!!
                // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, its attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
                  
                var plotWrapper = container.select(function() {return this.parentElement.parentElement;});

                var expectedPlotType = plotWrapper.attr("plottype");
                
                if (expectedPlotType !== "d3LineSeriesRrd" ){
                    // If the plot type has changed, then the svg contents need to be removed completely.
                    plotWrapper.attr("plottype", "d3LineSeriesRrd")
                    
                    svg.selectAll("*").remove();
                    curateSvg();
					
					
					// Add the selected variable and height optionto the svg. It cannot be in make, as the data passed in at update won't pass through it. The selection needs to be made here.
					assignDefaultInteractiveValues();
                    
                } else {
                    // Axes might need to be updated, thus the svg element needs to be refreshed.
                    curateSvg();
                    
                }; // if    
              
            }; // if

                    
                    
            function curateSvg(){
                
                // Also try to resize the plot to fit the data nicer.
                // d3.select(element.parentNode.parentNode).attr("class", "col-md-" + d3LineSeriesRrd.layout.colWidth);
                // For some reason this causes a bug which leaves redundant plots in the plot rows.
                
                var svgWidth = container.node().offsetWidth - d3LineSeriesRrd.margin.left;
                var svgHeight = d3LineSeriesRrd.layout.height;

                var width = svgWidth - d3LineSeriesRrd.margin.left - d3LineSeriesRrd.margin.right;
                var height = svgHeight - d3LineSeriesRrd.margin.top - d3LineSeriesRrd.margin.bottom;
                
				
                // Curating the svg.                
                container.select("svg")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight)
                    .attr("plotWidth", width)
                    .attr("plotHeight", height)
					
                    
                var plotArea = container.select("svg").select(".plotArea");
                if(plotArea.empty()){
                    // If there's none, add it.
                    container.select("svg")
                        .append("g")
                          .attr("transform", "translate(" + d3LineSeriesRrd.margin.left + "," + d3LineSeriesRrd.margin.top + ")")
                          .attr("class", "plotArea");
                    
                }; // if
                
                // The same with the clip path for zooming.
				var p = d3.select(container.node().parentElement.parentElement)
                var clipId = "clip-"+p.attr("plot-row-index")+"-"+p.attr("plot-index");
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
            
			function assignDefaultInteractiveValues(){
				
				// Select some default height and option to initialise the plot.
				var defaultSeries = data.series[0]
				svg.attr( 'selectedOption', defaultSeries.heights[0] )
				svg.attr( 'selectedVariable', Object.getOwnPropertyNames( defaultSeries[ defaultSeries.heights[0] ] )[0] )
				
			} // assignDefaultInteractiveValues
			
        }, // setupSvg
        
        addInteractivity : {
            
            addTooltip: function addTooltip(svg){
              
                // This controls al the tooltip functionality.
              
                var lines = svg.selectAll("path.line");
              
                lines.on("mouseover", tipOn)
                     .on("mouseout", tipOff);
              
              
                // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
                var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .offset([-12, 0])
                    .html(function (d) {
                        return "<span>" + [d.taskId, svg.attr("selectedOption"), svg.attr("selectedVariable")].join(' ') + "</span>";
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
					
					crossPlotHighlighting.on(d, "d3LineSeriesRrd")
					
                }; // tipOn

                function tipOff(d) {
                    lines.style("opacity", 1.0);
                    d3.select(this)
                        .style( "stroke-width", "2.5px" );
                    
                    tip.hide();
					
					crossPlotHighlighting.off(d, "d3LineSeriesRrd")
					
                }; // tipOff
              
              
            }, // addTooltip
            
            addZooming: function addZooming(svg, data){
              
              
                var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
        
                svg.transition().call(zoom.transform, d3.zoomIdentity);
                svg.call(zoom);
                
                

                function zoomed() {
                    var t = d3.event.transform;
                  
					var optn = svg.attr("selectedOption")
					var variable = svg.attr("selectedVariable")
					
				  
                    // Get the domains:
                    var xRange = d3LineSeriesRrd.helpers.getDomain(data, optn, variable, "x");
                    var yRange = d3LineSeriesRrd.helpers.getDomain(data, optn, variable, "y");
                  
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
                       .attr( "d", function(d){return line( d[optn][variable] );} );

                        
                    
                }; // zoomed
              

              
            }, // addZooming
            
			addInteractiveYAxisControls: function addInteractiveYAxisControls(element, data, layout){
				
				
				var heights = data.series[0].heights
				var options = Object.getOwnPropertyNames( data.series[0][heights[0]] )
				
				
				var ctrlContainer = d3.select(element).select(".yAxisControlDiv")
				var s = ctrlContainer.select(".custom-select")
				if( s.empty() ){
					
					s = ctrlContainer
					  .append("select")
						.attr("class", "select-vertical custom-select")
					
					s.selectAll("option")
					  .data( options )
					  .enter()
					  .append("option")
					    .attr("value", function(d){return d})
						.html(function(d){return d})
					
					
					ctrlContainer
					  .append("text")
						.text( s.node().value )
						.attr("class","txt-vertical")
					
					
					s.on("change", function(){
						d3.select(this.parentElement).select(".txt-vertical").text( this.value )
						d3.select(element).select("svg").attr("selectedVariable", this.value)
						
						d3LineSeriesRrd.update(element, data, layout)
					})
				
				} // if
				
				
				// Also add the heights button
				var h = ctrlContainer.select(".dropup")
				if( h.empty() ){
					
					h = ctrlContainer
					  .append("div")
					    .attr("class", "dropup")
						.attr("style", "position:absolute; bottom:0; left:0")
					
					h.append("button")
					    .attr("class", "btn")
						.attr("data-toggle","dropdown")
						.html("H")
					
					var m = h.append("ul")
					    .attr("class", "dropdown-menu")
					
					m.selectAll("a")
					  .data( heights )
					  .enter()
					  .append("a")
					    .attr("class", "dropdown-item")
						.html(function(d){return d;})
						
					m.selectAll(".dropdown-item").on("click", function(){
						
						d3.select(element).select("svg").attr("selectedOption", this.__data__)
						
						d3LineSeriesRrd.update(element, data, layout)
					
					})	
					
					
				} // if
				
				
			}, // addInteractiveYAxisControls
			
			updatePlotTitleControls: function updatePlotTitleControls(element){
				
				// Remove any controls in the plot title.
				plotHelpers.removePlotTitleControls(element)
				
				
			} // updatePlotTitleControls
			
			
			
        }, // addInteractivity
        
        helpers: {
            
            getDomain: function getDomain(data, optn, variable, axis){
                
                // d3.min and .max operate on arrays, not on objects. The 'line' is an array of objects, and therefor an accessor function is required.
				var options = data.series[0].heights
				var line = data.series[0][options[0]][variable]
                var minVal = d3.min( line, accessor );
                var maxVal = d3.max( line, accessor );
                
                for (var n = 1; n < data.series.length; ++n) {
					
						var line = data.series[n][optn][variable]
						
						var minVal_ =  d3.min( line, accessor );
							minVal = ( minVal_ < minVal ) ? minVal_ : minVal;
						
						var maxVal_ =  d3.max( line, accessor );
							maxVal = ( maxVal_ > maxVal ) ? maxVal_ : maxVal;
					
                }; // for
				
				// Add some padding.
				var valDiff = maxVal - minVal
				minVal = Number(minVal) - 0.1*valDiff
				maxVal = Number(maxVal) + 0.1*valDiff
                
                return [minVal, maxVal]
				
				function accessor(d){
					return Number( d[axis] )
				} // accessor
				
                
            } // getDomain
            
            
            
        } // helpers
        
    } // d3LineSeriesRrd


export { d3LineSeriesRrd };