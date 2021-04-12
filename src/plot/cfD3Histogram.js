import {dbsliceData} from "../core/dbsliceData.js"
import {builder} from "../core/builder.js"
import {color} from "../core/color.js"
import {plotHelpers} from "./plotHelpers.js"
import {sessionManager} from "../core/sessionManager.js"
import {crossPlotHighlighting} from "../core/crossPlotHighlighting.js";
import {filter} from "../core/filter.js";

export var cfD3Histogram = {
          
        name: "cfD3Histogram",
        
        make: function make(ctrl) {
			
          
            // Setup the object that will internally handle all parts of the chart.
			plotHelpers.setupPlot.general.setupPlotBackbone(ctrl)
			plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl)
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .append("g")
				    .attr("class", "extent")
			
			
			var i= cfD3Histogram.interactivity.onSelectChange
			plotHelpers.setupPlot.general.appendHorizontalSelection(ctrl.figure, i.horizontal(ctrl))
			plotHelpers.setupPlot.general.updateHorizontalSelection(ctrl)
			
			
			cfD3Histogram.setupPlot.setupPlotTools(ctrl)
			
			
			cfD3Histogram.interactivity.addBrush.make(ctrl)
			cfD3Histogram.interactivity.addBinNumberControls.make(ctrl)
			
			// Add the y label to the y axis.
			cfD3Histogram.helpers.axes.addYLabel(ctrl)
			
			cfD3Histogram.update(ctrl)
          
        },
        
        update: function update(ctrl) {
		
			// Create some common handles.
			var h = cfD3Histogram.draw
			
			
			// Check if the data should be regrouped, or if an update to the existing state is required. This check should be performed here, as a need to regroup might come from outside (by changing the color variable).
			if(h.isRegroupNeeded(ctrl)){
				
				// Perform the regroup
				h.regroup(ctrl)
				
			} else {
				// Just update the view
				h.update(ctrl)
				
			} // if
		
			
        }, // update
		
		draw: {
			
			plotDataExtent: function plotDataExtent(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .select("g.extent")
				
				cfD3Histogram.draw.bars(ctrl, items, target, "black", 0.1)
				
			}, // plotDataExtent
			
			plotSelectionBackground: function plotSelectionBackground(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.background")
				
				cfD3Histogram.draw.bars(ctrl, items, target, "cornflowerblue", 0.5)
				
			}, // plotSelectionBackground
			
			plotCurrentSelection: function plotCurrentSelection(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				cfD3Histogram.draw.bars(ctrl, items, target, ctrl.tools.fill, 1)
				
			}, // plotCurrentSelection
			
			bars: function bars(ctrl, items, target, color, opacity){
				
				// Plotting
				var t = ctrl.view.transitions
				

				// Handle entering/updating/removing the bars.
				var bars = target
				  .selectAll("rect").data(items);
			
					
				// Finally append any new bars with 0 height, and then transition them to the appropriate height
				var newBars = bars.enter()
				newBars
				  .append("rect")
					.attr("transform", ctrl.tools.startState)
					.attr("x", 1)
					.attr("width",  ctrl.tools.width )
					.attr("height", 0)
					.style("fill", color)
					.attr("opacity", opacity)
				  .transition()
					.delay( t.enterDelay )
					.duration( t.duration )
					.attr("height", ctrl.tools.height)
					.attr("transform", ctrl.tools.finishState)
				  
				// Now move the existing bars.
				bars
				  .transition()
					.delay( t.updateDelay )
					.duration( t.duration )
					.attr("transform", ctrl.tools.finishState)
					.attr("x", 1)
					.attr("width", ctrl.tools.width )
					.attr("height", ctrl.tools.height);
				  
				// Remove any unnecessary bars by reducing their height to 0 and then removing them.
				bars.exit()
				  .transition()
					.duration( t.duration )
					.attr("transform", ctrl.tools.startState)
					.attr("height", 0)
					.remove();
				
			}, // bars
			
			isRegroupNeeded: function isRegroupNeeded(ctrl){
				
				var flag = ctrl.view.gVar != ctrl.view.xVarOption.val ||
			               ctrl.view.gClr != color.settings.val
				
				// Update the 'gVar' and 'gClr' flags for next draw.				
				ctrl.view.gVar = ctrl.view.xVarOption.val
			    ctrl.view.gClr = color.settings.val
				
				return flag
				
			}, // isRegroupNeeded
			
			regroup: function regroup(ctrl){
				// This function controls the retreat of the data to prepare for the redrawing using the new grouping of the data.
				
				
				var g = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				
				// Remove the rectangles, and when completed order a redraw.
				g.selectAll("rect")
					.transition()
					.duration(500)
					  .attr("transform", ctrl.tools.startState)
					  .attr("height", 0)
					.remove()
					.end()
					.then(function(){
						
						
						// Redo the plot tools
						cfD3Histogram.setupPlot.setupPlotTools(ctrl)
						
						// Update the brush limits.
						ctrl.figure
						  .select("svg.plotArea")
					      .select(".selection")
						  .attr("xMin", d3.min( ctrl.tools.xscale.domain() ))
						  .attr("xMax", d3.max( ctrl.tools.xscale.domain() ))
						cfD3Histogram.interactivity.addBrush.updateBrush(ctrl)
						
						// Update any bin controls.
						cfD3Histogram.interactivity.addBinNumberControls.updateMarkers(ctrl)
						
						// All elements were removed. Update teh chart.
						cfD3Histogram.draw.update(ctrl)
						
					}) // then
			
			
			}, // regroup
			
			update: function update(ctrl){
				
				var h = cfD3Histogram.helpers
				
				var unfilteredItems    = h.getUnfilteredItems(ctrl);
				var filterItems        = h.getFilteredItems(ctrl);
				var filterItemsGrouped = h.getFilteredItemsGrouped(ctrl);
				
				
				// Unfiltered data extent
				cfD3Histogram.draw.plotDataExtent(ctrl, unfilteredItems)
				
				// Current selection background
				cfD3Histogram.draw.plotSelectionBackground(ctrl, filterItems)
				
				// Handle the entering/updating/exiting of bars.
				cfD3Histogram.draw.plotCurrentSelection(ctrl, filterItemsGrouped)
				
				
				// Handle the axes.
				cfD3Histogram.helpers.axes.update(ctrl);
				
				
				
			} // update
			
			
		}, // draw
        
		rescale: function rescale(ctrl){
			// What should happen if the window is resized?
			// 1.) The svg should be resized appropriately
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// 2.) The plot tools need to be updated
			cfD3Histogram.setupPlot.setupPlotTools(ctrl)
			
			// 3.) The plot needs to be redrawn
			cfD3Histogram.update(ctrl)
			
			
			// Update the bin number controls.
			cfD3Histogram.interactivity.addBinNumberControls.updateMarkers(ctrl)
			
			// UPDATE THE SELECT RECTANGLE TOO!!
			cfD3Histogram.interactivity.addBrush.updateBrush(ctrl)
			
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
				var width = Number( g.attr("width") )
				var height = Number( g.attr("height") )
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
				
				
				
				
				
				ctrl.tools.height = function height(d){
					// Height 
					return ctrl.figure.select("svg.plotArea").select("g.data").attr("height") - ctrl.tools.yscale(d.members.length)
				} // height
				
				ctrl.tools.width =  function width(d){
					var width = ctrl.tools.xscale(d.x1) - ctrl.tools.xscale(d.x0) - 1;
					width = width < 1 ? 1 : width
					return width	
				} // width
				
				ctrl.tools.startState =  function startState(d){
					var x = ctrl.tools.xscale(d.x0)
					var y = ctrl.figure.select("svg.plotArea").select("g.data").attr("height")
					return "translate("+[x, y].join()+")"
				} // startState
					
				ctrl.tools.finishState =  function finishState(d){
					var x = ctrl.tools.xscale(d.x0)
					var y = ctrl.tools.yscale(d.members.length + d.x)
					return "translate("+[x, y].join()+")"
				} // finishState
					
				ctrl.tools.fill =  function fill(d){
					return color.get(d.cVal)
				} // fill
			
			
			} // setupPlotTools
			
		}, // setupPlot
		     
        interactivity: {
		
			onSelectChange: {
				
				horizontal: function horizontal(ctrl){
					// Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
					return function(){
					
						var selectedVar = this.value
					
						// Update the y-variable for the plot, and re-intialise the number of bins.
						ctrl.view.xVarOption.val = selectedVar
						ctrl.view.nBins = undefined
						
						// Update the filters. As the variable has changed perhaps the limits of the brush have as well.
						filter.apply()
						
						

						ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated()

						// Update the graphics. As the variable changed and the fitler is getting removed the other plots should be notified.
						sessionManager.render()
						
						
						
					} // return
				}, // vertical
			}, // onSelectChange
			
			addBrush: { 
			
				make: function make(ctrl){
				
					var h = cfD3Histogram.interactivity.addBrush
					var property = ctrl.view.xVarOption.val
				
					// The hardcoded values need to be declared upfront, and abstracted.
					var svg = ctrl.figure.select("svg.plotArea")
					
					// Get the scale. All properties requried are in the svg.
					var x = ctrl.tools.xscale
					
					
					// There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again
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
						
						
						var limits = dbsliceData.data.histogramSelectedRanges[property]
						if(limits !== undefined){
							xMin = limits[0]
							xMax = limits[1]
						} else {
							filter.addUpdateDataFilter(property, [xMin, xMax])
							
						} // if
						
					} else {
						// Setup the filter bounds in the cfInit??
						var limits = dbsliceData.data.histogramSelectedRanges[property]
						var xMin = limits[0]
						var xMax = limits[1]
						
						
						brush.selectAll("*").remove();
						
					}// if
					
					var width = x(xMax) - x(xMin)
					var height = Number( svg.select("g.data").attr("height") )
					var rect = brush
					  .append("rect")
						.attr("class", "selection")
						.attr("cursor", "move")
						.attr("width", width)
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


					brush.append("path")
						.attr("d", h.drawHandle(rect, "e") )
						.attr("stroke", "#000")
						.attr("fill", "none")
						.attr("class", "handle handle--decoration-e")
						
					brush.append("path")
						.attr("d", h.drawHandle(rect, "w") )
						.attr("stroke", "#000")
						.attr("fill", "none")
						.attr("class", "handle handle--decoration-w")
					
				}, // make
					
				drawHandle: function drawHandle(rect, side){
					// Figure out the dimensions.
					var height = Number(rect.attr("height"))
					var width = Number(rect.attr("width"))
				
					
					var xWest = Number(rect.attr("x"))
					var yWest = Number(rect.attr("y")) + height/4
					
					var x = side == "w" ? xWest : xWest + width
					var y = side == "w" ? yWest : yWest

					
					// Figure out if the west or east handle is needed.
					var flipConcave = side == "e"? 1:0
					var flipDir = side == "e"? 1:-1
					
					var lambda = 30/300
					var r = lambda*height/2
					r = r > 10 ? 10 : r
					
					var start = "M" + x + " " + y
					var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir*r, r].join(" ")
					var leftLine = "h0 v" + (height/2 - 2*r)
					var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir*r, r].join(" ")
					var closure = "Z"
					var innerLine = "M" + [x + flipDir*r/2, y + r].join(" ") + leftLine
					
					return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ")
					
				},// drawHandle
					
				dragmove: function dragmove(rectDOM, ctrl){
					
					// Setup the appropriate transition
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()

					
					var h = cfD3Histogram.interactivity.addBrush
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
					
					

					
				}, // dragmove
				
				dragsize: function dragsize(handleDOM, ctrl){
					
					// Setup the appropriate transition
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
					
					
					// Update teh position of the left edge by the difference of the pointers movement.
					var h = cfD3Histogram.interactivity.addBrush
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
					
					
					
					
				}, // dragsize
				
				updateSelection: function updateSelection(ctrl){
					
					var nTasks_ = dbsliceData.data.taskDim.top(Infinity).length
					var x = ctrl.tools.xscale
					var rect = ctrl.figure.select("svg.plotArea").select(".selection")
					var lowerBound = Number(rect.attr("x"))
					var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"))
					
					var selectedRange = [x.invert(lowerBound), x.invert(upperBound)]
					
					// Update the filter range
					filter.addUpdateDataFilter(ctrl.view.xVarOption.val, selectedRange)
					
					// Apply the appropriate filters to the crossfilter
					filter.apply();
					
					// Only update other plots if the number of elements in the filter has changed.
					var nTasks = dbsliceData.data.taskDim.top(Infinity).length
					if(nTasks_ != nTasks){
						sessionManager.render()
					} // if
					
				}, // updateSelection
				
				updateBrush: function updateBrush(ctrl){
				
					var h = cfD3Histogram.interactivity.addBrush
					
					// First get the scale
					var svg = ctrl.figure.select("svg.plotArea")
					var height = svg.select("g.data").attr("height")
					var rect = svg.select(".selection")
					var x = ctrl.tools.xscale
					
					// Now get the values that are supposed to be selected.
					var xMin = Number(rect.attr("xMin"))
					var xMax = Number(rect.attr("xMax"))
					
					
					// Update teh rect.
					rect
					  .attr("x", x(xMin))
					  .attr("width", x(xMax) - x(xMin))
					  .attr("height", height)
					
					// Update the handles				
					svg.select(".brush").select(".handle--e")
					  .attr("x", x(xMax))
					  .attr("y", height/4 )
					  .attr("height", height/2)
					svg.select(".brush").select(".handle--w")
					  .attr("x", x(xMin) - 10)
					  .attr("y", height/4 )
					  .attr("height", height/2)
					
					
					// Update the handle decorations
					svg.select(".brush").select(".handle--decoration-e")
					  .attr("d", h.drawHandle(rect, "e"))
					svg.select(".brush").select(".handle--decoration-w")
					  .attr("d", h.drawHandle(rect, "w"))
					  
				} // updateBrush
				
				
			}, // addBrush
			
			addBinNumberControls: {
			
				make: function make(ctrl){
				
					// GENERALISE THE GROUP TRANSFORM!!
					var h = cfD3Histogram.interactivity.addBinNumberControls
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
				
					var h = cfD3Histogram.interactivity.addBinNumberControls
					
					
									
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
					
					var svg = ctrl.figure
					  .select("svg.plotArea")
					var height = svg.select("g.data").attr("height")
				

					// Update the bin control markers. The white markers do not interfere with the axis ticks as those are added later in the main update method.
					var markers = svg.select("g.markup")
					  .select("g.binControls")
					    .attr("transform", "translate(0," + height + ")")
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
			
			refreshContainerSize: function refreshContainerSize(ctrl){
				
				var container = d3.select(ctrl.format.parent)
				
				builder.refreshPlotRowHeight( container )
				
			} // refreshContainerSize
			
		}, // setupInteractivity
		
		helpers: {
			
			axes: {
				
				update: function update(ctrl){
					
					cfD3Histogram.helpers.axes.formatAxesY(ctrl)
					cfD3Histogram.helpers.axes.formatAxesX(ctrl)
					
					
					
				}, // update
				
				formatAxesY: function formatAxesY(ctrl){
				
					var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.yscale)

					var gExponent = ctrl.figure.select(".axis--y")
						.selectAll("g.exponent")
							.select("text")
							  .attr("fill", format.fill)
							.select("tspan.exp")
							  .html(format.exp)
					  
					// The y axis shows a number of items, which is always an integer. However, integers in scientific notation can have decimal spaces. Therefore pick integers from the original scale, and then transform them into the new scale.
					var yAxisTicks = ctrl.tools.yscale.ticks()
					  .filter(d=>Number.isInteger(d) )
					  .map(d=>Number.isInteger(format.exp) ? d/10**format.exp : d )
					
						
					ctrl.figure.select(".axis--y").call( 
						d3.axisLeft( format.scale )
							.tickValues(yAxisTicks)
							.tickFormat(d3.format("d")) 
					)
							  
					
				}, // formatAxesY
				
				formatAxesX: function formatAxesX(ctrl){
			
					var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale)

					var gExponent = ctrl.figure.select(".axis--x")
						.selectAll("g.exponent")
						
					gExponent.select("tspan.exp")
					  .html(format.exp)
						  
					gExponent.select("text")
					  .attr("fill", format.fill)
						
						
					ctrl.figure.select(".axis--x").call( d3.axisBottom( format.scale ).ticks(5) )
						  
				
				}, // formatAxesY
				
				addYLabel: function addYLabel(ctrl){
					
					ctrl.figure
					  .select("g.axis--y")
					  .selectAll("text.yAxisLabel")
					  .data( ["Number of tasks"] ).enter()
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
					
				}, // addYLabel
				
			}, // axes
			
			createAxes: function createAxes(ctrl){
				
				var svg = ctrl.figure.select("svg.plotArea")

				svg
				  .select("g.axis--x")
				  .call( d3.axisBottom(ctrl.tools.xscale) );
				
				
				
				
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
						   gVar: undefined,
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
						margin: {top: 10, right: 0, bottom: 30, left: 0},
						axesMargin: {top: 20, right: 20, bottom: 16, left: 45},
						parent: undefined,
						position: {
							ix: 0,
							iy: 0,
							iw: 4,
							ih: 4,
							minH: 290,
							minW: 190
						}
					}
				} // ctrl
				
				var options = dbsliceData.data.ordinalProperties
				ctrl.view.xVarOption = {name: "varName",
					                     val: options[0],
								     options: options}
									 
				ctrl.view.gVar = options[0]
				
				return ctrl
				
				
			}, // createDefaultControl
			
			createLoadedControl: function createLoadedControl(plotData){
			
				var ctrl = cfD3Histogram.helpers.createDefaultControl()
				
				// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
				if(plotData.xProperty != undefined){
					if( dbsliceData.data.ordinalProperties.includes(plotData.xProperty) ){
						ctrl.view.xVarOption.val = plotData.xProperty
						ctrl.view.gVar =           plotData.xProperty
					} // if						
				} // if	

				ctrl.format.title = plotData.title
											
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
					
			
			getItems: function getItems(bins, subgroupKey){
				
				// For cfD3Histogram this function transforms the outputs from hte histogram into a format that allows individual color subgroups to be shown. As in the bar chart several rectangles are made for this.
				
				
				// Make the subgroup the graphic basis, and plot it directly. Then make sure that the grouping changes are handled properly!!
				
				var subgroupVals = subgroupKey == undefined ? [undefined] : dbsliceData.data.categoricalUniqueValues[subgroupKey]
				
				// Loop over them to create the rectangles.
				var items = []
				bins.forEach(function(bin){
					
					var x = 0
					
					subgroupVals.forEach(function(subgroupVal){
						// This will run at least once with the subgroup value of 'undefined'. In that case the item array will hold a single rectangle for each of the expected bars.
						
						var members = bin.filter(function(task){
							// In case where the subgroupKey passed in is 'undefined' this statement evaluates as 'undefined' == 'undefined'
							return task[subgroupKey] == subgroupVal
						})
						
						var rectData = {
							x0: bin.x0,
							x1: bin.x1,
							cKey: subgroupKey,
							cVal: subgroupVal,
							x: x,
							members: members
						}
						
						items.push(rectData)
						
						// Update the position for the next subgroup.
						x = x + members.length
					}) // subgroup
				}) // group
					
				return items
			}, // getItems
			
			getUnfilteredItems: function getUnfilteredItems(ctrl){
				
				var items = dbsliceData.data.cf.all();
				var bins = ctrl.tools.histogram(items)
				return cfD3Histogram.helpers.getItems(bins, undefined)
				
			}, // getUnfilteredItems
			
			getFilteredItems: function getFilteredItems(ctrl){
				
				var items = dbsliceData.data.taskDim.top(Infinity);
				var bins = ctrl.tools.histogram(items)
				return cfD3Histogram.helpers.getItems(bins, undefined)
				
			}, // getFilteredItems
			
			getFilteredItemsGrouped: function getFilteredItemsGrouped(ctrl){
				
				var items = dbsliceData.data.taskDim.top(Infinity);
				var bins = ctrl.tools.histogram(items)
				return cfD3Histogram.helpers.getItems(bins, color.settings.variable)
				
			}, // getFilteredItemsGrouped
			
			// Functions for cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				// Do nothing. On all actions the graphics showing the current selection are being updated, which changes the amount of elements on hte screen accordingly.
				
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				// Just redraw the view with allDataPoints. To avoid circularity move the data extent to the foreground?
				var highlightedBins = ctrl.tools.histogram(allDataPoints)
				
				var highlightedData = cfD3Histogram.helpers.getItems(highlightedBins, color.settings.variable)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
				
				// Draw the highlighted data.
				cfD3Histogram.draw.plotCurrentSelection(ctrl, highlightedData)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
				
				cfD3Histogram.draw.update(ctrl)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
									
			}, // defaultStyle
			
		} // helpers
		
    }; // cfD3Histogram
