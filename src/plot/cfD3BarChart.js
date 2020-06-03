import { filter } from '../core/filter.js';
import { color } from '../core/color.js';
import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { plotHelpers } from '../plot/plotHelpers.js';

const cfD3BarChart = {

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
        
			
			// Create some common handles.
			var svg = ctrl.figure.select("svg.plotArea");
			
			// Get the items to plot.
			var items = cfD3BarChart.helpers.getItems(ctrl.view.yVarOption.val);
			
			
			
			
			
			
			// Handle the entering/updating/exiting of bars.
			var bars = svg.select("g.data").selectAll("rect").data(items);
			
			// New bars
			bars.enter()
			  .append("rect")
				.attr("height", getHeight)
				.attr("width", 0)
				.attr("x", 0)
				.attr("y", getPosition)
				.style("fill", getColor)
				.attr("opacity", getOpacity)
			  .transition()
				.attr("width", getWidth)	
			
			// Existing bars
			bars.transition()
			  .attr("height", getHeight)
			  .attr("width", getWidth)
			  .attr("y",     getPosition)
			  .style("fill", getColor)
			  .attr("opacity", getOpacity)

			bars.exit().remove()
			
			
			// Handle the entering/updating/exiting of bar labels.
			var keyLabels = svg.select("g.markup").selectAll(".keyLabel")
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
			
			
			// Handle the axes.
			cfD3BarChart.helpers.createAxes(ctrl);
			
			
			// Add interactivity:
			cfD3BarChart.addInteractivity.addOnMouseOver(svg);
			cfD3BarChart.addInteractivity.addOnMouseClick(ctrl);
        
		
			// TEST
			
			function getHeight(d){ return ctrl.tools.yscale.bandwidth() }
			function getWidth(d){ return ctrl.tools.xscale(d.value) }
			function getPosition(d){ return ctrl.tools.yscale(d.key) }
			function getColor(d){ return color.get(d.key) }
			function getOpacity(d){
					
				// Change color if the filter has been selected.
				// if no filters then all are selected
				var property = ctrl.view.yVarOption.val
				
				var filterItems = dbsliceData.data.filterSelected[property]
				if ( filterItems === undefined || filterItems.length === 0) {
					// The filter on this dimension either does not exist, or it contains no fitlered items, therefore this item is selected.
					return 1;
				} else {
					return filterItems.indexOf(d.key) === -1 ? 0.2 : 1;
				} // if
				
			} // transitionOpacityEffects
			
			function getLabelPosition(d){return getPosition(d) + 0.5*getHeight(d)}
			function getLabel(d){return d.key}
			
			
			
			
			


				
			
        }, // update
      
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
				/* The x and y axis tools need to be set up here, as well as the potential color scale. 
				
				
				*/
				
				// Get the items to plot. This is done on all the data here, and the scales are created here as well. This will make the axes fixed, and the bars move accordingly. This can be changed if needed by adjusting the xscale domain appropriately
				
				var property = ctrl.view.yVarOption.val
				var g = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				var width = g.attr("width")
				var height = g.attr("height")
				
				// TEMPORARY
				var dimId = dbsliceData.data.metaDataProperties.indexOf(property);
				var group = dbsliceData.data.metaDims[dimId].group();
				var items = group.all();
				
				// Remove any bars with no entries.
				items = items.filter(function (item){return item.value > 0;});
				
				// Add the property to it for convenience.
				items.forEach(function(d){d.keyProperty = property})
				var items = cfD3BarChart.helpers.getItems(ctrl.view.yVarOption.val);
				
				// The scale that will control the property used to visually convey numeric information.
				ctrl.tools.xscale = d3.scaleLinear()
					.range([0, width])
					.domain([0, d3.max(items, function (v){return v.value;}) ]);
				
				// 'd2.scaleBand' does the division of the plotting area into separate bands based on input categorical values, and returns the number corresponding to the position of the band, and to the width of the band by calling '<scale>()', and '<scale>.bandwidth()' respectively.
				// 'padding' sets the amount of space between the bands (innerPadding), and before and after the bands (outerPadding), to the same value.
				// 'align' controls how the outer padding is distributed between both ends of the band range.
				ctrl.tools.yscale = d3.scaleBand()
				    .range([0, height])
				    .domain(  items.map(function (d) {return d.key;})  )
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
						filter.update()
						
						// Perform tasks required by both the vertical and horizontal select on change events. This includes updating this plot, and it's plotting tools.
						plotHelpers.setupInteractivity.general.onSelectChange.common(ctrl)
						
						
						// Now render the view again. If a filter has been removed by changing the variable other plots will need to be updated too.
						render()
						
					} // return
				}, // vertical
			}, // onSelectChange
			
			addOnMouseClick: function addOnMouseClick(ctrl){
				
				// Add the mouse click event
				var property = ctrl.view.yVarOption.val
				var svg = ctrl.figure.select("svg.plotArea")
				
				svg.selectAll("rect").on("click", onClick);
				
				function onClick(d){
					
					
					// Update the filter selection.
					filter.addUpdateMetadataFilter(property, d.key)

					// Apply the selected filters to the crossfilter object.
				    filter.update();
				  
				    
				    // Everything needs to b rerendered as the plots change depending on one another according to the data selection.
				    render();
					
				} // onClick
				
			}, // addOnMouseClick
			
			addOnMouseOver: function addOnMouseOver(svg){
				
				var rects = svg.selectAll("rect");
				
				rects.on("mouseover", crossHighlightOn)
                     .on("mouseout",  crossHighlightOff);
					  
				function crossHighlightOn(d){
					
					// Here 'd' is just an object with properties 'key', and 'value'. The first denotes the value of the plotting property belonging to the bar, and the second how many items with that property value are currently selected.
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
							margin: {top: 10, right: 0, bottom: 30, left: 30},
							axesMargin: {top: 10, right: 30, bottom: 30, left: 10}
						}
				} // ctrl
				
				var options = dbsliceData.data.metaDataProperties
				ctrl.view.yVarOption = {name: "varName",
					                     val: options[0],
								     options: options}
				
				return ctrl
			
			}, // createDefaultControl
			
			createLoadedControl: function createLoadedControl(plotData){
			
				var ctrl = cfD3BarChart.helpers.createDefaultControl()
				
				// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
				if(plotData.xProperty != undefined){
					if( dbsliceData.data.dataProperties.includes(plotData.xProperty) ){
						ctrl.view.yVarOption.val = plotData.xProperty
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
		
			getItems: function getItems(property){
				
				// Get the data through crossfilters dimension functionality.
				var dimId = dbsliceData.data.metaDataProperties.indexOf(property);
				var group = dbsliceData.data.metaDims[dimId].group();
				var items = group.all();
				
				// Remove any bars with no entries.
				items = items.filter(function (item){return item.value > 0;});
				
				// Add the property to it for convenience.
				items.forEach(function(d){d.keyProperty = property})
				
			  return items;
			}, // getItems
			
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
				  .transition()
				  .call( d3.axisBottom(ctrl.tools.xscale)
					.tickValues(xAxisTicks)
					.tickFormat(d3.format("d")) );
				

				yAxis
				  .transition()
				  .call(d3.axisLeft(ctrl.tools.yscale).tickValues([]));
				
			}, // createAxes
		
		
			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("rect")
					.attr("stroke", "none")
					.attr("stroke-width", 3);
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, d){
					
				// Turn the text bold
				var labels = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .selectAll('.keyLabel')
				  ._groups[0];
				  
				labels.forEach(function(labelDOM){
					if(labelDOM.innerHTML == d[ctrl.view.yVarOption.val]){
						// Turn the text bold.
						labelDOM.style.fontWeight = 'bold'
					} // if
				}); // forEach
				
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
				// Remove the text bolding.
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .selectAll('.keyLabel')
				    .style("font-weight", "")
					
				// Rehighlight any manually selected tasks.
				crossPlotHighlighting.manuallySelectedTasks()
				
			}, // defaultStyle
			
			
		} // helpers
	
	}; // cfD3BarChart


export { cfD3BarChart };