import { filter } from '../core/filter.js';
import { color } from '../core/color.js';
import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { plotHelpers } from '../plot/plotHelpers.js';

const cfD3BarChart = {
		
		// Coloring:
		// When the user opts to color code the data by a metadata variable all plots are expected to respond. To color the bars of the bar charts the bars corresponding to each individual option of the selected data variable need to be made of several rectangles. This allows the color coding of the composition of the bar. The grouping of the rectangles into the bar tells the user which key they belong to, and the colors tell them how many of a specific color key tehre are in any bar.
		// Initially the color coding was done by having an individual rectangle for each task. However, consider the situation in which the filter has been adjusted, and a color group that is in the middle of a bar has to increase. When a task basis is used, d3 will assign all data to the rectangles sequentially, which means that the task that should be entering in the middle will not have a rectangle entering in the middle. Instead the task will be assigned to an existing rectangle, which will change it's color, and a new rectangle will be added to the right side, which will then be paired with a task that was previously visualised by the rectangle to the left of the new one. This is misleading for the user.
		// An alternate solution is to individually track the rectangles and the tasks assigned to them. The tasks would then also need to be sorted appropriately. It is difficult to calculate the exact exit transition points for the rectangles, as they would only have information of themselves available, but they would also require to know how the rectangles next to them are being positioned.
		// Another alternate solution is to group the tasks into 'series' when retireving them, and calculating their starting points. This then allows the rectangles to enter and exit in concert. Transitions between coloring and no coloring is trickier however. When coloring is turned on the series that displayed the entire bar beforehand must now shring as it becomes a part of the series. This can be hidden by first plotting other series over it. The shrinking would then be hidden from the user. Bars could alternately also be made to disappear, and then appear again coloured. Or the colors could enter from the right - this is potentially even more difficult to implement, as two separate functionalities would be required.
		
		// Transitions:
		// If the char is entering with the default color it enters well. Maybe the coloring should just be added post festum, and the boxes shouldn't be grouped by physical groups. They can still have their coordinates calculated beforehand for better transitions etc. Otherwise there is a confusion regarding the entering rectangles. Will it be enough to keep the bars grouped together?

        name: "cfD3BarChart",
        
        make: function make(ctrl) {
        
            // Remove any controls in the plot title.
			// cfD3BarChart.addInteractivity.updatePlotTitleControls(element)
			
			
			plotHelpers.setupPlot.general.setupPlotBackbone(ctrl)
			plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl)
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// Handle the select.
			var i= cfD3BarChart.addInteractivity.onSelectChange
			plotHelpers.setupPlot.general.appendVerticalSelection(ctrl.figure.select(".leftAxisControlGroup"), i.vertical(ctrl))
			plotHelpers.setupPlot.general.updateVerticalSelection(ctrl)
			
			
			cfD3BarChart.setupPlot.setupPlotTools(ctrl)
        
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
			
			

			
        }, // update
		
		draw: {
			
			plotDataExtent: function plotDataExtent(ctrl, items){
				
				var t = ctrl.view.transitions
				var bars = ctrl.figure.select("svg.plotArea").select("g.markup").selectAll("rect").data(items);
			
				// New bars
				bars.enter()
				  .append("rect")
					.attr("height", getHeight)
					.attr("width", 0)
					.attr("x", 0)
					.attr("y", getPosition)
					.style("fill", "black")
					.attr("opacity", 0.2)
				  .transition()
				  .delay(t.updateDelay)
				  .duration(t.duration)
					.attr("width", getWidth)	
				
				// Existing bars
				bars.transition()
				  .delay(t.updateDelay)
				  .duration(0)
				    .attr("y", getPosition)
					.attr("height", getHeight)
				  .transition()
				  .delay(t.updateDelay)
				  .duration(t.duration)
				    .attr("width", getWidth)
				    .style("fill", "black")
				    .attr("opacity", 0.2)

				bars.exit().remove()
				
				function getHeight(d){ return ctrl.tools.yscale.bandwidth() }
				function getWidth(d){ return ctrl.tools.xscale(d.members.length) }
				function getPosition(d){ return ctrl.tools.yscale(d.val) }
				
			}, // plotDataExtent
			
			plotCurrentSelection: function plotCurrentSelection(ctrl, items){
				
				
				// Helpers
				function x(d){return ctrl.tools.xscale(d.x)}
				function y(d){return ctrl.tools.yscale(d.val)}
				function width(d){return ctrl.tools.xscale(d.members.length)}
				var height = ctrl.tools.yscale.bandwidth()
				function fill(d){return color.get(d.cVal)}
				
				// The items should be plotted as rectangles. Everytime the grouping of the data is changed the rectangles retreat, regroup, and reappear.
				
				var rect = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("rect").data(items)
				
				rect.enter()
				  .append("rect")
				    .attr("x", 0)
					.attr("y", y)
					.attr("height", height)
					.attr("width", 0)
					.style("fill", fill)
					.attr("opacity", 1)
					.attr("stroke-width", 0)
				  .transition()
				  .duration(1000)
				    .attr("x", x)
					.attr("width", width)
					
				rect
				  .transition()
				  .duration(1000)
				  .attr("x", x)
				  .attr("y", y)
				  .attr("height", height)
				  .attr("width", width)
				  .style("fill", fill)
				  
				rect.exit()
				  .transition()
				  .duration(1000)
				  .attr("x", x)
				  .attr("width", width)
				  .remove()
				
				
				
			}, // plotCurrentSelection
			
			plotMarkup: function plotMarkup(ctrl, items){
			
				var keyLabels = ctrl.figure.select("svg.plotArea").select("g.markup")
				  .selectAll(".keyLabel")
				  .data(items);
					
				keyLabels.enter()
				  .append("text")
					.attr("class", "keyLabel")
					.attr("x", 0)
					.attr("y", getLabelPosition )
					.attr("dx", 5)
					.attr("dy", ".35em")
					.attr("text-anchor", "start")
					.text(getLabel)

				keyLabels
				  .transition()
				  .attr("y", getLabelPosition )
				  .text( getLabel );
				
				keyLabels.exit().remove();
				
				function getHeight(d){ return ctrl.tools.yscale.bandwidth() }
				function getPosition(d){ return ctrl.tools.yscale(d.val) }
				function getLabelPosition(d){return getPosition(d) + 0.5*getHeight(d)}
				function getLabel(d){return d.val}
				
			}, // plotMarkup
			
			isRegroupNeeded: function isRegroupNeeded(ctrl){
				
				var flag = ctrl.view.gVar != ctrl.view.yVarOption.val ||
			               ctrl.view.gClr != color.settings.variable
				
				// Update the 'gVar' and 'gClr' flags for next draw.				
				ctrl.view.gVar = ctrl.view.yVarOption.val
			    ctrl.view.gClr = color.settings.variable
				
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
				
				// Remove the rectangles, and when completed order a redraw.
				svg.select("g.data")
				  .selectAll("rect")
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
				var svg = ctrl.figure.select("svg.plotArea")
				
				var backgroundItems = h.getUnfilteredItems(ctrl.view.yVarOption.val);
				var filterItems     = h.getFilteredItems(ctrl.view.yVarOption.val);
				
				// Background data extent
				cfD3BarChart.draw.plotDataExtent(ctrl, backgroundItems)
				
				// Handle the entering/updating/exiting of bars.
				cfD3BarChart.draw.plotCurrentSelection(ctrl, filterItems)
				
				
				// Handle the entering/updating/exiting of bar labels.
				cfD3BarChart.draw.plotMarkup(ctrl, backgroundItems)
				
				
				// Handle the axes.
				cfD3BarChart.helpers.createAxes(ctrl);
				
				// Add interactivity:
				cfD3BarChart.addInteractivity.addOnMouseOver(ctrl);
				cfD3BarChart.addInteractivity.addOnMouseClick(ctrl);
				
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
				    .domain(  items.map(function (d) {return d.val;})  )
				    .padding([0.2])
				    .align([0.5]);
					
			
			} // setupPlotTools
		
		}, // setupPlot
	  
		addInteractivity: {
			
			onSelectChange: {
				
				vertical: function vertical(ctrl){
					// Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
					return function(){
					
						var selectedVar = this.value
					
						// Perform the regular task for y-select: update teh DOM elements, and the plot state object.
						plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar)
						
						// Update the filter. If a variable is removed from view then it's filter must be removed as well. It is completely REMOVED, and not stored in the background.
						filter.apply()
						
						// Setup the tools anew.
						cfD3BarChart.setupPlot.setupPlotTools(ctrl)
						
						// Signal that a regroup is required.
			
						// Maybe just call a render here, but flag internally if a regroup is needed?
						render()			
					
					} // return
				}, // vertical
			}, // onSelectChange
			
			addOnMouseClick: function addOnMouseClick(ctrl){
				
				// Add the mouse click event
				var property = ctrl.view.yVarOption.val
				var svg = ctrl.figure.select("svg.plotArea").select("g.markup")
				
				
				svg.selectAll("rect").on("click", onClick);
				
				function onClick(d){
					console.log("on bar click")
					
					// Update the filter selection.
					filter.addUpdateMetadataFilter(property, d.val)

					// Apply the selected filters to the crossfilter object.
				    filter.apply();
				  
				    // Everything needs to b rerendered as the plots change depending on one another according to the data selection.
				    render();
					
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
			
			
		}, // addInteractivity
	
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
							colWidth: 4,
							width: undefined,
							height: 400,
							margin: {top: 10, right: 0, bottom: 30, left: 30},
							axesMargin: {top: 10, right: 30, bottom: 30, left: 10}
						}
				} // ctrl
				
				var options = dbsliceData.data.metaDataProperties
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
					if( dbsliceData.data.metaDataProperties.includes(plotData.yProperty) ){
						ctrl.view.yVarOption.val = plotData.yProperty
						ctrl.view.gVar =           plotData.yProperty
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
				
				var groupVals = dbsliceData.data.metaDataUniqueValues[groupKey]
				var subgroupVals = subgroupKey == undefined ? [undefined] : dbsliceData.data.metaDataUniqueValues[subgroupKey]
				
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
				
				var tasks = dbsliceData.data.metaDims[property].top(Infinity)
				
				return cfD3BarChart.helpers.getItems(tasks, property, color.settings.variable)
				
			}, // getFilteredItems
			
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
			
			createAxes: function createAxes(ctrl){
				
				var svg = ctrl.figure.select("svg.plotArea")
				
				var xAxis = svg.select("g.axis--x");
				var yAxis = svg.select("g.axis--y");

				if (xAxis.select("text").empty()){
					xAxis
					  .append("text")
					    .attr("class", "txt-horizontal-axis")
						.attr("fill", "#000")
						.attr("x", svg.select("g.data").attr("width"))
						.attr("y", ctrl.format.axesMargin.bottom)
						.attr("text-anchor", "end")
						.text("Number of Tasks");
				}; // if
				
				// Control the tick values, and make sure they only display integeers.
				var xAxisTicks = ctrl.tools.xscale.ticks()
					.filter(function(d){ return Number.isInteger(d) });
				
				xAxis
				  .call( d3.axisBottom(ctrl.tools.xscale)
					.tickValues(xAxisTicks)
					.tickFormat(d3.format("d")) );
				

				yAxis
				  .call(d3.axisLeft(ctrl.tools.yscale).tickValues([]));
				
			}, // createAxes
		
		
			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				// Do nothing. On all actions the graphics showing the current selection are being updated, which changes the amount of elements on hte screen accordingly.
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				
				// Just redraw the view with allDataPoints. To avoid circularity move the data extent to the foreground?
				var highlightedData = cfD3BarChart.helpers.getItems(allDataPoints, ctrl.view.yVarOption.val, color.settings.variable)
				cfD3BarChart.draw.plotCurrentSelection(ctrl, highlightedData)
				
				
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
				
				cfD3BarChart.draw.update(ctrl)
				
			}, // defaultStyle
			
			
		} // helpers
	
	}; // cfD3BarChart


export { cfD3BarChart };