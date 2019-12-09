import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';

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
	    var plotArea = svg.select(".plotArea");
		
		// Get the data through crossfilters dimension functionality.
	    var dimId = dbsliceData.data.metaDataProperties.indexOf(data.xProperty);
	    var group = dbsliceData.data.metaDims[dimId].group();
	    var items = group.all();
		
		// Remove any bars with no entries.
	    var removeZeroBar = layout.removeZeroBar === undefined ? false : layout.removeZeroBar;
	    if (removeZeroBar) items = items.filter(function (item) {
	      return item.value > 0;
	    });
	    
		// Create the x and y plotting scales.
		var x = d3.scaleLinear()
		  .range([0, svg.attr("plotWidth")])
		  .domain(  [  0, d3.max(  items, function (v) {return v.value;}  )  ]  );
	    
		var y = d3.scaleBand()
		  .range([0, svg.attr("plotHeight")])
		  .domain(  items.map(function (d) {return d.key;})  )
		  .padding([0.2])
		  .align([0.5]);
	    
		var colour = layout.colourMap === undefined ? d3.scaleOrdinal().range(["cornflowerblue"]) : d3.scaleOrdinal(layout.colourMap);
	    colour.domain( dbsliceData.data.metaDataUniqueValues[data.xProperty] );
		
		// Handle the entering/updating/exiting of bars.
	    var bars = plotArea
		  .selectAll("rect")
		  .data(items, function (v) {return v.key;});
		  
	    bars.enter()
		  .append("rect")
		    .on("click", function (selectedItem) {
	          
			  // check if current filter is already active
			  if ( dbsliceData.data.filterSelected[dimId] === undefined ) {
	            dbsliceData.data.filterSelected[dimId] = [];
	          } // if


			  if (dbsliceData.data.filterSelected[dimId].indexOf(selectedItem.key) !== -1) {
				  // Already active filter, let it remove this item from view.
				  var ind = dbsliceData.data.filterSelected[dimId].indexOf(selectedItem.key);
				  dbsliceData.data.filterSelected[dimId].splice(ind, 1);
			  } else {
				  // Filter not active, add the item to view.
				  dbsliceData.data.filterSelected[dimId].push(selectedItem.key);
			  }

			  cfUpdateFilters(dbsliceData.data);
			  
			  // Everything needs to b rerendered as the plots change depending on one another according to the data selection.
			  // It seems that if this one call the cfD3BarChart.update
			  render(dbsliceData.elementId, dbsliceData.session);
			})
			.attr("height", y.bandwidth())
			.attr("y",     function (v) {return      y(v.key);})
			.style("fill", function (v) {return colour(v.key);})
		    .transition()
		    .attr("width", function (v) {return    x(v.value);})
	        .attr("opacity", 1); // updating the bar chart bars

	    bars.transition()
		  .attr("width", function (v) {return x(v.value);})
		  .attr("y",     function (v) {return y(v.key);})
		  .attr("height", y.bandwidth()) 
	      .attr("opacity", function (v) {
			  // Change color if the filter has been selected.
	          // if no filters then all are selected
			  if (dbsliceData.data.filterSelected[dimId] === undefined || dbsliceData.data.filterSelected[dimId].length === 0) {
				return 1;
			  } else {
				return dbsliceData.data.filterSelected[dimId].indexOf(v.key) === -1 ? 0.2 : 1;
			  } // if
	      });
		  
	    bars.exit().transition().attr("width", 0).remove();
	    
		
		// Handle the axes.
		var xAxis = plotArea.select(".xAxis");
		var yAxis = plotArea.select(".yAxis");

	    if (xAxis.empty()) {
	      
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

	    if (yAxis.empty()) {
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
	    var keyLabels = plotArea
		  .selectAll(".keyLabel")
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
		
	  }, // update
	  
	  setupSvg: function setupSvg(container, data, layout){
		  // Create o clear existing svg to fix the bug of entering different plot types onto exting graphics.
		  
		  
		  // If layout has a margin specified store it as the internal property.
		  var margin = cfD3BarChart.margin;
	      margin = layout.margin === undefined ? cfD3BarChart.margin : layout.margin;
		  
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
				  .attr("plotWidth", width).attr("plotHeight", height)
				.append("g")
				  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				  .attr("class", "plotArea");
			
		  }; // curateSvg
	    

	  } // setupSvg
}; // cfD3BarChart

export { cfD3BarChart };