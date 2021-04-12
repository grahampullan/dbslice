import {dbsliceData} from "../core/dbsliceData.js"
import {builder} from "../core/builder.js"
import {color} from "../core/color.js"
import {crossPlotHighlighting} from "../core/crossPlotHighlighting.js";
import {plotHelpers} from "./plotHelpers.js"
import {filter} from "../core/filter.js"

export var cfD3Scatter = {
		
			name: "cfD3Scatter",
		
			make: function(ctrl){
				
				// Major differences from the standalone example to the implemented one:
				// 1.) The input arguments to the make have been changed to (element, data, layout)
				// 2.) The data is now an object containing the selected inputs by the user, as well as the crossfilter object governing the data. Therefore the internal access to the data has to be changed. This is done on point of access to the data to ensure that the crossfilter selections are correctly applied.
				// 3.) Some actions are performed from outside of the object, therefore the ctrl has to be passed in. That is why the ctrl is hidden in layout now.
			
				
				
				var s = cfD3Scatter.setupPlot
				var hs= plotHelpers.setupPlot
				var i = cfD3Scatter.interactivity
				var hi= plotHelpers.setupInteractivity.twoInteractiveAxes
				
				
				// Add the manual selection toggle to its title.
				// hs.twoInteractiveAxes.updatePlotTitleControls(ctrl)
				
				// Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.
				hs.twoInteractiveAxes.setupPlotBackbone(ctrl)
				
				// Create the svg with all required children container groups and append it to the appropriate backbone div.
				hs.general.rescaleSvg(ctrl)


				// Add in the controls for the y axis.
				hs.general.appendVerticalSelection( ctrl.figure, hi.onSelectChange.vertical(ctrl) )
				
				// Add in the controls for the x axis.
				hs.general.appendHorizontalSelection( ctrl.figure,hi.onSelectChange.horizontal(ctrl) )
				
				// Add teh button menu - in front of the update for it!
				hs.twoInteractiveAxes.buttonMenu.make(ctrl)
				
				// Get the variable options
				s.updateUiOptions(ctrl)
				
				
				// Setup the scales for plotting
				plotHelpers.setupTools.go(ctrl)
				
				
				// Scatter plot specific interactivity.
				hi.addAxisScaling(ctrl)
				
				
				// General interactivity
				hi.addZooming(ctrl)
				i.createLineTooltip(ctrl)
				i.createPointTooltip(ctrl)
				
				// Draw the actual plot. The first two inputs are dummies.
				cfD3Scatter.update(ctrl)
			
			
			}, // make
			
			update: function update(ctrl){
				// On re-render the 'update' is called in the render, therefore it must exist. To conform with the line plot functionality the update plot here executes the redraw for now. Later on it should handle all preparatory tasks as well.
				
				cfD3Scatter.draw.plotDataExtent(ctrl)
				
				cfD3Scatter.draw.plotCurrentSelection(ctrl)
				
				cfD3Scatter.refresh(ctrl)
				
			}, // update
		
		
			draw: {
				
				plotDataExtent: function plotDataExtent(ctrl){
					
					// Plot everything there is.
					
					

					// Accessor functions
					var accessor = cfD3Scatter.helpers.getAccessors(ctrl)
					var clipPath = "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")"
					
					
					// Get the data to draw.
					var pointData = cfD3Scatter.helpers.getPointData(ctrl)
						
					// Deal with the points
					var points = ctrl.figure.select("svg.plotArea")
					  .select(".data")
					  .selectAll("circle")
					  .data(pointData, d => d.taskId)
					 
					points.join(
					  enter => enter.append("circle")
						.attr("r", 5)
						.attr("cx", accessor.x )
						.attr("cy", accessor.y )
						.style("fill", "Gainsboro")
						.style("opacity", 1)
						.attr("clip-path", clipPath)
						.attr("task-id", accessor.id )
						.each(function(d){ 
							cfD3Scatter.interactivity.addPointTooltip(ctrl, this) 
						}),
					  update => update,
					  exit => exit.remove()
					)

					
				}, // plotDataExtent
				
				plotCurrentSelection: function plotCurrentSelection(ctrl){
					// Current selection separates the current selection from the background data extent by coloring them appropriately.
					// Change the properties of the selected part.
					
					// Get the data to draw.
					var accessor = cfD3Scatter.helpers.getAccessors(ctrl)
					var pointData = cfD3Scatter.helpers.getPointData(ctrl)
					var taskIds = pointData.map(d=>d.taskId)
					
					// Weird... right now all data should still be drawn...
					
					var gData = ctrl.figure
						  .select("svg.plotArea")
						  .select("g.data")
						  
					gData.selectAll("circle")
					    .filter(function(d_){return taskIds.includes(d_.taskId)})
						.style("fill", d=> accessor.c(d) )
						.raise()
					
					// If drawing was needed, then also the lines need to be updated. Drawing should only be updated if the variable is actiually selected.
					ctrl.view.gVarOption.action = ctrl.view.gVarOption.val ? "draw" : undefined
					
				} // plotCurrentSelection
				
			}, // draw
		
			refresh: function refresh(ctrl){
				// Update also runs on manual reselct of points, and on brushing in other plots. It therefore must support the addition and removal of points.
		
				// Refresh is called on zoom!! On zoom nothing is entering or leaving, it's just readjusted.
				
				var h = cfD3Scatter.helpers
				var i = cfD3Scatter.interactivity
				
				// Check to adjust the width of the plot in case of a redraw.
				plotHelpers.setupPlot.general.rescaleSvg(ctrl)
				
				
				// Accessor functions
				var accessor = h.getAccessors(ctrl)
				

				// Refresh point positions
				var points = ctrl.figure.select("svg.plotArea")
				  .select(".data")
				  .selectAll("circle")
				  .transition()
				    .duration(ctrl.view.transitions.duration)
				    .attr("r", 5)
				    .attr("cx", accessor.x )
				    .attr("cy", accessor.y )
				    .attr("task-id", accessor.id );
				
					
			
				// Update the markup lines to follow on zoom
				i.groupLine.update(ctrl)
				
				// Update the axes
				h.axes.update(ctrl)
			
			
				// Highlight any manually selected tasks.
				i.addSelection(ctrl);
					
					
				// Add in the interactivity of the tooltips
				i.addLineTooltip(ctrl)
				
				
			
			}, // refresh
			
			rescale: function rescale(ctrl){
				// What should happen if the window is resized?
				// 1.) The svg should be resized appropriately
				plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
				// 2.) The plot tools need to be updated
				plotHelpers.setupTools.go(ctrl)
			
				// 3.) The plot needs to be redrawn
				cfD3Scatter.refresh(ctrl)
				
			}, // rescale
		
			setupPlot: {
				
				
				// This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
				
				updateUiOptions: function updateUiOptions(ctrl){
					// Improve this so that in case the metadata gets changed this changes appropriately - e.g. if the new metadata has the same values, then these options should keep them.
					var gh = plotHelpers.setupPlot.general
					var h = plotHelpers.setupPlot.twoInteractiveAxes
					
										 
					// Update the actual menus
					gh.updateVerticalSelection(ctrl)
					gh.updateHorizontalSelection(ctrl)
					
					
					
					// Update the dropup menu
					h.buttonMenu.update(ctrl, assembleButtonMenuOptions() )
					
					
					
					function assembleButtonMenuOptions(){
						// The button menu holds several different options that come from different sources. One is toggling the axis AR of the plot, which has nothing to do with the data. Then the coloring and grouping of points using lines, which relies on metadata categorical variables. Thirdly, the options that are in the files loaded on demand are added in.
						
						// Make a custom option that fires an aspect ratio readjustment.
						var arOption = {
							name: "AR",
							val: undefined,
							options: ["User / Unity"],
							event: cfD3Scatter.interactivity.toggleAR
						} // arOption
						
						
						// Make functionality options for the menu.
						var codedPlotOptions = [color.settings]
						
						return codedPlotOptions
					
				} // assembleButtonMenuOptions

					
				}, // updateUiOptions
						
				// Helpers for setting up plot tools.
				findPlotDimensions: function findPlotDimensions(svg){
				
					return {x: [0, Number( svg.select("g.data").attr("width") )],     y: [Number( svg.select("g.data").attr("height") ), 0]}
				
				
				}, // findPlotDimensions
					
				findDomainDimensions: function findDomainDimensions(ctrl){
					
					// Get the data to draw.
					var pointData = cfD3Scatter.helpers.getPointData(ctrl)
					
					// Dealing with single array.
					var xMinVal = d3.min(pointData, xAccessor)
					var yMinVal = d3.min(pointData, yAccessor)
				
					var xMaxVal = d3.max(pointData, xAccessor)
					var yMaxVal = d3.max(pointData, yAccessor)
					
					return {x: [xMinVal, xMaxVal], y: [yMinVal, yMaxVal]}
				
				
				
					function xAccessor(d){return d[ctrl.view.xVarOption.val]}
					function yAccessor(d){return d[ctrl.view.yVarOption.val]}
					
				} // findDomainDimensions
				
			
			}, // setupPlot
		
			interactivity: {
				
				onSelectChange: function onSelectChange(ctrl){
					
					// Reset the AR values.
					ctrl.view.dataAR = undefined
					ctrl.view.viewAR = undefined
					
					// Update the plot tools
					plotHelpers.setupTools.go(ctrl)
					
					// Update transition timings
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.animated()
					
					// Update plot itself
					cfD3Scatter.update(ctrl)
					
				}, // onSelectChange
				
				// Tooltips
				createLineTooltip: function createLineTooltip(ctrl){
					// The tooltips are shared among the plots, therefore check if the tooltip is already available first.
					
					
					if(ctrl.view.lineTooltip == undefined){
						ctrl.view.lineTooltip = createTip()
					} // if
					
					
					
					function createTip(){
						
						// Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
						var tip = d3.tip()
							.attr('class', 'd3-tip')
							.attr("type", "cfD3ScatterLineTooltip")
							.offset([-15, 0])
							.html(function (d) {
								return "<span>" + [ctrl.view.gVarOption.val,'=',d[0][ctrl.view.gVarOption.val]].join(' ') + "</span>";
							});
							
							ctrl.figure.select("svg.plotArea").call( tip );
						
						
					  return tip
						
					} // createTip
					
				}, // createLineTooltip
				
				addLineTooltip: function addLineTooltip(ctrl, lineDOM){
				  
					// This controls al the tooltip functionality.
				  
					var lines = d3.select(lineDOM);
				  
					lines.on("mouseover", tipOn)
						 .on("mouseout", tipOff);
				  
					  
					function tipOn(d) {
						lines.style("opacity", 0.2);
						d3.select(this)
							.style("opacity", 1.0)
							.style( "stroke-width", "4px" );
						
						
						var anchorPoint = ctrl.figure.select("svg.plotArea").select(".background").select(".anchorPoint")
							.attr( "cx" , d3.mouse(this)[0] )
							.attr( "cy" , d3.mouse(this)[1] );
						
						ctrl.view.lineTooltip.show(d, anchorPoint.node());
						
						
						
					}; // tipOn

					function tipOff(d) {
						lines.style("opacity", 1.0);
						d3.select(this)
							.style( "stroke-width", "2.5px" );
						
						ctrl.view.lineTooltip.hide();
						
						
						
					}; // tipOff
				  
				  
				}, // addLineTooltip
				
				createPointTooltip: function createPointTooltip(ctrl){
					
					if(ctrl.view.pointTooltip == undefined){
						ctrl.view.pointTooltip = createTip()
					} // if
					
					function createTip(){
						
						var tip = d3.tip()
						  .attr('class', 'd3-tip')
						  .attr("type", "pointTooltip")
						  .offset([-10, 0])
						  .html(function (d) {
							  return "<span>" + d.taskId + "</span>";
						  });
						  
						  ctrl.figure.select("svg.plotArea").call( tip );
						  
						return tip
						
					} // createTip
					
				}, // createPointTooltip
				
				addPointTooltip: function addPointTooltip(ctrl, pointDOM){
					  
					// This controls al the tooltip functionality.
					  
					var points = d3.select(pointDOM)
					  
					points.on("mouseover", tipOn)
						  .on("mouseout", tipOff);
					  
						  
						  
					function tipOn(d) {
						points.style("opacity", 0.2);
						d3.select(this).style("opacity", 1.0).attr("r", 7);
						ctrl.view.pointTooltip.show(d);
						
						crossPlotHighlighting.on(d, "cfD3Scatter")
					}; // tipOn

					function tipOff(d) {
						points.style("opacity", 1);
						d3.select(this).attr("r", 5);
						ctrl.view.pointTooltip.hide();
						
						crossPlotHighlighting.off(d, "cfD3Scatter")
					}; // tipOff
					  
					  
				}, // addPointTooltip
				
				
				// Manual selection
				addSelection: function addSelection(ctrl){
					// This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
					
					
					
					var points = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle");
					
					points.on("click", selectPoint)
								
					function selectPoint(d){
						
						
						var filteredPoints = cfD3Scatter.helpers.getPointData()
						
						if(filteredPoints.includes(d)){
							
							// Toggle the selection
							var p = dbsliceData.data.manuallySelectedTasks
							
							// Is this point in the array of manually selected tasks?
							var isAlreadySelected = p.indexOf(d.taskId) > -1
							if(isAlreadySelected){
								// The poinhas currently been selected, but must now be removed
								p.splice(p.indexOf(d.taskId),1)
							} else {
								p.push(d.taskId)
							}// if
							
							// Highlight the manually selected options.
							crossPlotHighlighting.manuallySelectedTasks()
							
						} // if
						
						
						
					} // selectPoint
					
				}, // addSelecton
				
				// Custom options for dropup menu
				groupLine: {  
				
					update: function update(ctrl){
						// 'update' executes what 'make' lined up.
						
						// Shorthand handle
						var h = cfD3Scatter.interactivity.groupLine
						
						switch(ctrl.view.gVarOption.action){
							
							case "zoom":
							  // Just update the lines
							  h.updateLines( ctrl, 0 )
							  break;
							  
							case "draw":
							  h.drawLines(ctrl, ctrl.view.gVarOption.val)
							  break;
							
							case "remove":
							  h.removeLines(ctrl)
							  break;
							  
							case "replace":
							  h.replaceLines(ctrl, ctrl.view.gVarOption.val)
							  break;
							  
							default:
								// Do nothing.
							  break;
						} // switch
						
						// After the action is performed the action needs to be changed to the default - "zoom".
						ctrl.view.gVarOption.action = "zoom"
						
						
						
					}, // update
				
					make: function make(ctrl, varName, linesVarSame){
						
						// This is separated so that the lines just move with the zoom. Notice that this function does not handle zoom!!
						
						// Options to cover
						var noLines = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").empty()
						
						
						if( noLines ){
							// 1: no existing lines - draw new lines
							// h.drawLines(ctrl, varName)
							ctrl.view.gVarOption.action = "draw"
						
						} else if ( linesVarSame ){ 
							// 2: existing lines - same var -> remove lines
							// h.removeLines(ctrl)
							ctrl.view.gVarOption.action = "remove"
							
							
						} else {
							// 2: existing lines - diff var -> remove and add
							// h.replaceLines(ctrl, varName)
							ctrl.view.gVarOption.action = "replace"
						
						} // if
						
						cfD3Scatter.interactivity.groupLine.update(ctrl)
						
					
					}, // make
					
					drawLines: function drawLines(ctrl, varName){
					
						// Shorthand handles.
						var h = cfD3Scatter.interactivity.groupLine
						var i = cfD3Scatter.interactivity
						
						// Get the data to draw.
						var pointData = ctrl.plotFunc.helpers.getPointData(ctrl)
						
						// Retrieve all the series that are needed.
						var s = getUniqueArraySeries(pointData, varName)
						
							
						// Now draw a line for each of them.
						var paths = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path")
						  .data(s)
						  
						paths
						  .enter()
						  .append("path")
						  .attr("stroke", "black")
						  .attr("stroke-width", "2")
						  .attr("fill", "none")
						  .attr("clip-path", "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")")
						  .each(function(d){ i.addLineTooltip(ctrl, this)} )
						
						// Update transitions:
						ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated()
						
						
						// Do the actual drawing of it in the update part.
						h.updateLines(ctrl, ctrl.view.transitions.duration)
						
						
						// Remove any now unnecessary lines.
						paths.exit()
						  .each(function(){
						
							var totalLength = this.getTotalLength();
							
							d3.select(this)
								.transition()
								.duration( ctrl.view.transitions.duration )
								.ease(d3.easeLinear)
								.attr("stroke-dashoffset", totalLength)
								.on("end", function(){d3.select(this).remove()})
						})   
						
						
						// Update the tooltips. These can be missing if new data is added.
						ctrl.plotFunc.interactivity.addLineTooltip(ctrl)
						
						
						// HELPER
						function getUniqueArraySeries(array, varName){
				
							// First get the unique values of the variable used for grouping.
							var u = getUniqueArrayValues(array, varName)
						
						
							var s = []
							u.forEach(function(groupName){
								var groupData = array.filter(function(d){return d[varName] == groupName})
								s.push(groupData)
							})
						  return s
						
						} // getUniqueArraySeries
						
						function getUniqueArrayValues(array, varName){
							// This function returns all the unique values of property 'varName' from an array of objects 'array'.
							var u = []
							array.forEach(function(d){
								if( u.indexOf( d[varName] ) == -1){
									u.push( d[varName] )
								} // if
							})
						  return u
						
						} // getUniqueArrayValues
					  
					}, // drawLines
					
					removeLines: function removeLines(ctrl){
						
						// Update transitions:
						ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated()
						
						// Schedule removal transitions.
						ctrl.figure
						  .select("svg.plotArea")
						  .select(".markup")
						  .selectAll("path")
						  .each(function(){
						
							var totalLength = this.getTotalLength();
							
							d3.select(this)
								.transition()
								.duration( ctrl.view.transitions.duration )
								.ease(d3.easeLinear)
								.attr("stroke-dashoffset", totalLength)
								.on("end", function(){d3.select(this).remove()})
						})   
					}, // removeLines
											
					replaceLines: function replaceLines(ctrl, varName){
					
						var h = cfD3Scatter.interactivity.groupLine
						
						// Update transitions:
						ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated()
						
						// n is a coutner to allow tracking of when all the transitions have finished. This is required as the drawLines should only execute once at teh end.
						var n = 0
						ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").each(function(){
							n++
							var totalLength = this.getTotalLength();
							
							d3.select(this)
								.transition()
								.duration(ctrl.view.transitions.duration)
								.ease(d3.easeLinear)
								.attr("stroke-dashoffset", totalLength)
								.on("end", function(){
									n--
									d3.select(this).remove()
									
									if(n == 0){ 
										h.drawLines(ctrl, varName)
										
										// The lines were removed, therefore new tooltips are needed.
										ctrl.plotFunc.interactivity.addLineTooltip(ctrl)
									} // if
								}) // on
								
						}) // each
					}, // replaceLines
					
					updateLines: function updateLines(ctrl, t){
					
						// Accessor functions
						var accessor = ctrl.plotFunc.helpers.getAccessors(ctrl)
					
						var line = d3.line()
							.curve(d3.curveCatmullRom)
							.x( accessor.x )
							.y( accessor.y )
						
						var paths = ctrl.figure.select("svg.plotArea")
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
								  .duration( t )
								  .ease(d3.easeLinear)
								  .attr("stroke-dashoffset", 0);
						})
					
					} // updateLines
				
				}, // groupLine
			
				toggleAR: function toggleAR(ctrl){
					
					if(ctrl.view.viewAR == 1){
						// Change back to the data aspect ratio. Recalculate the plot tools.
						ctrl.view.viewAR = ctrl.view.dataAR
						
						plotHelpers.setupTools.go(ctrl)
					} else {
						// Change to the unity aspect ratio. Adjust the y-axis to achieve it.
						ctrl.view.viewAR = 1
						
						// When adjusting the AR the x domain should stay the same, and only the y domain should adjust accordingly. The bottom left corner should not move.
					
						// Adjust so that the middle of the plot stays at the same place.
						
						// How many pixels per dx=1
						var xRange = ctrl.tools.xscale.range()
						var yRange = ctrl.tools.yscale.range()
						var xDomain = ctrl.tools.xscale.domain()
						var yDomain = ctrl.tools.yscale.domain()
						
						var xAR = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0])
						var yAR = xAR/ctrl.view.viewAR
						var yDomainRange = [yRange[0] - yRange[1]] / yAR
						var yDomain_ = [
							yDomain[0] - yDomainRange/2, 
							yDomain[0] + yDomainRange/2]
						
						
						ctrl.tools.yscale.domain( yDomain_ )
					} // if
					
					
					
					
					
					// t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.
					ctrl.view.t = -1
					
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.animated()
					cfD3Scatter.update(ctrl)
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.instantaneous()
					
				}, // toggleAR
			
				// When resizing the axes interactively
				dragAdjustAR: function dragAdjustAR(ctrl){
					
					// Transitions
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.instantaneous()
				  
					// Offload to the function itself!! Line cannot update as per new axes, because it uses transform -> translate to move the lines around.
					cfD3Scatter.update(ctrl)
					
				}, // dragAdjustAR
			
				// On resize/drag
				refreshContainerSize: function refreshContainerSize(ctrl){
				
					var container = d3.select(ctrl.format.parent)
					
					builder.refreshPlotRowHeight( container )
					
				} // refreshContainerSize
		
			}, // interactivity
			
			helpers: {
				
				
				// Initialisation
				createDefaultControl: function createDefaultControl(){
					
					var ctrl = {
						
						plotFunc: cfD3Scatter,
						figure: undefined,
						view: {
							   viewAR: NaN,
							   dataAR: NaN,
							   xVarOption: undefined,
							   yVarOption: undefined,
							   cVarOption: undefined,
							   gVarOption: undefined,
							   lineTooltip: undefined,
							   pointTooltip: undefined,
							   transitions: {
								duration: 0,
								updateDelay: 0,
								enterDelay: 0								
							   },
							   t: undefined},
						tools: {xscale: undefined,
								yscale: undefined},
						format: {
							title: "Edit title",
							margin: {top: 10, right: 10, bottom: 38, left: 30},
						    axesMargin: {top: 20, right: 20, bottom: 16, left: 30},
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
					
					// Initialise the options straight away.
					var i = cfD3Scatter.interactivity
					var hs = plotHelpers.setupPlot.twoInteractiveAxes
					var options = dbsliceData.data.ordinalProperties 
					
					ctrl.view.xVarOption = {name: "varName",
					                         val: options[0],
										 options: options}
										 
					ctrl.view.yVarOption = {name: "varName",
					                         val: options[0],
										 options: options}
										 
					ctrl.view.cVarOption = color.settings

					// Custom option.
					ctrl.view.gVarOption = {name: "Line",
					                         val: undefined,
										 options: dbsliceData.data.categoricalProperties,
										   event: i.groupLine.make,
										  action: undefined}
					
					return ctrl
					
				}, // createDefaultControl
					
				createLoadedControl: function createLoadedControl(plotData){
				
					var ctrl = cfD3Scatter.helpers.createDefaultControl()
					
					// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
					if(plotData.xProperty != undefined){
						if( dbsliceData.data.ordinalProperties.includes(plotData.xProperty) ){
							ctrl.view.xVarOption.val = plotData.xProperty
						} // if						
					} // if
					
					if(plotData.yProperty != undefined){
						if( dbsliceData.data.ordinalProperties.includes(plotData.yProperty) ){
							ctrl.view.yVarOption.val = plotData.yProperty
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
					var yProperty = accessProperty( ctrl.view.yVarOption, "val" )
					
					s = s + writeOptionalVal("xProperty", xProperty)
					s = s + writeOptionalVal("yProperty", yProperty)
					
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
				axes: {
					
					update: function update(ctrl){
					
						cfD3Scatter.helpers.axes.formatAxesY(ctrl)
						cfD3Scatter.helpers.axes.formatAxesX(ctrl)
					
						cfD3Scatter.helpers.axes.updateTicks(ctrl)
					
					}, // update
					
					
					formatAxesY: function formatAxesY(ctrl){
				
						var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.yscale)

						ctrl.figure.select(".axis--y")
							.selectAll("g.exponent")
							.select("text")
							  .attr("fill", format.fill)
							.select("tspan.exp")
							  .html(format.exp)
							
						ctrl.figure.select(".axis--y").call( d3.axisLeft( format.scale ) )
							  
					
					}, // formatAxesY
					
					formatAxesX: function formatAxesX(ctrl){
				
						var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale)

						ctrl.figure.select(".axis--x")
							.selectAll("g.exponent")
							.select("text")
							  .attr("fill", format.fill)
							.select("tspan.exp")
							  .html(format.exp)
				
						ctrl.figure.select(".axis--x").call( d3.axisBottom( format.scale ).ticks(5) )
							  
					
					}, // formatAxesX
					
					updateTicks: function updateTicks(ctrl){
					  
						// Update all the axis ticks.
						ctrl.figure.select("svg.plotArea").select(".axis--x")
						   .selectAll(".tick")
						   .selectAll("text")
							 .style("cursor", "ew-resize")
						   
						ctrl.figure.select("svg.plotArea").select(".axis--y")
						   .selectAll(".tick")
						   .selectAll("text")
							 .style("cursor", "ns-resize")
						   
						ctrl.figure.select("svg.plotArea").selectAll(".tick")
						   .selectAll("text")
						   .on("mouseover", function(){d3.select(this).style("font-weight", "bold")})
						   .on("mouseout" , function(){d3.select(this).style("font-weight", "normal")})
					}	// updateTicks
				
				}, // axes
			
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
			
				// Data handling
				getAccessors: function getAccessors(ctrl){
				
				return {
					x: function xAccessor(d){ 
						return ctrl.tools.xscale( d[ctrl.view.xVarOption.val] ) 
						},
					y: function yAccessor(d){ 
						return ctrl.tools.yscale( d[ctrl.view.yVarOption.val] ) 
						},
					c: function cAccessor(d){ 
						return color.get( d[ctrl.view.cVarOption.val] ) 
						},
					id: function idAccessor(d){ 
						return d.taskId 
						}
					}
				}, // getAccessors
				
				getPointData: function getPointData(ctrl){
							
				  return dbsliceData.data.taskDim.top(Infinity);
					
				}, // getPointData
			
				getUnfilteredPointData: function getUnfilteredPointData(ctrl){
					
					filter.remove();
					
					var unfilteredData = dbsliceData.data.taskDim.top(Infinity);
					
					filter.apply();
					
					return unfilteredData
					
				}, // getUnfilteredPointData
			
			
				
				// Functions for cross plot highlighting:
				unhighlight: function unhighlight(ctrl){
					
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
					    .style("fill", "Gainsboro");
						 // .style("opacity", 0.2);
					
				}, // unhighlight
				
				highlight: function highlight(ctrl, allDataPoints){
					
					var taskIds = allDataPoints.map(d=>d.taskId)
					
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
						.filter(function(d_){return taskIds.includes(d_.taskId)})
						  .style("fill", "cornflowerblue")
						  .attr("r", 7);
					
				}, // highlight
				
				defaultStyle: function defaultStyle(ctrl){
					
					// Use crossfilter to do these loops? How to speed this all up?
					
					var filteredItems = cfD3Scatter.helpers.getPointData(ctrl)
					var taskIds = filteredItems.map(d=>d.taskId)
					
					// This should only color the filtered items in blue.
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
					    .filter(function(d_){return taskIds.includes(d_.taskId)})
					    .style("fill", "cornflowerblue")
					    .attr("r", 5);
						
					
					
				}, // defaultStyle
			
				// Manual interactivity
				updateManualSelections: function updateManualSelections(ctrl){
				
					
					var g = ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  
					// Instead of color change the border??
					// Default style
					g.selectAll("circle").style("stroke", "none")
					
					// Color in selected circles.
					dbsliceData.data.manuallySelectedTasks.forEach(function(d){
						g.selectAll("circle[task-id='" + d + "']")
						  .style("stroke", "rgb(255, 127, 14)")
						  .style("stroke-width", 4)
					}) //forEach
					
				} // updateManualSelections
			
			} // helpers
		
		} // cfD3Scatter
	