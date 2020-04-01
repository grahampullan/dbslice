import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { plotHelpers } from '../plot/plotHelpers.js';
import { importExportFunctionality } from '../core/importExportFunctionality.js';

const cfD3Scatter = {
		
			name: "cfD3Scatter",
		
			make: function(element, data, layout){
				
				// Major differences from the standalone example to the implemented one:
				// 1.) The input arguments to the make have been changed to (element, data, layout)
				// 2.) The data is now an object containing the selected inputs by the user, as well as the crossfilter object governing the data. Therefore the internal access to the data has to be changed. This is done on point of access to the data to ensure that the crossfilter selections are correctly applied.
				// 3.) Some actions are performed from outside of the object, therefore the ctrl has to be passed in. That is why the ctrl is hidden in layout now.
			
				// Setup the object that will internally handle all parts of the chart.
				/*
				var ctrl = {
					data: data.cfData,
					svg: undefined,
					view: {xVar: data.xProperty,
						   yVar: data.yProperty,
						   cVar: "speed",
						   gVar: "speed",
						   dataAR: undefined,
						   viewAR: undefined,
						   t: undefined},
					tools: {xscale: undefined,
							yscale: undefined,
							cscale: undefined},
					format: {
						margin: {top: 17, right: 25, bottom: 20, left: 20},
						axesMargin: {left: 25, bottom: 20},
						width: undefined,
						height: layout.height,
						transitionTime: 500
					}
				} // ctrl
				*/
				
				var ctrl = layout.ctrl
				
				var b = cfD3Scatter
				var s = cfD3Scatter.setupPlot
				var i = cfD3Scatter.addInteractivity
				var figure = d3.select(element)
				
				// Add the manual selection toggle to its title.
				i.updatePlotTitleControls(element)
				
				// Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.
				s.setupPlotWithInteractiveAxes(ctrl, figure)
				
				// Create the svg with all required children container groups and append it to the appropriate backbone div.
				s.curateSvg(figure, ctrl) 
				
				// Add in the controls for the y axis.
				s.appendVerticalSelection(figure.select(".leftAxisControlGroup"), ctrl)
				
				// Add in the controls for the x axis.
				s.appendHorizonalSelection(figure.select(".bottomAxisControlGroup"), ctrl)
				
				
				// Setup the scales for plotting
				s.setupPlotTools(ctrl)
				
				
				// Scatter plot specific interactivity.
				i.addButtonDropdownTools.make(figure.select(".bottomLeftControlGroup"), ctrl)
				i.addAxisScaling(ctrl)
				
				
				// General interactivity
				i.addZooming(ctrl)
				
				
				// Draw the actual plot. The first two inputs are dummies.
				b.render(element, data, layout)
			
			
			}, // make
		
			render: function render(element, data, layout){
				// The first two inputs are dummies.
				var ctrl = layout.ctrl
		
				var h = cfD3Scatter.helpers
				var i = cfD3Scatter.addInteractivity
				
				// Check to adjust the width of the plot in case of a redraw.
				cfD3Scatter.setupPlot.rescaleSvg(ctrl)
				
				// Get the data to draw.
				var pointData = h.getPointData(ctrl)
				
				
				// Accessor functions
				var accessor = h.getAccessors(ctrl)

				
				
				// Deal with the points
				var points = ctrl.svg
				  .select(".data")
				  .selectAll("circle")
				  .data(pointData)
				  
				points.enter()
				  .append("circle")
					.attr("r", 5)
					.attr("cx", accessor.x )
					.attr("cy", accessor.y )
					.style("fill", accessor.c )
					.style("opacity", 1)
					.attr("clip-path", "url(#" + ctrl.svg.select("clipPath").attr("id") + ")")
					.attr("task-id", accessor.id )
					
					
					
				points
				  .transition()
				  .attr("r", 5)
				  .attr("cx", accessor.x )
				  .attr("cy", accessor.y )
				  .style("fill", accessor.c )
				  .attr("task-id", accessor.id );
				 
				points.exit().remove();
				
				
				// Deal with the lines markup. Note that in case the data in the plot changes these might have to increase in size. Maybe just redo the lines in that case?
				i.addButtonDropdownTools.options.groupLine.updateLines(ctrl, ctrl.format.transitionTime)
				
				// Add in the axes
				h.axes.update(ctrl)
				
				// Highlight any manually selected tasks.
				i.addSelection(ctrl);
				h.updateManualSelections()
				
				// Add in the interactivity of the tooltips
				i.addPointTooltip(ctrl)
				i.addLineTooltip(ctrl)
				
				// AK: HACK
				// New session file needs to be written in case the variables changed..
				importExportFunctionality.saveSession.createSessionFileForSaving()
				
				
			}, // render
		
			update: function update(element, data, layout){
				
				// Needs to accept element, data, layout... Make an imposter function for now?? Or write a function that rebuilds the control?? Or both... The first two are dummy inputs.
				var ctrl = layout.ctrl
		
				// Do the update maually (outside of render) in order to remove the transition
				var h = cfD3Scatter.helpers
				var i = cfD3Scatter.addInteractivity
				
				// Check to adjust the width of the plot in case of a redraw.
				cfD3Scatter.setupPlot.rescaleSvg(ctrl)
				
				
				// Accessor functions
				var accessor = h.getAccessors(ctrl)
				
				// Update also runs on manual reselct of points, and on brushing in other plots. It therefore must support the addition and removal of points.
				/*
				ctrl.svg
				  .select(".data")
				  .selectAll( "circle" )
					.attr("r", 5)
					.attr("cx", accessor.x )
					.attr("cy", accessor.y )
					.attr("task-id", accessor.id )
					.style("fill", accessor.c )
				*/
				/////////////////////////////////////////////////////////////////
				
				// Get the data to draw.
				var pointData = h.getPointData(ctrl)
				
				// Deal with the points
				var points = ctrl.svg
				  .select(".data")
				  .selectAll("circle")
				  .data(pointData)
				 
				points.enter()
				  .append("circle")
					.attr("r", 5)
					.attr("cx", accessor.x )
					.attr("cy", accessor.y )
					.style("fill", accessor.c)
					.style("opacity", 1)
					.attr("clip-path", "url(#" + ctrl.svg.select("clipPath").attr("id") + ")")
					.attr("task-id", accessor.id )
					
					
				points
				  .attr("r", 5)
				  .attr("cx", accessor.x )
				  .attr("cy", accessor.y )
				  .style("fill", accessor.c)
				  .attr("task-id", accessor.id );
				 
				points.exit().remove();
					
				/////////////////////////////////////////////////////////////////
			
				// Update the markup lines
				i.addButtonDropdownTools.options.groupLine.updateLines(ctrl, 0)
				
				// Update the axes
				h.axes.update(ctrl)
			
			
				// Highlight any manually selected tasks.
				i.addSelection(ctrl);
				h.updateManualSelections()
					
					
				// Add in the interactivity of the tooltips
				i.addPointTooltip(ctrl)
				i.addLineTooltip(ctrl)
				
				// AK: HACK
				// New session file needs to be written in case the variables changed..
				importExportFunctionality.saveSession.createSessionFileForSaving()
			
			}, // update
			
		
			setupPlot: {
				// This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
				
				
				
				setupPlotWithInteractiveAxes: function setupPlotWithInteractiveAxes(ctrl, plot){
					/* This function makes the skeleton required for a plot that will have interactive inputs on both axes.
					_________________________________________________
					|| div | | div                                   |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||-----| |---------------------------------------|
					||-----| |---------------------------------------|
					|| div | | div                                   |
					||_____| |_______________________________________|
					
					*/
					
					var margin = {top: 20, right: 20, bottom: 30, left: 20}
				
					
					// Left Control
					var leftControls = plot
					  .append("div")
						.attr("class", "leftAxisControlGroup")
						.attr("style", "width: "+ ctrl.format.margin.left +"px; height: 100%; float: left")
						
					// Main plot with its svg.
					plot
					  .append("div")
						.attr("class", "plotContainer")
						.attr("style", "margin-left: " + ctrl.format.margin.left + "px")
					  
				
					// Bottom left corner div
					plot
					  .append("div")
						.attr("class", "bottomLeftControlGroup")
						.attr("style", "width: "+ ctrl.format.margin.left +"px; height: " + ctrl.format.margin.right + "px; float:left")
					
					
					// Bottom controls
					plot
					  .append("div")
						.attr("class", "bottomAxisControlGroup")
						.attr("style", "margin-left: " + ctrl.format.margin.left + "px; height: " + ctrl.format.margin.right + "px;")
						
						
				}, // setupPlotWithInteractiveAxes
				
				appendVerticalSelection: function appendVerticalSelection(container, ctrl){
		
					var s = container
					  .append("select")
						.attr("class", "select-vertical custom-select")
					
					ctrl.data.dataProperties.forEach(function(d){
						s.append("option")
						   .html(d)
					})		
					
					container
					  .append("text")
						.text( ctrl.view.yVar )
						.attr("class","txt-vertical")
					
					
					s.on("change", function(){
						
						var selectedVar = this.value
						
						// Change the text.
						d3.select(this.parentElement)
						  .select(".txt-vertical")
						  .text( selectedVar )
						  
						// Update the y-variable for the plot.
						ctrl.view.yVar = selectedVar
						
						// Reset the AR values.
						ctrl.view.dataAR = undefined
						ctrl.view.viewAR = undefined
						
						cfD3Scatter.setupPlot.setupPlotTools(ctrl)
						
						
						// Create dummies.
						var dummyElement = ''
						var dummyData = ''
						var dummyLayout = {ctrl: ctrl}
						cfD3Scatter.render(dummyElement, dummyData, dummyLayout)
					})
				
				}, // appendVerticalSelection
				
				appendHorizonalSelection: function appendHorizonalSelection(container, ctrl){
				
					var s = container
					  .append("select")
						.attr("class", "custom-select")
						.attr("dir","rtl")
						.attr("style", 'float:right;')
					
					ctrl.data.dataProperties.forEach(function(d){
						s.append("option")
						   .attr("dir","ltr")
						   .html(d)
					})		
					
					s.on("change", function(){
						
						var selectedVar = this.value
						  
						// Update the y-variable for the plot.
						ctrl.view.xVar = selectedVar
						
						// Reset the AR values.
						ctrl.view.dataAR = undefined
						ctrl.view.viewAR = undefined
						
						cfD3Scatter.setupPlot.setupPlotTools(ctrl)
						
						// Create dummies.
						var dummyElement = ''
						var dummyData = ''
						var dummyLayout = {ctrl: ctrl}
						cfD3Scatter.render(dummyElement, dummyData, dummyLayout)
					})
					
				}, // appendHorizonalSelection
			
				curateSvg: function curateSvg(figure, ctrl){


					var plotContainer = figure.select(".plotContainer")

					// These are margins of the entire drawing area including axes.
					var margin = ctrl.format.margin
					var axesMargin = ctrl.format.axesMargin
					
					
					// Width of the plotting area is the width of the div intended to hold the plot (.plotContainer).
					var width = ctrl.format.width
					if(width == undefined){
						width = plotContainer.node().offsetWidth - margin.left - margin.right
					}
					
					// If undefined the height is the same as width
					var height = ctrl.format.height
					if(height == undefined){
						height = width
					}
					
					
					
					// The plot will contain some axes which will take up some space. Therefore the actual plot width will be different to the width of the entire graphic. Same is true for the height. The outer and inner svg only touch on the right border - there is no margin there.
					var plotWidth = width - axesMargin.left - 20
					var plotHeight = height - axesMargin.bottom - margin.top
					
					// Outer svg. This is required to separate the plot from the axes. The axes need to be plotted onto an svg, but if the zoom is applied to the same svg then the zoom controls work over the axes. If rescaling of individual axes is needed the zoom must therefore be applied to a separate, inner svg.
					// This svg needs to be translated to give some space to the controls on the y-axes.
					var svg = plotContainer
						.append("svg")
							.attr("width", width)
							.attr("height", height)
							.attr("plotWidth", plotWidth)
							.attr("plotHeight", plotHeight)
							.attr("transform", makeTranslate(margin.left, 0) )
							
					
					// Inner svg. This will now hold several groups, such as g.axis--x, g.axis--y, g.markup, g.data, clipPath,...
					var plotArea = svg.append("svg")
							.attr("class", "plotArea")
					
					// 25, 20 are margins for the axes. If too small the ticks will be obscured. This translation needs to be applied to all elements in hte inner svg. The grouping of graphic primitives in "g" is useful, as any transformation applied to a g is applied to its children automatically.
					var axesTranslate = makeTranslate(axesMargin.left, axesMargin.bottom)
					
					// Make a group that will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. This group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.
					plotArea
						.append("g")
							.attr("class", "markup")
							.attr("transform",  axesTranslate)
						.append("rect")
								.attr("width", plotWidth )
								.attr("height", plotHeight )
								.style("fill", "rgb(255,255,255)")	
					
					// Group holding the primary data representations. Needs to be after g.markup, otherwise the white rectangle hides all the elements.
					plotArea
						.append("g")
							.attr("class", "data")
							.attr("transform", axesTranslate)
					
					// The zoom needs some restrictions on where it can draw, which is why the clipPath is added. Not sure why this one doesn't need to be translated - if it is the clipping is done wrong.
					svg.append("clipPath")
							.attr("id", "zoomClip")
						  .append("rect")
							.attr("width", plotWidth )
							.attr("height", plotHeight )
							
					// Group for the x axis
					svg.append("g")
						.attr( "class", "axis--x")
						.attr( "transform", makeTranslate(axesMargin.left,  axesMargin.bottom + plotHeight) )
						
						
					// Group for the y axis
					svg.append("g")
						.attr( "class", "axis--y")
						.attr( "transform", axesTranslate )
						
						
						
					// Update the control object.
					ctrl.svg = svg
						
						
					function makeTranslate(x,y){
						return "translate("+[x, y].join()+")"
					} // makeTranslate	
							
				}, // curateSvg
				
				rescaleSvg: function rescaleSvg(ctrl){
					
					

					// These are margins of the entire drawing area including axes.
					var margin = ctrl.format.margin
					var axesMargin = ctrl.format.axesMargin
					
					
					// Width of the plotting area is the width of the div intended to hold the plot (.plotContainer).
					var width = ctrl.format.width
					if(width == undefined){
						width = ctrl.svg.node().parentElement.parentElement.offsetWidth - margin.left - margin.right
					}
					
					// If undefined the height is the same as width
					var height = ctrl.format.height
					if(height == undefined){
						height = width
					}
					
					
					
					// The plot will contain some axes which will take up some space. Therefore the actual plot width will be different to the width of the entire graphic. Same is true for the height. The outer and inner svg only touch on the right border - there is no margin there.
					var plotWidth = width - axesMargin.left - 20
					var plotHeight = height - axesMargin.bottom - margin.top
					
					// Outer svg. This is required to separate the plot from the axes. The axes need to be plotted onto an svg, but if the zoom is applied to the same svg then the zoom controls work over the axes. If rescaling of individual axes is needed the zoom must therefore be applied to a separate, inner svg.
					// This svg needs to be translated to give some space to the controls on the y-axes.
					var svg = ctrl.svg
							.attr("width", width)
							.attr("height", height)
							.attr("plotWidth", plotWidth)
							.attr("plotHeight", plotHeight)
							.attr("transform", makeTranslate(margin.left, 0) )
							
					
					// Inner svg. This will now hold several groups, such as g.axis--x, g.axis--y, g.markup, g.data, clipPath,...
					var plotArea = svg.select(".plotArea")
							
					
					// 25, 20 are margins for the axes. If too small the ticks will be obscured. This translation needs to be applied to all elements in hte inner svg. The grouping of graphic primitives in "g" is useful, as any transformation applied to a g is applied to its children automatically.
					var axesTranslate = makeTranslate(axesMargin.left, axesMargin.bottom)
					
					// Make a group that will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. This group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.
					plotArea
						.select("g.markup")
							.attr("transform",  axesTranslate)
						.select("rect")
								.attr("width", plotWidth )
								.attr("height", plotHeight )
								.style("fill", "rgb(255,255,255)")	
					
					// Group holding the primary data representations. Needs to be after g.markup, otherwise the white rectangle hides all the elements.
					plotArea
						.select("g.data")
							.attr("transform", axesTranslate)
					
					// The zoom needs some restrictions on where it can draw, which is why the clipPath is added. Not sure why this one doesn't need to be translated - if it is the clipping is done wrong.
					svg.select("clipPath")
							.attr("id", "zoomClip")
						  .select("rect")
							.attr("width", plotWidth )
							.attr("height", plotHeight )
							
					
						
						
						
					// Update the scale domains.
					var ranges = cfD3Scatter.setupPlot.findPlotDimensions(svg)
					ctrl.tools.xscale.range( ranges.x )
					ctrl.tools.yscale.range( ranges.y )
				
						
					function makeTranslate(x,y){
						return "translate("+[x, y].join()+")"
					} // makeTranslate	
					
				}, // rescaleSvg
				
				setupPlotTools: function setupPlotTools(ctrl){
		
					// The plot tools are either setup based on data (e.g. upon initialisation), or on where the user has navigated to.
					var bounds = cfD3Scatter.setupPlot.getPlotBounds(ctrl)
					
					
					// Create the required scales.
					ctrl.tools.xscale = d3.scaleLinear()
						.range( bounds.range.x )
						.domain( bounds.domain.x );

					ctrl.tools.yscale = d3.scaleLinear()
						.range( bounds.range.y )
						.domain( bounds.domain.y );
					
					// The internal color scale might change due to the user changing hte data, but this should not reset the color scale.
					if(ctrl.tools.cscale == undefined){
						ctrl.tools.cscale = function(){return "cornflowerblue"}
					} // if
					
				}, // setupPlotTools
				
				getPlotBounds: function getPlotBounds(ctrl){
					// This function should determine the domain of the plot and use it to control the plots aspect ratio.
					var h = cfD3Scatter.setupPlot
					
					// Get the data to draw.
					var pointData = cfD3Scatter.helpers.getPointData(ctrl)
					
					// Get the bounds based on the data.
					var domain = h.findSeriesMinMax(pointData, ctrl.view.xVar, ctrl.view.yVar)
					var range  = h.findPlotDimensions(ctrl.svg)
					
					
					
					
					if(ctrl.view.viewAR !== undefined){
						
						// Adjust the plot domain to preserve an aspect ratio of 1, but try to use up as much of the drawing area as possible.
						h.adjustAR(range, domain, ctrl.view.viewAR)
						
					} else {
						// The aspect ratio is the ratio between pixels per unit of y axis to the pixels per unit of the x axis. As AR = 2 is expected to mean that the n pixels cover 2 units on y axis, and 1 unit on x axis teh actual ration needs to be ppdx/ppdy.
						
						ctrl.view.dataAR = h.calculateAR(range, domain)
						ctrl.view.viewAR = h.calculateAR(range, domain)
					}// switch
					
					
					// Finally, adjust the plot so that there is some padding on the sides of the plot.
					h.adjustPadding(range, domain)
					
					return {domain: domain, range: range}
				
				
				
				}, // getPlotBounds
				
				adjustPadding: function adjustPadding(range, domain){
					// The padding must be equal both on the x and y axes in terms of pixels used for padding. Specify this simply in terms of pixels. This inadvertently impacts the AR of the actual final plot.
					var padding = 10
				
					var xPad = ( d3.max(domain.x) - d3.min(domain.x) ) / (d3.max(range.x) - d3.min(range.x))*padding 
					var yPad = ( d3.max(domain.y) - d3.min(domain.y) ) / (d3.max(range.y) - d3.min(range.y))*padding
					
					domain.x[0] = domain.x[0] - xPad
					domain.x[1] = domain.x[1] + xPad
					
					domain.y[0] = domain.y[0] - yPad
					domain.y[1] = domain.y[1] + yPad
					
				
				}, // adjustPadding
				
				calculateAR: function calculateAR(range, domain){
					var ppdx = (range.x[1] - range.x[0]) / (domain.x[1] - domain.x[0])
					var ppdy = (range.y[0] - range.y[1]) / (domain.y[1] - domain.y[0])
					return ppdx / ppdy
				}, // calculateAR
							
				adjustAR: function adjustAR(range, domain, AR){
				
					// The limits of the data definitely need to be within the plot.
					// If the x range is fixed, then there is a maximum AR that can be imposed. If the forced AR is larger the x range will need to be adjusted to display it appropriately
					
					// The smaller of these will be the dominating one.
					var xAR = (d3.max(range.x) - d3.min(range.x)) / ( d3.max(domain.x) - d3.min(domain.x) )
					var yAR = (d3.max(range.y) - d3.min(range.y)) / ( d3.max(domain.y) - d3.min(domain.y) )

					if(xAR*AR <= yAR){
						// Resize the y domain.
						var yDiff = (d3.max(range.y) - d3.min(range.y)) / (xAR/AR)
						domain.y[1] = domain.y[0] + yDiff
					} else {
						// Resize the x domain.
						var xDiff = (d3.max(range.x) - d3.min(range.x)) / (yAR*AR)
						domain.x[1] = domain.x[0] + xDiff

					} // if
				
				}, // 
						
				findPlotDimensions: function findPlotDimensions(svg){
				
					return {x: [0, Number( svg.attr("plotWidth") )],     y: [Number( svg.attr("plotHeight") ), 0]}
				
				
				}, // findPlotDimensions
					
				findSeriesMinMax: function findSeriesMinMax(data, xVar, yVar){
					
					// Dealing with single array.
					var xMinVal = d3.min(data, xAccessor)
					var yMinVal = d3.min(data, yAccessor)
				
					var xMaxVal = d3.max(data, xAccessor)
					var yMaxVal = d3.max(data, yAccessor)
					
					return {x: [xMinVal, xMaxVal], y: [yMinVal, yMaxVal]}
				
				
				
					function xAccessor(d){return d[xVar]}
					function yAccessor(d){return d[yVar]}
					
				} // findSeriesMinMax
				
			
			}, // setupPlot
		
			addInteractivity: {
			
				addButtonDropdownTools: {
				
					make: function make(container, ctrl){
					
						// Shorthand handles.
						var h = cfD3Scatter
							.addInteractivity
							.addButtonDropdownTools
						var o = h.options
						var makeOptions = h.helpers.getMetadataOptions
						
						// Make the control for the menu
						var plotOptionGroups = [
							{name:"Color", options: makeOptions(ctrl, o.groupColor)},
							{name:"Group", options: makeOptions(ctrl, o.groupLine.make)},
							{name:"AR"   , options:[], event: function(){ o.toggleAR(ctrl)   }}
						  ]
						
						// Makethe menu
						h.addAccordionDropdownMenu(container, plotOptionGroups)
					
					}, // make
					
					addAccordionDropdownMenu: function addAccordionDropdownMenu(container, optionGroups){
			
						// Add in the container for the whole group.
						var menuWrapper = container
						  .append("div")
							.attr("class", "dropup dropdown-accordion")
							
						// Add in the toggle button
						menuWrapper
						  .append("button")
							.attr("class", "btn dropdown-toggle")
							.attr("data-toggle", "dropdown")
							.html("O")
						  .append("span")
							.attr("class", "glyphicon glyphicon-option-vertical")
							
						// Add in the actual menu
						var menu = menuWrapper
						  .append("ul")
							.attr("class", "dropdown-menu dropup")
							
						// Add in the groups
						var groups = menu
						  .selectAll("div")
						  .data(optionGroups)
						  .enter()
						  .append("div")
							.attr("class", "dropup")
						  
						var s = "panel-collapse collapse"
							
						groups.each(function(d){
							var div = d3.select(this)
							
							
							var style = "list-group-item"
							var type = d.options.length < 1 ? "option" : "collapse"
							
							// Append the group items
							// list-group-item | menu-item
							div.append("p")
								 .attr("class", style)
								 .attr("type", type)
								 .html(d.name)
							   
								 
							// Append the group options
							var submenu = div.append("ul")
								 .attr("class", s)
							
							submenu
							  .selectAll("li")
							  .data(d.options)
							  .enter()
								.append("li")
								  .attr("class", style)
								  .html(function(option){return option.name})
								  .on("click", function(option){
									
									
									var isAlreadyActive = d3.select(this).attr("class") == style + " active"
									
									// Set the active status.
									submenu.selectAll("li")
									  .attr("class", style)
									
									if(!isAlreadyActive){d3.select(this).attr("class", style + " active")}
									
									// Fire the option event
									option.event()
								  })
								  
							// Functionality for empty groups. Note that if all the group headers should have on click events this needs to be coordinated with the prevention of default functionality.
							if(d.event != undefined){
								div.select("p").on("click", d.event)
							} // if
							
						}) // each
						
						// Add the functionality
						container.select('.dropdown-toggle').on('click', function (event) {
						  // Collapse accordion every time dropdown is shown
						  d3.select(this.parentElement)
							.selectAll(".panel-collapse")
							  .attr("class", s + " hide")
						});

						
						
						container.select('.dropdown-menu').selectAll("p[type='collapse']").on('click', function () {
						  
						  // Stop the default behaviour.
						  d3.event.preventDefault();
						  d3.event.stopPropagation();
						  
						  // Determine the action that should be performed.
						  var panel = d3.select(this.parentElement)
							.select(".panel-collapse")
						  var action = s + " show"
						  if(panel.attr("class") == action){
							action = s + " hide"
						  } // if
						  
						  // Hide all the collapsible elements.
						  d3.select(this.parentElement.parentElement)
							.selectAll(".panel-collapse")
							  .attr("class", s + " hide")
							  
						  // Toggle the collapse
						  panel
							.attr("class", action)
						  
						});
					
					}, // addAccordionDropdownMenu
					
					
				
					options: {
					
						groupLine: {  
						
						make: function make(ctrl, varName){
							
							// Shorthand handle
							var h = cfD3Scatter.addInteractivity.addButtonDropdownTools.options.groupLine
							
							// Options to cover
							var noLines = ctrl.svg.select(".markup").selectAll("path").empty()
							var linesVarSame = ctrl.view.gVar == varName
							
							// Update the control object.
							ctrl.view.gVar = varName

							if( noLines ){
								// 1: no existing lines - draw new lines
								h.drawLines(ctrl)
							
							} else if ( linesVarSame ){ 
								// 2: existing lines - same var -> remove lines
								h.removeLines(ctrl)
								
								// The lines were toggled off. Reflect in the control object.
								ctrl.view.gVar = undefined
								
							} else {
								// 2: existing lines - diff var -> remove and add
								h.replaceLines(ctrl)
							
							} // if
							
							
							
						
						}, // make
						
						
							
							
							
						drawLines: function drawLines(ctrl){
						
							// Shorthand handles.
							var h = cfD3Scatter
								.addInteractivity
								.addButtonDropdownTools
								
							// Get the data to draw.
							var pointData = cfD3Scatter.helpers.getPointData(ctrl)
							
							// Retrieve all the series that are needed.
							var s = h.helpers.getUniqueArraySeries(pointData, ctrl.view.gVar)
							
								
							// Now draw a line for each of them.
							var paths = ctrl.svg.select(".markup").selectAll("path")
							  .data(s)
							  .enter()
							  .append("path")
							  .attr("stroke", "black")
							  .attr("stroke-width", "2")
							  .attr("fill", "none")
							  .attr("clip-path", "url(#" + ctrl.svg.select("clipPath").attr("id") + ")")
							
							// Do the actual drawing of it in the update part.
							h.options.groupLine.updateLines(ctrl, ctrl.format.transitionTime)
							
							
							// Update the tooltips. These can be missing if new data is added.
							cfD3Scatter.addInteractivity.addLineTooltip(ctrl)
						  
						}, // drawLines
						
						removeLines: function removeLines(ctrl){
							
							ctrl.svg.select(".markup").selectAll("path").each(function(){
							
								var totalLength = this.getTotalLength();
								
								d3.select(this)
									.transition()
									.duration(ctrl.format.transitionTime)
									.ease(d3.easeLinear)
									.attr("stroke-dashoffset", totalLength)
									.on("end", function(){d3.select(this).remove()})
							})   
						}, // removeLines
												
						replaceLines: function replaceLines(ctrl){
						
							var h = cfD3Scatter.addInteractivity.addButtonDropdownTools.options.groupLine
							
							// n is a coutner to allow tracking of when all the transitions have finished. This is required as the drawLines should only execute once at teh end.
							var n = 0
							ctrl.svg.select(".markup").selectAll("path").each(function(){
								n++
								var totalLength = this.getTotalLength();
								
								d3.select(this)
									.transition()
									.duration(ctrl.format.transitionTime)
									.ease(d3.easeLinear)
									.attr("stroke-dashoffset", totalLength)
									.on("end", function(){
										n--
										d3.select(this).remove()
										
										if(n == 0){ 
											h.drawLines(ctrl)
											
											// The lines were removed, therefore new tooltips are needed.
											cfD3Scatter.addInteractivity.addLineTooltip(ctrl)
										} // if
									}) // on
									
							}) // each
						}, // replaceLines
						
						updateLines: function updateLines(ctrl, t){
						
							// Accessor functions
							var accessor = cfD3Scatter.helpers.getAccessors(ctrl)
						
							var line = d3.line()
								.curve(d3.curveCatmullRom)
								.x( accessor.x )
								.y( accessor.y )
							
							var paths = ctrl.svg
							  .select(".markup")
							  .selectAll("path")
								
							// The whole animation uses the framework of dashed lines. The total length of the desired line is set for the length of the dash and the blank space. Then the transition starts offsetting the start point of the dash to make the 'movement'.	
							paths.each(function(){
												
								var path = d3.select(this)
									.attr("d", line)
								
								var totalLength = path.node().getTotalLength();
								
								path.attr("stroke-dasharray", totalLength+" "+totalLength)
									.attr("stroke-dashoffset", totalLength)
									.transition()
									  .duration(t)
									  .ease(d3.easeLinear)
									  .attr("stroke-dashoffset", 0);
							})
						
						} // updateLines
						
						}, // groupLine
					
						groupColor: function groupColor(ctrl, varName){
							
							// This functionality relies on the update to perform the actual change, and only configures the tools for the update to have the desired effect.
							
							// Setup the color function.
							if(ctrl.tools.cscale() == "cornflowerblue"){
								// The default behaviour of d3 color scales is that they extend the domain as new items are passed to it. Even if the domain is fixed upfront, the scale will extend its domain when new elements are presented to it.
								ctrl.tools.cscale = d3.scaleOrdinal(d3.schemeCategory10)
							} else if (ctrl.view.cVar != varName){
								ctrl.tools.cscale = d3.scaleOrdinal(d3.schemeCategory10)
							} else {
								ctrl.tools.cscale = function(){return "cornflowerblue"}
							} // if
							
							ctrl.view.cVar = varName
							
							// Create dummies.
							var dummyElement = ''
							var dummyData = ''
							var dummyLayout = {ctrl: ctrl}
							cfD3Scatter.update(dummyElement, dummyData, dummyLayout)
						}, // groupColor
					
						toggleAR: function toggleAR(ctrl){
							// This should stick to the ange specified by the user.
							
							
							if(ctrl.view.viewAR == 1){
								ctrl.view.viewAR = ctrl.view.dataAR
							} else {
								ctrl.view.viewAR = 1
							} // if
							
							// When adjusting the AR the x domain should stay the same, and only the y domain should adjust accordingly. The bottom left corner should not move.
							
							// How many pixels per dx=1
							var xRange = ctrl.tools.xscale.range()
							var yRange = ctrl.tools.yscale.range()
							var xDomain = ctrl.tools.xscale.domain()
							var yDomain = ctrl.tools.yscale.domain()
							
							var xAR = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0])
							var yAR = xAR/ctrl.view.viewAR
							var yDomainRange = [yRange[0] - yRange[1]] / yAR
							var yDomain_ = [yDomain[0], 
											yDomain[0] + yDomainRange]
							
							
							ctrl.tools.yscale.domain( yDomain_ )
							
							// Create dummies.
							var dummyElement = ''
							var dummyData = ''
							var dummyLayout = {ctrl: ctrl}
							cfD3Scatter.render(dummyElement, dummyData, dummyLayout)
							
							// t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.
							ctrl.view.t = -1
							
							
						} // toggleAR
					
					}, // options
				
					helpers: {
					
						getMetadataOptions: function getMetadataOptions(ctrl, event){
						
							var options = []
							
							ctrl.data.metaDataProperties.forEach(function(d){
								options.push( {name: d, event: function(){
									// this is the option object being created here.
									event(ctrl, this.name)
								}} )
							}) // forEach
							
						  return options
						
						
						}, // getMetadataOptions
						
						getUniqueArrayValues: function getUniqueArrayValues(array, varName){
							// This function returns all the unique values of property 'varName' from an array of objects 'array'.
							var u = []
							array.forEach(function(d){
								if( u.indexOf( d[varName] ) == -1){
									u.push( d[varName] )
								} // if
							})
						  return u
						
						}, // getUniqueArrayValues
					
						getUniqueArraySeries: function getUniqueSeries(array, varName){
						
							// Shorthand handles.
							var h = cfD3Scatter
								.addInteractivity
								.addButtonDropdownTools
								.helpers
						
							// First get the unique values of the variable used for grouping.
							var u = h.getUniqueArrayValues(array, varName)
						
						
							var s = []
							u.forEach(function(groupName){
								var groupData = array.filter(function(d){return d[varName] == groupName})
								s.push(groupData)
							})
						  return s
						
						} // getUniqueSeries
					
						
					} // helpers
				
				}, // addButtonDropdownTools
						
				addAxisScaling: function addAxisScaling(ctrl){
		
					var svg = ctrl.svg
		
					var mw = Number( svg.attr("plotWidth") )
					var downx = Math.NaN;
					var downscalex;
					
					var mh = Number( svg.attr("plotHeight") )
					var downy = Math.NaN;
					var downscaley;
				
					svg.select(".axis--x")
					  .on("mousedown", function(d) {
						
						var p = d3.event.x;
						downx = ctrl.tools.xscale.invert(p);
						downscalex = ctrl.tools.xscale;
						
					  });
					  
					svg.select(".axis--y")
					  .on("mousedown", function(d) {
						
						var p = d3.event.y;
						downy = ctrl.tools.yscale.invert(p);
						downscaley = ctrl.tools.yscale;
						
					  });
					  
					// attach the mousemove and mouseup to the body
					// in case one wonders off the axis line
					
					svg
					  .on("mousemove", function(d) {
						if (!isNaN(downx)) {
						  var px = d3.event.x
						  var dpx = d3.event.dx
						  if (dpx != 0) {
							ctrl.tools.xscale.domain([downscalex.domain()[0],  mw * (downx - downscalex.domain()[0]) / px + downscalex.domain()[0]]);
						  }
						  
							// Create dummies.
							var dummyElement = ''
							var dummyData = ''
							var dummyLayout = {ctrl: ctrl}
							cfD3Scatter.update(dummyElement, dummyData, dummyLayout)
						  
						  
						}
						
						
						if (!isNaN(downy)) {
						  var py = d3.event.y
						  var dpy = d3.event.dy
						  if (dpy != 0) {
							ctrl.tools.yscale.domain([downscaley.domain()[0],  mh * ( downy - downscaley.domain()[0]) / (mh - py) + downscaley.domain()[0]])
						  }
						  
							// Create dummies.
							var dummyElement = ''
							var dummyData = ''
							var dummyLayout = {ctrl: ctrl}
							cfD3Scatter.update(dummyElement, dummyData, dummyLayout)
						  
						}
						
						
						
					  })
					  .on("mouseup", function(d) {
						downx = Math.NaN;
						downy = Math.NaN;
						
						ctrl.view.t = -1
					  });
					  
					  
					  // The aspect ratio still needs to be recalculated
									
						 
					  
					  
				}, // addAxisScaling
				
				addZooming: function addZooming(ctrl){
					  
					// The current layout will keep adding on zoom. Rethink this for more responsiveness of the website.
					var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
				
					ctrl.svg.select(".plotArea").call(zoom);
					
					ctrl.svg.select(".plotArea").on("dblclick.zoom", null);
					
					// As of now (23/03/2020) the default zoom behaviour (https://d3js.org/d3.v5.min.js) does not support independantly scalable y and x axis. If these are implemented then on first zoom action (panning or scaling) will have a movement as the internal transform vector (d3.event.transform) won't corespond to the image. 
					
					// The transformation vector is based on the domain of the image, therefore any manual scaling of the domain should also change it. The easiest way to overcome this is to apply the transformation as a delta to the existing state.
					
					// ctrl.view.t is where the current state is stored. If it is set to -1, then the given zoom action is not performed to allow any difference between d3.event.transform and ctrl.view.t due to manual rescaling of the domain to be resolved.
					ctrl.view.t = d3.zoomIdentity
					
					
					function zoomed(){
						
						d3.selectAll(".d3-tip").remove();
						
						// Get the current scales, and reshape them back to the origin.
						var t = d3.event.transform
						var t0= ctrl.view.t
						
						// Check if there was a manual change of the domain
						if(t0 == -1){
							t0 = t
						}
						
						// Hack to get the delta transformation.
						var dt = d3.zoomIdentity
						dt.k = t.k / t0.k 
						dt.x = t.x - t0.x 
						dt.y = t.y - t0.y 
						
						
						// Simply rescale the axis to incorporate the delta event.  
						ctrl.tools.xscale = dt.rescaleX(ctrl.tools.xscale)
						ctrl.tools.yscale = dt.rescaleY(ctrl.tools.yscale)
						
						
						// Update the plot
						// Create dummies.
						var dummyElement = ''
						var dummyData = ''
						var dummyLayout = {ctrl: ctrl}
						cfD3Scatter.update(dummyElement, dummyData, dummyLayout)
						
						ctrl.view.t = t
						
					} // zoomed
					  

					  
				}, // addZooming
				
				addLineTooltip: function addLineTooltip(ctrl){
				  
					// This controls al the tooltip functionality.
				  
					var lines = ctrl.svg.select(".markup").selectAll("path");
				  
					lines.on("mouseover", tipOn)
						 .on("mouseout", tipOff);
				  
				    var tip_ = d3.selectAll(".d3-tip[type=lineTooltip]")
					if(!tip_.empty()){
						tip_.remove()
					} // if
					
					
				    var tip = createTip()
				  
					function createTip(){
						
						// Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
						var tip = d3.tip()
							.attr('class', 'd3-tip')
							.attr("type", "lineTooltip")
							.offset([-15, 0])
							.html(function (d) {
								return "<span>" + [ctrl.view.gVar,'=',d[0][ctrl.view.gVar]].join(' ') + "</span>";
							});
							
						// To control tip location another element must be added onto the svg. This can then be used as an anchor for the tooltip.
						var anchorPoint = ctrl.svg.select(".markup")
							.append("g")
								.style("display","none")
							.append("circle")
									.attr("class", "anchorPoint")
									.attr("r",1);
					
						ctrl.svg.call( tip );
						
					  return tip
						
					} // createTip
				  
					
					  
					  
					function tipOn(d) {
						lines.style("opacity", 0.2);
						d3.select(this)
							.style("opacity", 1.0)
							.style( "stroke-width", "4px" );
						
						
						var anchorPoint = ctrl.svg.select(".markup").select(".anchorPoint")
							.attr( "cx" , d3.mouse(this)[0] )
							.attr( "cy" , d3.mouse(this)[1] );
						
						tip.show(d, anchorPoint.node());
						
						
						
					}; // tipOn

					function tipOff(d) {
						lines.style("opacity", 1.0);
						d3.select(this)
							.style( "stroke-width", "2.5px" );
						
						tip.hide();
						
						
						
					}; // tipOff
				  
				  
				}, // addLineTooltip
				
				addPointTooltip: function addPointTooltip(ctrl){
					  
					// This controls al the tooltip functionality.
					  
					var points = ctrl.svg.selectAll("circle");
					  
					points.on("mouseover", tipOn)
						  .on("mouseout", tipOff);
					  
					// Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
					var tip = d3.tip()
					  .attr('class', 'd3-tip')
					  .attr("type", "pointTooltip")
					  .offset([-10, 0])
					  .html(function (d) {
						  return "<span>" + d.taskId + "</span>";
					  });
					  
					
					ctrl.svg.call( tip );
						  
						  
					function tipOn(d) {
						points.style("opacity", 0.2);
						d3.select(this).style("opacity", 1.0).attr("r", 7);
						tip.show(d);
						
						crossPlotHighlighting.on(d, "cfD3Scatter")
					}; // tipOn

					function tipOff(d) {
						points.style("opacity", 1);
						d3.select(this).attr("r", 5);
						tip.hide();
						
						crossPlotHighlighting.off(d, "cfD3Scatter")
					}; // tipOff
					  
					  
				}, // addPointTooltip
				
				// Legacy
				
				addSelection: function addSelection(ctrl){
					// This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
					
					var points = ctrl.svg.select("g.data").selectAll("circle");
					
					points.on("click", selectPoint)
					
					
					
					function selectPoint(d){
						// Toggle the selection
						var p = dbsliceData.data.scatterManualSelectedTasks
						
						// Is this point in the array of manually selected tasks?
						var isAlreadySelected = p.indexOf(d.taskId) > -1

						
						if(isAlreadySelected){
							// The poinhas currently been selected, but must now be removed
							p.splice(p.indexOf(d.taskId),1)
						} else {
							p.push(d.taskId)
						}// if
						
						
						
						// Highlight the manually selected options.
						cfD3Scatter.helpers.updateManualSelections()
						
					} // selectPoint
					
				}, // addSelecton
				
				addToggle: function addToggle(element){
				
					// THIS IS THE TOGGLE.
					// Additional styling was added to dbslice.css to control the appearance of the toggle.
					var controlGroup = d3.select(element.parentElement).select(".plotTitle").select(".ctrlGrp")
					
					var toggleGroup = controlGroup
					  .append("label")
						.attr("class", "switch float-right")
					var toggle = toggleGroup
					  .append("input")
						.attr("type", "checkbox")
					toggleGroup
					  .append("span")
						.attr("class", "slider round")
						
					// Add it's functionality.
					toggle.on("change", function(){ 
						
						var currentVal = this.checked
						
						// All such switches need to be activated.
						var allToggleSwitches = d3.selectAll(".plotWrapper[plottype='cfD3Scatter']").selectAll("input[type='checkbox']")
						
						allToggleSwitches.each(function(){
							
							this.checked = currentVal
							// console.log("checking")
						})
						
						// Update filters
						cfUpdateFilters( dbsliceData.data )
						
						render(dbsliceData.elementId, dbsliceData.session)
					})
					
				}, // addToggle
				
				updatePlotTitleControls: function updatePlotTitleControls(element){
				
					// Remove any controls in the plot title.
					plotHelpers.removePlotTitleControls(element)
					
					// Add the toggle to switch manual selection filter on/off
					cfD3Scatter.addInteractivity.addToggle(element)
					
					
				} // updatePlotTitleControls
				
				
				
			}, // addInteractivity
			
			helpers: {
			
				axes: {
					
					update: function update(ctrl){
					
						var xAxis = d3.axisBottom( ctrl.tools.xscale ).ticks(5);
						var yAxis = d3.axisLeft( ctrl.tools.yscale );
					
						ctrl.svg.select(".axis--x").call( xAxis )
						ctrl.svg.select(".axis--y").call( yAxis )
						
						cfD3Scatter.helpers.axes.updateTicks(ctrl)
					
					}, // update
					
					updateTicks: function updateTicks(ctrl){
					  
						// Update all the axis ticks.
						ctrl.svg.select(".axis--x")
						   .selectAll(".tick")
						   .selectAll("text")
							 .style("cursor", "ew-resize")
						   
						ctrl.svg.select(".axis--y")
						   .selectAll(".tick")
						   .selectAll("text")
							 .style("cursor", "ns-resize")
						   
						ctrl.svg.selectAll(".tick")
						   .selectAll("text")
						   .on("mouseover", function(){d3.select(this).style("font-weight", "bold")})
						   .on("mouseout" , function(){d3.select(this).style("font-weight", "normal")})
					}	// updateTicks
				
				}, // axes
			
				getAccessors: function getAccessors(ctrl){
				
				return {
					x: function xAccessor(d){ 
						return ctrl.tools.xscale( d[ctrl.view.xVar] ) 
						},
					y: function yAccessor(d){ 
						return ctrl.tools.yscale( d[ctrl.view.yVar] ) 
						},
					c: function cAccessor(d){ 
						return ctrl.tools.cscale( d[ctrl.view.cVar] ) 
						},
					id: function idAccessor(d){ 
						return d.taskId 
						}
					}
				}, // getAccessors
				
				getPointData: function getPointData(ctrl){
							
					var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVar);
					var dim = dbsliceData.data.dataDims[dimId];
					var pointData = dim.top(Infinity);
	  
				  return pointData;
					
				}, // getPointData
			
			
				updateManualSelections: function updateManualSelections(){
				
					// Loop through all scatter plots.
					var allScatterPlots = d3.selectAll(".plotWrapper[plottype='cfD3Scatter']")
					
					allScatterPlots.each(function(){
						var svg = d3.select(this).select("svg")
						// Instead of color change the border??
						// Default style
						svg.selectAll("circle").style("stroke", "none")
						
						// Color in selected circles.
						dbsliceData.data.scatterManualSelectedTasks.forEach(function(d){
							svg.selectAll("circle[task-id='" + d + "']")
							  .style("stroke", "rgb(255, 127, 14)")
							  .style("stroke-width", 4)
						}) //forEach
					}) // each
					
				} // updateManualSelections
			
			} // helpers
		
		} // cfD3Scatter
		

export { cfD3Scatter };