import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { plotHelpers } from '../plot/plotHelpers.js';

const cfD3Histogram = {
          
        name: "cfD3Histogram",
        
        make: function make(ctrl) {
			
			
         
            // Update the controls as required
			// MISSING FOR NOW. IN THE END PLOTHELPERS SHOULD HAVE A VERTEILER FUNCTION
			// cfD3Histogram.addInteractivity.updatePlotTitleControls(element)
          
            // Setup the object that will internally handle all parts of the chart.
			plotHelpers.setupPlot.general.setupPlotBackbone(ctrl)
			plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl)
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			
			// cfD3Histogram.setupPlot.appendHorizonalSelection(ctrl.figure.select(".bottomAxisControlGroup"), ctrl)
			var i= cfD3Histogram.addInteractivity.onSelectChange
			plotHelpers.setupPlot.general.appendHorizontalSelection(ctrl.figure.select(".bottomAxisControlGroup"), i.horizontal(ctrl))
			plotHelpers.setupPlot.general.updateHorizontalSelection(ctrl)
			
			
			cfD3Histogram.setupPlot.setupPlotTools(ctrl)
			
			
			cfD3Histogram.addInteractivity.addBrush.make(ctrl)
			cfD3Histogram.addInteractivity.addBinNumberControls.make(ctrl)
			
			
			
			cfD3Histogram.update(ctrl)
          
        },
        
        update: function update(ctrl) {
		
			
			
			
			// An idea was to introduce numbers onto the bars for increased readability. However, how should these numbers behave in case teh bins get very narrow? In that case the y axis will be required again.
			// For now the y-axis has been left on.
            
            
            var x = ctrl.tools.xscale
			var y = ctrl.tools.yscale
            var g = ctrl.figure.select("svg.plotArea").select("g.data")
			
			var items = dbsliceData.data.dataDims[0].top(Infinity);
			var bins = ctrl.tools.histogram(items)
			

            // Handle entering/updating/removing the bars.
            var bars = g.selectAll("rect").data(bins);
        
			
				
				
			// Finally append any new bars with 0 height, and then transition them to the appropriate height
			var newBars = bars.enter()
			newBars
              .append("rect")
                .attr("transform", startState)
                .attr("x", 1)
                .attr("width",  calculateWidth )
                .attr("height", 0)
                .style("fill", "cornflowerblue")
                .attr("opacity", 1)
			  .transition()
			    .delay( ctrl.view.transitions.enterDelay )
				.duration( ctrl.view.transitions.duration )
				.attr("height", calculateHeight)
                .attr("transform", finishState)
              
			// Now move the existing bars.
            bars
			  .transition()
			    .delay( ctrl.view.transitions.updateDelay )
			    .duration( ctrl.view.transitions.duration )
                .attr("transform", finishState)
                .attr("x", 1)
                .attr("width", calculateWidth )
                .attr("height", calculateHeight);
			  
			// Remove any unnecessary bars by reducing their height to 0 and then removing them.
            bars.exit()
			  .transition()
			    .duration( ctrl.view.transitions.duration )
				.attr("transform", startState)
				.attr("height", 0)
				.remove();
            
		
			// Make some axes
			cfD3Histogram.helpers.createAxes(ctrl)
		
			// Add on the tooltips.
			cfD3Histogram.addInteractivity.addMarkerTooltip(ctrl)
		
			function calculateHeight(d_){
				return g.attr("height") - y(d_.length)
			} // calculateHeight
		
			function calculateWidth(d_){
				var width = x(d_.x1) - x(d_.x0) - 1;
				width = width < 1 ? 1 : width
				return width	
			} // calculateWidth
			
			function startState(d){
				return makeTranslate(x(d.x0), g.attr("height"))
			} // startState
			
			function finishState(d){
				return makeTranslate(x(d.x0), y(d.length))
			} // finishState
		
			function makeTranslate(x,y){
				return "translate("+[x, y].join()+")"
			} // makeTranslate	
        
        }, // update
        
		rescale: function rescale(ctrl){
			// What should happen if the window is resized?
			// 1.) The svg should be resized appropriately
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// 2.) The plot tools need to be updated
			cfD3Histogram.setupPlot.setupPlotTools(ctrl)
			
			// 3.) The plot needs to be redrawn
			cfD3Histogram.update(ctrl)
			
			// UPDATE THE SELECT RECTANGLE TOO!!
			cfD3Histogram.addInteractivity.addBrush.updateBrush(ctrl)
			
		}, // rescale
		
        setupPlot: {
            
			setupPlotTools: function setupPlotTools(ctrl){
				// Desired properties for the bin widths:
				//   1.) Constant bin width
				//   2.) "nice" bin thresholds
				  
				//   Constant bin widths are achieved by specifying the ticks to be created via 'd3.ticks'. This also results in nice bin thresholds. Using '.nice()' is expected to round the domain limits to values that naturally coincide with the values created by 'd3.ticks'*.
				  
				//   The function requires the number of ticks to be created to be specified by the user. 'd3.thresholdSturges' computes a 'sensible' number of bins.
				  
				//   * This is potentially error prone as d3.ticks will not always return the number of ticks requested, but will instead try to find 'sesnible bins instead. This will need to be reworked if the number of bins is to be changeable...
				//  */
			
				// Get the values on which the calculation is performed
				var items = dbsliceData.data.cf.all()
				var g = ctrl.figure.select("svg.plotArea").select("g.data")
				var width = g.attr("width")
				var height = g.attr("height")
				function xAccessor(d){return d[ctrl.view.xVarOption.val]}
				
				// Create the domains and ranges that can be. The y domain is dependent on the binning of the data. Therefore it can only be specified after the histogram data has been created.
				var xDomain = [ d3.min( items, xAccessor),
						        d3.max( items, xAccessor) ]
				var xRange = [0, width]
				var yRange = [height, 0]
				
				
				
				// Create the xscale to be used to calculate both the y domain, as well as to facilitate the plotting.
				var x = d3.scaleLinear()
				  .domain( xDomain )
				  .range( xRange )
				  .nice()
				

				// Create the histogram data. Note that the bin number will likely be altered by 'd3.ticks'...
				var nBins = ctrl.view.nBins
				if( nBins == undefined ){
					var values = []
					items.forEach(function(d){ values.push( xAccessor(d) ) })
					nBins = d3.thresholdSturges(values)
				} // if
				
				
				// Calculate the thresholds by hand. Use the nice x domain as a starting point. D3.histogram insists on adding an additional bin that spans from 'maxVal' to the end of the domain, therefore remove the last value in the manually created thresholds.
				var maxVal = d3.max(x.domain())
				var minVal = d3.min(x.domain())
				var t = d3.range(minVal, maxVal, (maxVal - minVal)/nBins )
				// t.splice(t.length-1, 1)
				
				// If the minVal and maxVal are the same the d3.<calculateBinNumber> methods will still come up with a number of bins, as it only depends on the number of observations. In that case t will be empty, and the histogram will have no items displayed. Should the desired behavior be different?
				
				// Due to the imprecision of storing values with repeated decimal patterns it can be that the last value is not included in the thresholds. This is a workaround.
				// if(t.indexOf(maxVal) == -1){ t.push(maxVal) }
				
				var histogram = d3.histogram()
				  .value(function(d){return d[ctrl.view.xVarOption.val]})
				  .domain( x.domain() )
				  .thresholds( t );
			  
				var bins = histogram( items );
				
				
				
				// Create the corresponding y scale. 
				// NOTE: It might be required that this becomes a reactive scale, in which case it will need to be updated when brushing.
				var yDomain = [0, d3.max( bins, function (d){return d.length;} )]
				var y = d3.scaleLinear()
					.domain( yDomain )
					.range( yRange );
					
					
				// Assign the objects required for plotting and saving hte plot.
				ctrl.tools.xscale = x
				ctrl.tools.yscale = y
				ctrl.tools.histogram = histogram
				
				// nBins is saved instead of the actual bins, as those are expected to change with the movements of the brush.
				ctrl.view.nBins = nBins
				ctrl.view.thresholds = t
				
			
			} // setupPlotTools
			
		}, // setupPlot
		     
        addInteractivity: {
		
			onSelectChange: {
				
				horizontal: function horizontal(ctrl){
					// Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
					return function(){
					
						var selectedVar = this.value
					
						// Update the y-variable for the plot, and re-intialise the number of bins.
						ctrl.view.xVarOption.val = selectedVar
						ctrl.view.nBins = undefined
						
						// Redo the plot tools
						cfD3Histogram.setupPlot.setupPlotTools(ctrl)
						
						// Update any bin controls.
						cfD3Histogram.addInteractivity.addBinNumberControls.updateMarkers(ctrl)

						ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated()

						// Update the graphics
						cfD3Histogram.update(ctrl)
						
						
						
					} // return
				}, // vertical
			}, // onSelectChange
		
			addMarkerTooltip: function addMarkerTooltip(ctrl){
                  
                // Firs remove any already existing tooltips.
				d3.selectAll(".d3-tip[type='bin']").remove()
                var svg = ctrl.figure
				  .select("svg.plotArea")
				  
                var markers = svg
				  .select("g.markup")
				  .select("g.binControls")
				  .selectAll("polygon")
                  
                markers.on("mouseover", tipOn)
                       .on("mouseout", tipOff);
                  
				// Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
                var tip = d3.tip()
						  .attr('class', 'd3-tip')
						  .attr('type', 'bin')
						  .offset([10, 0])
						  .direction("s")
						  .html(function (d) {
							  return "<span>" + "x: "+ d3.format("r")( d ) + "</span>";
						}) // tip
                  
                
                svg.call( tip );
                      
                      
                function tipOn(d) {
                    tip.show(d);
                }; // tipOn

                function tipOff(d) {
                    tip.hide();
                }; // tipOff
                  
                  
            }, // addMarkerTooltip
			
			addBrush: { 
			
				make: function make(ctrl){
				
					var h = cfD3Histogram.addInteractivity.addBrush
				
					// The hardcoded values need to be declared upfront, and abstracted.
					var svg = ctrl.figure.select("svg.plotArea")
					
					// Get the scale. All properties requried are in the svg.
					var x = ctrl.tools.xscale
					
					
					// There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again
					// Why is there no brush here on redraw??
					var brush = svg.select(".brush")
					if(brush.empty()){
						
						brush = svg.select("g.markup")
						  .append("g")
							.attr("class","brush")
							.attr("xDomMin", x.domain()[0] )
							.attr("xDomMax", x.domain()[1] )
							
							
						var xMin = x.domain()[0]
						var xMax = x.domain()[1]
						
						// Initialise the filter if it isn't already.
						var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val)
						var filter = dbsliceData.data.histogramSelectedRanges[dimId]
						if(filter !== undefined){
							xMin = filter[0]
							xMax = filter[1]
						} else {
							dbsliceData.data.histogramSelectedRanges[dimId] = [xMin, xMax]
						} // if
						
					} else {
						// Setup th efilter bounds in the cfInit??
						var filter = dbsliceData.data.histogramSelectedRanges[dimId]
						var xMin = filter[0]
						var xMax = filter[1]
						
						
						brush.selectAll("*").remove();
						
					}// if
					

					var height = svg.select("g.data").attr("height")
					var rect = brush
					  .append("rect")
						.attr("class", "selection")
						.attr("cursor", "move")
						.attr("width", x(xMax) - x(xMin))
						.attr("height", height)
						.attr("x", x(xMin))
						.attr("y", 0)
						.attr("opacity", 0.2)
						.attr("xMin", xMin)
						.attr("xMax", xMax)
						
					
					// Make the rect draggable
					rect.call( d3.drag().on("drag", function(){ h.dragmove(this, ctrl) }  ) )
					
					
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
						.call( d3.drag().on("drag", function(){ h.dragsize(this, ctrl) }) )
					brush
					  .append("rect")
						.attr("class", "handle handle--w")
						.attr("cursor", "ew-resize")
						.attr("x", Number(rect.attr("x")) - 10)
						.attr("y", Number(rect.attr("y")) + Number(rect.attr("height"))/4 )
						.attr("width", 10)
						.attr("height", Number(rect.attr("height"))/2)
						.attr("opacity", 0)
						.call( d3.drag().on("drag", function(){ h.dragsize(this, ctrl) }) )
					

					// Decorative handles.
					var handleData = h.assembleHandleData(rect)
					
					
					brush.selectAll("path").data(handleData).enter()
					  .append("path")
						.attr("d", h.drawHandle )
						.attr("stroke", "#000")
						.attr("fill", "none")
						.attr("class", function(d){ return "handle handle--decoration-" + d.side})
					
				}, // make
					
				drawHandle: function drawHandle(d){
					// Figure out if the west or east handle is needed.
					var flipConcave = d.side == "e"? 1:0
					var flipDir = d.side == "e"? 1:-1
					
					var lambda = 30/300
					var r = lambda*d.height
					r = r > 10 ? 10 : r
					
					var start = "M" + d.x0[0] + " " + d.x0[1]
					var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir*r, r].join(" ")
					var leftLine = "h0 v" + (d.height - 2*r)
					var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir*r, r].join(" ")
					var closure = "Z"
					var innerLine = "M" + [d.x0[0] + flipDir*r/2, d.x0[1] + r].join(" ") + leftLine
					
					return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ")
					
				},// drawHandle
					
				dragmove: function dragmove(rectDOM, ctrl){
					
					var h = cfD3Histogram.addInteractivity.addBrush
					var x = ctrl.tools.xscale
					
					var rect = d3.select(rectDOM)
					var brush = d3.select(rectDOM.parentNode)

					
					// Update teh position of the left edge by the difference of the pointers movement.
					var oldWest = Number(rect.attr("x"))
					var oldEast = Number(rect.attr("x")) + Number(rect.attr("width"))
					var newWest = oldWest + d3.event.dx; 
					var newEast = oldEast + d3.event.dx;
					
					// Check to make sure the boundaries are within the axis limits.
					if (x.invert(newWest) <  d3.min(x.domain()) ){
						newWest = d3.min(x.range())
					} else if (x.invert(newEast) >  d3.max(x.domain()) ){
						newEast = d3.max(x.range())
					} // if
					
					
					// Update the xMin and xMax values.
					rect.attr("xMin", x.invert(newWest))
					rect.attr("xMax", x.invert(newEast))
					
					
					// Update the selection rect.
					h.updateBrush(ctrl);
					
					// Update the data selection
					h.updateSelection(ctrl)
					
					// Setup the appropriate transition
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
					
					// Rerender to allow other elements to respond.
					render()
					
					
				}, // dragmove
				
				dragsize: function dragsize(handleDOM, ctrl){
					// Update teh position of the left edge by the difference of the pointers movement.
					var h = cfD3Histogram.addInteractivity.addBrush
					var x = ctrl.tools.xscale
					
					var handle = d3.select(handleDOM)
					var brush = d3.select(handleDOM.parentNode)
					var rect = brush.select("rect.selection")
					
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
					if (x.invert(newWest) <  d3.min(x.domain()) ){
						newWest = d3.min(x.range())
					} else if (x.invert(newEast) >  d3.max(x.domain()) ){
						newEast = d3.max(x.range())
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
					h.updateBrush(ctrl);
					
					
					// Update the data selection
					h.updateSelection(ctrl)
					
					// Setup the appropriate transition
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
					
					// Rerender to allow other elements to respond.
					render()
					
				}, // dragsize
				
				updateSelection: function updateSelection(ctrl){
					
					var x = ctrl.tools.xscale
					var rect = ctrl.figure.select("svg.plotArea").select(".selection")
					var lowerBound = Number(rect.attr("x"))
					var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"))
					
					var selectedRange = [x.invert(lowerBound), x.invert(upperBound)]
					
					var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val)
					dbsliceData.data.histogramSelectedRanges[ dimId ] = selectedRange;
					
					// Update the filter
					cfUpdateFilters( dbsliceData.data );
					
				}, // updateSelection
				
				updateBrush: function updateBrush(ctrl){
				
					var h = cfD3Histogram.addInteractivity.addBrush
					
					// First get the scale
					var svg = ctrl.figure.select("svg.plotArea")
					var rect = svg.select(".selection")
					var x = ctrl.tools.xscale
					
					// Now get the values that are supposed to be selected.
					var xMin = Number(rect.attr("xMin"))
					var xMax = Number(rect.attr("xMax"))
					
					
					// Update teh rect.
					rect
					  .attr("x", x(xMin))
					  .attr("width", x(xMax) - x(xMin))
					
					// Update the handles				
					svg.select(".brush").select(".handle--e").attr("x", x(xMax))
					svg.select(".brush").select(".handle--w").attr("x", x(xMin) - 10)
					
					
					// Update the handle decorations
					var handleData = h.assembleHandleData(rect)
					svg.select(".brush").select(".handle--decoration-e")
					  .attr("d", h.drawHandle(handleData[0]))
					svg.select(".brush").select(".handle--decoration-w")
					  .attr("d", h.drawHandle(handleData[1]))
					  
				}, // updateBrush
				
				assembleHandleData: function assembleHandleData(rect){
				
					var height = Number(rect.attr("height"))
					var width = Number(rect.attr("width"))
				
					var xWest = Number(rect.attr("x"))
					var yWest = Number(rect.attr("y")) + height/4
				
					var xEast = xWest + width
					var yEast = yWest
					
					return [{x0: [xEast, yEast],
						     height: height/2, 
							 side: "e"}, 
						    {x0: [xWest, yWest],
						     height: height/2, 
						     side: "w"}]
				
				} // assembleHandleData
			}, // addBrush
			
			addBinNumberControls: {
			
				make: function make(ctrl){
				
					// GENERALISE THE GROUP TRANSFORM!!
					var h = cfD3Histogram.addInteractivity.addBinNumberControls
					var svg = ctrl.figure.select("svg.plotArea")
					var height = svg.select("g.data").attr("height")
				
					// Add in the markers
					var g = svg.select("g.markup").select("g.binControls")
					if(g.empty()){
						// this g already has a transform added to it (the y-axes translate). Therefore only the height needs to be corrected in order for the markers to be located at the x axis.
						g = svg.select("g.markup")
						  .append("g")
							.attr("class","binControls")
							.attr("transform", "translate(0," + height + ")")
					} // if
					 
						  
					// Add in the controls.
					h.updateMarkers(ctrl)
				

					
					// Add interactivity to the axis
					
	
					// Initialise the behaviour monitors
					var downx = Math.NaN
					var dx = Math.NaN
					svg.select("g.binControls")
					    .on("mousedown", function(d) {
							downx = d3.event.x
							dx = 0
					 }) // on
					  
					
					  
					// attach the mousemove and mouseup to the body
					// in case one wonders off the axis line
					svg
					    .on("mousemove", function(d) {
					    
							// Check if the update of bin numbers has been appropriately initiated.
							if (!isNaN(downx)) {
							
								// Update the distance moved.
							    dx = d3.event.x - downx
								
								
							    if (Math.abs(dx) > 20) {
								    // rebase the dx by changing downx, otherwise a new bin is added for every pixel movement above 20, wheteher positive or negative.
									downx = d3.event.x
									
									// Only the bin number depends on the dx, and it does so because the number of bins can be increased or decreased
									h.updateBinNumber(ctrl, dx)

									// Update the plot
									h.update(ctrl)
									
							    } // if
							} // if
					    })
					    .on("mouseup", function(d) {
						    downx = Math.NaN
						    dx = Math.NaN
					    });
						
						
						
						
						
					  
					  				
				}, // make
			
				update: function update(ctrl){
				
					var h = cfD3Histogram.addInteractivity.addBinNumberControls
					
					
									
					// First update the plotting tools.
					cfD3Histogram.setupPlot.setupPlotTools(ctrl)
									
					// Update the markers
					h.updateMarkers(ctrl)
					
					// Update transition times
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated()
					
					// Update the chart graphics.
					cfD3Histogram.update(ctrl)
				
				
				}, // update
				
				
				updateBinNumber: function updateBinNumber(ctrl, dx){
							
					// Change the number of bins, and redo the plotting tools. Note that if the number of bins is 1 the bin should not be removed.
					
					// Control the direction of the behavior.
					var sign = dx > 0? -1 : 1
					
					// Update the bin number
					ctrl.view.nBins = ctrl.view.nBins + 1*sign
					
					// Impose minimum number of bins as 1
					if(ctrl.view.nBins < 1){ ctrl.view.nBins = 1 }
				
				}, // updateBinNumber

				updateMarkers: function updateMarkers(ctrl){
					// Update the bin control markers. The white markers do not interfere with the axis ticks as those are added later in the main update method.
					var markers = ctrl.figure
					  .select("svg.plotArea")
					  .select("g.markup")
					  .select("g.binControls")
					  .selectAll("polygon")
							
					markers
					  .data(ctrl.view.thresholds)
					  .enter()
						.append("polygon")
						  .attr("points", "0,0 10,12, -10,12")
						  .attr("transform", makeTranslate)
						  .attr("style","fill:white;cursor:ew-resize")
						  
						  
					markers
						.transition()
						.duration( ctrl.view.transitions.duration )
						.attr("transform", makeTranslate)
						
					markers.exit().remove()
					
					function makeTranslate(d){
						return "translate("+ctrl.tools.xscale(d)+",1)"
					} // makeTRanslate
				
				}, // updateMarkers
					

				
			}, // addBinNumberControls
			
			updatePlotTitleControls: function updatePlotTitleControls(element){
				
				plotHelpers.removePlotTitleControls(element)
				
			} // updatePlotTitleControls
			
		}, // setupInteractivity
		
		helpers: {
			
			createAxes: function createAxes(ctrl){
				
				var svg = ctrl.figure.select("svg.plotArea")

				svg
				  .select("g.axis--x")
				  .call( d3.axisBottom(ctrl.tools.xscale) );
				
				
				/*
				var xLabelD3 = ctrl.svg.select("g.axis--x").selectAll("text.xAxisLabel")
				
				xLabelD3.data( [ctrl.view.xVar] ).enter()
					.append("text")
					  .attr("class", "xAxisLabel")
					  .attr("fill", "#000")
					  .attr("x", ctrl.svg.attr("plotWidth"))
					  .attr("y", 30)
					  .attr("text-anchor", "end")
					  .style("font-weight", "bold")
					  .text(function(d){return d});
				  
				xLabelD3.text(function(d){return d});
				*/
				
				// Y AXIS
				
				// Find the desirable tick locations - integers.
				var yAxisTicks = ctrl.tools.yscale.ticks()
					.filter(function(d){ return Number.isInteger(d) });
					
				svg
				  .select("g.axis--y")
				  .transition()
				  .duration( ctrl.view.transitions.duration )
				  .call( 
					d3.axisLeft(ctrl.tools.yscale)
					  .tickValues(yAxisTicks)
					  .tickFormat(d3.format("d")) 
				);
			
				var yLabelD3 = svg.select("g.axis--y").selectAll("text.yAxisLabel")
				
				yLabelD3.data( ["Number of tasks"] ).enter()
					.append("text")
					  .attr("class", "yAxisLabel")
					  .attr("fill", "#000")
					  .attr("transform", "rotate(-90)")
					  .attr("x", 0)
					  .attr("y", -25)
					  .attr("text-anchor", "end")
					  .style("font-weight", "bold")
					  .style("font-size", 12)
					  .text(function(d){return d});
				  
				yLabelD3.text(function(d){return d});

				

			}, // createAxes
			
			transitions: {
				instantaneous: function instantaneous(){
				
					return {
						duration: 500,
						updateDelay: 0,
						enterDelay: 0
					}
				
				}, // instantaneous
				
				animated: function animated(){
				
					return {
						duration: 500,
						updateDelay: 500,
						enterDelay: 1000
					}
				
				} // animated
			}, // transitions
		
			
			// Initialisation
			createDefaultControl: function createDefaultControl(){
				
				
				var ctrl = {
					plotFunc: cfD3Histogram,
					figure: undefined,
					svg: undefined,
					view: {xVarOption: undefined,
						   nBins: undefined,
						   transitions: {
								duration: 500,
								updateDelay: 0,
								enterDelay: 0
							  }
						   },
					tools: {xscale: undefined,
							yscale: undefined,
							histogram: undefined},
					format: {
						title: "Edit title",
						colWidth: 4,
						width: undefined,
						height: 400,
						margin: {top: 10, right: 0, bottom: 30, left: 0},
						axesMargin: {top: 20, right: 20, bottom: 16, left: 45}
					}
				} // ctrl
				
				var options = dbsliceData.data.dataProperties
				ctrl.view.xVarOption = {name: "varName",
					                     val: options[0],
								     options: options}
				
				return ctrl
				
				
			}, // createDefaultControl
			
			createLoadedControl: function createLoadedControl(plotData){
			
				var ctrl = cfD3Histogram.helpers.createDefaultControl()
				
				// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
				if(plotData.xProperty != undefined){
					if( dbsliceData.data.dataProperties.includes(plotData.xProperty) ){
						ctrl.view.xVarOption.val = plotData.xProperty
					} // if						
				} // if				
											
				return ctrl
				
				
			}, // createLoadedControl
			
			writeControl: function writeControl(ctrl){
				
				var s = ""
				s = s + '{';
				s = s + '"type": "' + ctrl.plotFunc.name + '", ';
				s = s + '"title": "' + ctrl.format.title + '"';
				  
				  
				// For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
				// Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.
				  
				var xProperty = accessProperty( ctrl.view.xVarOption, "val" )
				
				  
				s = s + writeOptionalVal("xProperty", xProperty)
				
				s = s + '}';
				
				return s
				
				function writeOptionalVal(name, val){
					var s_ = ""
					if (val !== undefined) {
					  s_ = s_ + ', ';
					  s_ = s_ + '"' + name + '": "' + val + '"';
					} // if
					return s_
					
				} // writeOptionalVal
				
				function accessProperty(o,p){
					// When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
					// This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
					return o==undefined? undefined : o[p]
				} // accessProperty
				
			}, // writeControl
			
			// Functions for cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("rect")
					.style("opacity", 0.2)
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, d){
				// NOTE THAT THE TRANSITION EFFECTS CAUSE SLIGHT BUGS - THE MARKERS ARE CREATED BEFORE THE TRANSITION COMPLETES!
					
				// Find within which bar the point falls.
				var property = ctrl.view.xVarOption.val;
				var bars = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("rect");
				 
				
				bars.each(function(barData, barInd){
					// d3 connects each of the bars with its data! here 'barData' is an array containing all the data points relating to it, as well as the range of values it represents.
					
					// Pick the corresponding marker.
					var marker = ctrl.figure
								  .select("svg.plotArea")
								  .select("g.markup")
								  .selectAll('.tempMarker[ind="'+barInd+'"]');
					
					// If there is any data connected to this bar check if it needs to be highlighted.
					for(var i=0; i < barData.length; i++){
						
						// Check if the datapoint with the taskId is in this array. In this case check with a for loop (as opposed to forEach), as otherwise the x0 and x1 properties are interpreted as array elements too.
						if(d.taskId == barData[i].taskId){
							
							// Find the height corresponding to 1 task.
							var h = this.height.baseVal.value/barData.length;
							
							
							// Get the marker rectangle, and update its attributes.
							if(marker.empty()){
								// There is none, so append one.
								var n = 1;
								
								marker = ctrl.figure
								  .select("svg.plotArea")
								  .select("g.markup")
								    .append("rect")
									  .attr("class", "tempMarker")
									  .attr("height", n*h)
									  .attr("transform", getTranslate(this, n, h))
									  .attr("n", n)
									  .attr("ind", barInd)
									  .attr("width", this.width.baseVal.value)
									  .attr("opacity", 1)
									  .style("fill","cornflowerblue")
								
							} else {
								// Add to the height.
								var n = Number(marker.attr("n")) + 1;
								
								marker
									.attr("height", n*h)
									.attr("transform", getTranslate(this, n, h))
									.attr("n", n)
								
							} // if
							
						}; // if
						
					}; //if
					
					function getTranslate(barDOM, n, h){
						
						var plotHeight = d3.select(barDOM.parentElement.parentElement)
						.select("g.data").attr("height");
						
						var leftEdgeX = barDOM.transform.baseVal[0].matrix.e + 1;
						var topEdgeY = plotHeight - n*h;
						var t = "translate(" + leftEdgeX + "," + topEdgeY + ")";
					  return t;
					} // getTranslate
					
				}); // each
				
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
				// Find within which bar the point falls.
				ctrl.figure.selectAll(".tempMarker").remove()
				
				// Set opacity to the histogram bars.
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("rect")
				    .style("opacity", 1)
					
				// Rehighlight any manually selected tasks.
				crossPlotHighlighting.manuallySelectedTasks()
				
			}, // defaultStyle
			
		} // helpers
		
    }; // cfD3Histogram


export { cfD3Histogram };