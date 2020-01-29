import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';

const cfD3BarChart = {

	name: "cfD3BarChart",
	
	margin: {top: 20, right: 20, bottom: 30, left: 20},
	
	make: function make(element, data, layout) {
	
		var container = d3.select(element);
	
		cfD3BarChart.setupSvg(container, data, layout);
	
		cfD3BarChart.update(element, data, layout);
	}, // make
  
	update: function update(element, data, layout) {
	
		var container = d3.select(element);
		
		// Setup the svg
		cfD3BarChart.setupSvg(container, data, layout);
		
		// Create some common handles.
		var svg = container.select("svg");
		
		// Get the items to plot.
		var items = cfD3BarChart.helpers.getItems(data.xProperty);
		
		// Create the x and y plotting scales.
		var x = cfD3BarChart.helpers.getScaleX(svg, items);
		var y = cfD3BarChart.helpers.getScaleY(svg, items);
		
		// Color scale
		var colour = d3.scaleOrdinal().range(["cornflowerblue"]);
		colour.domain( dbsliceData.data.metaDataUniqueValues[data.xProperty] );
		
		// Handle the entering/updating/exiting of bars.
		var bars = svg.select(".plotArea").selectAll("rect")
		  .data(items, function (v) {return v.key;});
		
		bars.enter()
		  .append("rect")
			.attr("keyVal", function(v){return v.key})
			.attr("height", y.bandwidth())
			.attr("y",     function (v) {return      y(v.key);})
			.style("fill", function (v) {return colour(v.key);})
		  .transition()
			.attr("width", function (v) {return    x(v.value);})
			.attr("opacity", 1); // updating the bar chart bars

		bars.exit().remove();
		
		
		// Handle the axes.
		createAxes();
		
		
		// Add interactivity:
		cfD3BarChart.addInteractivity.addOnMouseOver(svg);
		cfD3BarChart.addInteractivity.addOnMouseClick(svg, data.xProperty);
	
	
		// Helper functions
		function createAxes(){
			
			var plotArea = svg.select(".plotArea");
			
			var xAxis = plotArea.select(".xAxis");
			var yAxis = plotArea.select(".yAxis");

			if (xAxis.empty()){
			  
				plotArea
				  .append("g")
					.attr("transform", "translate(0," + svg.attr("plotHeight") + ")")
					.attr("class", "xAxis")
					.call(d3.axisBottom(x))
				  .append("text")
					.attr("fill", "#000")
					.attr("x", svg.attr("plotWidth"))
					.attr("y", cfD3BarChart.margin.bottom)
					.attr("text-anchor", "end")
					.text("Number of Tasks");
			} else {
				xAxis
				  .attr("transform", "translate(0," + svg.attr("plotHeight") + ")")
				  .transition()
				  .call(d3.axisBottom(x));
			}; // if

			if (yAxis.empty()){
				plotArea
				  .append("g")
					.attr("class", "yAxis")
					.call(d3.axisLeft(y).tickValues([]));
			} else {
				yAxis
				  .transition()
				  .call(d3.axisLeft(y).tickValues([]));
			}; // if

			// Add the labels to the bars
			var keyLabels = plotArea.selectAll(".keyLabel")
				.data(items, function (v) {return v.key;});
				
			keyLabels.enter()
			  .append("text")
				.attr("class", "keyLabel")
				.attr("x", 0)
				.attr("y", function (v){return y(v.key) + 0.5 * y.bandwidth();})
				.attr("dx", 5)
				.attr("dy", ".35em")
				.attr("text-anchor", "start")
				.text(function (v) {return v.key;}); // updating meta Labels

			keyLabels
			  .transition()
			  .attr("y", function (v){return y(v.key) + 0.5 * y.bandwidth();})
			  .text(function (v){return v.key;});
			
			keyLabels.exit().remove();
			
		} // createAxes
		
		
	}, // update
  
	setupSvg: function setupSvg(container, data, layout){
		// Create o clear existing svg to fix the bug of entering different plot types onto exting graphics.
	  
	  
		// If layout has a margin specified store it as the internal property.
		var margin = layout.margin === undefined ? cfD3BarChart.margin : layout.margin;
	  
		var svg = container.select("svg");          
		if (svg.empty()){
		  
		  
			// Append new svg.
			svg = container.append("svg");
	  
			curateSvg();
		  
		  
		} else {
			
			// Differentiate between changing plot types, or just changing the data!!
			// If just the data is changing nothing needs to be done here, whereas if the plot type is changing this function needs to remove anything it does not need!
			  
			var plotWrapper = container.select(function() {return this.parentElement.parentElement;});

			var expectedPlotType = plotWrapper.attr("plottype");
			
			if (expectedPlotType !== "cfD3BarChart" ){
				// If the plot type has changed, then the svg contents need to be removed completely.
				plotWrapper.attr("plottype", "cfD3BarChart")
				svg.selectAll("*").remove();
				
				curateSvg();
			} else {
				curateSvg();
			}; // if                  
		}; // if
	  
		function curateSvg(){
		
			var svgWidth = container.node().offsetWidth;
			var svgHeight = layout.height;
			var width = svgWidth - margin.left - margin.right;
			var height = svgHeight - margin.top - margin.bottom;
		  
			container.select("svg")
				.attr("width", svgWidth)
				.attr("height", svgHeight)
				.attr("plotWidth", width)
				.attr("plotHeight", height)
									
			var plotArea = container.select("svg").select(".plotArea");
			if(plotArea.empty()){
				// If there's nonoe, add it.
				container.select("svg")
				  .append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
					.attr("class", "plotArea");
				
			}; // if
		
		}; // curateSvg
	

	}, // setupSvg

	addInteractivity: {
		
		addOnMouseClick: function addOnMouseClick(svg, property){
			
			// Add the mouse click event
			svg.selectAll("rect").on("click", onClick);
			
			// Add the associated transition effects.
			svg.selectAll("rect").transition()
			  .attr("width", transitionWidthEffects)
			  .attr("y",     transitionYEffects)
			  .attr("height", transitionHeightEffects) 
			  .attr("opacity", transitionOpacityEffects);
			
			function onClick(d){
				
				var dimId = dbsliceData.data.metaDataProperties.indexOf(property);
				
				// check if current filter is already active
				if (dbsliceData.data.filterSelected[dimId] === undefined){
					dbsliceData.data.filterSelected[dimId] = [];
				} // if


				if (dbsliceData.data.filterSelected[dimId].indexOf(d.key) !== -1){
					// Already active filter, let it remove this item from view.
					var ind = dbsliceData.data.filterSelected[dimId].indexOf(d.key);
					dbsliceData.data.filterSelected[dimId].splice(ind, 1);
				} else {
					// Filter not active, add the item to view.
					dbsliceData.data.filterSelected[dimId].push(d.key);
				} // if

				cfUpdateFilters(dbsliceData.data);
			  
				
				// Everything needs to b rerendered as the plots change depending on one another according to the data selection.
				render(dbsliceData.elementId, dbsliceData.session);
				
				// Adjust the styling: first revert back to default, then apply the mouseover.
				crossPlotHighlighting.off(d, "cfD3BarChart");
				crossPlotHighlighting.on(d, "cfD3BarChart");
				
			} // onClick
			
			function transitionOpacityEffects(v){
				
				// Change color if the filter has been selected.
				// if no filters then all are selected
				var dimId = dbsliceData.data.metaDataProperties.indexOf(property);
				  
				if (dbsliceData.data.filterSelected[dimId] === undefined || dbsliceData.data.filterSelected[dimId].length === 0) {
					return 1;
				} else {
					return dbsliceData.data.filterSelected[dimId].indexOf(v.key) === -1 ? 0.2 : 1;
				} // if
				
			} // transitionEffects
			
			function transitionWidthEffects(v){
				
				// Get the items.
				var items = cfD3BarChart.helpers.getItems(property);
				
				// Get th eappropriate scale.
				var xscale = cfD3BarChart.helpers.getScaleX(svg, items);
				
				// Get the new width;
			  return xscale(v.value);
				
			} // transitionWidthEffects
			
			function transitionHeightEffects(){
				
				// Get the items.
				var items = cfD3BarChart.helpers.getItems(property);
				
				// Get th eappropriate scale.
				var yscale = cfD3BarChart.helpers.getScaleY(svg, items);
				
			  return yscale.bandwidth();
				
			} // transitionHeightEffects
			
			function transitionYEffects(v){
				
				// Get the items.
				var items = cfD3BarChart.helpers.getItems(property);
				
				// Get th eappropriate scale.
				var yscale = cfD3BarChart.helpers.getScaleY(svg, items);
				
				// Get the new width;
			  return yscale(v.key);
				
			} // transitionYEffects
			
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
			
		} // addOnMouseOver
		
	}, // addInteractivity

	helpers: {
		
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
		
		getScaleX: function getScaleX(svg, items){
			
			var scale = d3.scaleLinear()
				.range([0, svg.attr("plotWidth")])
				.domain([0, d3.max(items, function (v){return v.value;}) ]);
			
		  return scale;
		}, // getScaleX
		
		getScaleY: function getScaleY(svg, items){
			
			var scale = d3.scaleBand()
				.range([0, svg.attr("plotHeight")])
				.domain(  items.map(function (d) {return d.key;})  )
				.padding([0.2])
				.align([0.5]);
		
		  return scale;			
		} // getScaleY
		
	} // helpers

}; // cfD3BarChart


export { cfD3BarChart };