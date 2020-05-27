import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { plotHelpers } from '../plot/plotHelpers.js';

const cfD3Scatter = {
		
			name: "cfD3Scatter",
		
			make: function(ctrl){
				
				// Major differences from the standalone example to the implemented one:
				// 1.) The input arguments to the make have been changed to (element, data, layout)
				// 2.) The data is now an object containing the selected inputs by the user, as well as the crossfilter object governing the data. Therefore the internal access to the data has to be changed. This is done on point of access to the data to ensure that the crossfilter selections are correctly applied.
				// 3.) Some actions are performed from outside of the object, therefore the ctrl has to be passed in. That is why the ctrl is hidden in layout now.
			
				
				
				
				var b = cfD3Scatter
				var g = plotHelpers.setupPlot.general
				var s = plotHelpers.setupPlot.twoInteractiveAxes
				var si= plotHelpers.setupInteractivity.twoInteractiveAxes
				var i = cfD3Scatter.addInteractivity
				
				// Add the manual selection toggle to its title.
				// i.updatePlotTitleControls(element)
				
				// Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.
				s.setupPlotBackbone(ctrl)
				
				// Create the svg with all required children container groups and append it to the appropriate backbone div.
				plotHelpers.setupPlot.general.rescaleSvg(ctrl)


				// Add in the controls for the y axis.
				g.appendVerticalSelection( ctrl.figure.select(".leftAxisControlGroup"),
										   si.onSelectChange.vertical(ctrl) )
				
				// Add in the controls for the x axis.
				g.appendHorizontalSelection( ctrl.figure.select(".bottomAxisControlGroup"),
											 si.onSelectChange.horizontal(ctrl) )
				
				// Add teh button menu - in front of the update for it!
				s.buttonMenu.make(ctrl)
				
				// Get the variable options
				cfD3Scatter.setupPlot.updateUiOptions(ctrl)
				
				
				// Setup the scales for plotting
				plotHelpers.setupTools.go(ctrl)
				
				
				// Scatter plot specific interactivity.
				si.addAxisScaling(ctrl)
				
				
				// General interactivity
				si.addZooming(ctrl)
				i.createLineTooltip(ctrl)
				i.createPointTooltip(ctrl)
				
				// Draw the actual plot. The first two inputs are dummies.
				b.update(ctrl)
			
			
			}, // make
			
			update: function update(ctrl){
				// On re-render the 'update' is called in the render, therefore it must exist. To conform with the line plot functionality the update plot here executes the redraw for now. Later on it should handle all preparatory tasks as well.
				
				cfD3Scatter.refresh(ctrl)
				
			}, // update
		
			refresh: function refresh(ctrl){
				// Update also runs on manual reselct of points, and on brushing in other plots. It therefore must support the addition and removal of points.
		
				
				var h = cfD3Scatter.helpers
				var h_= plotHelpers.setupPlot.twoInteractiveAxes
				var i = cfD3Scatter.addInteractivity
				
				// Check to adjust the width of the plot in case of a redraw.
				plotHelpers.setupPlot.general.rescaleSvg(ctrl)
				
				
				// Accessor functions
				var accessor = h.getAccessors(ctrl)
				
				
				
				// Get the data to draw.
				var pointData = h.getPointData(ctrl)
				
				// Deal with the points
				var points = ctrl.figure.select("svg.plotArea")
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
					.attr("clip-path", "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")")
					.attr("task-id", accessor.id )
					.each(function(d){ i.addPointTooltip(ctrl, this) })
					
					
				points
				  .transition()
				  .duration(ctrl.view.transitions.duration)
				  .attr("r", 5)
				  .attr("cx", accessor.x )
				  .attr("cy", accessor.y )
				  .style("fill", accessor.c)
				  .attr("task-id", accessor.id );
				 
				points.exit().remove();
					
			
				// Update the markup lines to follow on zoom
				// MOVE THE EXECUTION OF THE LINE DRAWING HERE! MAKE WILL ONLY DECIDE WHAT NEEDS TO BE DONE!
				h_.buttonMenu.options.groupLine.update(ctrl)
				
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
				
				setupPlotBackbone: function setupPlotBackbone(ctrl, plot){
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
						
						
				}, // setupPlotBackbone
				
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
							event: h.buttonMenu.options.toggleAR
						} // arOption
						
						
						// Make functionality options for the menu.
						var codedPlotOptions = [ctrl.view.cVarOption, ctrl.view.gVarOption, arOption]
						
						return codedPlotOptions
					
				} // assembleButtonMenuOptions

					
				}, // updateUiOptions
				

		
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
		
			addInteractivity: {
				
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
				
				
				// Legacy
				
				addSelection: function addSelection(ctrl){
					// This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
					
					var points = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle");
					
					points.on("click", selectPoint)
					console.log(ctrl)
					
					
					function selectPoint(d){
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
						
						console.log(d, p, dbsliceData.data.manuallySelectedTasks)
						
						// Highlight the manually selected options.
						crossPlotHighlighting.manuallySelectedTasks()
						
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
						
						render()
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
				
				
				// Initialisation
				createDefaultControl: function createDefaultControl(){
					
					var ctrl = {
						
						plotFunc: cfD3Scatter,
						figure: undefined,
						view: {
							   viewAR: undefined,
							   dataAR: undefined,
							   xVarOption: undefined,
							   yVarOption: undefined,
							   cVarOption: undefined,
							   gVarOption: undefined,
							   lineTooltip: undefined,
							   pointTooltip: undefined,
							   transitions: {
								duration: 500,
								updateDelay: 0,
								enterDelay: 0								
							   },
							   t: undefined},
						tools: {xscale: undefined,
								yscale: undefined,
								cscale: undefined},
						format: {
							title: "Edit title",
							colWidth: 4,
							width: undefined,
							height: 400,
							margin: {top: 10, right: 10, bottom: 38, left: 30},
						    axesMargin: {top: 20, right: 20, bottom: 16, left: 30}
						}
					} // ctrl
					
					// Initialise the options straight away.
					var h = plotHelpers.setupPlot.twoInteractiveAxes
					var options = dbsliceData.data.dataProperties 
					
					ctrl.view.xVarOption = {name: "varName",
					                         val: options[0],
										 options: options}
										 
					ctrl.view.yVarOption = {name: "varName",
					                         val: options[0],
										 options: options}
										 
					ctrl.view.cVarOption = {name: "Colour",
					                         val: undefined,
										 options: dbsliceData.data.metaDataProperties,
										   event: h.buttonMenu.options.groupColor}

					ctrl.view.gVarOption = {name: "Line",
					                         val: undefined,
										 options: dbsliceData.data.metaDataProperties,
										   event: h.buttonMenu.options.groupLine.make,
										  action: undefined}
					
					return ctrl
					
				}, // createDefaultControl
					
				createLoadedControl: function createLoadedControl(plotData){
				
					var ctrl = cfD3Scatter.helpers.createDefaultControl()
					
					// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
					if(plotData.xProperty != undefined){
						if( dbsliceData.data.dataProperties.includes(plotData.xProperty) ){
							ctrl.view.xVarOption.val = plotData.xProperty
						} // if						
					} // if
					
					if(plotData.yProperty != undefined){
						if( dbsliceData.data.dataProperties.includes(plotData.yProperty) ){
							ctrl.view.yVarOption.val = plotData.yProperty
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
					
						var xAxis = d3.axisBottom( ctrl.tools.xscale ).ticks(5);
						var yAxis = d3.axisLeft( ctrl.tools.yscale );
					
						ctrl.figure.select("svg.plotArea").select(".axis--x").call( xAxis )
						ctrl.figure.select("svg.plotArea").select(".axis--y").call( yAxis )
						
						cfD3Scatter.helpers.axes.updateTicks(ctrl)
					
					}, // update
					
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
			
			
				getAccessors: function getAccessors(ctrl){
				
				return {
					x: function xAccessor(d){ 
						return ctrl.tools.xscale( d[ctrl.view.xVarOption.val] ) 
						},
					y: function yAccessor(d){ 
						return ctrl.tools.yscale( d[ctrl.view.yVarOption.val] ) 
						},
					c: function cAccessor(d){ 
						return ctrl.tools.cscale( d[ctrl.view.cVarOption.val] ) 
						},
					id: function idAccessor(d){ 
						return d.taskId 
						}
					}
				}, // getAccessors
				
				getPointData: function getPointData(ctrl){
							
					var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val);
					var dim = dbsliceData.data.dataDims[dimId];
					var pointData = dim.top(Infinity);
	  
				  return pointData;
					
				}, // getPointData
			
			
			
				// Functions for cross plot highlighting:
				unhighlight: function unhighlight(ctrl){
					
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
						  .style("opacity", 0.2);
					
				}, // unhighlight
				
				highlight: function highlight(ctrl, d){
					
					// Find the circle corresponding to the data point. Look for it by taskId.
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					    .selectAll("circle")
						.filter(function(d_){return d_.taskId == d.taskId})
					      .style("opacity", 1.0)
					      .attr("r", 7);
					
				}, // highlight
				
				defaultStyle: function defaultStyle(ctrl){
					
					// Find all the circles, style them appropriately.
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
					    .style("opacity", 1)
					    .attr("r", 5);
						
					// Rehighlight any manually selected tasks.
					crossPlotHighlighting.manuallySelectedTasks()
					
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
	

export { cfD3Scatter };