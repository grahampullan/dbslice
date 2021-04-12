import {dbsliceData} from "../core/dbsliceData.js"
import {builder} from "../core/builder.js"
import {sessionManager} from "../core/sessionManager.js"
import {color} from "../core/color.js"
import {crossPlotHighlighting} from "../core/crossPlotHighlighting.js";
import {filter} from "../core/filter.js"
import {plotHelpers} from "./plotHelpers.js"


export var cfD3BarChart = {
		
		

        name: "cfD3BarChart",
        
        make: function make(ctrl) {
        
            // Remove any controls in the plot title.
			// cfD3BarChart.interactivity.updatePlotTitleControls(element)
			
			
			plotHelpers.setupPlot.general.setupPlotBackbone(ctrl)
			plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl)
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// Create the necessary markup groups.
			var svg = ctrl.figure.select("svg.plotArea")
			var markup = svg.select("g.markup")
			markup.append("g").attr("class", "highlight")
			markup.append("g").attr("class", "extent")
			markup.append("g").attr("class", "label")
			
			// Handle the select.
			var i= cfD3BarChart.interactivity.onSelectChange
			plotHelpers.setupPlot.general.appendVerticalSelection(ctrl.figure, i.vertical(ctrl))
			plotHelpers.setupPlot.general.updateVerticalSelection(ctrl)
			
			
			cfD3BarChart.setupPlot.setupPlotTools(ctrl)
			
			cfD3BarChart.helpers.axes.addXLabel(ctrl)
			
        
            cfD3BarChart.update(ctrl);
        }, // make
      
        update: function update(ctrl) {
			// Plot some bars to the background, which show the entire extent of the data, and additional bars on top to show current selection.
			
			// Create some common handles.
			var h = cfD3BarChart.draw
			
			
			// Check if the data should be regrouped, or if an update to the existing state is required. This check should be performed here, as a need to regroup might come from outside (by changing the color variable).
			if(h.isRegroupNeeded(ctrl)){
				
				// Perform the regroup
				h.regroup(ctrl)
				
			} else {
				// Just update the view
				h.update(ctrl)
				
			} // if
			
			// VARIABLE CHANGE MUST BE HANDLED SEPARATELY TO ALLOW THE DATA EXTENT TO UPDATE TOO!! MUST SIGNAL THAT THE Y VARIABLE CHANGED
			

			
        }, // update
		
		draw: {
			
			plotDataExtent: function plotDataExtent(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .select("g.extent")
				
				cfD3BarChart.draw.bars(ctrl, items, target, "black", 0.2)
				
				
			}, // plotDataExtent
			
			plotSelectionBackground: function plotSelectionBackground(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.background")
				  
				
				cfD3BarChart.draw.bars(ctrl, items, target, "cornflowerblue", 0.5)
				
			}, // plotSelectionBackground
			
			plotCurrentSelection: function plotCurrentSelection(ctrl, items){
				
				// THIS HAS TO PLOT INTO THE BACKGROUND TOO!!
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				cfD3BarChart.draw.bars(ctrl, items, target, ctrl.tools.getFill, 1)
				
			}, // plotCurrentSelection
			
			bars: function bars(ctrl, items, target, color, opacity){
				
				// THIS HAS TO PLOT INTO THE BACKGROUND TOO!!
				

				var t = ctrl.view.transitions
				
				// The items should be plotted as rectangles. Everytime the grouping of the data is changed the rectangles retreat, regroup, and reappear.
				
				var rect = target
				  .selectAll("rect")
				  .data(items)
				
				rect.enter()
				  .append("rect")
				    .attr("x", 0)
					.attr("y", ctrl.tools.getY)
					.attr("height", ctrl.tools.getHeight)
					.attr("width", 0)
					.style("fill", color)
					.attr("opacity", opacity)
					.attr("stroke-width", 0)
				  .transition()
				  .duration(t.duration)
				    .attr("x", ctrl.tools.getX)
					.attr("width", ctrl.tools.getWidth)
					
				rect
				  .transition()
				  .duration(t.duration)
				  .attr("x", ctrl.tools.getX)
				  .attr("y", ctrl.tools.getY)
				  .attr("height", ctrl.tools.getHeight)
				  .attr("width", ctrl.tools.getWidth)
				  .style("fill", color)
				  .attr("opacity", opacity)
				  
				rect.exit()
				  .transition()
				  .duration(t.duration)
				  .attr("x", ctrl.tools.getX)
				  .attr("width", ctrl.tools.getWidth)
				  .remove()
				
				
				
			}, // bars
			
			plotMarkup: function plotMarkup(ctrl, items){
			
				var keyLabels = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .select("g.label")
				  .selectAll(".keyLabel")
				  .data(items);
					
				keyLabels.enter()
				  .append("text")
					.attr("class", "keyLabel")
					.attr("x", 0)
					.attr("y", ctrl.tools.getLabelPosition )
					.attr("dx", 5)
					.attr("dy", ".35em")
					.attr("text-anchor", "start")
					.text(ctrl.tools.getLabel)

				keyLabels
				  .transition()
				  .attr("y", ctrl.tools.getLabelPosition )
				  .text( ctrl.tools.getLabel );
				
				keyLabels.exit().remove();
				

				
			}, // plotMarkup
			
			isRegroupNeeded: function isRegroupNeeded(ctrl){
				
				var flag = ctrl.view.gVar != ctrl.view.yVarOption.val ||
			               ctrl.view.gClr != color.settings.val
				
				// Update the 'gVar' and 'gClr' flags for next draw.				
				ctrl.view.gVar = ctrl.view.yVarOption.val
			    ctrl.view.gClr = color.settings.val
				
				return flag
				
			}, // isRegroupNeeded
			
			regroup: function regroup(ctrl){
				// This function controls the retreat of the data to prepare for the redrawing using the new grouping of the data.
				
				var svg = ctrl.figure
				  .select("svg.plotArea")
				  
				// Remove the labels too.
				svg.select("g.markup")
				  .selectAll(".keyLabel")
				  .transition()
				  .remove()
				  
				// Check which rectangles need to be removed. If just some grouping was changed (color), then only the colored rectangles in g.data need to be changed. If the y variable changed, then also the data extent needs to be changed.
				var rects
				if(ctrl.view.yVarChanged){
					rects = svg.selectAll("g")
					           .selectAll("rect")
					
					ctrl.view.yVarChanged = false
				} else {
					// 
					rects = svg.selectAll("g.data")
					           .selectAll("rect")
				}
				
				// Remove the rectangles, and when completed order a redraw.
				rects
					.transition()
					.duration(500)
					  .attr("x", ctrl.tools.xscale(0))
					  .attr("width", 0)
					.remove()
					.end()
					.then(function(){
						
						// All elements were removed. Update teh chart.
						cfD3BarChart.draw.update(ctrl)
						
					}) // then
			
			
			}, // regroup
			
			update: function update(ctrl){
				
				var h = cfD3BarChart.helpers
				var draw = cfD3BarChart.draw
				
				var unfilteredItems    = h.getUnfilteredItems(ctrl.view.yVarOption.val);
				var filterItems        = h.getFilteredItems(ctrl.view.yVarOption.val);
				var filterItemsGrouped = h.getFilteredItemsGrouped(ctrl.view.yVarOption.val);
				
				// Unfiltered data extent
				draw.plotDataExtent(ctrl, unfilteredItems)
				
				// Current selection background
				draw.plotSelectionBackground(ctrl, filterItems)
				
				// Handle the entering/updating/exiting of bars.
				draw.plotCurrentSelection(ctrl, filterItemsGrouped)
				
				
				// Handle the entering/updating/exiting of bar labels.
				draw.plotMarkup(ctrl, unfilteredItems)
				
				
				// Handle the axes.
				h.axes.update(ctrl);
				
				// Add interactivity:
				cfD3BarChart.interactivity.addOnMouseOver(ctrl);
				cfD3BarChart.interactivity.addOnMouseClick(ctrl);
				
			}, // update
			
			
			
		}, // draw
		
		
      
		rescale: function rescale(ctrl){
			// What should happen if the window is resized?
			// 1.) The svg should be resized appropriately
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// 2.) The plot tools need to be updated 
			cfD3BarChart.setupPlot.setupPlotTools(ctrl)
			
			// 3.) The plot needs to be redrawn
			cfD3BarChart.update(ctrl)
			
			
		}, // rescale
	  
	    setupPlot : {
			
			setupPlotTools: function setupPlotTools(ctrl){
				// The x and y axis tools need to be set up here. 
				
				// Get the items to plot. This is done on all the data here, and the scales are created here as well. This will make the axes fixed, and the bars move accordingly. This can be changed if needed by adjusting the xscale domain appropriately
				
				var property = ctrl.view.yVarOption.val
				var g = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				var width = g.attr("width")
				var height = g.attr("height")
				
				// TEMPORARY
				var items = cfD3BarChart.helpers.getUnfilteredItems(property);
				
				// The scale that will control the property used to visually convey numeric information.
				ctrl.tools.xscale = d3.scaleLinear()
					.range([0, width])
					.domain([0, d3.max(items, function (v){return v.members.length;}) ]);
				
				// 'd2.scaleBand' does the division of the plotting area into separate bands based on input categorical values, and returns the number corresponding to the position of the band, and to the width of the band by calling '<scale>()', and '<scale>.bandwidth()' respectively.
				// 'padding' sets the amount of space between the bands (innerPadding), and before and after the bands (outerPadding), to the same value.
				// 'align' controls how the outer padding is distributed between both ends of the band range.
				ctrl.tools.yscale = d3.scaleBand()
				    .range([0, height])
				    .domain(  items.map(function (d) {return d.val;}).sort()  )
				    .padding([0.2])
				    .align([0.5]);
					
					
				ctrl.tools.getHeight = function(d){ return ctrl.tools.yscale.bandwidth() }
				ctrl.tools.getWidth = function(d){ return ctrl.tools.xscale(d.members.length)}
				ctrl.tools.getX = function(d){ return ctrl.tools.xscale(d.x) }
				ctrl.tools.getY = function(d){ return ctrl.tools.yscale(d.val) }
				ctrl.tools.getFill = function(d){ return color.get(d.cVal) }	
				ctrl.tools.getLabelPosition = function(d){
					return ctrl.tools.getY(d) + 0.5*ctrl.tools.getHeight(d)
					}
				ctrl.tools.getLabel = function(d){return d.val}
			
			} // setupPlotTools
		
		}, // setupPlot
	  
		interactivity: {
			
			onSelectChange: {
				
				vertical: function vertical(ctrl){
					// Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
					return function(){
					
						var selectedVar = this.value
					
						// Perform the regular task for y-select: update teh DOM elements, and the plot state object.
						plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar)
						
						// Update the filter. If a variable is removed from view then it's filter must be removed as well. It is completely REMOVED, and not stored in the background. Filter checks the variables in the control objects.
						filter.apply()
						
						// Setup the tools anew.
						cfD3BarChart.setupPlot.setupPlotTools(ctrl)
						
						// Signal that a regroup is required.
						ctrl.view.yVarChanged = true
			
						// Render is called because the filter may have changed.
						sessionManager.render()			
					
					} // return
				}, // vertical
			}, // onSelectChange
			
			addOnMouseClick: function addOnMouseClick(ctrl){
				
				// Add the mouse click event
				var property = ctrl.view.yVarOption.val
				var svg = ctrl.figure.select("svg.plotArea").select("g.markup")
				
				
				svg.selectAll("rect").on("click", onClick);
				
				function onClick(d){

					
					// Update the filter selection.
					filter.addUpdateMetadataFilter(property, d.val)

					// Apply the selected filters to the crossfilter object.
				    filter.apply();
				  
				    // Everything needs to b rerendered as the plots change depending on one another according to the data selection.
				    sessionManager.render();
					
				} // onClick
				
			}, // addOnMouseClick
			
			addOnMouseOver: function addOnMouseOver(ctrl){
				
				
				// Onle the rectangles showing the data outline are interactive.
				var rects = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .selectAll("rect");
				
				rects.on("mouseover", crossHighlightOn)
                     .on("mouseout",  crossHighlightOff);
					  
				function crossHighlightOn(d){
					
					// When mousing over a deselected item it should show the user the preview. This means it should show extra data. But it also means that it needs to keep track of active/inactive rectangles.
					
					crossPlotHighlighting.on(d, "cfD3BarChart");

				}; // crossHighlightOn
				
				function crossHighlightOff(d){
					
					crossPlotHighlighting.off(d, "cfD3BarChart");
					
				}; // crossHighlightOff
				
			}, // addOnMouseOver
			
			refreshContainerSize: function refreshContainerSize(ctrl){
				
				var container = d3.select(ctrl.format.parent)
				
				builder.refreshPlotRowHeight( container )
				
			} // refreshContainerSize
			
		}, // interactivity
	
		helpers: {
		
			// Initialisation/saving
			createDefaultControl: function createDefaultControl(){
			
				var ctrl = {
				        plotFunc: cfD3BarChart,
						figure: undefined,
						svg: undefined,
						view: {yVarOption: undefined,
							   nBins: undefined,
							   transitions: cfD3BarChart.helpers.transitions.instantaneous(),
							   gVar: undefined,
							   gClr: undefined
							   },
						tools: {xscale: undefined,
								yscale: undefined,
								histogram: undefined},
						format: {
							title: "Edit title",
							margin: {top: 10, right: 0, bottom: 30, left: 30},
							axesMargin: {top: 10, right: 30, bottom: 30, left: 10},
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
				
				var options = dbsliceData.data.categoricalProperties
				ctrl.view.yVarOption = {name: "varName",
					                     val: options[0],
								     options: options}
									 
				ctrl.view.gVar = options[0]
				
				return ctrl
			
			}, // createDefaultControl
			
			createLoadedControl: function createLoadedControl(plotData){
			
				var ctrl = cfD3BarChart.helpers.createDefaultControl()
				
				// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
				if(plotData.yProperty != undefined){
					if( dbsliceData.data.categoricalProperties.includes(plotData.yProperty) ){
						ctrl.view.yVarOption.val = plotData.yProperty
						ctrl.view.gVar =           plotData.yProperty
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
				  
				var xProperty = accessProperty( ctrl.view.yVarOption, "val" )
				
				  
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
			
			
			// Functions supporting interactivity
			axes: {
				
				update: function update(ctrl){
					
					

					cfD3BarChart.helpers.axes.formatAxesX(ctrl)
					
					// Empty y-axis as the labels are drawn.
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.axis--y")
					  .call(d3.axisLeft(ctrl.tools.yscale).tickValues([]));
					
				}, // update
				
				formatAxesX: function formatAxesX(ctrl){
				
					var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale)

					ctrl.figure.select(".axis--x")
						.selectAll("g.exponent")
						.select("text")
						  .attr("fill", format.fill)
						.select("tspan.exp")
						  .html(format.exp)
			
					ctrl.figure.select(".axis--x").call( d3.axisBottom( format.scale ).ticks(5) )
						  
				
				}, // formatAxesY
				
				addXLabel: function addXLabel(ctrl){
					
					ctrl.figure
					  .select("div.bottomAxisControlGroup")
					  .append("text")
						.attr("class", "txt-horizontal-axis")
						.style("float", "right")
						.style("margin-right", "15px")
						.text("Number of Tasks");
					
				}, // addXLabel
				
				
			}, // axes
			
			
			transitions: {
				instantaneous: function instantaneous(){
					// For 'cfD3BarChart' animated transitions handles filter changes.
				
					return {
						duration: 500,
						updateDelay: 0,
						enterDelay: 0
					}
				
				}, // instantaneous
				
				animated: function animated(){
					// For 'cfD3BarChart' animated transitions handles variable changes.
				
					return {
						duration: 500,
						updateDelay: 500,
						enterDelay: 0
					}
				
				} // animated
			}, // transitions
		
		
		
			getItems: function getItems(tasks, groupKey, subgroupKey){
				
				// Make the subgroup the graphic basis, and plot it directly. Then make sure that the grouping changes are handled properly!!
				
				var groupVals = dbsliceData.data.categoricalUniqueValues[groupKey]
				var subgroupVals = subgroupKey == undefined ? [undefined] : dbsliceData.data.categoricalUniqueValues[subgroupKey]
				
				// Loop over them to create the rectangles.
				var items = []
				groupVals.forEach(function(groupVal){
					
					var x = 0
					
					subgroupVals.forEach(function(subgroupVal){
						// This will run at least once with the subgroup value of 'undefined'. In that case the item array will hold a single rectangle for each of the expected bars.
						
						var members = tasks.filter(function(task){
							// In case where the subgroupKey passed in is 'undefined' this statement evaluates as 'undefined' == 'undefined'
							return task[groupKey] == groupVal &&
							       task[subgroupKey] == subgroupVal
						})
						
						var rectData = {
							key: groupKey,
							val: groupVal,
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
			
			getFilteredItems: function getFilteredItems(property){
				
				var tasks = dbsliceData.data.categoricalDims[property].top(Infinity)
				
				return cfD3BarChart.helpers.getItems(tasks, property, undefined)
				
			}, // getFilteredItems
			
			getFilteredItemsGrouped: function getFilteredItemsGrouped(property){
				
				var tasks = dbsliceData.data.categoricalDims[property].top(Infinity)
				
				return cfD3BarChart.helpers.getItems(tasks, property, color.settings.variable)
				
			}, // getFilteredItemsGrouped
			
			getUnfilteredItems: function getUnfilteredItems(property){
				
				// 1.) get the unfiltered items for plotting. This means the plot will never zoom in, regardless of selection.
				// 2.) get the items for plotting as before. This will change with selection, but will still allow subsets to be highlighted later on.
				
				// First attempt with 1.). the other will be implemented later when it will be visible.
				// When using 'filter.remove' and later 'filter.apply' the object 'items' changes after the filters are reapplied.
				
				// Get all tasks.
				var tasks = dbsliceData.data.cf.all()
				
				// Make the items.
				return cfD3BarChart.helpers.getItems(tasks, property, undefined)
				
				// https://stackoverflow.com/questions/33102032/crossfilter-group-a-filtered-dimension
				// Crossfilter groups respect all filters except those of the dimension on which they are defined. Define your group on a different dimension and it will be filtered as you expect.
				
				
			}, // getUnfilteredItems
			
			
			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				/*
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("rect")
				    .attr("opacity", 0.5)
				*/
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				
				
				// Create bars for hte highlight
				var highlightedData = cfD3BarChart.helpers.getItems(allDataPoints, ctrl.view.yVarOption.val, color.settings.variable)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.instantaneous()
				
				// Just redraw the view with allDataPoints. To avoid circularity move the data extent to the foreground?
				cfD3BarChart.draw.plotCurrentSelection(ctrl, highlightedData)
				
				// Reset the transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.animated()
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.instantaneous()
				
				cfD3BarChart.draw.update(ctrl)
				
				// Reset the transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.animated()
				
			}, // defaultStyle
			
			
		} // helpers
	
	}; // cfD3BarChart
