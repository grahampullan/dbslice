import {dbsliceData} from "../core/dbsliceData.js"
import {fileManager} from "../core/fileManager.js"
import {builder} from "../core/builder.js"
import {helpers} from "../core/helpers.js"
import {positioning} from "../core/positioning.js";
import {crossPlotHighlighting} from "../core/crossPlotHighlighting.js";
import * as FILE from "../core/fileClasses.js"
import {lasso} from "../core/lasso.js"
import {plotHelpers} from "./plotHelpers.js"



export var cfD3Contour2d = {
		
		// Externally visible methods are:
		// name, make, update, rescale, helpers.highlught/unhighlight/defaultStyle, helpers.createDefaultControl/createLoadedControl/writeControl
		
		// SHOULD: the contour plot always occupy the whole width? Should it just size itself appropriately? It has a potential to cover other plots... Should all plots just reorder. I think only the clashing plots should reorder. Maybe implement this as general functionality first.
		
		// SHOULD: instead of looping over the contours when figuring out the dimension the plot dimensions be updated internally on the fly? By saving the maximum ih for example?
	
		// SHOULD: when calculating the statistics create domain areas on which to calculate the value for particular contour? Or is this too much? It does involve integration...
	
		name: "cfD3Contour2d",
	
		make: function(ctrl){
		
			// This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
			
			// How should the user select the variable to be plotted? At the beginning there will be no contours, so the controls need to be elsewhere. For now put them into the plot title.
			
			// Scale the card appropriately so that it occupies some area. Needs to be adjusted for hte title height
			cfD3Contour2d.setupPlot.dimension(ctrl)
			
			
			cfD3Contour2d.setupPlot.setupTrendingCtrlGroup(ctrl)
			
			// `cfD3Contour2d' has a different structure than the other plots, therefore the `ctrl.figure' attribute needs to be updated.
			cfD3Contour2d.setupPlot.setupPlottingArea(ctrl)
			
			// Add the lassoing.
			cfD3Contour2d.interactivity.lassoing(ctrl)
			
			
			
			
			// The plotBody must be reassigned here so that the rightcontrolgroup svgs are appended appropriately.
			
			
			cfD3Contour2d.resizing.plotOnExternalChange(ctrl)
			
			// NOTES:
			// How to configure the contour plot on the go? For now the positional variables will be just assumed.
			
		
		}, // make
		
		
		getData: function(ctrl){
			
			
			// First establish for which tasks the files are available.
			let tasks = dbsliceData.data.taskDim.top(Infinity)
			let requiredUrls = tasks.map(d=>d[ctrl.view.sliceId])
			
			// Create an itnernal data object for tasks that have a loaded file, and log those that weren't loaded as missing.
			let dataobjs = tasks.reduce(function(acc, t){
				
				// The library will retrieve at most 1 file!
				let filename = t[ctrl.view.sliceId]
				let f = fileManager.library.retrieve(FILE.contour2dFile, filename)
				
				if(f){
					// Exactly the right file was found. As on-demand filenames will have the same filename and url this should always happen when the file has been loaded. The series is still empty as the selection of the variables has not been made yet.
					acc.available.push({
						task: t,
						file: f,
						graphic: undefined
					})
				} else {
					// File not found - log as missing
					acc.missing.push({
						task: t,
						value: filename
					})
				} // if
				
				
				return acc
			}, {available: [], missing:[]}) // reduce
			
			
			ctrl.data.available = dataobjs.available
			ctrl.data.missing = dataobjs.missing
			
			// Set the intersect of availbale variables.
			ctrl.data.intersect = ctrl.data.available.length > 0 ?  cfD3Contour2d.getIntersectOptions( ctrl.data.available ) : undefined
			
		}, // getData
		
		getIntersectOptions: function(dataobjs){
			
			// Find which variables appear in all the dataobj files. These are the variables that can be compared.
			
			
			let commonvars = dataobjs.reduce(function(acc, d){
				
				acc = acc.filter(function(varname){
					return d.file.content.variables.includes(varname)
				})
				
				return acc
			}, [...dataobjs[0].file.content.variables])
			
			return commonvars
			
		}, // getIntersectOptions
		
				
		update: function update(ctrl){
			// This is called during render. Do nothing. Maybe only signal differences to the crossfilter.
			
		}, // update
	
		updateData: function updateData(ctrl){
			
			// This should do what? Come up with the initial contour data? Maybe calculate the initial threshold items? Set a number of levels to show. Calculate the ideal bin number?
			
			// First collect and report the data available.
			cfD3Contour2d.getData(ctrl)
			
			// How to handle contour data? The user should be expected to select the position variables once, and then just change the flow variable if needed. For now this is manually selected here, but the user should be able to select their varioable based on hte name. Implement that later. Maybe a focus out to adjust the contours, and then a focus in to show change. However, in json formats the user should just name the variables correctly!! How should it happen in csv?
			
			// Only use the first 6 files for now.
			// ctrl.data.available = ctrl.data.available.splice(0,6)
			

			// Calculate the extent of hte data and the thresholds
			cfD3Contour2d.setupPlot.setupPlotTools(ctrl)
			
			// Get the contours based on the thresholds
			cfD3Contour2d.draw.getContours(ctrl)
				
			// Draw the plot
			cfD3Contour2d.draw.cards(ctrl)
			
			// Draw teh colorbar
			cfD3Contour2d.draw.rightControlGroup(ctrl)
			
			
			// Resize the plot cotnainers
			cfD3Contour2d.resizing.plotOnInternalChange(ctrl)
			
			  
			
			// When panning over the levels markers on the colorbar highlight those on hte contours somehow.
			
			// Introduce a card folder to the side, and only present 4 at the same time at the beginning. Then the user should add other cards to the view.
			
			// A special tool to order the cards roughly? This is the grouping sort-of?
			
		}, // updateData
		
		// MOVE ALL RESCALING TO A SINGLE OBJECT?
		rescale: function rescale(ctrl){
			
			// Should rescale the whole plot and the individual contours in it.
			
			console.log("Rescaling cfD3Contour2d")
			
			// Make sure the overlay is the right size
			
		}, // rescale
		
		
		resizing: {
			
			findContainerSize: function findContainerSize(container, memberClass){
				
				// Index of the lowest plot bottom.
				var lowestPoint = []
				container
				  .selectAll( memberClass )
				  .each(function(d){
					  lowestPoint.push(this.offsetTop + this.offsetHeight)
				})
				
				
				// But return only an incremental change - so every time the lowest point is lower than the container return the height incremented by one grid distance.
				lowestPoint = Math.max(...lowestPoint)
				
				let dy = positioning.dy(container)
				
				return Math.ceil(lowestPoint/dy)*dy
				
			
			}, // findContainerSize
			
			contourCard: function contourCard(contourCtrl){
			
				// Retrieve the data AR from the plot ctrl.
				let format = contourCtrl.graphic.format
				let card = format.wrapper
				let p = format.position
				let plotCtrl = d3.select(format.parent).datum()
				
				let dy = positioning.dy(plotCtrl.figure)
				let dx = positioning.dx(plotCtrl.figure)
				
		
				// Update the position based on the new ih and iw.
				let position_ = cfD3Contour2d.draw.dimension(p.iw, p.ih, dx, dy, plotCtrl.data.domain.ar)
				
				p.w = position_.w
				p.h = position_.h
				p.sw = position_.sw
				p.sh = position_.sh
				p.minW = position_.minW
				p.minH = position_.minH
				p.ar = position_.ar
				
				// Update the relevant DOM elements.

				// Update the title div. Enforce a 24px height for this div.
				let title = card
				  .select("div.title")
				  .select("p")
					.style("text-align", "center")
					.style("margin-left", "5px")
					.style("margin-right", "5px")
					.style("margin-bottom", "8px")
				  
				  
				helpers.fitTextToBox(title, title, "height", 24)
		
				// Update the plot svg
				card.select("svg.plotArea")
				  .attr("width",  p.sw)
				  .attr("height", p.sh )
				
				
			}, // contourCard
			
			plotOnInternalChange: function plotOnInternalChange(ctrl){
				// An internal change has occured that prompted the plot to be resized (contours were added, moved, or resized).
				
				// Update the plot, AND the plot row. When updating the plot row also the other plots need to be repositioned on the grid.
				
				// Needs to update:
  				// 1 plot (div.plot holding the contours), 
				// 2 plotWrapper (containing hte whole plot)
				// 3 plotRowBody (containing the plot). 
				// 4 other plots of hte plot row need to be repositioned.
				
				// First update the size of the contour plotting area. Based on this size update the plot wrapper. Based on the new plot wrapper size update the plot row.
				
				
				let h = cfD3Contour2d.resizing
				let f = ctrl.format
				let w = ctrl.format.wrapper
				
				let dx = positioning.dx( d3.select( f.parent ) )
				let dy = positioning.dy( d3.select( f.parent ) )
				
				
				
				let rightControlSize = w.select("svg.rightControlSVG").node().getBoundingClientRect()
				let rightControlY = f.rightControls.format.position.iy * positioning.dy( d3.select(f.rightControls.format.parent) )
				
				
				// Heights of components
				let titleHeight = w.select("div.plotTitle").node().offsetHeight
				let plotHeight = h.findContainerSize(ctrl.figure, ".contourWrapper")
				let colorbarHeight = rightControlY + rightControlSize.height
				let figureHeight = colorbarHeight > plotHeight ? colorbarHeight : plotHeight
				
				// Size the plotWrapper appropriately.
				let ih = Math.ceil( (figureHeight + titleHeight) / dy) 
				f.position.ih = ih < 4 ? 4 : ih
				
				
				// Update the heights of the wrapper, hte plot body, and the svg overlay.
				let wrapperHeight = f.position.ih*dy
				let plotAreaHeight= wrapperHeight - titleHeight
				
				w.style("height", wrapperHeight + "px" )
				ctrl.figure.style("height", plotAreaHeight + "px" )
				d3.select(ctrl.figure.node().parentElement).style("height", plotAreaHeight + "px" )
				
				w.select("svg.overlay").style("height", plotAreaHeight + "px")
				
				
				// Reposition other on-demand plots and size the plot row accordingly.
				cfD3Contour2d.resizing.plotOnExternalChange(ctrl)
				
				
				
				
			}, // plotOnInternalChange
			
			plotOnExternalChange: function plotOnExternalChange(plotCtrl){
				// An external change occured - the plot was moved or resized.
				
				// The contour plot is not allowed to clash with other plots. Once an appropriate sizing logic will be selected and implemented this can be relaxed. Therefore when it is moved or resized other plots in the same plot row need to be repositioned.
				
				// If the body of the plot moves, then hte other plots must also move.
				positioning.helpers.repositionSiblingPlots(plotCtrl)
				
				// Update the plot row height itself.
				let plotRowBody = d3.select(plotCtrl.format.parent)
				builder.refreshPlotRowHeight(plotRowBody)
				
				
			}, // plotOnExternalChange
			
			
			
			
		}, // resizing
		

	
			
		// Rename setupPlot -> setup
		// Add groups: plot, controls, cards
	
		setupPlot: {
			
			// Broadly dimension the plot.
			dimension: function dimension(ctrl){
				
				// `makeNewPlot' sizes the plot wrapper. Here calculate the dimensions of the internals.
				let p = ctrl.format.position
				let w = ctrl.format.wrapper
				
				let dy = positioning.dy(d3.select( ctrl.format.parent ))
				let wrapperHeight = p.ih*dy
				
				p.titleHeight = w.select(".plotTitle").node().offsetHeight
				p.plotHeight = wrapperHeight - p.titleHeight
				p.plotWidth =  w.node().offsetWidth - p.rightControlWidth
				
				
			}, // dimension
			
			setupPlottingArea: function setupPlottingArea(ctrl){
				
				let p = ctrl.format.position
				
				ctrl.figure
				  .attr("class", "card-body plot")
				  .style("padding-left", "0px")
				  .style("padding-top", "0px")
				  .style("padding-right", "0px")
				  .style("padding-bottom", "0px")
				
				// `cfD3Contour2d' has a different structure than the other plots, therefore the `ctrl.figure' attribute needs to be updated.
				let dataDiv = ctrl.figure.append("div")
				  .attr("class", "data")
				  .style("width",  p.plotWidth + "px" )
				  .style("height", p.plotHeight + "px" )
				  .style("position", "absolute")
				  
				// MOST OF BELOW IS DUE TO LASSOING. MOVE!!
				var overlaySvg = ctrl.figure.append("svg")
					.attr("class", "overlay")
					.style("width",  p.plotWidth + "px" )
					.style("height", p.plotHeight + "px" )
					.style("position", "absolute")
					.style("top", p.titleHeight + "px")
					.style("display", "none")
					
				
				  
				dataDiv.on("mousemove", function(){
					  if (event.shiftKey) {
						  overlaySvg.style("display", "")
					  } else {
						  overlaySvg.style("display", "none")
					  } // if
				})
				
				overlaySvg.on("mousemove", function(){
					if (event.shiftKey) {
						  
						  
					} else {
						// If shift is released, hide overlay
						overlaySvg.style("display", "none")
					} // if
				})
				
				
				// Add in hte tooltip that hosts the tools operating on lasso selection.
				cfD3Contour2d.interactivity.tooltip.add(ctrl)
				
				// Reassing hte figure to support drag-move.
				ctrl.figure = dataDiv
				
				
				
				
				// Also setup the right hand side controls
				cfD3Contour2d.setupPlot.setupRightControlDOM(ctrl)
				
			}, // setupPlottingArea
			
			setupTrendingCtrlGroup: function setupTrendingCtrlGroup(ctrl){
				
				let variables = dbsliceData.data.ordinalProperties
				
				let trendingCtrlGroup = ctrl.format.wrapper
				  .select("div.plotTitle")
				  .append("div")
				    .attr("class", "trendingCtrlGroup float-right")
					.style("display", "none")
					.datum(ctrl)
					
				let p = cfD3Contour2d.interactivity.piling
				p.addRoundButton(trendingCtrlGroup, p.minimise, "times")
				
					
				let menu = trendingCtrlGroup
				  .append("div")
				    .attr("class", "trendTools")
				    .style("position", "relative")
				    .style("top", "5px")
				    .style("display", "inline-block")
					.style("float", "right")
					.style("margin-right", "10px")
				
				menu.append("label")
					.html("x:")
					.style("margin-left", "10px")
					.style("margin-right", "5px")
				
				menu.append("select")
				    .attr("axis", "x")
				    .style("margin-right", "10px")
				  .selectAll("option")
				  .data(variables)
				  .enter()
				  .append("option")
					.attr("value", d=>d)
					.html(d=>d)
					
				menu.append("label")
					.html("y:")
					.style("margin-left", "10px")
					.style("margin-right", "5px")
				
				menu.append("select")
				    .attr("axis", "y")
				    .style("margin-right", "10px")
				  .selectAll("option")
				  .data(variables)
				  .enter()
				  .append("option")
					.attr("value", d=>d)
					.html(d=>d)
					
				// Add the functionalityto the dropdowns
				menu.selectAll("select").on("change", function(){
					
					console.log("Arrange the contours by: " + this.value)
					
					// Find the axis:
					let axis = d3.select(this).attr("axis")
					
					cfD3Contour2d.interactivity.sorting[axis](ctrl, this.value)
				})
				
					
				/* Buttons needed:
						Minimise
						Highlight
				*/
				
				
				p.addRoundButton(trendingCtrlGroup, p.highlight, "lightbulb-o")
				
			}, // setupTrendingCtrlGroup
			
			// Right colorbar control group
			
			setupContourTools: function setupContourTools(ctrl){
				
				var h = cfD3Contour2d.setupPlot
				var dataobjs = ctrl.data.available
				
				// Setup the domain.
				ctrl.data.domain = {
					x: h.getDomain(dataobjs, d=>d.file.content.surface.x),
					y: h.getDomain(dataobjs, d=>d.file.content.surface.y),
					v: h.getDomain(dataobjs, d=>d.file.content.surface.v),
					thresholds: undefined,
					nLevels: undefined
				}
				
				// Set the AR:
				ctrl.data.domain.ar = 
					( ctrl.data.domain.y[1] - ctrl.data.domain.y[0] ) / 
					( ctrl.data.domain.x[1] - ctrl.data.domain.x[0] )
				
				cfD3Contour2d.setupPlot.setupThresholds(ctrl, ctrl.data.domain.v)
				

			}, // setupContourTools

			setupColorbarTools: function setupColorbarTools(ctrl){
				
				let c = ctrl.format.rightControls.colorbar
	
			    // Tools. `scaleSequential' maps into a range between 0 and 1.
				ctrl.tools.scales.px2clr = d3.scaleSequential(d3.interpolateViridis)
				  .domain([0, c.height ])
				  
				// Thresholds respond to selections on hte histogram. This is the corresponding scale.
				ctrl.tools.scales.val2px = d3.scaleLinear()
				  .domain( d3.extent( ctrl.data.domain.thresholds ) )
				  .range([0, c.height ])
				 
				// Histogram needs to use a fixed scale based on the data domain.
				ctrl.tools.scales.val2px_ = d3.scaleLinear()
				  .domain( ctrl.data.domain.v )
				  .range([0, c.height ])
				  
				// Coloring
				ctrl.tools.scales.val2clr = d3.scaleSequential(d3.interpolateViridis)
				  .domain( d3.extent( ctrl.data.domain.thresholds ) )
				  
				
			}, // setupColorbarTools
			
			setupHistogramTools: function setupHistogramTools(ctrl){
				
				
				// There is a lot of data expected, and therefore each pixel can be used as a bin. Avoid making a new large array by calculating the histogram for each file independently, and then sum up all the bins.
				
				let s = ctrl.tools.scales
				let c = ctrl.format.rightControls.colorbar
				let h = ctrl.format.rightControls.histogram
				
				// Get the histogram data
				let vMin = ctrl.data.domain.v[0]
				let vMax = ctrl.data.domain.v[1]
				let nBins = c.height
				let thresholds = d3.range(vMin, vMax, (vMax - vMin)/nBins )
				 
				let histogram = d3.histogram()
				  .domain( ctrl.data.domain.v )
				  .thresholds( thresholds );
								  
				let fileBins = ctrl.data.available.map(function(dataobj){
					
					// The returned bins acutally contain all the values. Rework the bins to remove them and thus minimise memory usage.
					let bins = histogram( dataobj.file.content.surface.v )
					
					return bins.map(function(bin){return {x0:bin.x0, x1:bin.x1, n: bin.length}});
				})
				
				// Now summ all hte bins together.
				h.bins = fileBins.reduce(function(acc, val){
					// Acc and val are arrays of bins, which have to be summed individually.
					return acc.map(function(d,i){
						d.n += val[i].n
						return d
					})
				})
				
				// Take a log of the bin lengths to attempt to improve the histogram
				h.bins = h.bins.map(function(d){
					d.n = d.n == 0 ? 0 : Math.log10(d.n)
					return d
				})
				
				
				// Tools for the histogram.
				s.bin2px = d3.scaleLinear()
				  .domain([0, d3.max( h.bins, d=>d.n ) ])
				  .range([0, h.width ])
				  
				
			}, // setupHistogramTools
			
			
			sizeRightControlGroup: function sizeRightControlGroup(ctrl){
				
				// Histogram can be narrower!
				
				let groupDiv = ctrl.format.wrapper.select("div.rightControlGroup")
				let width  = groupDiv.node().getBoundingClientRect().width
				let height = groupDiv.node().getBoundingClientRect().height
				

				let h = ctrl.format.rightControls.histogram
				let c = ctrl.format.rightControls.colorbar

				// Dimension control group. X and Y are positions of the svgs.			
				c.width = width * 3/5 - c.margin.left - c.margin.right
			    c.height = height - c.margin.top - c.margin.bottom
				c.x = c.margin.left
				c.y = c.margin.top
				c.legendWidth = c.width * 1/2
				c.axisWidth   = c.width * 1/2
				
				
				h.width = width * 2/5 - h.margin.left - h.margin.right
			    h.height = height - h.margin.top - h.margin.bottom
				h.x = c.margin.left + c.width + c.margin.right + h.margin.left
				h.y = h.margin.top
				
				// The control group consists of two SVGs side-by-side. The left holds an interactive histogram, the right holds the interactive colorbar. Both have the same size.
				
				
				
				
				
			}, // sizeRightControlGroup
			
			setupRightControlDOM: function setupRightControlDOM(ctrl){
				
				//Separate this out into colorbar and histogram??
				let p = ctrl.format.position
				let c = ctrl.format.rightControls.colorbar
				let h = ctrl.format.rightControls.histogram
				
				// Let teh div be the wrapper, and the parent simultaneously.
				
				let rightControlDiv = ctrl.format.wrapper.select("div.plot")
				  .append("div")
					.attr("class", "rightControlGroup")
					.style("width",  p.rightControlWidth + "px" )
					.style("height", p.plotHeight + "px")
					.style("position", "absolute")
					.style("left", p.plotWidth + "px")
					.style("top", p.titleHeight + "px")
					
					
				// One stationary div
				let rightControlSvgWrapper = rightControlDiv.append("div").attr("class", "rightControlWrapper")
				  
					
				let rightControlSVG = rightControlSvgWrapper
				  .append("svg")
					.attr("class", "rightControlSVG")
					.attr("width",  p.rightControlWidth )
					.attr("height", Math.floor( p.plotHeight ) )
					.style("position", "absolute")
					
				ctrl.format.rightControls.format.parent = rightControlSvgWrapper.node()
				ctrl.format.rightControls.format.wrapper = rightControlSVG
			

				// Size the components.
				cfD3Contour2d.setupPlot.sizeRightControlGroup(ctrl)
			
				// These should be sized later on, so in case some resizing is needed it is easier to update.
				h.svg = rightControlSVG.append("svg")
				c.svg = rightControlSVG.append("svg")
				
				// Update teh svgs
				h.svg
				  .attr("height", h.height )
				  .attr("width", h.width )
				  .attr("x", h.x )
				  .attr("y", h.y )
				
			    c.svg
				  .attr("height", c.height )
				  .attr("width", c.width )
				  .attr("x", c.x )
				  .attr("y", c.y )

				
				
				// Colorbar: the transform is required as d3.axisLeft positions itself in reference to the top right corner.
				let gColorbar = c.svg.append("g")
				  .attr("transform", helpers.makeTranslate(c.axisWidth, 0) )
				gColorbar.append("g").attr("class", "gBar")
				gColorbar.append("g").attr("class", "gBarAxis")
				gColorbar.append("g").attr("class", "gBarLevels")
				
				// Histogram
				h.svg.append("g").attr("class", "gHist")
			    h.svg.append("g").attr("class", "gBrush")
			    h.svg.append("g").attr("class", "gHistAxis")
				
				// Additional text for histogram.
				let logNote = rightControlSVG
				  .append("g")
					.attr("class", "logNote")
				    .attr("transform", helpers.makeTranslate(h.x + 20, h.height + h.y + 9) )
				  .append("text")
				    .style("font", "10px / 15px sans-serif")
				    .style("font-size", 10 + "px")
				    .style("display", "none")
				logNote.append("tspan").text("log")
				logNote.append("tspan").text("10").attr("dy", 7)
				logNote.append("tspan").text("(n)").attr("dy", -7)
				
				
				
				
				// Add the dragging.
				let drag = d3.drag()
				  .on("start", positioning.dragStart)
				  .on("drag", positioning.dragMove)
				  .on("end", positioning.dragEnd)
				
				rightControlSVG
				  .append("g")
				    .attr("class", "gRightGroupDrag")
				  .append("circle")
				    .attr("r","5")
				    .attr("cx", h.x - 15 )
				    .attr("cy", p.plotHeight - 6 )
				    .attr("fill","gainsboro")
				    .attr("cursor", "move")
				    .attr("opacity", 0)
				    .datum( ctrl.format.rightControls )
				    .call(drag)
				
				
				  
				
				
			}, // setupRightControlDOM
			
			
			// The plotting tools
			setupPlotTools: function setupPlotTools(ctrl){
				
				// Setup the colorbar tools. This is in a separate function to allow it to be updated later if needed. Maybe create individual functions for all three? Contour, Colorbar, Histogram?
				cfD3Contour2d.setupPlot.setupContourTools(ctrl)
				
				cfD3Contour2d.setupPlot.setupColorbarTools(ctrl)
				
				cfD3Contour2d.setupPlot.setupHistogramTools(ctrl)
				  
			}, // setupPlotTools
			
			setupThresholds: function setupThresholds(ctrl, extent){
				// The domain of the data, and the domain of the visualisation need not be the same. This is needed when selecting a subset on hte colorbar histogram.
				
				// Calculate the initial threshold values. Note that thresholds don't include teh maximum value.
				
				// First check if the number of levels has been determined already.
				if( ctrl.data.domain.nLevels == undefined ){
					// Base it off of the values in a single contour.
					ctrl.data.domain.nLevels = d3.thresholdSturges( ctrl.data.available[0].file.content.surface.v )
				} // if
				
				
				var thresholds = d3.range(extent[0], extent[1], (extent[1] - extent[0])/ctrl.data.domain.nLevels )
				
				ctrl.data.domain.thresholds = thresholds
				
				
			}, // setupThresholds
			
			getDomain: function getDomain(data, accessor){
				
				// Data is expected to be an array of contour chart data 
				// read from the attached json files.
				let domain = data.map(function(d){
					return d3.extent( accessor(d) )
				}) // map
						
				return d3.extent( [].concat.apply([], domain) )
			}, // getDomain
			
			// Contour cards
			design: function design(ctrl, file){
				// This is the initial dimensioning of the size of the contour cards.
				  
				// Find a range aspect ratio that will fit at least 6 similar contours side by side.
				
				
				  
				// Max width is 3 grid nodes. Find a combination of nx and ny that get an AR lower than the domain AR.
				let cardsPerRow = 6
				let bestCandidate = {ar: 0}
				
				// Margins are implemented on the svg itself. They are taken into account through the projection.
				
				let dy = positioning.dy(ctrl.figure)
				let dx = positioning.dx(ctrl.figure)
				let nx = positioning.nx(ctrl.figure)
				
				
				for(let iw = 1; iw <= nx/cardsPerRow; iw++){
					for(let ih = 1; ih <= nx; ih++){
					  
						// Calculate proposed card dimensions  
						let candidate = cfD3Contour2d.draw.dimension(iw, ih, dx, dy, ctrl.data.domain.ar)
						  
						// Enforce constraints. The data AR must be larger than the maximum available svg AR to allow the visualisation to fill the space as good as possible.
						// Find the maximum (!) inner ar of the cnadidates. As candidates are enforced to have an AR smaller than the data AR this will be the closest to the data AR.
						if( (ctrl.data.domain.ar >= candidate.ar) && (candidate.ar > bestCandidate.ar) ){
							bestCandidate = candidate
						} // if
					} // for
				} // for
				  
				  
				
				
				return bestCandidate
				
			}, // design
			
			
		}, // setupPlot
	

		positioning: {
			
			newCard: function newCard(plotCtrl){
			
			
				// The difference between plots and cards is that plots are added manually, and the cards are added automatically.
				
				let h = positioning.helpers
				let occupiedNodes = []
				
				// Collect already occupied nodes. Check if there are any existing contours here already. The existing contours will have valid `ix' and `iy' positions. Position all new cards below the existing ones. This means that all nodes that have an existing card below them are `occupied'.
				
				// How to eliminatethe empty space at the top though?? Calculate the min iy index, and offset all plots by it?
				let minOccupiedIY = d3.min(plotCtrl.data.plotted, function(d){ return d.graphic.format.position.iy})
				
				plotCtrl.data.plotted.forEach(function(d){
					d.graphic.format.position.iy -= minOccupiedIY
				})
					
				let maxOccupiedIY = d3.max(plotCtrl.data.plotted, function(d){return d.graphic.format.position.iy + d.graphic.format.position.ih})
				
				h.pushNodes(occupiedNodes, 0, 0, plotCtrl.grid.nx, maxOccupiedIY)
				
				
				
				// With all the occupied nodes known, start positioning the contours that are not positioned.
				
				
				plotCtrl.data.plotted.forEach(function(d){
					let pn = d.graphic.format.position
				
					
					// Position this card, but only if it is unpositioned.
					if( ( (pn.ix == undefined) || isNaN(pn.ix) ) && 
						( (pn.iy == undefined) || isNaN(pn.iy) ) ){
						
						// Position the plot.
						positioning.onGrid(plotCtrl.grid.nx, occupiedNodes, pn)
					
						// Mark the nodes as occupied.
						h.pushNodes(occupiedNodes, pn.ix, pn.iy, pn.iw, pn.ih)
						
					} // if
					
				}) // forEach plot
				
				
				
				
			}, // newCard
			
		}, // positioning
	
		draw: {
			
			// Making the presentation blocks.
			cards: function cards(ctrl){
				// This should handle the enter/update/exit parts.
  
			    const div = ctrl.figure
				let dx = positioning.dx(div)
				let dy = positioning.dy(div)
			  
			    let drag = cfD3Contour2d.interactivity.dragging.smooth.make(ctrl)
				  
				function getPositionLeft(d){
					return d.graphic.format.position.ix*dx + 
						   d.graphic.format.parent.offsetLeft + "px"
				}
				function getPositionTop(d){
					return d.graphic.format.position.iy*dy + "px"
				}
			    
				// The key function must output a string by which the old data and new data are compared.
			    let cards = div.selectAll(".contourWrapper")
				  .data(ctrl.data.plotted, d => d.task.taskId)
			  
			    // The update needed to be specified, otherwise errors occured.
			    cards.join(
				  enter => enter.append("div")
					.attr("class", "card contourWrapper")
					.attr("task",d=>d.task.taskId)
					.style("position", "absolute")
					.style("background-color", "white")
					.style("left", getPositionLeft )
					.style("top", getPositionTop )
					.style("cursor", "move")
					.call(drag)
					.each(function(d){
						
						d.graphic.format.wrapper = d3.select(this)
						
						cfD3Contour2d.draw.contourBackbone(d)
					
						// Draw the actual contours.
						cfD3Contour2d.draw.contours(d)
					}),
				  update => update
				    .each( d => cfD3Contour2d.draw.contours(d) )
					.style("left", getPositionLeft )
					.style("top", getPositionTop ),
				  exit => exit.remove()
				)

			   
			   
			   
			}, // cards
			
			contourBackbone: function contourBackbone(d){
				
				// The projection should be updated here to cover the case when the user resizes the plot.
  
			    let card = d.graphic.format.wrapper
			    
			    // Set the width of the plot, and of the containing elements.
			    card
				  .style(     "width", d.graphic.format.position.w + "px" )
				  .style( "max-width", d.graphic.format.position.w + "px" )
				  .style(    "height", d.graphic.format.position.h + "px" )
			  
			    // Append the title div. Enforce a 24px height for this div.
			    let title = card.append("div")
				  .attr("class", "title")
				  .append("p")
				  .style("text-align", "center")
				  .style("margin-left", "5px")
				  .style("margin-right", "5px")
				  .style("margin-bottom", "8px")
				  .text( d=> d.task.taskId )
				  
				  
				helpers.fitTextToBox(title, title, "height", 24)
							  
			    // Append the svg
			    card.append("svg")
				    .attr("class", "plotArea")
				    .attr("width",  d.graphic.format.position.sw)
				    .attr("height", d.graphic.format.position.sh )
				    .style("fill", "smokewhite")
				    .style("display", "block")
				    .style("margin", "auto")
			      .append("g")
				    .attr("class", "contour")
				    .attr("fill", "none")
				    .attr("stroke", "#fff")
				    .attr("stroke-opacity", "0.5")

					
				// The resize behavior. In addition to resizeEnd the resizing should also update the contour.
				let h = cfD3Contour2d.interactivity.dragging.gridded
				let resize = d3.drag()
				  .on("start", h.resizeStart)
				  .on("drag", h.resizeMove)
				  .on("end", function(d){
					  
					  h.resizeEnd(d)
					  
					  cfD3Contour2d.draw.updateContour(d)
				  })
				  
				card.append("svg")
					.attr("width",  "10")
					.attr("height", 10)
					.style("position", "absolute")
					.style("bottom", "0px")
					.style("right", "0px")
				  .append("circle")
					.attr("cx", "5")
					.attr("cy", 5)
					.attr("r", 5)
					.attr("fill", "gainsboro")
					.attr("cursor", "nwse-resize")
					.call(resize)
				
			}, // contourBackbone
			
			// Actual drawing
			contours: function contours(d){
				
				// The projection should be updated here to cover the case when the user resizes the plot.

			  
			    // Append the contour
			    d.graphic.format.wrapper.select("g.contour")
				  .selectAll("path")
				  .data(d => d.graphic.levels)
				  .join("path")
				    .attr("fill", d.graphic.format.color )
				    .attr("d", cfD3Contour2d.draw.projection(d) );
				
					  
			}, // contours
			
			updateContour: function updateContour(d){
				
				// By this point everything external to the contour has been rescaled. Here the internal parts still need to be rescaled, and the contour levels redrawn.
				
				// Readjust the card DOM
				cfD3Contour2d.resizing.contourCard(d)
				
				
				// The projection should be updated here to cover the case when the user resizes the plot.
  
			    let card = d.graphic.format.wrapper
			    let projection = cfD3Contour2d.draw.projection(d)

			  
			    // Update the contour
				card.select("g.contour")
				  .selectAll("path")
				  .data(d => d.graphic.levels)
				  .join(
					enter => enter.append("path")
					             .attr("fill", d.graphic.format.color )
				                 .attr("d", projection ),
					update => update
					             .attr("fill", d.graphic.format.color )
				                 .attr("d", projection ),
					exit => exit.remove()
				  )
					
					
				
				
			}, // updateContour
			
			
			// The control group
			rightControlGroup: function rightControlGroup(ctrl){
				
			    

			    // The histogram on the left.
			    cfD3Contour2d.draw.histogram(ctrl)
			  
			    // The colorbar on the right.
				cfD3Contour2d.draw.colorbar(ctrl)
				
				let r = ctrl.format.rightControls
				
				// Turn the group controls and the note on.
				r.format.wrapper
				  .select("g.gRightGroupDrag")
				  .selectAll("circle")
				  .attr("opacity", 1)
				  
				let histogramLogNote = r.format.wrapper
				  .select("g.logNote")
				  .select("text")
				    .style("display", "initial")
			    
				// Enforce that the axis text is the same size on both plots here!
				
				let colorbarAxisTicks = r.colorbar.svg.select("g.gBarAxis").selectAll("text")
				let histogramAxisTicks = r.histogram.svg.select("g.gHistAxis").selectAll("text")
				let histogramLogNoteText = histogramLogNote.selectAll("tspan")
				
				let minFontSize = d3.min([
					parseInt( colorbarAxisTicks.style("font-size") ),
					parseInt( histogramAxisTicks.style("font-size") ),
					parseInt( histogramLogNote.style("font-size") )
				])
				
				colorbarAxisTicks.style("font-size", minFontSize)
				histogramAxisTicks.style("font-size", minFontSize)
				histogramLogNote.style("font-size", minFontSize)
				
				// Draw ticks to show it's a log scale. This will have to be on the background svg. Axis to small to draw ticks - a text has been added instead.
				
				// Make the colorbar draggable. For the colorbar to move automatically a scrolling event would have to be listened to. Position sticky positions the colorbar below everything else.
				
				// Maybe draw the empty colorbar etc on startup already??
				
				// Make the colorbar interactive!!
				
			}, // rightControlGroup
			
			colorbar: function colorbar(ctrl){
				// The colorbar must have it's own axis, because the user may want to change the color extents to play with the data more. 
				
				let c = ctrl.format.rightControls.colorbar
				let s = ctrl.tools.scales
				

				// Color bars
			    c.svg.select("g.gBar").selectAll("rect")
				  .data( d3.range( c.height ) )
				  .enter()
				  .append("rect")
				    .attr("class", "bars")
				    .attr("x", 0)
				    .attr("y", d=>d)
				    .attr("height", 2)
				    .attr("width", c.legendWidth)
				    .style("fill", s.px2clr )    
			  
			    // Add in the axis with some ticks.
				let gBarAxis = c.svg.select("g.gBarAxis")
				gBarAxis.call( d3.axisLeft( s.val2px ) )
						
				// Dimension the axis apropriately. 
				helpers.fitTextToBox(gBarAxis.selectAll("text"), gBarAxis, "width", c.axisWidth)
				
				
				// Draw the contour plot levels.
				c.svg.select("g.gBarLevels").selectAll("rect")
				  .data( ctrl.data.domain.thresholds )
				  .enter()
				    .append("rect")
				      .attr("class", "bars")
				      .attr("x", 2)
				      .attr("y", d => s.val2px(d) )
				      .attr("height", 2)
				      .attr("width", c.legendWidth - 3)
					  .attr("cursor", "ns-resize")
				      .style("fill", "gainsboro" )
				
			}, // colorbar
			
			histogram: function histogram(ctrl){
				
				
				let h = ctrl.format.rightControls.histogram
				let s = ctrl.tools.scales
				
			    let gHist = h.svg.select("g.gHist")
				
				
			  
			    let rects = gHist.selectAll("rect").data( h.bins )
			    rects.enter()
				  .append("rect")
				    .attr("height", d => s.val2px_(d.x1) - s.val2px_(d.x0) )
				    .attr("width", d => s.bin2px(d.n) )
				    .attr("y", d => s.val2px_(d.x0) )
				    .style("fill", "DarkGrey")
			  
				
			  
			    // Brushing and axes.
			    let gBrush = h.svg.select("g.gBrush")
			    let gHistAxis = h.svg.select("g.gHistAxis")
				  
			    let brush = d3.brushY(s.val2px_).on("end", cfD3Contour2d.interactivity.rightControls.histogramBrushMove);
			  
			    gBrush.call(brush);
			  
			    // Add in the axis with some ticks.
				gHistAxis.call( d3.axisRight( s.val2px_ ) )
				
				
				h.svg.select("g.gHistBottom").append("p").text("log10(n)")
				
			}, // histogram
			
			
			
			// MOVE getContours, json2contour, dimensioning, projection TO SETUP PLOT!!
			
			getContours: function getContours(ctrl){
				// Assemble all information required to draw the individual contours in a single object.
			  

			  
				let item
				let alreadyPlottedTasks = ctrl.data.plotted.map(d=>d.task.taskId)
				
				// Create contours
				ctrl.data.plotted = ctrl.data.available.map(function(dataobj){
					
					
					
					
					// What happens if the URL is duplicated?? Instead focus on retrieving the taskId
					let i = alreadyPlottedTasks.indexOf(dataobj.task.taskId)
					
					if( i > -1 ){
						// Return the already existing object.
						dataobj = ctrl.data.plotted[i]
						
					} else {
						// Initialise new plotting entry.
						
						dataobj.graphic = {
							levels: cfD3Contour2d.draw.json2contour(dataobj.file.content.surface, ctrl.data.domain.thresholds),
							format: {
								parent: ctrl.figure.node(),
								wrapper: undefined,
								position: cfD3Contour2d.setupPlot.design(ctrl, dataobj),
								domain: ctrl.data.domain,
								color: function(d){ return ctrl.tools.scales.val2clr(d.value) }
							}
						} // item
						
					
					} // if
					
					return dataobj
				}) // items
				  
				  
				// Positioning needs to be re-done to allow for update to add cards. Position the new cards below the existing cards.
				cfD3Contour2d.positioning.newCard(ctrl)
				
				
				
				
			}, // getContours
			
			json2contour: function json2contour(surface, thresholds){
			  // Create the contour data
			  return d3.contours()
						.size(surface.size)
						.thresholds(thresholds)
						(surface.v)
			}, // json2contour


			dimension: function dimension(iw, ih, dx, dy, dataAR){
				// Calculates the inner dimensions of a contour plot card, which depend on the data aspect ratio, and the dimensions of the card.
				
				// Specify a margin to the card sides, and the title of hte card.
				// 24px for title, 10px for resize controls. The minimum height of the card in px is the title width plus 30px.
				let margin = {y: 7, x: 7}
				let title = 24 + 10
				
				// Calculate proposed card dimensions
				let divHeight = ih*dy
				let divWidth = iw*dx
				let divAR = divHeight/divWidth
				let innerHeight = divHeight - 2*margin.y - title
				let innerWidth = divWidth - 2*margin.x
				
				return {ix: undefined,
						iy: undefined,
						iw: iw, 
						ih: ih, 
						w: divWidth,
						h: divHeight,
						sw: innerHeight / dataAR,
						sh: innerHeight,
						minW: dx,
						minH: title + 30,
						ar: innerHeight / innerWidth,
						mouse: {}
				}
				
				
				
				
				
			}, // dimension
			
			projection: function projection(dataobj){
				// The projection is only concerned by plotting the appropriate contour level points at the appropriate x and y positions. That is why the projection only relies on x and y data, and can be computed for all contours at the same time, if they use the same x and y locations.
				let f = dataobj.graphic.format
				let s = dataobj.file.content.surface
				
				let xscale = d3.scaleLinear()
						.domain( f.domain.x )
						.range( [0, f.position.sw] );

				let yscale = d3.scaleLinear()
						.domain( f.domain.y ) 
						.range( [f.position.sh, 0] );
				
				let x = s.x;
				let y = s.y;
				let m = s.size[0];
				let n = s.size[1];

				// configure a projection to map the contour coordinates returned by
				// d3.contours (px,py) to the input data (xgrid,ygrid)
				let p = d3.geoTransform( {
					point: function( px, py ) {
						let xfrac, yfrac, xnow, ynow;
						let xidx, yidx, idx0, idx1, idx2, idx3;
						// remove the 0.5 offset that comes from d3-contour
						px = px - 0.5;
						py = py - 0.5;
						// clamp to the limits of the xgrid and ygrid arrays (removes "bevelling" from outer perimeter of contours)
						px < 0 ? px = 0 : px;
						py < 0 ? py = 0 : py;
						px > ( n - 1 ) ? px = n - 1 : px;
						py > ( m - 1 ) ? py = m - 1 : py;
						// xidx and yidx are the array indices of the "bottom left" corner
						// of the cell in which the point (px,py) resides
						xidx = Math.floor(px);
						yidx = Math.floor(py); 
						xidx == ( n - 1 ) ? xidx = n - 2 : xidx;
						yidx == ( m - 1 ) ? yidx = m - 2 : yidx;
						// xfrac and yfrac give the coordinates, between 0 and 1,
						// of the point within the cell 
						xfrac = px - xidx;
						yfrac = py - yidx;
						// indices of the 4 corners of the cell
						idx0 = xidx + yidx * n;
						idx1 = idx0 + 1;
						idx2 = idx0 + n;
						idx3 = idx2 + 1;
						// bilinear interpolation to find projected coordinates (xnow,ynow)
						// of the current contour coordinate
						xnow = (1-xfrac)*(1-yfrac)*x[idx0] + xfrac*(1-yfrac)*x[idx1] + yfrac*(1-xfrac)*x[idx2] + xfrac*yfrac*x[idx3];
						ynow = (1-xfrac)*(1-yfrac)*y[idx0] + xfrac*(1-yfrac)*y[idx1] + yfrac*(1-xfrac)*y[idx2] + xfrac*yfrac*y[idx3];
						this.stream.point(xscale(xnow), yscale(ynow));
					} // point
				}); // geoTransform
				
				return d3.geoPath( p );
			} // projection

			
			
			
		}, // draw
	
		interactivity: {
			
			// POTENTIALLY MOVE FOR ALL PLOTS?
			refreshContainerSize: function refreshContainerSize(ctrl){
				// This method is declared in other plots too, so must remain in this one for global compatibility.
				
				// There are 4 events that may prompt resisizing.
				// 1: Moving plots
				// 2: Resizing plots - cannot resize contour plot for now!!
				// 3: Moving contours
				// 4: Resizing contours
				
				// Maybe I should create classes for data objects??
				// Such as a pile object and a contour object?
				
				// Differentiate between contour rescaling and plot rescaling??
				if(ctrl.graphic ==undefined){
					// Plot. These don't have a graphic attribute.
					cfD3Contour2d.resizing.plotOnExternalChange(ctrl)
					
				} else {
					// Contour
					
					let contourPlot = d3.select(ctrl.graphic.format.parent)
					let contourPlotCtrl = contourPlot.datum()
					
					cfD3Contour2d.resizing.plotOnInternalChange(contourPlotCtrl)
					
				} // if
				
				
				
			}, // refreshContainerSize

			// Colorbar group
			rightControls: {
				// Move everything related to the right controls here!!
				update: function update(ctrl){
					
					let c = ctrl.format.rightControls.colorbar
					let s = ctrl.tools.scales
					
					// Needs to primarily update teh colorbar.
					let gBarAxis = c.svg.select("g.gBarAxis")
					gBarAxis.call( d3.axisLeft( s.val2px ) )
					
					
					// Update the threshold indicator positions.
					c.svg.select("g.gBarLevels").selectAll("rect")
					  .data( ctrl.data.domain.thresholds )
				      .attr("y", d => s.val2px(d) )
				      
					// Update the contour data. For this the levels need to be recalculated.
					ctrl.data.plotted.forEach(function(dataobj){
						dataobj.graphic.levels = cfD3Contour2d.draw.json2contour(dataobj.file.content.surface, ctrl.data.domain.thresholds)
					})
					
					// Update teh contour graphics.
					cfD3Contour2d.draw.cards(ctrl)
					
					// Also update the statistical plots if there are any.
					ctrl.figure
					  .selectAll(".pileWrapper")
					  .each(function(pileCtrl){
						  let stats = cfD3Contour2d.interactivity.statistics
						  stats.mean(pileCtrl)
						  stats.standardDeviation(pileCtrl)
						  
						  // Update the required plot:
						  switch( pileCtrl.statistics.plotted ){
							  case "mu":
								stats.drawMu(pileCtrl);
							    break;
							  case "sigma":
							    stats.drawSigma(pileCtrl);
								break;
						  } // switch
						  
					  })
				}, // update
				
				
				histogramBrushMove: function histogramBrushMove(ctrl){
					
					let s = ctrl.tools.scales
					let extent = d3.event.selection.map(s.val2px_.invert, s.val2px_);
				
				    // Change the colorbar appearance by changing the scale.

					
					// This needs to figure out the new thresholds, and then update all the contours.
					cfD3Contour2d.setupPlot.setupThresholds(ctrl, extent)
					cfD3Contour2d.setupPlot.setupColorbarTools(ctrl)
					
					// Now update the right control group
					cfD3Contour2d.interactivity.rightControls.update(ctrl)
					
				}, // histogramBrushMove
				
				interactivity: {
					
					refreshContainerSize: function refreshContainerSize(rightControlCtrl){
					
						// Has to take the right controls object, and resize the plot. First extract the ctrl for the whole plot, and then resize.
						
						let plotCtrl = rightControlCtrl.format.wrapper.data()[0]
						
						// Resize the plot.
						cfD3Contour2d.resizing.plotOnInternalChange(plotCtrl)
						
						
						// Resize the plot row.
						let plotRowBody = d3.select(plotCtrl.format.parent)
						builder.refreshPlotRowHeight(plotRowBody)
						
					}, // refreshContainerSize
					
					
				}, // interactivity
				
				
				
			}, // rightControls

			// Lasso
			lassoing: function lassoing(ctrl){
				
				var svgOverlay = ctrl.format.wrapper.select("svg.overlay")
				
				var lassoInstance = {
					element: {
						// 'owner': element to attach the lasso to.
						// 'svg'  : where to draw the lasso to
						// 'ref'  : reference for position retrieval
						owner: svgOverlay,
						svg: svgOverlay,
						ref: ctrl.figure
					},
					data: {
						boundary: [],
						getBasisData: function(){ return ctrl.data.plotted; }
					},		
					accessor: {
						// Here the data that is searched after is the position of the card on the screen.
						x: function(d){
							let el = d.graphic.format.wrapper.node()
							return el.offsetLeft + el.offsetWidth/2
						},
						y: function(d){
							let el = d.graphic.format.wrapper.node()
							return el.offsetTop + el.offsetHeight/2
						},
					},
					scales: {
						x: function(x){return x},
						y: function(y){return y}
					},
					preemptive: function(){
						cfD3Contour2d.interactivity.tooltip.tipOff(ctrl)
					},
					response: function(allDataPoints){
						// Highlight the selection
						cfD3Contour2d.helpers.highlight(ctrl, allDataPoints.map(d=>d.task))
						
						// Display the tooltip.
						cfD3Contour2d.interactivity.tooltip.tipOn(ctrl)
					},
				} // lassoInstance
				
				ctrl.tools.lasso = lassoInstance;
				
				lasso.add(lassoInstance)
				
				
			}, // lassoing

			// Use selection
			tooltip: {
		
				add: function add(ctrl){
					// Needs to know where to place the tooltip, and where to store the reference. How should the tooltip be triggered? Only on lasso selection! In that case just tipOn and tipOff must be presented, and should run given a selection of data. The data can them be used to calculate the appropriate position of hte tooltip.
					var f = cfD3Contour2d.interactivity.tooltip.functionality
					var tooltip = ctrl.figure.append("div")
						.attr("class", "contourTooltip")
						.style("display", "none")
						.style("cursor", "pointer")
						
					addButton("stack-overflow", d=>f.pileAndSummarise(ctrl))
					addButton("tags", d=>f.tag(ctrl))
					addButton("close", d=>cfD3Contour2d.interactivity.tooltip.tipOff(ctrl))
					
					
					ctrl.tools.tooltip = tooltip
					
					
					tooltip.datum({
						position: {
							x0: undefined,
							y0: undefined
						}
					})
					
					// Add dragging as well!
					var drag = d3.drag()
						.on("start", function(d){
							let delta = d3.mouse(tooltip.node())
							d.position.x0 = delta[0]
							d.position.y0 = delta[1]
						})
						.on("drag", function(d){
							tooltip
							  .style("left", d3.event.x-d.position.x0 +"px")
							  .style("top", d3.event.y+d.position.y0 +"px")
						})
						.on("end", function(d){
							d.position.x0 = undefined
							d.position.y0 = undefined
						})
					
					tooltip.call(drag)
					
					function addButton(icon, event){
						tooltip.append("button")
						.attr("class", "btn")
						.on("click", event)
					  .append("i")
						.attr("class", "fa fa-" + icon)
						.style("cursor", "pointer")
					} // addButton
				
				}, // add
				
				tipOn: function tipOn(ctrl){
					
					// Position hte tooltip appropriately. Use the lasso boundary to calculate a mean. Crude, but ok.
					
					var n = ctrl.tools.lasso.data.boundary.length
					var position = ctrl.tools.lasso.data.boundary.reduce(function(total, item){
						total.x += item.cx / n
						total.y += item.cy / n
						return total
					},
					{
						x: 0,
						y: 0
					})
					
					// Offset by the expected tooltip size. How to calculate that when display:none?
					ctrl.tools.tooltip
					  .style("display", "")
					  .style("left", (position.x-100) + "px")
					  .style("top",  (position.y-30) + "px")
					  
				}, // tipOn
						
				tipOff: function tipOff(ctrl){
					ctrl.tools.tooltip.style("display", "none")
				}, // tipOff
						
				functionality: {
							
					pileAndSummarise: function pileAndSummarise(ctrl){
					
						console.log("Pile and calculate standard deviation plot")
						
						// Call to make the pile.
						cfD3Contour2d.interactivity.piling.pile(ctrl)
						
						// Remove the tooltip? And add the functionality to highlight the members to the pile!
						
						
						cfD3Contour2d.interactivity.tooltip.tipOff(ctrl)
						
						
						
					}, // pileAndSummarise
					
					tag: function tag(ctrl){
						console.log("Run tagging interface")
					}, // tag
				
				} // functionality
				
			}, // tooltip

			// Introduce piling
			piling: {
	
				pile: function pile(ctrl){
				
					let p = cfD3Contour2d.interactivity.piling
					
					// Collect the contour plots from hte lasso, pile them up, and draw the piler.
					var selectedCards = ctrl.tools.lasso.data.selection
					
					// These must be recognised by the lasso!
					var selectedPiles = p.findPilesInLasso(ctrl)
					
					
					if(selectedPiles.length > 1){
						// There are several piles in the selection.
						// Well, in this case combine them all in a new pile, which contains all the constituent elements. And remove the old piles.
						
						selectedPiles.remove()
						
						p.makePile(ctrl.figure, selectedCards)
						
					} else if(selectedPiles.length == 1){
						// Exactly one pile selected -> add all the members to it, and consolidate in the existing pile.
						
						// The input to updatePile is a single d3.select(".pileWrapper")
						p.updatePile(selectedPiles[0], selectedCards)
					
					} else {
						// No piles in the selection. If there is more than one card selected, then create a pile for it.
						if(selectedCards.length > 1){
						
							p.makePile(ctrl.figure, selectedCards)
						
						} // if
						
					} // if		
				
				
				}, // pile
				
				unpile: function unpile(pileCtrl){
					// Return the contours to where they're supposed to be. Maybe this should be an external function? So that I can pass in a cutom positioning...
					console.log("Reposition cards.")
					
					// Remove the pile
					pileCtrl.wrapper.remove()
				}, // unpile
				
				makePile: function makePile(container, selectedCards){
					
					let i = cfD3Contour2d.interactivity
					
				
					// Calculate the pile position.
					var pileCtrl = i.piling.createPileObject(container, selectedCards)
					
					// Draw a pile over it.
					i.piling.drawPile(pileCtrl)
					
					// Consolidate the constituent cards
					i.piling.consolidatePile(pileCtrl)
				
					// Calculate the group statistics
					i.piling.statisticsPlots(pileCtrl)
					
					// Draw the stat plots.
					i.statistics.drawMu(pileCtrl)
				
				}, // makePile
				
				updatePile: function updatePile(selectedPile, selectedCards){
					
					let p = cfD3Contour2d.interactivity.piling
				
					var pileCtrl = selectedPile.datum()
						
					// Assign all the cards to the pile
					pileCtrl.members = selectedCards
						
					// Move them all to a pile
					p.consolidatePile(pileCtrl)
						
					// Raise the pile object.
					pileCtrl.wrapper.raise()
				
				}, // updatePile
			
				createPileObject: function createPileObject(container, cardCtrls){
			
					
			
					var pileCtrl = {
						x: 0,
						y: 0,
						sw: 0,
						sh: 0,
						delta: {
							x: undefined,
							y: undefined
						},
						container: container,
						wrapper: undefined,
						members: cardCtrls,
						statistics: {
							  mu: undefined,
						   sigma: undefined
						}
					}
					
					// Find the position of the pile, as well as it's width and height based on it's members. The position is the average of the memeber positions, and the size is determined by the largest member.
					var n = pileCtrl.members.length
					var position = pileCtrl.members.reduce(function(ctrl, member){
						let el = member.graphic.format.wrapper.node()
						
						ctrl.x += el.offsetLeft / n
						ctrl.y += el.offsetTop / n
						
						ctrl.sw = el.offsetWidth > ctrl.sw ? el.offsetWidth : ctrl.sw
						ctrl.sh = el.offsetHeight > ctrl.sh ? el.offsetHeight : ctrl.sh
						
						return ctrl
					}, pileCtrl )
				
					return position
				
				}, // createPileObject
				
			
				drawPile: function drawPile(ctrl){
					// Needs to have the position it draws to, and the cards it will contain.
					let s = cfD3Contour2d.interactivity.statistics
					let p = cfD3Contour2d.interactivity.piling
					
					
					let width = 2*ctrl.sw
					let height = ctrl.sh 
					let dw = ctrl.sw/ctrl.members.length
					
					// For now just draw a card and add dragging to it.
					ctrl.wrapper = ctrl.container
					  .append("div")
					  .datum(ctrl)
						.attr("class", "pileCard pileWrapper")
						.style("position", "absolute")
						.style("left", d=>d.x+"px")
						.style("top", d=>d.y+"px")
						
					var pileTitle = ctrl.wrapper.append("div")
						.attr("class", "pileTitle")
						

						
					p.addRoundButton(pileTitle, p.unpile, "times")
					p.addRoundButton(pileTitle, p.maximise, "arrows-alt")	
					p.addRoundButton(pileTitle, p.highlight, "lightbulb-o")
					p.addRoundButton(pileTitle, s.drawSigma, "&sigma;")	
					p.addRoundButton(pileTitle, s.drawMu, "&mu;")
						
						
				
					var svg = ctrl.wrapper
					  .append("div")
					    .attr("class","pileBody")
					  .append("svg")
						.attr("class", "plotArea")
						.attr("width", width)
						.attr("height", height)
						
					// This is the sigma/mu plot
					p.drawCard(ctrl.members[0], ctrl)
					
					
					// Append a viewon element for each of the members. It should be 5px wide.
					svg.selectAll("rect.preview")
					  .data(ctrl.members)
					  .enter()
					  .append("rect")
						.attr("class", "preview")
						.attr("width", dw)
						.attr("height", height)
						.attr("x", (d,i)=>width/2+i*dw)
						.attr("fill", "Gainsboro")
						.on("mouseover", function(d){
							// Raise.
							d.graphic.format.wrapper.raise()
						})
						.on("mouseout", function(d){
							// Raise the wrapper.
							ctrl.wrapper.raise()
						})
						
					// Position: absolute is somehow crucial to make thedragging smooth at the start!
					let drag = d3.drag()
						.on("start", function(d){
							let position = d3.mouse(d.container.node())
						
							d.delta.x = position[0]
							d.delta.y = position[1]
							
						})
						.on("drag", function(d){
							let position = d3.mouse(d.container.node())
							
							
							d.x += position[0] - d.delta.x
							d.y += position[1] - d.delta.y
						
							d.wrapper
							  .style("left", d.x + "px")
							  .style("top", d.y + "px")
							  
							d.delta.x = position[0]
							d.delta.y = position[1]
							  
							// Move also all the members.
							p.movePile(d)
						})
						.on("end", function(d){
							// Fix into grid positions?
						})
						
					ctrl.wrapper.call(drag)
					
					
				}, // drawPile
				
				addRoundButton: function addRoundButton(container, event, icon){
						// Greek letters will contain a "&", so parse for it.
						let class_ = "fa fa-" + icon
						let html_ = ""
						if(icon.search("&") > -1){
							class_ = "text-greek-button"
							html_ = icon
						} // if
						
						container
						  .append("button")
							.attr("class", "btn btn-circle")
							.on("click",event)
						  .append("i")
							.attr("class", class_)
							.html(html_)
							
						
				}, // addRoundButton
				
				drawCard: function drawCard(d, pileCtrl){
					// Draws a card that will hold the statistics plots.
					
					let offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl)
					
					let cards = pileCtrl.wrapper.select("div.pileBody").selectAll(".card")
						.data([d])
					
					cards.join(
					  enter => enter.append("div")
						.attr("class", "card summaryWrapper")
						.style("position", "absolute")
						.style("background-color", "white")
						.style("left", "0px" )
						.style("top", offset.y + "px" )
						.each(function(d){
							
							let p = d.graphic.format.position
							let card = d3.select(this)
							
			    
							// Set the width of the plot, and of the containing elements.
							card
							  .style(     "width", p.w + "px" )
							  .style( "max-width", p.w + "px" )
							  .style(    "height", p.h + "px" )
						  
							// Append the title div. Enforce a 24px height for this div.
							let title = card.append("div")
							  .attr("class", "title")
							  .append("p")
							  .style("text-align", "center")
							  .style("margin-left", "5px")
							  .style("margin-right", "5px")
							  .style("margin-bottom", "8px")
							  .text( "Sigma" )
							  
							  
							helpers.fitTextToBox(title, title, "height", 24)
										  
							// Append the svg
							card.append("svg")
								.attr("class", "plotArea")
								.attr("width",  p.sw)
								.attr("height", p.sh )
								.style("fill", "smokewhite")
								.style("display", "block")
								.style("margin", "auto")
							  .append("g")
								.attr("class", "contour")
								.attr("fill", "none")
								.attr("stroke", "#fff")
								.attr("stroke-opacity", "0.5")
						}),
					  update => update
						.each( d => cfD3Contour2d.draw.contours(d) ),
					  exit => exit.remove()
					)
					
				}, // drawCard
				
				redrawPile: function redrawPile(ctrl){
					// Needs to have the position it draws to, and the cards it will contain.
					let h = ctrl.sh
					let w = 2*ctrl.sw
					let dw = ctrl.sw / ctrl.members.length
					

					var svg = ctrl.wrapper.select("svg.plotArea")
						.attr("width", w)
						.attr("height", h)
						
						
					// Append a viewon element for each of the members. It should be 5px wide.
					svg.selectAll("rect.preview")
					  .data(ctrl.members, d=>d.task.taskId)
					  .enter()
					  .append("rect")
						.attr("class", "preview")
						.attr("width", dw)
						.attr("height", h)
						.attr("x", (d,i)=>ctrl.sw + i*dw)
						.attr("fill", "Gainsboro")
						.on("mouseover", function(d){
							// Raise.
							d.graphic.format.wrapper.raise()
						})
						.on("mouseout", function(d){
							// Raise the wrapper.
							ctrl.wrapper.raise()
						})
					
					
					svg.selectAll("rect.preview")
					  .attr("x", (d,i)=>ctrl.sw + i*dw)
					
					// Redo the statistics plot too.
					let s = cfD3Contour2d.interactivity.statistics
					switch(ctrl.statistics.plotted){
						case "mu":
							s.drawMu(ctrl)
							break;
							
						case "sigma":
							s.drawSigma(ctrl)
							break;
							
						default:
							break;
							
					} // switch
					
				}, // redrawPile
						
				movePile: function(pileCtrl){
				
					// The card hosts the pile title
					let offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl)
				
					// Move the cards to the pile position.
					pileCtrl.members.forEach(function(d, i){
						// When doing this they should also be resized, and redrawn if necessary.
						let position = d.graphic.format.position
						// Stagger them a bit?
						position.x = pileCtrl.x + offset.x
						position.y = pileCtrl.y + offset.y
						
						// Move the wrapper
						d.graphic.format.wrapper
							.style("left", position.x + "px")
							.style("top", position.y + "px")
							.style("border-width", "")
						    .style("border-style", "")
						    .style("border-color", "")
							.raise()
						
					})
					
					pileCtrl.wrapper.raise()
				
				}, // movePile
						
				consolidatePile: function consolidatePile(pileCtrl){
				
					// The card hosts the pile title
					let offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl)
				
					// Move the cards to the pile position.
					pileCtrl.members.forEach(function(d, i){
						// When doing this they should also be resized, and redrawn if necessary.
						let position = d.graphic.format.position
						// Stagger them a bit?
						position.x = pileCtrl.x + offset.x
						position.y = pileCtrl.y + offset.y
						
						// Move the wrapper
						d.graphic.format.wrapper
							.style("left", position.x + "px")
							.style("top", position.y + "px")
							.style("border-width", "")
						    .style("border-style", "")
						    .style("border-color", "")
							.raise()
							
						// Resize the wrapper if needed.
						if((position.sw != pileCtrl.sw) || 
						   (position.sh != pileCtrl.sh)){
							   
							let dx = positioning.dx(pileCtrl.container)
							let dy = positioning.dy(pileCtrl.container)
							position.iw = pileCtrl.sw / dx
							position.ih = pileCtrl.sh / dy
							let width = pileCtrl.sw
							let height = pileCtrl.sh
							
							d.graphic.format.wrapper
							  .style("max-width", width + "px")
							  .style("width"    , width + "px" )
							  .style("height"   , height + "px" )
							  
							d.graphic.format.wrapper.select("div.card")
							  .style("max-width", width + "px")
							  .style("width"    , width + "px" )
							  .style("height"   , height + "px" )
							
							
							// UPDATE THE PLOT
							cfD3Contour2d.resizing.contourCard(d)
							cfD3Contour2d.draw.contours(d)
						
						} // if
						
					})
					
					pileCtrl.wrapper.raise()
				
				}, // consolidatePile
				
				
				calculateOffset: function calculateOffset(pileCtrl){
					
					var titleDom = pileCtrl.wrapper.select(".pileTitle").node()
					var bodyDom = pileCtrl.wrapper.select(".pileBody").node()
					let titleHeight = titleDom.offsetHeight
					let titleMargin = 
					parseInt(window.getComputedStyle(titleDom).marginBottom) + 
					parseInt(window.getComputedStyle(titleDom).marginTop)
					let bodyMargin = parseInt(window.getComputedStyle(bodyDom).padding)
					
					return {
						x: bodyMargin,
						y: titleHeight + titleMargin + bodyMargin
					}
				}, // calculateOffset
				
				addCardToPile: function addCardToPile(cardCtrl, pileCtrl){
					let p = cfD3Contour2d.interactivity.piling
					pileCtrl.members.push(cardCtrl)
					p.consolidatePile(pileCtrl)
					p.statisticsPlots(pileCtrl)
					p.redrawPile(pileCtrl)
					
				}, // addCardToPile
			
				isCardOverPile: function isCardOverPile(cardCtrl, pileCtrl){
					
					let height = pileCtrl.wrapper.node().offsetHeight
					let posy = cardCtrl.graphic.format.position.y - pileCtrl.y 
					
					let width = pileCtrl.wrapper.node().offsetWidth
					let posx = cardCtrl.graphic.format.position.x - pileCtrl.x 
 
					let isInsideWidth = ( posx > 0) &&
								        ( posx < width)
					
					let isInsideHeight = ( posy > 0) &&
								         ( posy < height)

					
					return (isInsideWidth && isInsideHeight) ? posx : false
					
				}, // isCardOverPile
				
				findAppropriatePile: function findAppropriatePile(cardCtrl, pileCtrls){
					
					let p = cfD3Contour2d.interactivity.piling
					let pileCtrl = undefined
					let dst = Infinity
					
					pileCtrls.forEach(function(pileCtrl_){
						let dst_ = p.isCardOverPile(cardCtrl, pileCtrl_)
						
						if( (dst_ != false) && (dst_ < dst)){
							pileCtrl = pileCtrl_
							dst = dst_
						} // if
					}) // each
					
					if(pileCtrl != undefined){
						p.addCardToPile(cardCtrl, pileCtrl)
					} // if
					
				}, // findAppropriatePile
				
				findPilesInLasso: function findPilesInLasso(ctrl){
					
					var dx = positioning.dx(ctrl.figure)
					var dy = positioning.dy(ctrl.figure)
					
					var pileCtrls = ctrl.figure.selectAll(".pileWrapper").data()
					
					var selectedPiles = pileCtrls.filter(function(pileCtrl){
						
						var pileMidpoint = {
							x: pileCtrl.x + pileCtrl.iw*dx,
							y: pileCtrl.y + pileCtrl.ih*dy
						}
						
						return lasso.isPointInside( pileMidpoint, ctrl.tools.lasso.data.boundary )
						
					}) // forEach
					
					return selectedPiles
					
				}, // findPileInLasso
				
				statisticsPlots: function statisticsPlots(pileCtrl){
					
					let i = cfD3Contour2d.interactivity
					

					// Calculate the statistics.
					i.statistics.mean(pileCtrl)
					i.statistics.standardDeviation(pileCtrl)
					

				}, // statisticsPlots
				
				highlight: function highlight(pileCtrl){
					
					crossPlotHighlighting.on(pileCtrl.members.map(d=>d.task), "cfD3Contour2d")
					
				}, // highlight
				
				maximise: function maximise(pileCtrl){
					
					// Assign the pile for trending
					let ctrl = pileCtrl.container.datum()
					ctrl.tools.trending = pileCtrl
					
					
					// Make the trending tools visible.
					let trendingCtrlGroup = d3.select( ctrl.format.wrapper.node() )
					  .select("div.plotTitle")
					  .select("div.trendingCtrlGroup")
					trendingCtrlGroup
					  .selectAll("select")
					  .each(function(){this.value = -1})
					trendingCtrlGroup
						.style("display", "inline-block")
						
						
						
					// The buttons also need access to the right pile
					trendingCtrlGroup.selectAll("button")
						.datum(pileCtrl)
					
					// Hide the piles
					pileCtrl.container
					  .selectAll("div.pileWrapper")
					    .style("display", "none")
					
					
					// Hide / Re-position the contours
					var contourCtrls = pileCtrl.container.selectAll("div.contourWrapper").data()
					
					contourCtrls.forEach(function(d){
						if(pileCtrl.members.includes(d)){
							
						} else {
							d.graphic.format.wrapper.style("display", "none")
						} // if
					}) // forEach
					
				}, // maximise
				
				minimise: function minimise(pileCtrl){
					
					// Make the trending tools visible.
					let trendingCtrlGroup = d3.select( pileCtrl.container.datum().format.wrapper.node() )
					  .select("div.plotTitle")
					  .select("div.trendingCtrlGroup")
					
					trendingCtrlGroup
						.style("display", "none")
						
					pileCtrl.container
					  .selectAll("div.contourWrapper")
					  .style("display", "")
					  
					pileCtrl.container
					  .selectAll("div.pileWrapper")
					  .style("display", "")
					  
					pileCtrl.wrapper.style("display", "")
					cfD3Contour2d.interactivity.piling.consolidatePile(pileCtrl)
					
					// Adjust the plot size.
					cfD3Contour2d.resizing.plotOnInternalChange(pileCtrl.container.datum())  
					
				}, // minimise
				
			}, // piling
	
	
			dragging: {
				
				smooth: {
					
					make: function(ctrl){
						
						let dragctrl = {
							
							onstart: function(d){
								d.graphic.format.wrapper.raise()
							},
							onmove: function(d){
								// Check if the container needs to be resized.
								cfD3Contour2d.resizing.plotOnInternalChange(ctrl)
							},
							onend: function(d){
								
								let i = cfD3Contour2d.interactivity
								
								// Check if the card should be added to a pile.
								i.piling.findAppropriatePile(d, ctrl.figure.selectAll(".pileWrapper").data())
								
								// Update the correlations if trending tools are  active.
								let trendingCtrlGroup = ctrl.format.wrapper
								  .select("div.plotTitle")
								  .select("div.trendingCtrlGroup")
								  
								if( trendingCtrlGroup.style("display") != "none" ){
									// Here we can actually pass the pileCtrl in!
									i.statistics.drawCorrelation(trendingCtrlGroup)
									
									// Update the selects also.
									trendingCtrlGroup
									  .selectAll("select")
									  .each(function(){
										  this.value = -1
									  })
									
								} // if
							},
							
						}	
						
						
						var h = cfD3Contour2d.interactivity.dragging.smooth

						// Position: absolute is somehow crucial to make thedragging smooth at the start!
						let drag = d3.drag()
							.on("start", function(d){
								
								// Store the starting position of hte mouse.
								
								d.graphic.format.position.mouse = h.getMousePosition(d)
								
								dragctrl.onstart(d)
							})
							.on("drag", function(d){
								
								let position = h.calculateNewPosition(d)
								
								// Move the wrapper.
								d.graphic.format.wrapper
								  .style("left",position.x + "px")
								  .style("top",position.y + "px")
								  
								// Store the new position internally.
								d.graphic.format.position.x = position.x
								d.graphic.format.position.y = position.y
								  
								// Perform any additional on move tasks.
								dragctrl.onmove(d)
							})
							.on("end", function(d){
								dragctrl.onend(d)
							})
							
						
						
						
						return drag
						
						

						
						
					}, // add
					
					calculateNewPosition: function(d){
						
						let h = cfD3Contour2d.interactivity.dragging.smooth
						
						// Get the current wrapper position and the mouse movement on increment.
						let wrapper = h.getWrapperPosition(d)
						let movement = h.calculateMouseMovement(d)
						let parent = d.graphic.format.parent
						
						// Apply boundaries to movement
						movement = h.applyMovementBoundaries(movement, wrapper, parent)
						
						return {
							x: wrapper.x + movement.x,
							y: wrapper.y + movement.y
						}
						
					}, // calculateNewPosition
					
					getMousePosition: function(d){
							
						let mousePosition = d3.mouse(d.graphic.format.parent)
						
						return {
							x: mousePosition[0],
							y: mousePosition[1]
						}
					}, // getMousePosition
					
					getWrapperPosition: function(d){
						// Calculate the position of the wrapper relative to it's parent
						let el = d.graphic.format.wrapper.node()
						
						return {
							x: el.offsetLeft,
							y: el.offsetTop,
							w: el.offsetWidth,
							h: el.offsetHeight
						}
						
					}, // getWrapperPosition
					
					calculateMouseMovement: function (d){
						
						let h = cfD3Contour2d.interactivity.dragging.smooth
						let position = d.graphic.format.position
						
						let mp0 = position.mouse
						let mp1 = h.getMousePosition(d)
						
						let movement = {
							x: mp1.x - mp0.x,
							y: mp1.y - mp0.y
						}
						
						position.mouse = mp1

						return movement
						
					}, // calculateMouseMovement
					
					applyMovementBoundaries: function(movement, wrapper, parent){
						
						// Stop the movement exceeding the container bounds.
						let rightBreach = wrapper.w + wrapper.x + movement.x > parent.offsetWidth
						let leftBreach = wrapper.x + movement.x < 0
						
						
						if( rightBreach || leftBreach ){
							movement.x = 0
						} // if
						
						// Bottom breach should extend the plot!
						if( wrapper.y + movement.y < 0 ){
							movement.y = 0
						} // if
						
						return movement
						
					} // applyMovementBoundaries
					
					
				}, // smooth
				
				
				gridded: {
					
					resizeStart: function resizeStart(d){
						// Bring hte plot to front.
						d.graphic.format.wrapper.raise()
						
					}, // resizeStart
					
					resizeMove: function resizeMove(d){
			  
			  
						// Calculate the cursor position on the grid. When resizing the d3.event.x/y are returned as relative to the top left corner of the svg containing the resize circle. The cue to resize is when the cursor drags half way across a grid cell.
						
						// this < svg < bottom div < plot body < card < plotWrapper
						var f = d.graphic.format
						let parent = d.graphic.format.parent
						let container = d3.select(parent)
						let p = d.graphic.format.position
						
						
						let nx = positioning.nx( container )
						let dx = positioning.dx( container )
						let dy = positioning.dy( container )
						
						
						// clientX/Y is on-screen position of the pointer, but the width/height is relative to the position of the plotWrapper, which can be partially off-screen. getBoundingClientRect retrieves teh plotRowBody position relative to the screen.
						let x = d3.event.sourceEvent.clientX -parent.getBoundingClientRect().left -p.ix*dx
						let y = d3.event.sourceEvent.clientY -parent.getBoundingClientRect().top -p.iy*dy
					  
						let ix = p.ix
						let iw = Math.round( x / dx )
						let ih = Math.round( y / dy )
					  
						// Calculate if a resize is needed
						let increaseWidth = iw > p.iw
						let decreaseWidth = iw < p.iw
						let increaseHeight = ih > p.ih
						let decreaseHeight = ih < p.ih
						  
						// Update the container size if needed
						if([increaseWidth, decreaseWidth, increaseHeight, decreaseHeight].some(d=>d)){
							
							// Corrections to force some size. The minimum is an index width/height of 1, and in px. The px requirement is to make sure that the plot does not squash its internal menus etc. In practice 190/290px seems to be a good value. This finctionality handles the contours as well, therefore the minimum limits are in the format.position attribute.
							
							iw = iw*dx < p.minW ? Math.ceil(p.minW/dx) : iw
							ih = ih*dy < p.minH ? Math.ceil(p.minH/dy) : ih
							
											
							// RETHINK THIS LIMIT!! FOR CONTOUR PLOTS THE PX LIMIT IS NOT NEEDED!!
							
							// Correction to ensure it doesn't exceed limits.
							iw = (ix + iw) > nx ? nx - ix : iw
							
							
							// Width must simultaneously not be 1, and not exceed the limit of the container.
								
							p.ih = ih
							p.iw = iw

							
							
							// this < svg < bottom div < plot body < card < plotWrapper
							f.wrapper
							  .style("max-width", iw*dx + "px")
							  .style("width"    , iw*dx + "px" )
							  .style("height"   , ih*dy + "px" )
							  
							f.wrapper.select("div.card")
							  .style("max-width", iw*dx + "px")
							  .style("width"    , iw*dx + "px" )
							  .style("height"   , ih*dy + "px" )
							
							
							// UPDATE THE PLOT
							cfD3Contour2d.rescale(d)
							
							// Resize the containers accordingly
							cfD3Contour2d.interactivity.refreshContainerSize(d)
							
							// Redo the graphics.
								
						} // if
						  
					  
					}, // resizeMove
					
					resizeEnd: function resizeEnd(d){
						// After teh resize is finished update teh contour.
					  
						let container = d3.select(d.graphic.format.parent)
						builder.refreshPlotRowHeight( container )
						builder.refreshPlotRowWidth(  container )
						
						

					}, // resizeEnd
					
					
					
					
				}, // gridded
				
				
				
			}, // dragging
	
			statistics: {
				
				draw: function draw(pileCtrl, statContour){
					
					pileCtrl.wrapper
					  .select("div.pileBody")
					  .select("div.summaryWrapper")
					  .each(function(d){
						  
						  // Has to be designed to ensure units are kept.
						  
						  let svg = d.wrapper
						    .select("div.pileBody")
							.select("div.summaryWrapper")
							.select("svg")
							
						  // The svg defineds the range, so change the domain.
						  cfD3Contour2d.interactivity.statistics.design(svg, statContour)
					      
						  let projection = cfD3Contour2d.draw.projection(statContour)
							
						  svg
						    .select("g.contour")
						    .selectAll("path")
						    .data(statContour.graphic.levels)
						    .join(
							  enter => enter
							    .append("path")
								  .attr("fill", statContour.graphic.format.color )
								  .attr("d", projection ),
							update => update
								  .attr("fill", statContour.graphic.format.color )
								  .attr("d", projection ),
							exit => exit.remove()
						  )
						  
					})
					
					
				}, // draw
				
				
				design: function design(svg, statContour){
					
					let f = statContour.graphic.format
					
					let xdiff = f.domain.x[1] - f.domain.x[0]
					let ydiff = f.domain.y[1] - f.domain.y[0]
					
					let arX = (xdiff)/ f.position.sw
					let arY = (ydiff)/ f.position.sh
					
					// Larges AR must prevail - otherwise the plot will overflow.
					if(arX > arY){
						let padding = arX*f.position.sh - ydiff
						f.domain.y = [f.domain.y[0] - padding/2,
									  f.domain.y[1] + padding/2]
					} else {
						let padding = arY*f.position.sw - xdiff
						f.domain.x = [f.domain.x[0] - padding/2,
									  f.domain.x[1] + padding/2]
					} // if
					
					
					
				}, // design
				
				
				drawMu: function drawMu(pileCtrl){
					
					pileCtrl.statistics.plotted = "mu"

					// Change the title
					pileCtrl.wrapper
					  .select("div.summaryWrapper")
					  .select("div.title")
					  .select("p")
					  .html("μ")
					
					// Change the contours
					cfD3Contour2d.interactivity.statistics.draw(pileCtrl, pileCtrl.statistics.mu)
					
				}, // drawMu
				
				drawSigma: function drawSigma(pileCtrl){
					
					pileCtrl.statistics.plotted = "sigma"
					
					pileCtrl.wrapper
					  .select("div.summaryWrapper")
					  .select("div.title")
					  .select("p")
					  .html("σ")
					
					cfD3Contour2d.interactivity.statistics.draw(pileCtrl, pileCtrl.statistics.sigma)
					
				}, // drawSigma
				
				drawCorrelation: function drawCorrelation(trendingCtrlGroup){
					
					let i = cfD3Contour2d.interactivity
					
					// Get the scores
					var scores = i.statistics.correlation(trendingCtrlGroup.datum().tools.trending )
					
					// Get a palette
					var score2clr = d3.scaleLinear()
						.domain([0,1])
						.range([0, 0.75])
					
					 
  

					
					trendingCtrlGroup.selectAll("select").each(function(){
						
						// Determine if it's x or y select
						let axis = d3.select(this).attr("axis")
						
						var color = d=>d3.interpolateGreens(score2clr(Math.abs(d.score[axis])))
						
						d3.select(this)
						  .selectAll("option")
						  .data( scores )
						  .join(
						    enter => enter
							  .append("option")
							    .attr("value", d=>d.name)
								.html(d=>d.label[axis])
								.style("background-color", color),
							update => update
								.attr("value", d=>d.name)
								.html(d=>d.label[axis])
								.style("background-color", color),
							exit => exit.remove()
						  )
					})
					
				}, // drawCorrelation
				
				makeDataObj: function(wrapper, surface, thresholds, name, taskId){
					
					let s = surface
					
					let colorScheme = d3.scaleSequential(d3.interpolateViridis)
				      .domain( d3.extent( thresholds ) )
					
					return {
						
						file: {
							filename: name,
							content: {
								surface: s
							}
						},
						task: {taskId: taskId},
						graphic: {
							
							levels: cfD3Contour2d.draw.json2contour(s, thresholds),
					    
							format: {
								wrapper: wrapper,
								position: {
									sh: parseFloat( wrapper.attr("height") ),
									sw:  parseFloat( wrapper.attr("width") )
								},
								domain: {
									x: [d3.min(s.x), d3.max(s.x)],
									y: [d3.min(s.y), d3.max(s.y)],
									v: [d3.min(s.v), d3.max(s.v)] 
								},
								color: function(d){
									return colorScheme(d.value)
								}
							}
							
						}
						
					}
					
				}, // makeDataObj
				
				mean: function mean(pileCtrl){

					let dataobjs = pileCtrl.members
				    let mu, domain_
				    let n = dataobjs.length
				  
				    // calculate mean
				    dataobjs.forEach(function(dataobj){
					  let d= dataobj.file.content.surface
					
					  if(mu == undefined){
					  
					  mu = {x: d.x.map(function(x){ return x/n }), 
							y: d.y.map(function(y){ return y/n }), 
							v: d.v.map(function(v){ return v/n }), 
							size:  d.size}
					  
					  } else {

					    d.x.forEach((d_,i)=> mu.x[i] += d_/n)
					    d.y.forEach((d_,i)=> mu.y[i] += d_/n)
					    d.v.forEach((d_,i)=> mu.v[i] += d_/n)
					  
					  
					  } // if
					}) // forEach
 
					
							
					let plotCtrl = d3.select(pileCtrl.wrapper.node().parentElement).datum()
					let svg = pileCtrl.wrapper.select("div.pileBody").select("div.summaryWrapper").select("svg")
					
							
					// Create a statistics output:
				    pileCtrl.statistics.mu = cfD3Contour2d.interactivity.statistics.makeDataObj(svg, mu, plotCtrl.data.domain.thresholds, "mean@obs", "μ")
				  

				}, // mean
				
				standardDeviation: function(pileCtrl){
				 
					let tasks = pileCtrl.members
					let mean = pileCtrl.statistics.mu
					let mu = mean.file.content.surface
				    let sigma
				    let n = tasks.length
				  
				    // calculate standard deviation based on the mean.
				    tasks.forEach(function(task){
					  let t = task.file.content.surface
					  if(sigma == undefined){
					    sigma = {x: mu.x, 
							     y: mu.y, 
							     v: t.v.map( (d,i)=> 
									1/(n-1)*(d - mu.v[i])**2 
								 ), 
							  size: mu.size}
					  } else {
					    t.v.forEach( (d,i)=> 
						  sigma.v[i] += 1/(n-1)*(d - mu.v[i])**2 
						)
					  } // if
					  
				    }) // forEach
					
					

					let svg = pileCtrl.wrapper.select("div.pileBody").select("div.summaryWrapper").select("svg")
					
					
					// Use another way to calculate
					let domain = d3.extent(sigma.v)
					let thresholds = d3.range(domain[0], domain[1], (domain[1] - domain[0])/7)
				

				    // Create a statistics output:
				    pileCtrl.statistics.sigma = cfD3Contour2d.interactivity.statistics.makeDataObj(svg, sigma, thresholds, "stdev@obs", "σ")
					
					
					

				}, // standardDeviation
				
				
				correlation: function correlation(pileCtrl){
				    // Given some on-screen order show the user which variables are most correlated with it.
					let s = cfD3Contour2d.interactivity.statistics
				  
				    // Order is based given the left edge of the contour. The order on the screen is coordinated with the sequential order in contours.tasks in 'dragMove', and in 'ordering'.
				    
				  
				    let scores = dbsliceData.data.ordinalProperties.map(function(variable){
						// For each of the data variables calculate a correlation.
						
						
						// Collect the data to calculate the correlation.
						let d = pileCtrl.members.map(function(dataobj){
						  let el = dataobj.graphic.format.wrapper.node()
						  return {x: el.offsetLeft,
								  y: el.offsetTop,
								  var: dataobj.task[variable]
								 }
						}) // map
						
						// Get Spearman's rank correlation scores for the order in the x direction.
						// (https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient)
						
						// The coefficient is
						// covariance (x_rank, y_rank ) / ( sigma(rank_x) sigma(rank_y) )
						
						let cov = s.covariance(d)
						let sigma_x   = d3.deviation(d, d=>d.x)
						let sigma_y   = d3.deviation(d, d=>d.y)
						let sigma_var = d3.deviation(d, d=>d.var)
						
						sigma_x = sigma_x == 0 ? Infinity : sigma_x
						sigma_y = sigma_y == 0 ? Infinity : sigma_y
						sigma_var = sigma_var == 0 ? Infinity : sigma_var
						
						let score = {
							x: cov.x / ( sigma_x*sigma_var ),
							y: cov.y / ( sigma_y*sigma_var )
						}
						
						let label = {
							x: score.x < 0 ? "- " + variable : "+ " + variable,
							y: score.y < 0 ? "- " + variable : "+ " + variable,
						}
						
						return {
							name: variable, 
							label: label,
							score: score
						}
				    }) // map
				  
				  // Before returning the scores, order them.
				  scores.sort(function(a,b){return a.score - b.score})
				  
				  return scores
				  
				}, // correlation
				
				
				covariance: function covariance(d){

				    // 'd' is an array of observations. Calculate the covariance between x and the metadata variable.
				    let N = d.length
				    let mu_x = d3.sum(d, d=>d.x) / N
					let mu_y = d3.sum(d, d=>d.y) / N
				    let mu_var = d3.sum(d, d=>d.var) / N
				  
				  
				    var sumx = 0;
					var sumy = 0;
				    for(var i=0; i< N; i++) {
						sumx += ( d[i].x - mu_x )*( d[i].var - mu_var );
						sumy += ( d[i].y - mu_y )*( d[i].var - mu_var );
				    }
				  
				    return {
						x: 1/(N - 1)*sumx,
						y: 1/(N - 1)*sumy
					}

				} // covariance
				
			}, // statistics
	
			sorting: {
				
				x: function x(ctrl, variable){
					
					let dx = positioning.dx(ctrl.figure)
					let dy = positioning.dy(ctrl.figure)
					
					// Find the appropriate metadata, and the range to plot it to.
					let vals = ctrl.tools.trending.members.map(d=>d.task[variable])
					
					let range = cfD3Contour2d.interactivity.sorting.getRange(ctrl)
					
					// Create a scale
					let scale = d3.scaleLinear()
					  .domain( d3.extent(vals) )
					  .range( range.x )
					  
					// Position the contours.
					ctrl.tools.trending.members.forEach(function(d){
						
						let x = scale( d.task[variable] )
						
						d.graphic.format.position.x = x
						d.graphic.format.position.ix = Math.floor( x/dx )
						
						d.graphic.format.wrapper.style("left", x + "px")
					})
					
				}, // x
				
				y: function y(ctrl, variable){
					
					let dx = positioning.dx(ctrl.figure)
					let dy = positioning.dy(ctrl.figure)
					
					// Find the appropriate metadata, and the range to plot it to.
					let vals = ctrl.tools.trending.members.map(d=>d.task[variable])
					
					let range = cfD3Contour2d.interactivity.sorting.getRange(ctrl)
					
					// Create a scale
					let scale = d3.scaleLinear()
					  .domain( d3.extent(vals) )
					  .range( range.y )
					  
					// Position the contours.
					ctrl.tools.trending.members.forEach(function(d){
						
						let y = scale( d.task[variable] )
						
						d.graphic.format.position.y = y
						d.graphic.format.position.iy = Math.floor( y/dy )
						
						d.graphic.format.wrapper.style("top", y + "px")
					})
					
				}, // y
				
				getRange: function getRange(ctrl){
					
					let height = ctrl.figure.node().offsetHeight
					let width = ctrl.figure.node().offsetWidth
					
					let maxCardHeight = d3.max( ctrl.tools.trending.members.map(d=>d.graphic.format.position.h) )
					let maxCardWidth = d3.max( ctrl.tools.trending.members.map(d=>d.graphic.format.position.w) )
					
					return {
						x: [0, width - maxCardWidth],
						y: [0, height - maxCardHeight]
					}
					
				}, // getRange
				
			}, // sorting
	
		}, // interactivity
		
		helpers: {
		
			// Initialisation
			createDefaultControl: function createDefaultControl(){
			
				// data:
				 
				// • .promises are promises completed before drawing the graphics.
				// • .requested is an array of urls whose data are requested by the plotting tool. These need not be the same as the data in promises as those are loaded on user prompt!
				// • .available is an array of urls which were found in the central booking,
				// • .missing                              NOT found
				// • .ordinalProperties is a string array of properties found in the data.
				// • .data is an array of n-data arrays of the n-task slice files.
				
				
				var ctrl = {
				    plotFunc: cfD3Contour2d,
					fileClass: FILE.contour2dFile,
					figure: undefined,
					svg: undefined,
					grid: {nx: 12},
					data: {plotted: [],
						   available: [],
					       missing : [],
						   intersect: [],
						   domain: {
							   x: undefined,
							   y: undefined,
							   v: undefined,
							   ar: undefined,
							   thresholds: undefined,
							   nLevels: undefined,
						       },
					       },
					view: {sliceId: undefined,
					       options: [],
						   viewAR: NaN,
						   dataAR: NaN,
						   xVarOption: undefined,
						   yVarOption : undefined,
						   cVarOption : undefined,
						   transitions: {
								duration: 500,
								updateDelay: 0,
								enterDelay: 0								
							   },
						   t: undefined
						   },
					tools: {
							scales: {
								px2clr: undefined,
								val2clr: undefined,
								val2px: undefined,
								val2px_: undefined,
								bin2px: undefined
							},
							lasso: {
								points: [],
								tasks: []
							},
							tooltip: undefined,
							trending: undefined
						},
					format: {
						title: "Edit title",
						parent: undefined,
						wrapper: undefined,
						position: {
							ix: 0,
							iy: 0,
							iw: 12,
							ih: 4,
							minH: 290,
							minW: 340,
							titleHeight: undefined,
							plotHeight: undefined,
							plotWidth: undefined,
							rightControlWidth: 170
						},
						rightControls: {
							plotFunc: cfD3Contour2d.interactivity.rightControls,
							grid: {nx: 1},
							format: {
								parent: undefined,
								wrapper: undefined,
								position: {
									ix: 0,
									iy: 0,
									iw: 12,
									ih: undefined							
								},
							},							
							colorbar: {
								margin: {top: 20, bottom: 20, left: 10, right: 5},
								svg: undefined,
								height: undefined,
								width: undefined,
								x: undefined,
								y: undefined,
							}, // colorbar
							histogram: {
								margin: {top: 20, bottom: 20, left: 5, right: 10},
								svg: undefined,
								height: undefined,
								width: undefined,
								x: undefined,
								y: undefined,
								bins: undefined
							} // histogram
						}
					}
				} // ctrl
				
				
				return ctrl
			
			}, // createDefaultControl
		
			createLoadedControl: function createLoadedControl(plotData){
				
				var ctrl = cfD3Contour2d.helpers.createDefaultControl()
				
				// If sliceId is defined, check if it exists in the metadata. If it does, then store it into the config.
				if(plotData.sliceId != undefined){
					// Needs to check the slice properties that this plot cal draw. 
					if(dbsliceData.data.contour2dProperties.includes(plotData.sliceId)){
						ctrl.view.sliceId = plotData.sliceId
					} // if
				} // if
				
				
				ctrl.format.title = plotData.title
				// When the session is loaded all previously existing plots would have been removed, and with them all on demand loaded data. Therefore the variables for this plot cannot be loaded, as they will depend on the data.
											
				return ctrl
				
				
			}, // createLoadedControl
			
			writeControl: function writeControl(ctrl){
				
				var s = ""
				s = s + '{';
				s = s + '"type": "' + ctrl.plotFunc.name + '", ';
				s = s + '"title": "' + ctrl.format.title + '"';
				  
				  
				// For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
				// Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.
				  
				var sliceId = accessProperty( ctrl.view, "sliceId" )
				
				s = s + writeOptionalVal("sliceId", sliceId)
				
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
			
			// Interactivity
			transitions: {
				instantaneous: function instantaneous(){
				
					return {
						duration: 0,
						updateDelay: 0,
						enterDelay: 0
					}
				
				}, // instantaneous
				
				animated: function animated(){
				
					return {
						duration: 500,
						updateDelay: 0,
						enterDelay: 0
					}
				
				} // animated
			}, // transitions
		

			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				ctrl.figure
				  .selectAll("div.contourWrapper")
				  .style("border-width", "")
				  .style("border-style", "")
				  .style("border-color", "")
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				// Only highlight those points that are not in piles.
				
				
				
				// Udate the boundary.
				var allCards = ctrl.figure
				  .selectAll("div.contourWrapper")
				  
				var selectedCards = allCards.filter(function(d){
					  return allDataPoints.includes(d.task)
				})
				
				var others = allCards.filter(function(d){
					  return !allDataPoints.includes(d.task)
				})
				
				
				selectedCards
				  .style("border-width", "4px")
				  .style("border-style", "dashed")
				  .style("border-color", "black")
				
				others
				  .style("border-width", "")
				  .style("border-style", "")
				  .style("border-color", "")
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
					
				ctrl.figure
				  .selectAll("div.contourWrapper")
				  .style("border-width", "")
				  .style("border-style", "")
				  .style("border-color", "")
				
			}, // defaultStyle
		
			
		
		} // helpers
	
		
	} // cfD3Contour2d
	