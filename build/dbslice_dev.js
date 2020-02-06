var dbslice = (function (exports) {
    'use strict';

    function makeNewPlot( plotData, index ) {

    
        var plotRowIndex = d3.select(this._parent).attr("plot-row-index");
          
        var plot = d3.select(this)
          .append("div")
            .attr("class", "col-md-" + plotData.layout.colWidth + " plotWrapper")
            .attr("plottype", plotData.plotFunc.name)
          .append("div")
            .attr("class", "card");
          
          
        var plotHeader = plot
          .append("div")
            .attr("class", "card-header plotTitle");
        
        
        plotHeader
          .append("div")
            .attr("style","display:inline")
            .html(plotData.layout.title)
            .attr("spellcheck", "false")
            .attr("contenteditable", true);
            
          
        var plotBody = plot
          .append("div")
            .attr("class", "plot")
            .attr("plot-row-index", plotRowIndex)
            .attr("plot-index", index);
              
        plotData.plotFunc.make(plotBody.node(), plotData.data, plotData.layout);
		
		
		
        // Redraw the plot on window resize!
        $(window).resize(  function(){
			// Check if the element containing the plot to be resized is still in the visible dom (document). If not, then do not resize anything, as that will cause errors.
			if( document.body.contains(plotBody.node()) ){
				
				// Use the data assigned to the node to execute the redraw.
				d3.select(plotBody.node()).each(function(d){
					d.layout.isWindowResized = true
					d.plotFunc.update( plotBody.node(), d.data, d.layout );
					d.layout.isWindowResized = false
				}) // each
				
			    
			} // if
            
        }  );
		

    } // makeNewPlot

    function updatePlot( plotData, index ) {

		var plot = d3.select( this ) // this is the plotBody selection

		plotData.plotFunc.update(plot.node(),plotData.data,plotData.layout);

	} // updatePlot


	var cfDataManagement = {
		
		cfInit: function cfInit(metadata){
      
			var cfData = {};
			cfData.metaDataProperties = metadata.header.metaDataProperties;
			cfData.dataProperties = metadata.header.dataProperties;
			cfData.sliceProperties = metadata.header.sliceProperties;
			cfData.contourProperties = metadata.header.contourProperties;
			cfData.cf = crossfilter(metadata.data);
			cfData.metaDims = [];
			cfData.metaDataUniqueValues = {};
			cfData.dataDims = [];
			cfData.fileDim = [];
			cfData.filterSelected = [];
			cfData.histogramSelectedRanges = []; 
			
			// Populate the metaDims and metaDataUniqueValues.
			cfData.metaDataProperties.forEach(function (property, i) {
				cfData.metaDims.push(cfData.cf.dimension(function (d){return d[property];}));
				cfData.metaDataUniqueValues[property] = Array.from(new Set( metadata.data.map(
					function (d){return d[property];}
				)));
			}); // forEach
			
			
			// Populate the dataDims. cf.dimension(function(d){return d.<property>}) sets up a dimension, which is an object that can perform some specific tasks based on the data it is give. Two of these are "top(n)", and "bottom(n)", whih return topmost and bottommost n elements respectively.
			cfData.dataProperties.forEach(function (property, i) {
			  cfData.dataDims.push(cfData.cf.dimension(function (d) {
				return d[property];
			  }));
			}); // forEach
			
			

			cfData.fileDim = cfData.cf.dimension(function (d){return d.file;})
			
			
			// Create a standalone array of taskIds
			dbsliceData.filteredTaskIds = cfDataManagement.helpers.getTaskIds(metadata);
			
			// Store data internally
		    dbsliceData.data = cfData;
			
			
			
			
			
			
			
		}, // cfInit
		
		
		cfAdd: function cfAdd(metadata){
			// This function attempts to add data to the already existing dataset. It allows a compromise between searching for all available data and loading it in, and personally creating additional combinations of the metadata in csv files.
			// The ideal solution would be for each individual task to have it's own small metadata file, which could then by parsed by a search engine. This is unpractical for a localised application - this functionality is usable however.
			
			// If no data is currently loaded then call cfInit instead - this allows the dimensions to be overrun.
			if (dbsliceData.data !== undefined){
				if (dbsliceData.data.cf.all().length < 1){
					cfDataManagement.cfInit(metadata)
			
				} else {
			
					// Here the compatibility of data needs to be assessed. If the new dataset has the same variables as the existing datasets, then add those in. If it does not do nothing.
					var canMerge = cfDataManagement.helpers.crossCheckProperties(dbsliceData.data, metadata)
					
					if(canMerge){
						
						// Add these records into the dataset.
						dbsliceData.data.cf.add(metadata.data)
						
						// Update the filtered taskIds - note that these could fall into some filters, and therefore not be active straight away...
						var currentMetaData = dbsliceData.data.metaDims[0].top(Infinity);
						dbsliceData.filteredTaskIds = currentMetaData.map(function (d){return d.taskId;});
						
					} // if
			
			
				} // if
			} // if
			
			
		}, // cfAdd
		
		
		cfRemove: function cfRemove(dataFilesToRemove){
			// This function will remove the data from the crossfilter.
						
			// Loop though all the dimensions and remove the filters.
			dbsliceData.data.metaDims.forEach(function(metaDim){
				metaDim.filterAll()
			}) // forEach
			
			dbsliceData.data.dataDims.forEach(function(dataDim){
				dataDim.filterAll()
			}) // forEach
			
			// Apply the new filter. - I think this isn't working.
			dbsliceData.data.fileDim.filter(function(d){
				return dataFilesToRemove.indexOf(d) > -1
			})
			
			
			// Remove the data.
			dbsliceData.data.cf.remove()
			
			
			// Remove the filter.
			dbsliceData.data.fileDim.filterAll()
			
			// Reinstate other data filters.
			cfUpdateFilters( dbsliceData.data )
			
			
			
		}, // cfRemove
		
		
		helpers : {
			
			getTaskIds: function getTaskIds(metadata){
				var taskIds = [];
				metadata.data.forEach(function (task, i) {
				  taskIds.push(task.taskId);
				});
			  return taskIds
			}, // getTaskIds
			
			crossCheckProperties: function crossCheckProperties(existingData, newData){
				
				
				// oldData.header.dataProperties.filter(function(d){  return !newData.includes(d) })
				var missingDataProperties = existingData.dataProperties.filter(function(d){  return !newData.header.dataProperties.includes(d) })
				
				var missingMetadataProperties = existingData.metaDataProperties.filter(function(d){  return !newData.header.metaDataProperties.includes(d) })
				
				var missingSliceProperties = existingData.sliceProperties.filter(function(d){  return !newData.header.sliceProperties.includes(d) })
					
				var missingContourProperties = existingData.contourProperties.filter(function(d){  return !newData.header.contourProperties.includes(d) })
				
				var allPropertiesIncluded =     (missingDataProperties.length == 0) && 
										    (missingMetadataProperties.length == 0) &&
										       (missingSliceProperties.length == 0) &&
										     (missingContourProperties.length == 0)
											 
				
				
				if(allPropertiesIncluded){
					return true
				} else {
					// Which ones are not included?
					var warningText = "Selected data has been rejected. It requires additional variables:\n" + 
					"Data variables:     " +     missingDataProperties.join(", ") + "\n" +
				    "Metadata variables: " + missingMetadataProperties.join(", ") + "\n" +
					"Slice variables:    " +    missingSliceProperties.join(", ") + "\n" +
					"Contour variables:  " +  missingContourProperties.join(", ") + "\n"
					
					
					window.alert(warningText)
					return false
				} // if
				
			} // checkProperties
			
		} // helpers
		
	} // cfDataManagement
    

    

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
    } // _classCallCheck



    var DbsliceData = function DbsliceData() {
        _classCallCheck(this, DbsliceData);
    } // dbsliceData

    var dbsliceData = new DbsliceData();




    var cfD3Histogram = {
          
        name: "cfD3Histogram",
        
        margin: {top: 20, right: 20, bottom: 30, left: 50},
        
        colour: [],
          
        make: function make(element, data, layout) {
         
          
          
            // Update the view
            cfD3Histogram.update(element, data, layout);
          
        },
        
        update: function update(element, data, layout) {

            var container = d3.select(element);
          
            cfD3Histogram.setupSvg(container, data, layout);
          
            var svg = container.select("svg");
          
          
            // Get the required data.
            var items = dbsliceData.data.dataDims[0].top(Infinity);
          
            // Get the scale. All properties requried are in the svg.
			var x = cfD3Histogram.helpers.getXScale(svg);
          
            // Get the bins to plot
            var bins = cfD3Histogram.helpers.getBins(x, data.xProperty, items);
		  
		    // Make either a fixed scale or reactive scale (false/true)
            var y = cfD3Histogram.helpers.getYScale(svg, bins, false);
			  
			  
            // Handle entering/updating/removing the bars.
            var bars = svg.select(".plotArea").selectAll("rect").data(bins);
        
            bars.enter()
              .append("rect")
                .attr("transform", function (d){
                    return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
                .attr("x", 1)
                .attr("width",  function (d){return x(d.x1) - x(d.x0) - 1;})
                .attr("height", function (d){return svg.attr("plotHeight") - y(d.length);})
                .style("fill", cfD3Histogram.colour)
                .attr("opacity", 1);
                    
            bars.transition()
              .attr("transform", function (d){
                  return "translate(" + x(d.x0) + "," + y(d.length) + ")";})
              .attr("x", 1)
              .attr("width", function (d){return x(d.x1) - x(d.x0) - 1;})
              .attr("height", function (d){return svg.attr("plotHeight") - y(d.length);});
              
            bars.exit().remove();
        
		
			// Make some axes
			cfD3Histogram.helpers.createAxes(svg, x, y, data.xProperty, "Number of tasks")
		
		
		
		
			
        
        }, // update
        
        setupSvg: function setupSvg(container, data, layout){
            // Add the setupSvg function!!
            
            // If layout has a margin specified store it as the internal property.
            cfD3Histogram.margin = layout.margin === undefined ? cfD3Histogram.margin : layout.margin;
            cfD3Histogram.colour = layout.colour === undefined ? "cornflowerblue" : layout.colour;
            
            
            var svg = container.select("svg");
            if (svg.empty()){
                
                // Append new svg
                svg = container.append("svg");
                
                // Update its dimensions.
                curateSvg();
				
				// Add functionality.
				cfD3Histogram.setupInteractivity.addBrush(svg);
                 
            } else {
                
                // Differentiate between changing plot types, or just changing the data!!
                // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, is attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
                  
                var plotWrapper = container.select(function() {return this.parentElement.parentElement;});

                var expectedPlotType = plotWrapper.attr("plottype");
                
                if (expectedPlotType !== "cfD3Histogram" ){
                    // If the plot type has changed, then the svg contents need to be removed completely.
                    plotWrapper.attr("plottype", "cfD3Histogram")
                    
                    svg.selectAll("*").remove();
                    curateSvg();
                    
					// Add functionality.
					cfD3Histogram.setupInteractivity.addBrush(svg);
                    
                } else {
                    // Axes might need to be updated, thus the svg element needs to be refreshed.
                    curateSvg();
                    
					// Only update the brush if the window is resized - otherwise the functionality should remain the same
					if(layout.isWindowResized){
						cfD3Histogram.setupInteractivity.addBrush(svg);
					} // if
					
					
                }; // if        
                
            }; // if
          
          
            function curateSvg(){
              
              
                // Get plot dimensions
                var svgWidth = container.node().offsetWidth;
                var svgHeight = layout.height;
                var width = svgWidth - cfD3Histogram.margin.left - cfD3Histogram.margin.right;
                var height = svgHeight - cfD3Histogram.margin.top - cfD3Histogram.margin.bottom;
				
				
				
              
                // Calculation the min and max values - based on all the data, otherwise crossfilter will remove some, and the x-axis will be rescaled every time the brush adds or removes data.
                var items = dbsliceData.data.cf.all();
                
                var xDomMin = d3.min(items, function (d) {return d[data.xProperty];}) * 0.9;
                var xDomMax = d3.max(items, function (d) {return d[data.xProperty];}) * 1.1;
				
                
                // The dimId needs to be assigned here, otherwise there is confusion between the brush and the data if a hitogram plot inherits a histogram plot.
                var dimId = dbsliceData.data.dataProperties.indexOf(data.xProperty);
                
                // Curating the svg.                
                var svg = container.select("svg")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight)
                    .attr("plotWidth", width)
                    .attr("plotHeight", height)
                    .attr("xDomMin", xDomMin)
                    .attr("xDomMax", xDomMax)
                    .attr("dimId", dimId);
					
				// Create original bins to compare against during exploration.
				var x = cfD3Histogram.helpers.getXScale(svg);
				var bins = cfD3Histogram.helpers.getBins(x, data.xProperty, items);
				var yDomMax = d3.max(bins, function(d) {return d.length} )
				svg.attr("yDomMax", yDomMax)
                    
                var plotArea = svg.select(".plotArea");
                if(plotArea.empty()){
                    // If there's nonoe, add it.
                    svg
                      .append("g")
                        .attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")")
                        .attr("class", "plotArea");
                    
                }; // if
                
            }; // setupSvg.updateSvgAttributes
          
        }, // setupSvg
      
        setupInteractivity: {
			
			addBrush: function addBrush(svg){
				// The hardcoded values need to be declared upfront, and abstracted.
				
				
				// Get the scale. All properties requried are in the svg.
				var x = cfD3Histogram.helpers.getXScale(svg)
				
				
				// There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again
				// Why is there no brush here on redraw??
				var brush = svg.select(".brush")
				if(brush.empty()){
					brush = svg
					  .append("g")
						.attr("class","brush")
						.attr("xDomMin", svg.attr("xDomMin"))
						.attr("xDomMax", svg.attr("xDomMax"))
						.attr("transform", "translate(" + cfD3Histogram.margin.left + "," + cfD3Histogram.margin.top + ")")
						
					var xMin = svg.attr("xDomMin")
					var xMax = svg.attr("xDomMax")
					
				} else {
					var xMin = brush.select(".selection").attr("xMin")
					var xMax = brush.select(".selection").attr("xMax")
					
					brush.selectAll("*").remove();
					
				}// if
				
				
					
				var rect = brush
				  .append("rect")
					.attr("class", "selection")
					.attr("cursor", "move")
					.attr("width", x(xMax) - x(xMin))
					.attr("height", svg.attr("plotHeight"))
					.attr("x", x(xMin))
					.attr("y", 0)
					.attr("opacity", 0.2)
					.attr("xMin", xMin)
					.attr("xMax", xMax)
					
				
				// Make the rect draggable
				rect.call( d3.drag().on("drag", dragmove  ) )
				
				
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
					.call( d3.drag().on("drag", dragsize) )
				brush
				  .append("rect")
					.attr("class", "handle handle--w")
					.attr("cursor", "ew-resize")
					.attr("x", Number(rect.attr("x")) - 10)
					.attr("y", Number(rect.attr("y")) + Number(rect.attr("height"))/4 )
					.attr("width", 10)
					.attr("height", Number(rect.attr("height"))/2)
					.attr("opacity", 0)
					.call( d3.drag().on("drag", dragsize) )
				

				// Decorative handles.
				var handleData = [{x0: [Number(rect.attr("x")) + Number(rect.attr("width")),
				                       Number(rect.attr("y")) + Number(rect.attr("height"))/4],
								  height: Number(rect.attr("height"))/2, 
								  side: "e"}, 
								  {x0: [Number(rect.attr("x")),
				                       Number(rect.attr("y")) + Number(rect.attr("height"))/4],
								  height: Number(rect.attr("height"))/2, 
								  side: "w"}]
				
				
				brush.selectAll("path").data(handleData).enter()
				  .append("path")
				    .attr("d", drawHandle )
					.attr("stroke", "#000")
					.attr("fill", "none")
					.attr("class", function(d){ return "handle handle--decoration-" + d.side})
					
				function drawHandle(d){
					// Figure out if the west or east handle is needed.
					var flipConcave = d.side == "e"? 1:0
					var flipDir = d.side == "e"? 1:-1
					
					var lambda = 30/300
					var r = lambda*d.height
					
					var start = "M" + d.x0[0] + " " + d.x0[1]
					var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir*r, r].join(" ")
					var leftLine = "h0 v" + (d.height - 2*r)
					var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir*r, r].join(" ")
					var closure = "Z"
					var innerLine = "M" + [d.x0[0] + flipDir*r/2, d.x0[1] + r].join(" ") + leftLine
					
					return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ")
					
				}// drawHandle
				
				
				function dragmove(){
					var x = cfD3Histogram.helpers.getXScale(svg)
					
					var rect = d3.select(this)
					var brush = d3.select(this.parentNode)

					
					// Update teh position of the left edge by the difference of the pointers movement.
					var oldWest = Number(rect.attr("x"))
					var oldEast = Number(rect.attr("x")) + Number(rect.attr("width"))
					var newWest = oldWest + d3.event.dx; 
					var newEast = oldEast + d3.event.dx;
					
					// Check to make sure the boundaries are within the axis limits.
					if (x.invert(newWest) <  brush.attr("xDomMin")){
						newWest = x(brush.attr("xDomMin"))
					} else if (x.invert(newEast) >  brush.attr("xDomMax")){
						newEast = x(brush.attr("xDomMax"))
					} // if
					
					
					// Update the xMin and xMax values.
					rect.attr("xMin", x.invert(newWest))
					rect.attr("xMax", x.invert(newEast))
					
					
					// Update the selection rect.
					cfD3Histogram.setupInteractivity.updateBrush(svg);
					
					// Update the data selection
					updateSelection(brush)
					
					// Rerender to allow other elements to respond.
					render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
					
				} // dragmove
				
				function dragsize(){
					// Update teh position of the left edge by the difference of the pointers movement.
					var x = cfD3Histogram.helpers.getXScale(svg)
					
					var handle = d3.select(this)
					var brush = d3.select(this.parentNode)
					
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
					if (x.invert(newWest) <  brush.attr("xDomMin")){
						newWest = x(brush.attr("xDomMin"))
					} else if (x.invert(newEast) >  brush.attr("xDomMax")){
						newEast = x(brush.attr("xDomMax"))
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
					
					
					// Update the xMin and xMax values.
					brush.select(".selection").attr("xMin", x.invert(newWest))
					brush.select(".selection").attr("xMax", x.invert(newEast))
					
					// Update the brush rectangle
					cfD3Histogram.setupInteractivity.updateBrush(svg);
					
					
					// Update the data selection
					updateSelection(brush)
					
					// Rerender to allow other elements to respond.
					render(dbsliceData.elementId, dbsliceData.session, dbsliceData.config);
					
				} // dragsize
				
				function updateSelection(brush){
					
					var rect = brush.select(".selection")
					var lowerBound = Number(rect.attr("x"))
					var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"))
					
					var selectedRange = [x.invert(lowerBound), x.invert(upperBound)]
					
					dbsliceData.data.histogramSelectedRanges[svg.attr("dimId")] = selectedRange;
					
					// Update the filter
					cfUpdateFilters( dbsliceData.data );
					
				} // updateSelection
				
			}, // addBrush
			
			updateBrush: function updateBrush(svg){
				
				
				// First get the scale
				var x = cfD3Histogram.helpers.getXScale(svg)
				
				// Now get the values that are supposed to be selected.
				var xMin = Number(svg.select(".selection").attr("xMin"))
				var xMax = Number(svg.select(".selection").attr("xMax"))
				
				// Update teh rect.
				svg.select(".selection")
				  .attr("x", x(xMin))
				  .attr("width", x(xMax) - x(xMin))
				
				// Update the handles				
				svg.select(".brush").select(".handle--e").attr("x", x(xMax))
				svg.select(".brush").select(".handle--w").attr("x", x(xMin) - 10)
				
				// CLEAN THIS UP:
				// Update the handle decorations
				var rect = svg.select(".selection")
				var de = {x0: [Number(rect.attr("x")) + Number(rect.attr("width")),
				               Number(rect.attr("y")) + Number(rect.attr("height"))/4],
						  height: Number(rect.attr("height"))/2, 
						  side: "e"}
				var dw = {x0: [Number(rect.attr("x")),
			                   Number(rect.attr("y")) + Number(rect.attr("height"))/4],
					  height: Number(rect.attr("height"))/2, 
						side: "w"}
				
				svg.select(".brush").select(".handle--decoration-e")
				  .attr("d", drawHandle(de))
				svg.select(".brush").select(".handle--decoration-w")
				  .attr("d", drawHandle(dw))
				  
				function drawHandle(d){
					// Figure out if the west or east handle is needed.
					var flipConcave = d.side == "e"? 1:0
					var flipDir = d.side == "e"? 1:-1
					
					var lambda = 30/300
					var r = lambda*d.height
					
					var start = "M" + d.x0[0] + " " + d.x0[1]
					var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir*r, r].join(" ")
					var leftLine = "h0 v" + (d.height - 2*r)
					var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir*r, r].join(" ")
					var closure = "Z"
					var innerLine = "M" + [d.x0[0] + flipDir*r/2, d.x0[1] + r].join(" ") + leftLine
					
					return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ")
					
				}// drawHandle

				
			} // updateBrush
			
			
		}, // setupInteractivity
		
		helpers: {
			
			getXScale: function getXScale(svg){
				
				var x = d3.scaleLinear()
				  .domain(    [svg.attr("xDomMin"), svg.attr("xDomMax")  ])
				  .rangeRound([0                  , svg.attr("plotWidth")]);
				return x;
				
			}, // getXScale
			
			getYScale: function getYScale(svg, bins, reactive){
				
				if(reactive){
					var y = d3.scaleLinear()
					  .domain([0, d3.max(bins, function (d){return d.length;})])
					  .range([svg.attr("plotHeight"), 0]);
				} else {
					var y = d3.scaleLinear()
					  .domain([0, svg.attr("yDomMax")])
					  .range([svg.attr("plotHeight"), 0]);
				}// if
				
			  return y
				
			}, // getYScale
			
			getBins: function getBins(x, property, items){
				
				// The function in the histogram ensures that only a specific property is extracted from the data input to the function on the 'histogram(data)' call.
				var histogram = d3.histogram()
				  .value(function (d) {return d[property];})
				  .domain(x.domain())
				  .thresholds(x.ticks(20));
			  
				var bins = histogram(items);
				
			  return bins
			}, // getBins
			
			createAxes: function createAxes(svg, x, y, xLabel, yLabel){
				

				
				// Handle the axes.
				var xAxis = svg.select(".plotArea").select(".xAxis");
				if (xAxis.empty()){
					xAxis = svg.select(".plotArea")
						  .append("g")
							.attr("class", "xAxis")
							.attr("transform", "translate(0," + svg.attr("plotHeight") + ")")
							.call(d3.axisBottom(x));
						
					xAxis
					.append("text")
					  .attr("class", "xAxisLabel")
					  .attr("fill", "#000")
					  .attr("x", svg.attr("plotWidth"))
					  .attr("y", cfD3Histogram.margin.bottom)
					  .attr("text-anchor", "end")
					  .text(xLabel);
				  
				} else {
					// If the axis is already there it might just need updating.
					svg.select(".plotArea").select(".xAxis").call(d3.axisBottom(x));
					
				}; // if
			
				// The axes class holds the axes labels
				var axes = svg.select(".plotArea").select(".axes");
				if (axes.empty()) {
				  svg.select(".plotArea")
					.append("g")
					  .attr("class", "axes")
					  .call(d3.axisLeft(y));
				} else {
				  axes.transition().call(d3.axisLeft(y));
				} // if

				var yAxisLabel = svg.select(".plotArea").select(".axes").select(".yAxisLabel");
				if (yAxisLabel.empty()) {
				  svg.select(".plotArea").select(".axes")
					.append("text")
					  .attr("class", "yAxisLabel")
					  .attr("fill", "#000")
					  .attr("transform", "rotate(-90)")
					  .attr("x", 0)
					  .attr("y", -25)
					  .attr("text-anchor", "end")
					  .text(yLabel);
				} // if

			} // createAxes
			
		} // helpers
		
      
    }; // cfD3Histogram

    var cfD3Scatter = {
        
        name: "cfD3Scatter",
      
        margin: {top: 20, right: 20, bottom: 30, left: 50},
      
        colour: [],
      
        opacity: 1,
        
        make: function make(element, data, layout) {
            
            // Update the plot.
            cfD3Scatter.update(element, data, layout);
        },
      
        update: function update(element, data, layout) {
            
            
            cfD3Scatter.setupSvg(d3.select(element), data, layout);
            
            // Selections for plotting.
            var svg = d3.select(element).select("svg");
            
            
            // Get the points data, and calculate its range.
            var pointData = cfD3Scatter.helpers.getPointData(data);
            
            // Create the scales required for plotting. These convert data values into pixel positions on the screen.
            var xscale = createScale("x");
            var yscale = createScale("y");
            

            // Handle entering/updating/removing points.
            var points = svg.select(".plotArea").selectAll("circle").data(pointData);
            points.enter()
              .append("circle")
                .attr("r", 5)
                .attr("cx", function (d) { return xscale(d[data.xProperty]); })
                .attr("cy", function (d) { return yscale(d[data.yProperty]); })
                .style("fill", function (d) { return returnPointColor(d, data.cProperty); })
                .style("opacity", cfD3Scatter.opacity)
                .attr("clip-path", "url(#" + svg.select("clipPath").attr("id") + ")")
                .attr("task-id", function (d) { return d.taskId; });
                
            points
              .attr("r", 5)
              .attr("cx", function (d) { return xscale(d[data.xProperty]); })
              .attr("cy", function (d) { return yscale(d[data.yProperty]); })
              .style("fill", function (d) { return returnPointColor(d, data.cProperty); })
              .attr("task-id", function (d) { return d.taskId; });
              
            points.exit().remove();
            
            
            // Plot the axes
            createAxes();        

            // ADD INTERACTIVITY
            
            // Add the tooltip interactivity
            cfD3Scatter.addInteractivity.addTooltip(svg);

            // Add zooming.
            cfD3Scatter.addInteractivity.addZooming(svg, data);
            
        
            
            // HELPER FUNCTIONS
            function createScale(axis){
                
                // Create the scales that position the points in the svg area.
                switch(axis){
                    case "x":
                        var xRange_ = cfD3Scatter.helpers.getRange(svg, "x");
                        var scale = d3.scaleLinear()
                            .range([0, svg.attr("plotWidth")])
                            .domain( xRange_ );
                    
                      break;
                      
                    case "y":
                        var yRange_ = cfD3Scatter.helpers.getRange(svg, "y");
                        var scale = d3.scaleLinear()
                            .range([svg.attr("plotHeight"), 0])
                            .domain( yRange_ );
                      break;
                    
                }; // switch
                
                return scale;
                
            }; // createScale
                    
            function returnPointColor(d, cProperty){
                var pointColor = [];
                if (cProperty !== undefined){
                    pointColor = cfD3Scatter.colour(d[cProperty]);
                } else {
                    pointColor = cfD3Scatter.colour(1);
                };
                return pointColor;
            }; // returnPointColor
            
            function createAxes(){
                
                // Something with the axis?
                var xAxis = d3.axisBottom(xscale);
                var yAxis = d3.axisLeft(yscale);
               
                var xAxisContainer = svg.select(".plotArea").select(".axis--x");
                if (xAxisContainer.empty()) {
                  xAxisContainer = svg.select(".plotArea").append("g")
                      .attr("transform", "translate(0," + svg.attr("plotHeight") + ")")
                      .attr("class", "axis--x")
                      .call(xAxis);
                      
                  xAxisContainer.append("text")
                      .attr("fill", "#000")
                      .attr("x", svg.attr("plotWidth"))
                      .attr("y", cfD3Scatter.margin.bottom - 2)
                      .attr("text-anchor", "end")
                      .text(data.xProperty);
                } else {
                  xAxisContainer.transition()
                    .call(xAxis);
                }; // if

                var yAxisContainer = svg.select(".plotArea").select(".axis--y");
                if (yAxisContainer.empty()) {
                  yAxisContainer = svg.select(".plotArea").append("g")
                      .attr("class", "axis--y")
                      .call(yAxis);
                      
                  yAxisContainer.append("text")
                      .attr("fill", "#000")
                      .attr("transform", "rotate(-90)")
                      .attr("x", 0)
                      .attr("y", -cfD3Scatter.margin.left + 15)
                      .attr("text-anchor", "end")
                      .text(data.yProperty);
                } else {
                  yAxisContainer.transition()
                    .call(yAxis);
                }; // if
                
                
            }; // createAxes
            
            
        }, // update
      
        setupSvg: function setupSvg(container, data, layout){
            // Create o clear existing svg to fix the bug of entering different plot types onto exting graphics.
              
              
            // If layout has a margin specified store it as the internal property.
            var margin = cfD3Scatter.margin;
            margin = layout.margin === undefined ? cfD3Scatter.margin : layout.margin;
              
            // Set either the default colour, or the user selected one
            cfD3Scatter.colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeCategory10) : d3.scaleOrdinal(layout.colourMap);
              
            // Here the color domain is defined. If a cProperty is specified this is ok,
            // but if it isn't it can cause trouble!
            if (data.cProperty !== undefined){
                cfD3Scatter.colour.domain(dbsliceData.data.metaDataUniqueValues[data.cProperty]);
            } else {
                cfD3Scatter.colour.domain([1]);
            }; // if
              
            // Same for opacity
            var opacity = cfD3Scatter.opacity;
            opacity = opacity = layout.opacity === undefined ? 1.0 : layout.opacity;
              
              
              
            var svg = container.select("svg");          
            if (svg.empty()){
                  
                // Append new svg
                svg = container.append("svg");
                  
                // Update its dimensions.
                curateSvg();
                  
                
            } else {
                    
                // Differentiate between changing plot types, or just changing the data!!
                // If just the data is changing nothing needs to be done here, whereas if the plot type is changing this function needs to remove anything it does not need!
                      
                var plotWrapper = container.select(function() {return this.parentElement.parentElement;});
                    
                    

                var expectedPlotType = plotWrapper.attr("plottype");
                if (expectedPlotType !== "cfD3Scatter" ){
                    // If the plot type has changed, then the svg contents need to be removed completely.
                    plotWrapper.attr("plottype", "cfD3Scatter")
                    
                    svg.selectAll("*").remove();
                    curateSvg();
                        
                    // The interactivity is added in the main update function!
                        
                } else {
                    // The plot is being inherited by another scatter plot. Just update the plot.
                    curateSvg();
                        
                        
                }; // if                  
            }; // if
              
              
            function curateSvg(){
                  
                  
                var svgWidth = container.node().offsetWidth;
                var svgHeight = layout.height;
                var width = svgWidth - margin.left - margin.right;
                var height = svgHeight - margin.top - margin.bottom;
                  
                var pointData = cfD3Scatter.helpers.getPointData(data);
                  
                var xRange = cfD3Scatter.helpers.calculateRange(pointData, data.xProperty);
                var yRange = cfD3Scatter.helpers.calculateRange(pointData, data.yProperty);
                  
                container.select("svg")
                  .attr("width", svgWidth)
                  .attr("height", svgHeight)
                  .attr("plotWidth", width)
                  .attr("plotHeight", height)
                  .attr("xDomMin", xRange[0])
                  .attr("xDomMax", xRange[1])
                  .attr("yDomMin", yRange[0])
                  .attr("yDomMax", yRange[1]);
              
                var plotArea = container.select("svg").select(".plotArea");
                if (plotArea.empty()){
                    container.select("svg")
                      .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .attr("class", "plotArea"); 
                }; // if
                      

                // Add a clipPath: everything outside the size of this area won't be drawn.
                // I think just the size of this element matters, not where it is actually located on the screen.
                var clipId = "clip-" + container.attr("plot-row-index") + "-" + container.attr("plot-index");
                var clip = container.select("svg").select("clipPath")
                if (clip.empty()){
                    container.select("svg")
                      .append("clipPath")
                        .attr("id", clipId)
                      .append("rect")
                        .attr("width", svg.attr("plotWidth"))
                        .attr("height", svg.attr("plotHeight"));
                } else {
                    clip.select("rect")
                      .attr("width", svg.attr("plotWidth"))
                      .attr("height", svg.attr("plotHeight"))
                }; // if
                      
            }; // setupSvg.curateSvg
            

        }, // setupSvg
      
        addInteractivity: {
              
            addTooltip: function addTooltip(svg){
                  
                // This controls al the tooltip functionality.
                  
                var points = svg.selectAll("circle");
                  
                points.on("mouseover", tipOn)
                      .on("mouseout", tipOff);
                  
				// Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
                var tip = d3.tip()
                  .attr('class', 'd3-tip')
                  .offset([-10, 0])
                  .html(function (d) {
                      return "<span>" + d.label + "</span>";
                  });
                  
                
                svg.call( tip );
                      
                      
                function tipOn(d) {
                    // points.style("opacity", 0.2);
                    // d3.select(this).style("opacity", 1.0).attr("r", 7);
                    tip.show(d);
					
					// Here I want to add cross highlighting.
					crossPlotHighlighting.on(d, "cfD3Scatter")
                }; // tipOn

                function tipOff(d) {
                    // points.style("opacity", cfD3Scatter.opacity);
                    // d3.select(this).attr("r", 5);
                    tip.hide();
					
					// Add cross highlighting effect.
					crossPlotHighlighting.off(d, "cfD3Scatter")
                }; // tipOff
                  
                  
            }, // addTooltip
              
            addZooming: function addZooming(svg, data){
                  
                  
                var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
            
                svg.transition().call(zoom.transform, d3.zoomIdentity);
                svg.call(zoom);
                    
                    
                function zoomed() {
                    var t = d3.event.transform;
                      
                    // Get the domains:
                    var xRange = cfD3Scatter.helpers.getRange(svg, "x");
                    var yRange = cfD3Scatter.helpers.getRange(svg, "y");
                      
                    // Recreate original scales.
                    var xscale = d3.scaleLinear()
                      .range([0, svg.attr("plotWidth")])
                      .domain( xRange );
                    var yscale = d3.scaleLinear()
                      .range([svg.attr("plotHeight"), 0])
                      .domain( yRange );
                      
                    // Create new axes based on the zoom, which altered the domain.
                    // d3.event.transform.rescaleX(xScale2).domain() to get the exact input of the location showing in the zooming aera and brush area.
                    var newXRange = t.rescaleX(xscale).domain();
                    var newYRange = t.rescaleY(yscale).domain();
                      
                    // Create new scales in the zoomed area.
                    xscale.domain(newXRange);
                    yscale.domain(newYRange);
                      
                    // Redo the axes.
                    svg.select(".plotArea").select(".axis--x").call( d3.axisBottom(xscale) );
                    svg.select(".plotArea").select(".axis--y").call( d3.axisLeft(yscale) );
                      
                    // Reposition all dots
                    svg.select(".plotArea").selectAll("circle")
                      .attr("cx", function (d) {return xscale(d[data.xProperty]);})
                      .attr("cy", function (d) {return yscale(d[data.yProperty]);});
                }; // zoomed
                  

                  
            } // addZooming
              
              
        }, // addInteractivity
      
        helpers: {
          
            getPointData: function getPointData(data){
              
                // "dim" is a crossfilter.dimension(). It is the functionality that allows the user to perform specific filtering and grouping operations, two of which are "top(n)", and "bottom(n)", which return n top and bottom most elements along the chosen dimension. The returned elements are full data rows!
                // The functionality to select specific dimensions has been pushed to the plotting functions, as the data manipulation occurs here.
                var dimId = dbsliceData.data.dataProperties.indexOf(data.xProperty);
                var dim = dbsliceData.data.dataDims[dimId];
                var pointData = dim.top(Infinity);
              
              return pointData;
              
            }, // getPointData
          
            calculateRange: function calculateRange(p, property){
                var pMin = d3.min(p, function (d) { return d[property]; });
                var pMax = d3.max(p, function (d) { return d[property]; });
                var pDiff = pMax - pMin;
                pMin -= 0.1 * pDiff;
                pMax += 0.1 * pDiff;
                var range = [pMin, pMax];
            
              return range
            }, // calculateRange
                    
            getRange: function getRange(svg, dimName){
              
                var domMin = Number( svg.attr( dimName + "DomMin") );
                var domMax = Number( svg.attr( dimName + "DomMax") );
              return [domMin, domMax]
            } // getRange
          
          
        } // helpers
      
    }; // cfD3Scatter

    var cfD3BarChart = {

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

    var d3LineSeries = {
        
        name: "d3LineSeries",
      
        margin: {top: 20, right: 20, bottom: 30, left: 50},
        
        layout: { colWidth : 4, height : 400},
      
        colour: [],

        make : function ( element, data, layout ) {
            
            d3LineSeries.update( element, data, layout );

        }, // make

        update : function ( element, data, layout ) {
			
			

            // Setup the svg.
            d3LineSeries.setupSvg(element, data, layout);
                
            // Some convenient handles.
            var svg = d3.select(element).select("svg");
            
            // Create the required scales.
            var xscale = d3.scaleLinear()
                .range( [0, svg.attr("plotWidth")] )
                .domain( d3LineSeries.helpers.getDomain(data, 'x') );

            var yscale = d3.scaleLinear()
                .range( [svg.attr("plotHeight"), 0] )
                .domain( d3LineSeries.helpers.getDomain(data, 'y') );


            // Create a plotting function
            var line = d3.line()
                .x( function( d ) { return xscale( d.x ); } )
                .y( function( d ) { return yscale( d.y ); } );

			
            // Assign the data
            var allSeries = svg.select(".plotArea").selectAll( ".plotSeries" ).data( data.series );

            // Enter/update/exit 
            allSeries.enter()
              .each( function() {
                  var series = d3.select( this );
                  var seriesLine = series.append( "g" )
                      .attr( "class", "plotSeries")
                      .attr( "series-name", function(d){ return d.label; })
					  .attr( "task-id", function(d){ return d.taskId; })
                      .attr( "clip-path", "url(#" + svg.select("clipPath").attr("id") + ")")
                    .append( "path" )
                      .attr( "class", "line" )
                      .attr( "d", function(d){ return line( d.data ); } )
                      .style( "stroke", function(d){ return d3LineSeries.colour( d.cKey ); } )    
                      .style( "fill", "none" )
                      .style( "stroke-width", "2.5px" );
            });

            allSeries.each( function() {
                var series = d3.select( this )
				    .attr( "series-name", function(d){ return d.label; })
					.attr( "task-id",     function(d){ return d.taskId; });
					
                var seriesLine = series.select( "path.line" );
                seriesLine.transition()
                  .attr( "d",       function(d){return line( d.data );})
                  .style( "stroke", function(d){ return d3LineSeries.colour( d.cKey ); })  ;
            });

            allSeries.exit().remove();


            // Create some axes
            createAxes();
        
            
            // ADD SOME INTERACTIVITY
            d3LineSeries.addInteractivity.addTooltip(svg);
            
            d3LineSeries.addInteractivity.addZooming(svg, data);
            
            // Update marker.
            data.newData = false;
            
            // HELPER FUNCTIONS
            function createAxes(){
                
                // Create the axes objects
                var xAxis = d3.axisBottom( xscale ).ticks(5);
                var yAxis = d3.axisLeft( yscale );

                var gX = svg.select(".plotArea").select(".axis--x");
                if ( gX.empty() ) {
                    gX = svg.select(".plotArea").append("g")
                      .attr( "transform", "translate(0," + svg.attr("plotHeight") + ")" )
                      .attr( "class", "axis--x")
                      .call( xAxis );
                    gX.append("text")
                      .attr("fill", "#000")
                      .attr("x", svg.attr("plotWidth"))
                      .attr("y", d3LineSeries.margin.bottom)
                      .attr("text-anchor", "end")
                      .text(layout.xAxisLabel);
                } else {
                    gX.transition().call( xAxis );
                } // if

                var gY = svg.select(".plotArea").select(".axis--y");
                if ( gY.empty() ) {
                    gY = svg.select(".plotArea").append("g")
                      .attr( "class", "axis--y")
                      .call( yAxis );
                    gY.append("text")
                      .attr("fill", "#000")
                      .attr("transform", "rotate(-90)")
                      .attr("x", 0)
                      .attr("y", -d3LineSeries.margin.left + 15)
                      .attr("text-anchor", "end")
                      .text(layout.yAxisLabel)
                      .attr("spellcheck", "false");
                } else {
                    gY.transition().call( yAxis );
                } // if
                
            } // createAxes
            
        }, // update
        
        setupSvg : function setupSvg(element, data, layout){
            
            
            d3LineSeries.margin = layout.margin === undefined ? d3LineSeries.margin : layout.margin;
            d3LineSeries.colour = layout.colourMap === undefined ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );

            var container = d3.select(element);

            // Check if there is a svg first.
            var svg = container.select("svg");
            if (svg.empty()){
              
                // Append new svg
                svg = container.append("svg");
                
                // Update its dimensions.
                curateSvg();
                 
            } else {
                
                // Differentiate between changing plot types, or just changing the data!!
                // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, its attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
                  
                var plotWrapper = container.select(function() {return this.parentElement.parentElement;});

                var expectedPlotType = plotWrapper.attr("plottype");
                
                if (expectedPlotType !== "d3LineSeries" ){
                    // If the plot type has changed, then the svg contents need to be removed completely.
                    plotWrapper.attr("plottype", "d3LineSeries")
                    
                    svg.selectAll("*").remove();
                    curateSvg();
                    
                } else {
                    // Axes might need to be updated, thus the svg element needs to be refreshed.
                    curateSvg();
                    
                }; // if    
              
            }; // if

                    
                    
            function curateSvg(){
                
                // Also try to resize the plot to fit the data nicer.
                // d3.select(element.parentNode.parentNode).attr("class", "col-md-" + d3LineSeries.layout.colWidth);
                // For some reason this causes a bug which leaves redundant plots in the plot rows.
                
                var svgWidth = container.node().offsetWidth;
                var svgHeight = d3LineSeries.layout.height;

                var width = svgWidth - d3LineSeries.margin.left - d3LineSeries.margin.right;
                var height = svgHeight - d3LineSeries.margin.top - d3LineSeries.margin.bottom;
                
                // Curating the svg.                
                container.select("svg")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight)
                    .attr("plotWidth", width)
                    .attr("plotHeight", height);
                    
                var plotArea = container.select("svg").select(".plotArea");
                if(plotArea.empty()){
                    // If there's none, add it.
                    container.select("svg")
                        .append("g")
                          .attr("transform", "translate(" + d3LineSeries.margin.left + "," + d3LineSeries.margin.top + ")")
                          .attr("class", "plotArea");
                    
                }; // if
                
                // The same with the clip path for zooming.
                var clipId = "clip-"+container.attr("plot-row-index")+"-"+container.attr("plot-index");
                var clip = container.select("svg").select("clipPath")
                if (clip.empty()){
                    container.select("svg")
                      .append("defs")
                      .append("clipPath")
                        .attr("id", clipId)
                      .append("rect")
                        .attr("width", svg.attr("plotWidth"))
                        .attr("height", svg.attr("plotHeight"));
                    
                } else {
                    clip.select("rect")
                        .attr("width", svg.attr("plotWidth"))
                        .attr("height", svg.attr("plotHeight"))
                    
                    
                }; // if
                
                
            }; // curateSvg
            
        }, // setupSvg
        
        addInteractivity : {
            
            addTooltip: function addTooltip(svg){
              
                // This controls al the tooltip functionality.
              
                var lines = svg.selectAll(".line");
              
                lines.on("mouseover", tipOn)
                     .on("mouseout", tipOff);
              
              
                // Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
                var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .offset([-12, 0])
                    .html(function (d) {
                        return "<span>" + d.label + "</span>";
                    });
                    
                // Add an anchorPoint for the tooltip.
                var anchorPoint = svg.select(".plotArea")
                    .append("g")
                        .style("display","none")
                    .append("circle")
                            .attr("r",1);
            
                svg.call( tip );
                  
                  
                function tipOn(d) {
                    lines.style("opacity", 0.2);
                    d3.select(this)
                        .style("opacity", 1.0)
                        .style( "stroke-width", "4px" );
                    
                    // To control tip location another element must be added onto the svg. This can then be used as an anchor for the tooltip.
                    anchorPoint
                        .attr( "cx" , d3.mouse(this)[0] )
                        .attr( "cy" , d3.mouse(this)[1] );
                    
                    tip.show(d, anchorPoint.node());
					
					crossPlotHighlighting.on(d, "d3LineSeries")
					
                }; // tipOn

                function tipOff(d) {
                    lines.style("opacity", 1.0);
                    d3.select(this)
                        .style( "stroke-width", "2.5px" );
                    
                    tip.hide();
					
					crossPlotHighlighting.off(d, "d3LineSeries")
					
                }; // tipOff
              
              
            }, // addTooltip
            
            addZooming: function addZooming(svg, data){
              
              
                var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
        
                svg.transition().call(zoom.transform, d3.zoomIdentity);
                svg.call(zoom);
                
                

                function zoomed() {
                    var t = d3.event.transform;
                  
                    // Get the domains:
                    var xRange = d3LineSeries.helpers.getDomain(data, "x");
                    var yRange = d3LineSeries.helpers.getDomain(data, "y");
                  
                    // Recreate original scales.
                    var xscale = d3.scaleLinear()
                        .range([0, svg.attr("plotWidth")])
                        .domain( xRange );
                    var yscale = d3.scaleLinear()
                        .range([svg.attr("plotHeight"), 0])
                        .domain( yRange );
                        
                    // In scales the range is the target, and the domain the source.
                  
                    // Create new axes based on the zoom, which altered the domain.
                    // d3.event.transform.rescaleX(xScale2).domain() to get the exact input of the location showing in the zooming aera and brush area.
                    var newXRange = t.rescaleX(xscale).domain();
                    var newYRange = t.rescaleY(yscale).domain();
                    
                    // Create new scales in the zoomed area.
                    xscale.domain(newXRange);
                    yscale.domain(newYRange);
                  
                    // Redo the axes.
                    svg.select(".plotArea").select(".axis--x").call( d3.axisBottom(xscale) );
                    svg.select(".plotArea").select(".axis--y").call( d3.axisLeft(yscale) );
                  
                    // Reposition all lines
                    var line = d3.line()
                        .x( function( d ) { return xscale( d.x ); } )
                        .y( function( d ) { return yscale( d.y ); } );
                  
                    
                    svg.select(".plotArea").selectAll(".line")
                        .attr( "d", function(d){return line( d.data );} );
                        
                    
                }; // zoomed
              

              
            } // addZooming
            
        }, // addInteractivity
        
        helpers: {
            
            getDomain: function getDomain(data, variable){
                
                // Finding the axis limits.
                var minVal = d3.min( data.series[0].data, function(d) { return d[variable]; } );
                var maxVal = d3.max( data.series[0].data, function(d) { return d[variable]; } );
                
                for (var n = 1; n < data.series.length; ++n) {
                    var minVal_ =  d3.min( data.series[n].data, function(d){ return d[variable];} );
                    minVal = ( minVal_ < minVal ) ? minVal_ : minVal;
                    var maxVal_ =  d3.max( data.series[n].data, function(d){ return d[variable];} );
                    maxVal = ( maxVal_ > maxVal ) ? maxVal_ : maxVal;
                }; // for
                
                return [minVal, maxVal]
                
            } // getDomain
            
            
            
        } // helpers
        
    } // d3LineSeries

    var d3Contour2d = {
        
        name: "d3Contour2d",
      
        margin: {top: 20, right: 65, bottom: 20, left: 10},
      
        colour: [],

        make : function ( element, data, layout ){

            d3Contour2d.update ( element, data, layout )

        }, // make

        update : function ( element, data, layout ){

            var container = d3.select(element);

            d3Contour2d.setupSvg(container, data, layout);

            var svg = container.select("svg");
            


            // Make a projection for the points
            var projection = d3Contour2d.helpers.createProjection(data, svg);

            // Claculate threshold values
            var vMinAll = data.limits.v[0];
            var vMaxAll = data.limits.v[1];
            var thresholds = d3.range( vMinAll , vMaxAll , ( vMaxAll - vMinAll ) / 21 );

            // Setup colour scale
            var colourScale = d3Contour2d.colour;
            colourScale.domain(d3.extent(thresholds));





            // Initialise contours
            var contours = d3.contours()
                .size(data.surfaces.size)
                .smooth(true)
                .thresholds(thresholds);

            // make and project the contours
            svg.select(".plotArea").selectAll("path")
                .data(contours( data.surfaces.v ))
                .enter()
				  .append("path")
                    .attr("d", d3.geoPath(projection))
                    .attr("fill", function(d){return colourScale(d.value);})
                    .attr("transform", "translate(5,20)");                    


            // Create a colourbar
            var scaleHeight = svg.attr("height")/2
            colourScale.domain( [0, scaleHeight]);

            var scaleBars = svg.select(".scaleArea").selectAll(".scaleBar")
                .data(d3.range(scaleHeight), function(d){return d;})
                .enter()
				  .append("rect")
                    .attr("class", "scaleBar")
                    .attr("x", 0 )
                    .attr("y", function(d, i){return scaleHeight - i;})
                    .attr("height", 1)
                    .attr("width", 20)
                    .style("fill", function(d, i ){return colourScale(d);})

            var cscale = d3.scaleLinear()
                .domain( d3.extent(thresholds) )
                .range( [scaleHeight, 0]);

            var cAxis = d3.axisRight( cscale ).ticks(5);


            var colorAxisDOM = svg.select(".scaleArea").select("g");
			if(colorAxisDOM.empty()){
				svg.select(".scaleArea")
				  .append("g")
                    .attr("transform", "translate(20,0)")
                    .call(cAxis);
			} else {
				colorAxisDOM.call(cAxis);
			} // if
			  
            
            
            // ADD INTERACTIVITY
            d3Contour2d.addInteractivity.addZooming(svg);
            
			d3Contour2d.addInteractivity.addOnMouseOver(svg);

            // Mark the data flag
            data.newData = false;
        }, // update
        
        setupSvg : function setupSvg(container, data, layout){
            
            // DON'T MOVE THIS TO MAKE!
            d3Contour2d.margin = layout.margin === undefined ? d3Contour2d.margin : layout.margin;
            d3Contour2d.colour = layout.colourMap === undefined ? d3.scaleSequential( d3.interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
            
            

            // Check if there is a svg first.
            var svg = container.select("svg");
            if (svg.empty()){
              
                // Append new svg
                svg = container.append("svg");
                
                // Update its dimensions.
                curateSvg();
                 
            } else {
                
                // Differentiate between changing plot types, or just changing the data!!
                // If just the data is changing nothing needs to be done here. If the plot type is changing then the svg needs to be refreshed, its attributes updated, the 'plotWrapper' 'plottype' changed, and the interactivity restored.
                  
                var plotWrapper = container.select(function() {return this.parentElement.parentElement;});

                var expectedPlotType = plotWrapper.attr("plottype");
                
                if (expectedPlotType !== "d3Contour2d" ){
                    // If the plot type has changed, then the svg contents need to be removed completely.
                    plotWrapper.attr("plottype", "d3Contour2d")
                    
                    svg.selectAll("*").remove();
                    curateSvg();
                    
                    // ADD FUNCTIONALITY.
                    // cfD3Histogram.setupInteractivity(container, data);
                    
                } else {
                    // Axes might need to be updated, thus the svg element needs to be refreshed.
                    curateSvg();
                    
                }; // if    
              
            }; // if

                    
                    
            function curateSvg(){
                
                var svgWidth = container.node().offsetWidth;
                var svgHeight = layout.height;

                var width = svgWidth - d3Contour2d.margin.left - d3Contour2d.margin.right;
                var height = svgHeight - d3Contour2d.margin.top - d3Contour2d.margin.bottom;
                
                // Curating the svg.                
                container.select("svg")
                  .attr("width", svgWidth)
                  .attr("height", svgHeight)
                  .attr("plotWidth", width)
                  .attr("plotHeight", height);
                    
                var plotArea = container.select("svg").select(".plotArea");
                if(plotArea.empty()){
                    // If there's none, add it.
                    container.select("svg")
                      .append("g")
                        .attr("transform", "translate(" + d3Contour2d.margin.left + "," + d3Contour2d.margin.top + ")")
                        .attr("class", "plotArea")
						.attr("task-id", data.taskId);
                    
                }; // if
                
                // The same with the clip path for zooming.
                var clipId = "clip-"+container.attr("plot-row-index")+"-"+container.attr("plot-index");
                var clip = container.select("svg").select("clipPath")
                if (clip.empty()){
                    container.select("svg")
                      .append("defs")
                      .append("clipPath")
                        .attr("id", clipId)
                      .append("rect")
                        .attr("width", svg.attr("plotWidth"))
                        .attr("height", svg.attr("plotHeight"));
                    
                } else {
                    clip.select("rect")
                        .attr("width", svg.attr("plotWidth"))
                        .attr("height", svg.attr("plotHeight"))    
                }; // if
                
                
                // Create a 'g' for the colorbar.
                var colorbar = container.select("svg").select(".scaleArea");
                if(colorbar.empty()){
                    container.select("svg")
                      .append("g")
                        .attr("class", "scaleArea")
                        .attr("transform", "translate(" + (svgWidth-60) + "," + d3Contour2d.margin.top + ")")            
                }; // if
                
                
            }; // curateSvg
        }, // setupSvg
        
        addInteractivity: {
            
            addZooming: function addZooming(svg){
              
                var zoom = d3.zoom().scaleExtent([0.5, Infinity]).on("zoom", zoomed);
        
                svg.transition().call(zoom.transform, d3.zoomIdentity);
                svg.call(zoom);

                function zoomed() {
                    var t = d3.event.transform;
                    svg.select(".plotArea").attr( "transform", t );
                }; // zoomed
              
            }, // addZooming
			
			addOnMouseOver: function addOnMouseOver(svg){
				
				// Select the whole card for mouseover, but what needs to be returned is the data of the plot.
				var contour = svg.selectAll(".plotArea");
				
				contour.on("mouseover", crossHighlightOn)
                       .on("mouseout",  crossHighlightOff);
					  
				function crossHighlightOn(d){
					
					crossPlotHighlighting.on(d, "d3Contour2d")
					
				}; // crossHighlightOn
				
				function crossHighlightOff(d){
					
					crossPlotHighlighting.off(d, "d3Contour2d")
					
				}; // crossHighlightOff
				
			} // addOnMouseOver
            
        }, // addInteractivity
        
        helpers: {
            
            getScaleRange: function getScaleRange(data, svg){
                
                var width = svg.attr("plotWidth");
                var height = svg.attr("plotHeight");
                
                // set x and y scale to maintain 1:1 aspect ratio  
                var domainAspectRatio = d3Contour2d.helpers.calculateDataAspectRatio(data);
                var rangeAspectRatio = d3Contour2d.helpers.calculateSvgAspectRatio(svg);
          
                if (rangeAspectRatio > domainAspectRatio) {
                    var xScaleRange = [ 0 , width ];
                    var yScaleRange = [ domainAspectRatio * width , 0 ];    
                    
                } else {
                    var xScaleRange = [ 0 , height / domainAspectRatio ];
                    var yScaleRange = [ height , 0 ];
                    
                } // if
                
                return {x: xScaleRange, y: yScaleRange};
                
            }, // getScaleRange
            
            calculateDataAspectRatio: function calculateDataAspectRatio(data){
                
                var xMinAll = data.limits.x[0];
                var yMinAll = data.limits.y[0];

                var xMaxAll = data.limits.x[1];
                var yMaxAll = data.limits.y[1];

                var xRange = xMaxAll - xMinAll;
                var yRange = yMaxAll - yMinAll;

                // set x and y scale to maintain 1:1 aspect ratio  
                return yRange / xRange;
                
            }, // calculateDataAspectRatio
            
            calculateSvgAspectRatio: function calculateSvgAspectRatio(svg){
                
                var width = svg.attr("plotWidth");
                var height = svg.attr("plotHeight");
                
                return height / width;
                
            }, // calculateSvgAspectRatio
            
            createProjection: function createProjection(data, svg){
                
                // Create the scale ranges, and ensure that a 1:1 aspect ratio is kept.
                var scaleRanges = d3Contour2d.helpers.getScaleRange(data, svg);
                
                var xscale = d3.scaleLinear()
                        .domain( data.limits.x )
                        .range( scaleRanges.x );

                var yscale = d3.scaleLinear()
                        .domain( data.limits.y ) 
                        .range( scaleRanges.y );
                


                
                var x = data.surfaces.x;
                var y = data.surfaces.y;
                var v = data.surfaces.v;
                var m = data.surfaces.size[0];
                var n = data.surfaces.size[1];

                // configure a projection to map the contour coordinates returned by
                // d3.contours (px,py) to the input data (xgrid,ygrid)
                var projection = d3.geoTransform( {
                    point: function( px, py ) {
                        var xfrac, yfrac, xnow, ynow;
                        var xidx, yidx, idx0, idx1, idx2, idx3;
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
                
                return projection;
                
            } // createProjection

        } // helpers
        
    } // d3Contour2d

    var plotHelpers = {
        
        getDomain: function getDomain(series, accessor){
            // This function expects an array of objects 'series', that contains all the information about the data, as well as the data itself. 'series' is expected to have the data itself stored in a lover level [dataWrapper]. It expects that the 'variable' data can be accessed using series[n][plotWrapper][variable]  
            
            // Finding the axis limits.
            
            var minVal = d3.min( accessor( series[0] ) );
            var maxVal = d3.max( accessor( series[0] ) );
            
            for (var n = 1; n < series.length; ++n) {
                
                var minVal_ = d3.min( accessor( series[n] ) );
                var maxVal_ = d3.max( accessor( series[n] ) );
                
                minVal = ( minVal_ < minVal ) ? minVal_ : minVal;
                maxVal = ( maxVal_ > maxVal ) ? maxVal_ : maxVal;
            }; // for
            
            return [minVal, maxVal]
            
        }, // getDomain
             
        collectAllPropertyNames: function collectAllPropertyNames(series, accessor){
            // This function collects all the property names in an array of objects.
            var allPropertyNames = [];        
            
            for(var i = 0; i<series.length; i++){
                
                allPropertyNames.push( Object.getOwnPropertyNames( accessor( series[i] ) ) );
                
            }; // for
            
            return allPropertyNames;
            
        }, // collectAllPropertyNames
        
        findCommonElements: function findCommonElements(arrs) {
            // This function goes through all the arrays and finds only the common elements. // Adapted from "https://codereview.stackexchange.com/questions/96096/find-common-elements-in-a-list-of-arrays".
            // It expects an array of arrays as an input.
            
            var resArr = [];
            
            // Loop over elements in the first array.
            for (var i = 0; i<arrs[0].length; i++) {

                // Check if all subsequent arrays have this. If they don't, break the loop and try again. 
                for (var j = arrs.length - 1; j > 0; j--) {
                    if (arrs[j].indexOf(arrs[0][i]) == -1) {
                        break;
                    } // if
                } // for

                // If the loop executed to the end store this property.
                if (j === 0) {
                    resArr.push(arrs[0][i]);
                }; // if
            }
            return resArr;
        } // findCommonElements
        	
	} // plotHelpers



    var addMenu = {

        addPlotControls: {
            
            elementOptionsArray: function(plotRowType){
                
                var options;
                switch(plotRowType){
                    case "metadata":
                        options = [
                            {val: "undefined"    , text: " "},
                            {val: "cfD3BarChart" , text: "Bar Chart"},
                            {val: "cfD3Scatter"  , text: "Scatter"},
                            {val: "cfD3Histogram", text: "Histogram"}
                        ]
                        break;
                    
                    case "plotter":
                        options = [
                            {val: "undefined"        , text: " "},
                            {val: "d3LineSeries"     , text: "Line"},
                            {val: "d3Contour2d", text: "Contour"}
                        ]
                        break;
                }; // switch
                
                return options;
                
            },
                            
            make: function make(plotRowElement){
                
                
                
                var plotRowIndex = d3.select($(plotRowElement)[0].parentNode).attr("plot-row-index");
                var plotRowType = d3.select(plotRowElement).attr("type");
                
                switch(plotRowType){
                    case "metadata":
                        var buttonLabel = "Add plot";
                      break;
                    case "plotter":
                        var buttonLabel = "Configure plot";
                }; // switch
                
                // Append a button to each plot row title, if it does not exist already.
                if(d3.select(plotRowElement).selectAll(".btn-success").empty()){
                    // If a button does not exist,make it.
                    var buttonId = "addPlotButton" + plotRowIndex;
                    d3.select(plotRowElement).append("button")
                        .attr("style","display:inline")
                        .attr("id", buttonId)
                        .attr("class", "btn btn-success float-right")
                        .html(buttonLabel);
                }; // if
                
                
                // FUNCTIONALITY!!
                // Create the config element with all required data.
                var config = addMenu.addPlotControls.createConfig(buttonId);
                
                // First create the ids of the required inputs
                addMenu.helpers.makeMenuContainer(config);
                
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);
                
                // Add the on click event: show menu
                addMenu.helpers.addButtonClickEvent(config);
                
                // Add listening to on plot type selection change
                addMenu.addPlotControls.onPlotTypeChangeEvent(config);
                        
                        

                    
                    

                
                
                
            }, // make
            
            createConfig: function createConfig(buttonId){
                
                // The config depends on the plot row type.
                var plotRowType = $("#" + buttonId)[0].parentElement.getAttribute('type');
                
                var a = addMenu.addPlotControls;
                var config = {
                    title                : "undefined",
                    buttonId             : buttonId,
                    containerId          : buttonId + 'MenuContainer',
                    plotSelectionMenuId  : buttonId + 'MenuContainer' + "PlotSelectionMenu",
                    xPropertyMenuId      : buttonId + 'MenuContainer' + "xPropertyMenu",        
                    yPropertyMenuId      : buttonId + 'MenuContainer' + "yPropertyMenu",
                        sliceMenuId      : buttonId + 'MenuContainer' +     "sliceMenu",
                    menuOkButtonId       : buttonId + 'MenuContainer' + "DialogButtonOk",
                    menuCancelButtonId   : buttonId + 'MenuContainer' + "DialogButtonCancel",
                    ok                   : a.submitNewPlot,
                    cancel               : a.cancelNewPlot,
                    userSelectedVariables: ["xProperty", "yProperty", "slice"],
                    categoricalVariables : [],
                    continuousVariables  : [],
                    sliceVariables       : [],
                    contourVariables     : [],
                    menuItems            : [{options: a.elementOptionsArray(plotRowType),
                                             label  : "Select plot type",
                                             id     : buttonId + 'MenuContainer' + "PlotSelectionMenu"}],
                    newPlot              : [],
                    ownerPlotRowIndex    : $("#" + buttonId)[0].parentElement.parentElement.getAttribute("plot-row-index"),
                    ownerPlotRowType     : plotRowType,
                    buttonActivationFunction : a.enableDisableSubmitButton
                };
                
                
                // Check and add the available data variables.
                addMenu.helpers.updateDataVariables(config);
                
                // Create the appropriate newPlot object in the config.
                addMenu.addPlotControls.createNewPlot(config);
                
                
                return config;
                
            }, // createConfig
            
            createNewPlot: function createNewPlot(config){
                
                switch(config.ownerPlotRowType){
                    case "metadata":
                        config.newPlot =  {
                            plotFunc : undefined,
                            layout : { title : undefined, colWidth : 4, height : 300 }, 
                            data : { xProperty : undefined, 
                                     yProperty : undefined, 
                                     cProperty : undefined}
                        }; // new plot config
                        break;
                        
                    case "plotter":
                        // axis labels should come from the data!
                        // slices contains any previously added slices.
                        config.newPlot = {
                            plotFunc : undefined,
                            layout : { title: undefined, colWidth : 4, height : 300},
                            data : { slice : undefined},
                            slices : []
                        }; // new plot config
                        
                        // FORMATDATAFUNC IS DIFFERENT FOR EACH PLOT TYPE!
                        
                        break;
                        
                    default:
                        // Do nothing?
                        break;
                    
                }; // switch
                
                
                
            }, // createNewPlot
            
            copyNewPlot:   function copyNewPlot(config){
                // Based on the type of plot selected a config ready to be submitted to the plotting functions is assembled.

                var selectedPlotType = $("#" + config.plotSelectionMenuId).val();
                
                var plotCtrl = {};
                switch(selectedPlotType){
                    
                    case "cfD3BarChart":
                    case "cfD3Histogram":
                        plotCtrl = {
                            plotFunc : config.newPlot.plotFunc,
                            layout : { title : config.newPlot.layout.title, 
                                    colWidth : config.newPlot.layout.colWidth, 
                                      height : config.newPlot.layout.height }, 
                            data : {  cfData : dbsliceData.data, 
                                   xProperty : config.newPlot.data.xProperty, 
                                   cProperty : config.newPlot.data.cProperty}
                        };
                      break;
                      
                    case "cfD3Scatter":
                        plotCtrl = {
                            plotFunc : config.newPlot.plotFunc,
                            layout : { title : config.newPlot.layout.title, 
                                    colWidth : config.newPlot.layout.colWidth, 
                                      height : config.newPlot.layout.height }, 
                            data : {  cfData : dbsliceData.data, 
                                   xProperty : config.newPlot.data.xProperty,
                                   yProperty : config.newPlot.data.yProperty,
                                   cProperty : config.newPlot.data.cProperty}
                        };
                      break;
                      
                    case "d3LineSeries":
                    
                        // The user selected variable to plot is stored in config.newPlot.data, with all other user selected variables. However, for this type of plot it needs to be one level above, which is achieved here.
                        // Store the currently selected slice, then push everything forward.
                        config.newPlot.slices.push(config.newPlot.data.slice)
                    
                        // Set the other options.
                        plotCtrl = {
                            plotType : "d3LineSeries",
                            layout : { colWidth: 4, xAxisLabel : "Axial distance",yAxisLabel : "Mach number" },
                            data : dbsliceData.data,
                            plotFunc : config.newPlot.plotFunc,
                            taskIds : null,
                            sliceIds : config.newPlot.slices,
                            tasksByFilter : true,
                            formatDataFunc : function ( data ) {
                                var series = [];
                                data.forEach( function( line ) { series.push( line ) } );
                                return { series : series };
                            }
                        };
                      break;
                      
                    case "d3Contour2d":
                    
                        plotCtrl = {
                            plotType : "d3Contour2d",
                            layout : { colWidth : 2, height : 200 },
                            data : dbsliceData.data,
                            limits : {},
                            plotFunc : config.newPlot.plotFunc,
                            taskIds : dbsliceData.filteredTaskIds,
                            sliceIds : [config.newPlot.data.slice],
                            tasksByFilter : true,
                        };

                    default:
                        break;
                    
                }; // switch

                
                return plotCtrl;
                
            }, // copyNewPlot
            
            clearNewPlot: function clearNewPlot(config){
                
                switch(config.ownerPlotRowType){
                    case "metadata":
                        config.newPlot.plotFunc = undefined;
                        config.newPlot.layout.title = undefined;
                        config.newPlot.data.xProperty = undefined;
                        config.newPlot.data.yProperty = undefined;
                        break;
                    case "plotter":
                        config.newPlot.plotFunc = undefined;
                        config.newPlot.data = {};
                        break;
                    default:
                        // Do nothing?
                        break;
                }; // switch
            }, // clearNewPlot
            
            enableDisableSubmitButton: function enableDisableSubmitButton(config){
        
                var submitButton = $("#" + config.menuOkButtonId);
        
                var selectedPlotType = $("#" + config.plotSelectionMenuId).val();
                switch(selectedPlotType){
                    case "undefined":
                        // Disable
                        
                        submitButton.prop("disabled", true);
                      break;
                      
                    case "cfD3BarChart":
                    
                        // xProperty enabled, yProperty disabled.
                        var isConfigValid = (config.newPlot.data.xProperty !== undefined) && 
                                            (config.newPlot.data.yProperty === undefined);
                        if(isConfigValid){submitButton.prop("disabled", false)}
                        else             {submitButton.prop("disabled", true)};
                        
                      break;
                      
                    case "cfD3Histogram":
                        // xProperty enabled, yProperty disabled.
                        var isConfigValid = (config.newPlot.data.xProperty !== undefined) && 
                                            (config.newPlot.data.yProperty === undefined);
                        
                        if(isConfigValid){submitButton.prop("disabled", false)}
                        else             {submitButton.prop("disabled", true)};
                      break;
                      
                    case "cfD3Scatter":
                        // xProperty enabled, yProperty  enabled.
                        var isConfigValid = (config.newPlot.data.xProperty !== undefined) && 
                                            (config.newPlot.data.yProperty !== undefined);
                        
                        if(isConfigValid){submitButton.prop("disabled", false)}
                        else             {submitButton.prop("disabled", true)};
                      break;
                      
                    case "d3LineSeries":
                        // Nothing else is needed, just enable the submit button.
                        submitButton.prop("disabled", false);
                    
                      break;
                      
                    case "d3Contour2d":
                        // Nothing else is needed, just enable the submit button.
                        submitButton.prop("disabled", false);
                    
                      break;
                      
                    default :
                        // Disable
                        submitButton.prop("disabled", true);
                      break;
                }; // switch(selectedPlotType)


            }, // enableDisableSubmitButton
            
            onPlotTypeChangeEvent: function onPlotTypeChangeEvent(config){
                
                var a = addMenu.addPlotControls;
                var h = addMenu.helpers;
                
                d3.select("#" + config.plotSelectionMenuId).on("change", function(){ 
        
                    // Check if the data variables have changed.
                    h.updateDataVariables(config);
        
                    // Use the same switch to populate the appropriate properties in the 'newPlot' object, and to allow further selections.
                    var selectedPlotType = $(this).val();
                    switch( selectedPlotType ){
                        case "undefined":
                          
                          // Remove all variable options.
                          h.removeMenuItemObject( config, config.xPropertyMenuId );
                          h.removeMenuItemObject( config, config.yPropertyMenuId );
                          h.removeMenuItemObject( config, config.sliceMenuId );
                          
                          // Update plot type selection.
                          a.clearNewPlot( config );
                          
                          break;
                          
                        // METADATA PLOTS
                          
                        case "cfD3BarChart":
                        
                          // One variable menu - categorical
                          config.newPlot.plotFunc = cfD3BarChart;
                          
                          // xProperty required.
                          h.addUpdateMenuItemObject( config, config.xPropertyMenuId , config.categoricalVariables);
                          
                          // yProperty must not be present.
                          h.removeMenuItemObject( config, config.yPropertyMenuId );
                          
                          break;
                          
                        case "cfD3Histogram":
                          // One variable menu - ordinal
                          config.newPlot.plotFunc = cfD3Histogram;
                          
                          // xProperty required.
                          h.addUpdateMenuItemObject( config, config.xPropertyMenuId , config.continuousVariables);
                          
                          // yProperty must not be present.
                          h.removeMenuItemObject( config, config.yPropertyMenuId );
                          
                          break;
                          
                        case "cfD3Scatter":
                          // Two variables menu - ordinal
                          config.newPlot.plotFunc = cfD3Scatter;
                          
                          // xProperty and yProperty required.
                          h.addUpdateMenuItemObject( config, config.xPropertyMenuId, config.continuousVariables);
                          h.addUpdateMenuItemObject( config, config.yPropertyMenuId, config.continuousVariables);
                          break;
                          
                          
                        // 2D/3D PLOTS
                        case "d3LineSeries":
                          // Menu offering different slices.
                          config.newPlot.plotFunc = d3LineSeries;
                          
                          // slice is required.
                          h.addUpdateMenuItemObject( config, config.sliceMenuId, config.sliceVariables);
                          break;
                          
                        case "d3Contour2d":
                          // Menu offering different variables.
                          config.newPlot.plotFunc = d3Contour2d;
                          
                          // Contour locations need to be predetermined by grouping the appropriate file names in the metadata excel sheet. The group names should be available here.
                          h.addUpdateMenuItemObject( config, config.sliceMenuId, config.contourVariables);
                        
                          break;
                          
                        default :
                          // Update plot type selection.
                          a.clearNewPlot(config);
                        
                          // Remove all variable options.
                          h.removeMenuItemObject( config, config.xPropertyMenuId );
                          h.removeMenuItemObject( config, config.yPropertyMenuId );
                          h.removeMenuItemObject( config, config.sliceMenuId );
                                                    
                          console.log("Unexpected plot type selected:", selectedPlotType);
                          break;
                    }; // switch( selectedPlotType )
                    
                    
                    
                    // Since there was a change in the plot type reset the variable selection menus. Also reset the config object selections.
                    h.resetVariableMenuSelections(config.xPropertyMenuId);
                    h.resetVariableMenuSelections(config.yPropertyMenuId);
                    h.resetVariableMenuSelections(config.sliceMenuId);
                    
                    switch(config.ownerPlotRwoType){
                        case "metadata":
                            config.newPlot.data.yProperty = undefined;
                            config.newPlot.data.xProperty = undefined;
                            break;
                        case "plotter":
                            config.newPlot.data.slice = undefined;
                    }; // if
                    
                    
                    // Update.
                    h.updateMenus(config);
                    
                }); // on change
                
            }, // onPlotTypeChangeEvent
            
            submitNewPlot: function submitNewPlot(config){
                
                // IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
                switch(config.ownerPlotRowType){
                    case "metadata":
                        
                        // Make a pysical copy of the object.
                        var plotToPush = addMenu.addPlotControls.copyNewPlot(config);
                    
                        dbsliceData.session.plotRows[config.ownerPlotRowIndex].plots.push(plotToPush);
                      break;
                        
                    case "plotter":
                        // Here plots are not pushed, but rather a config is passed to the plotRow.    The number of slices then defines how many plots appear. The slices are contained in 'plotCtrl.sliceIds'.
                        
                        // The keys are the variable names in 'metadata', which are prefixed with 's_' for splice. This allows the user to select which data to compare when setting up the metadata. More flexibility is gained this way, as no hardcoded templating needs to be introduced, and no clumsy user interfaces.
                        
                        // Make a pysical copy of the object. This function also includes the functionality in which the 'line' plot
                        var newPlotCtrl = addMenu.addPlotControls.copyNewPlot(config);

                        // If the plot type is changing remove all the plots first.
                        var oldPlotCtrl = dbsliceData.session.plotRows[config.ownerPlotRowIndex].ctrl;
                        
                        if(oldPlotCtrl !== undefined){
                            if(oldPlotCtrl.plotType !== newPlotCtrl.plotType){
                                dbsliceData.session.plotRows[config.ownerPlotRowIndex].plots = [];
                            }; // if
                        } // if
                    
                        // Assign the new control.
                        dbsliceData.session.plotRows[config.ownerPlotRowIndex].ctrl = newPlotCtrl;
                        
                      break;
                }; // switch
                
                
                // Add the new plot to the session object. How does this know which section to add to? Get it from the parent of the button!! Button is not this!
                // var plotRowIndex = d3.select(this).attr("plot-row-index")
                // console.log(element)
                
                // Redraw the screen.
                dbslice.render(dbsliceData.elementId, dbsliceData.session);
                
                // Clear newPlot to be ready for the next addition.
                addMenu.addPlotControls.clearNewPlot(config);
                
                // Reset the variable menu selections!
                addMenu.helpers.resetVariableMenuSelections(config.plotSelectionMenuId);
                addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
                addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
                addMenu.helpers.resetVariableMenuSelections(config.sliceMenuId);
                
                // Reset the plot type menu selection.
                document.getElementById(config.plotSelectionMenuId).value = "undefined";
                
                // Remove all variable options.
                addMenu.helpers.removeMenuItemObject( config, config.xPropertyMenuId );
                addMenu.helpers.removeMenuItemObject( config, config.yPropertyMenuId );
                addMenu.helpers.removeMenuItemObject( config, config.sliceMenuId );
                
                // Update the menus so that the view reflects the state of the config.
                addMenu.helpers.updateMenus(config);
                
            }, // submitNewPlot
            
            cancelNewPlot: function cancelNewPlot(config){
                
                addMenu.addPlotControls.clearNewPlot(config);
                
                // Reset the menu selection!
                addMenu.helpers.resetVariableMenuSelections(config.plotSelectionMenuId);
                addMenu.helpers.resetVariableMenuSelections(config.xPropertyMenuId);
                addMenu.helpers.resetVariableMenuSelections(config.yPropertyMenuId);
                addMenu.helpers.resetVariableMenuSelections(config.sliceMenuId);
                
                
                // Remove the select menus from the view.
                addMenu.helpers.removeMenuItemObject( config, config.xPropertyMenuId );
                addMenu.helpers.removeMenuItemObject( config, config.yPropertyMenuId );
                addMenu.helpers.removeMenuItemObject( config, config.sliceMenuId );
                
                // Update the menus so that the view reflects the state of the config.
                addMenu.helpers.updateMenus(config);
                
            } // cancelNewPlot
            
            
        }, // addPlotControls
        
        removePlotControls: function removePlotControls(){
            
            var allPlotRows = d3.select("#" + dbsliceData.elementId).selectAll(".plotRowBody");
            allPlotRows.each( function(d,i){
                // This function operates on a plot row instance. It selects all the plots, and adds a button and its functionality to it. This is only done if the plot row is a metadata row.
                var plotRowType = d3.select(this).attr("type"); 
                
                var plotRowIndex = i;
                
                var allPlotTitles = d3.select(this).selectAll(".plotTitle");
                allPlotTitles.each( function (d,i){
                // Append the button, and its functionality, but only if it does no talready exist!
                    var addPlotButton = d3.select(this).select(".btn-danger")
                    
                    if (addPlotButton.empty()){
                        // If it dosn't exist, add it.
                        d3.select(this).append("button")
                            .attr("class", "btn btn-danger float-right")
                            .html("x")
                            .on("click", function(){
                                // This function recalls the position of the data it corresponds to, and subsequently deletes that entry.
                                var plotIndex = i;

                                // Remove the plot from viewv
                                dbsliceData.session.plotRows[plotRowIndex].plots.splice(plotIndex,1);

                                // If necesary also remove the corresponding ctrl from the plotter rows.
                                if('ctrl' in dbsliceData.session.plotRows[plotRowIndex]){
                                    dbsliceData.session.plotRows[plotRowIndex].ctrl.sliceIds.splice(plotIndex,1);
                                }; // if
                                

                                render(dbsliceData.elementId, dbsliceData.session)
                            }); // on
                        
                    } else {
                        // If it doesn't, do nothing.
                        
                    }; // if
                    
                    
                } ); // each 
                                
                
              
            } ) // each
            
        }, // removePlotControls

        addPlotRowControls: { 
        
            elementOptionsArray: [
                    {val: "undefined", text: " "},
                    {val: "metadata", text: 'Metadata overview'},
                    {val: "plotter", text: 'Flow field plots'}
                ],
        
            make : function make(buttonId){

                // Create the config element with all required data.
                var config = addMenu.addPlotRowControls.createConfig(buttonId);
                
                // First create the ids of the required inputs
                addMenu.helpers.makeMenuContainer(config);
            
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);

                // Show the menu on button click
                addMenu.helpers.addButtonClickEvent(config);
                
                // Add listeners for plot row type changes
                addMenu.addPlotRowControls.onPlotRowTypeChangeEvent(config);
                
                
            }, // make
            
            createConfig: function createConfig(buttonId){
                
                var a = addMenu.addPlotRowControls;
                var config = {
                    buttonId                : buttonId,
                    containerId             : buttonId + 'MenuContainer',
                    plotRowSelectionMenuId  : buttonId + 'MenuContainer' + "PlotRowSelectionMenu",
                    menuItems               : [{options: a.elementOptionsArray,
                                                label  : "Select plot row type",
                                                id     : buttonId + 'MenuContainer' + "PlotRowSelectionMenu"}],
                    menuOkButtonId          : buttonId + 'MenuContainer' + "DialogButtonOk",
                    menuCancelButtonId      : buttonId + 'MenuContainer' + "DialogButtonCancel",
                    userSelectedVariables   : [],
                    newPlotRow              : {title: "New row", 
                                               plots: [], 
                                                type: "undefined",
                                       addPlotButton: {id : "undefined", label : "Add plot"}},
                    ok                      : a.submitNewPlotRow,
                    cancel                  : a.cancelNewPlotRow,
                    buttonActivationFunction: a.enableDisableSubmitButton
                };
                
                // The addPlotButton id needs to be updated when the row is submitted!
                
                return config;
            }, // createConfig
            
            clearNewPlotRow: function clearNewPlotRow(config){
                config.newPlotRow.title = "New row";
                config.newPlotRow.plots = [];
                config.newPlotRow.type  = "undefined";
                config.newPlotRow.addPlotButton = {id : "undefined", label : "Add plot"};
            }, // clearNewPlotRow
            
            submitNewPlotRow: function submitNewPlotRow(config){
                
                
                var plotRowToPush = {title: config.newPlotRow.title, 
                                     plots: config.newPlotRow.plots, 
                                      type: config.newPlotRow.type,
                            addPlotButton : config.newPlotRow.addPlotButton
                };
                
                // If this is a 'plotter' plot row it also requires a 'ctrl' field. This is filled out later by users actions.
                if(plotRowToPush.type === "plotter"){
                    plotRowToPush.ctrl = undefined;
                }; // if
                
                // Find the latest plot row index. Initiate with 0 to try allow for initialisation without any plot rows!
                var newRowInd = addMenu.helpers.findLatestPlotRowInd();
                
                plotRowToPush.addPlotButton.id = "addPlotButton" + newRowInd;
                
                
                // Push and plot the new row.
                dbsliceData.session.plotRows.push( plotRowToPush );
                dbslice.render(dbsliceData.elementId, dbsliceData.session);
                
                // Reset the plot row type menu selection.
                document.getElementById(config.plotRowSelectionMenuId).value = "undefined";
                
                // Clearthe config
                addMenu.addPlotRowControls.clearNewPlotRow(config);
                
            }, // submitNewPlotRow
            
            cancelNewPlotRow: function cancelNewPlotRow(config){
                addMenu.addPlotRowControls.clearNewPlotRow(config);
            }, // cancelNewPlotRow
            
            enableDisableSubmitButton: function enableDisableSubmitButton(config){
                
                
                var submitButton = $("#" + config.menuOkButtonId);
        
                var selectedPlotRowType = $("#" + config.plotRowSelectionMenuId).val();
                
                
                // If either 'metadata' or 'plotter' were chosen then enable the button.
                switch (selectedPlotRowType){
                    case "metadata":
                    case "plotter":
                        submitButton.prop("disabled", false)
                      break;
                    
                    case "undefined":
                        submitButton.prop("disabled", true)
                      break;
                      
                    default:
                        submitButton.prop("disabled", true)
                      break;
                    
                    
                }; // switch
                
            }, // enableDisableSubmitButton
            
            onPlotRowTypeChangeEvent: function onPlotRowTypeChangeEvent(config){
                
                // When the plot row type is changed just check if the button should be enabled.
                d3.select("#" + config.plotRowSelectionMenuId).on("change", function (){
                    config.newPlotRow.type = $(this).val();
                    
                    addMenu.addPlotRowControls.enableDisableSubmitButton(config);
                });
                
                
            } // onPlotRowTypeChangeEvent
            
        }, // addPlotRowControls

		removeDataControls: {
			
			make: function make(elementId){
			
				// Create the container required
				addMenu.removeDataControls.createRemoveDataContainer(elementId);
			  
			  
				// Add teh functonaliy to the option in the "sesson options" menu.
				d3.select("#" + elementId)
					.on("click", function(){
						
						// Get the options required
						var options = dbsliceData.data.fileDim.group().all()

						
						// Create the appropriate checkboxes.
						addMenu.removeDataControls.addCheckboxesToTheForm(elementId, options);
							  

						// Bring up the prompt
						addMenu.removeDataControls.createDialog(elementId);
						
					   
					   })
			}, // make
			
			createRemoveDataContainer: function createRemoveDataContainer(elementId){
				
				var removeDataMenuId = elementId + "Menu"
				var removeDataMenu = d3.select("#" + removeDataMenuId)
				if (removeDataMenu.empty()){
					
					removeDataMenu = d3.select( ".sessionHeader" )
							  .append("div")
								.attr("id", removeDataMenuId )
								.attr("class", "card ui-draggable-handle")
							  .append("form")
								.attr("id", removeDataMenuId + "Form")

							$("#" + removeDataMenuId ).hide();
				} // if
				
			}, // createRemoveDataContainer
			
			addCheckboxesToTheForm: function addCheckboxesToTheForm(elementId, options){
				
				// Create teh expected target for the checkboxes.
				var checkboxFormId = elementId + "MenuForm"
				
				// Create the checkboxes
				var checkboxes = d3.select("#" + checkboxFormId).selectAll(".checkbox").data(options)
				checkboxes.enter()
					.append("div")
					  .attr("class", "checkbox")
					.append("input")
					  .attr("type", "checkbox")
					  .attr("name", function(d, i){ return "dataset"+i })
					  .attr("value", function(d){ return d.key })
					  .attr("checked", true)
				
				// Append the labels after it
				checkboxes = d3.select("#" + checkboxFormId).selectAll(".checkbox")
        		checkboxes.selectAll("label").remove()
				checkboxes
					.append("label")
					  .html(function(d){ return d.key })
				
			}, // addCheckboxesToTheForm
			
			createDialog: function createDialog(elementId){
				
				// Create the dialog box, and it's functionality.
				$("#" + elementId + "Menu" )
					.dialog({
						draggable: false,
						autoOpen: true,
						modal: true,
						show: {effect: "fade",duration: 50},
						hide: {effect: "fade", duration: 50},
						buttons: {  "Ok"    :{text: "Submit",
											  id: "submitRemoveData",
											  disabled: false,
											  click: onSubmitClick
											 }, // ok
									"Cancel":{text: "Cancel",
											  id: "cancelRemoveData",
											  disabled: false,
											  click: onCancelClick
											 } // cancel
								 }  })
					.parent()
					.draggable();
			   
			   
				$(".ui-dialog-titlebar").remove();
				$(".ui-dialog-buttonpane").attr("class", "card");
				
				function onSubmitClick(){
					// Figure out which options are unchecked.
					var checkboxInputs = d3.select(this).selectAll(".checkbox").selectAll("input")
					
					var uncheckedInputs = checkboxInputs.nodes().filter(function(d){return !d.checked})
					
					
					var uncheckedDataFiles = uncheckedInputs.map(function(d){return d.value})
					
					
					// Pass these to the data remover.
					cfDataManagement.cfRemove(uncheckedDataFiles)
					
					
					// Close the dialog.
					$( this ).dialog( "close" )
					
					// Redraw the view.
					render(dbsliceData.elementId, dbsliceData.session);
					
				} // onSubmitClick
				
				function onCancelClick(){
					// Just close the dialog.
					$( this ).dialog( "close" )
					
				} // onSubmitClick
				
			} // createDialog
			
		}, // removeDataControls

        helpers: {
            
            updateDataVariables: function updateDataVariables(config){
                
                // Categorical variables must have a val and text.
                var categoricalVariables = [{val: "undefined", text: " "}];
                for (var i=0; i<dbsliceData.data.metaDataProperties.length; i++){
                    categoricalVariables.push({val: dbsliceData.data.metaDataProperties[i], 
                                              text: dbsliceData.data.metaDataProperties[i]});
                };

                // Continuous variables.
                var continuousVariables = [{val: "undefined", text: " "}];
                for (var i=0; i<dbsliceData.data.dataProperties.length; i++){
                    continuousVariables.push({val: dbsliceData.data.dataProperties[i], 
                                             text: dbsliceData.data.dataProperties[i]});
                };
                
                // Slice variables
                var sliceVariables = [{val: "undefined", text: " "}];
                for (var i=0; i<dbsliceData.data.sliceProperties.length; i++){
                    sliceVariables.push({val: dbsliceData.data.sliceProperties[i], 
                                        text: dbsliceData.data.sliceProperties[i]});
                };
                
                // Contour variables
                var contourVariables = [{val: "undefined", text: " "}];
                for (var i=0; i<dbsliceData.data.contourProperties.length; i++){
                    contourVariables.push({val: dbsliceData.data.contourProperties[i], 
                                        text: dbsliceData.data.contourProperties[i]});
                };
                
                
                // Assign
                config.categoricalVariables = categoricalVariables;
                 config.continuousVariables =  continuousVariables;
                      config.sliceVariables =       sliceVariables;
                    config.contourVariables =   contourVariables;
                
                
            }, // updateDataVariables
        
            makeMenuContainer: function makeMenuContainer(config){
            
                // CREATE THE CONTAINER FOR THE MENU IN THE BUTTONS CONTAINER.
                // But do this only if it does not already exist.
                if (d3.select("#" + config.containerId).empty()){
                
                    var buttonElement = d3.select("#" + config.buttonId);
                    var menuContainer = d3.select( buttonElement.node().parentNode )
                      .append("div")
                      .attr("id", config.containerId )
                      .attr("ownerButton", config.buttonId)
                      .attr("class", "card ui-draggable-handle");

                    $("#" + config.containerId ).hide();
                }//
            
            }, // makeMenuContainer
        
            updateMenus: function updateMenus(config){

                // This function updates the menu of the pop-up window.
                var menus = d3.select("#" + config.containerId).selectAll(".selectmenu").data(config.menuItems);
                
                // Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.
                menus.enter()
                  .append("label")
                    .attr("class", "selectmenuLabel")
                    .text( function(d){ return d.label })
                  .append("select")
                    .attr("class", "selectmenu")
                    .attr("id", function(d){ return d.id });
                
                
                // Update all the menu elements.
                d3.select("#" + config.containerId).selectAll(".selectmenu")   
                  .each( function(d){
                      // This function handles the updating of the menu options for each 'select' element.
                  
                      // Select the 'option' elements and use d3 to update them.
                      var options = d3.select(this).selectAll("option").data(d.options);
                      options
                        .enter()
                          .append("option")
                            .text( function(d){ return d.text; } )
                            .attr("value", function(d){ return d.val; } );
                            
                      options = d3.select(this).selectAll("option").data(d.options);
                      options.attr("value", function(d){ return d.val; })
                             .text( function(d){ return d.text; } );
                      
                      
                      // Remove redundant entries.
                      options.exit().remove();
                  }); // d3.select ... each

                
                // Remove exiting menus.
                menus.exit().remove();
                
                
                // LABELS
                // Label creation is handled in the creation of the menus. Removal takes place here.
                var labels = d3.select("#" + config.containerId).selectAll(".selectmenuLabel").data(config.menuItems);
                labels.exit().remove();
                
                
                
                // Add the functionality to update dependent properties of the new element we're adding to the view. E.g. x and y variable names. THIS HAS TO BE HERE, AS THE MENUS ENTER AND EXIT THE VIEW UPON UPDATE, AND THEIR ON CHANGE EVENTS NEED TO BE UPDATED.
                var variables = config.userSelectedVariables;
                for (var i=0; i<variables.length; i++){
                    addMenu.helpers.addVariableChangeEvent(config, variables[i]);
                };
                          
                
                config.buttonActivationFunction(config);
                  

            }, // updateMenus

            addUpdateMenuItemObject: function addUpdateMenuItemObject(config, menuItemId, variables){


                // First remove any warnings. If they are needed they are added later on.
                d3.select("#" + config.containerId).selectAll(".warning").remove();

                // Only add or update the menu item if some selection variables exist.
                // >1 is used as the default option "undefined" is added to all menus.
                if (variables.length>1){

                    var menuItems = config.menuItems;
                              
                    // Check if the config object already has an item with the 'xPropertyMenu' id.
                    var requiredItem = menuItems.find(x => x.id === menuItemId);
                    var doesItemExist = requiredItem !== undefined;

                    if (doesItemExist){
                      // If the item exists, just update it.
                      var index = menuItems.map(function(d) { return d.id; }).indexOf(menuItemId);

                      config.menuItems[index].options =  variables;

                    } else {
                      // If it doesn't, create a new one.
                      requiredItem = {options: variables, label: "Select variable", id: menuItemId}
                      
                      config.menuItems.push(requiredItem);
                    };      

                
                } else {
                      // There are no variables. No point in having an empty menu.
                      addMenu.helpers.removeMenuItemObject(config, menuItemId);
                      
                      
                      // Tell the user that the data is empty.
                      
                      var warning = d3.select("#" + config.containerId).selectAll(".warning");
                      if (warning.empty()){
                          d3.select("#" + config.containerId)
                            .append("div")
                              .attr("class", "warning")
                              .html("No data has been loaded!")
                              .attr("style", "background-color:pink;font-size:25px;color:white")  
                      }; // if
                        
                }; // if
                
            }, // addUpdateMenuItemObject

            removeMenuItemObject: function removeMenuItemObject(config, menuItemId){
                
                var menuItems = config.menuItems;
                var index = config.menuItems.map(function(d) { return d.id; }).indexOf(menuItemId);
                
                
                if (index>-1){
                    menuItems.splice(index,1);
                };
                
                config.menuItems = menuItems;
                
            }, // removeMenuItemObject

            resetVariableMenuSelections: function resetVariableMenuSelections(menuId){

                var propertyMenuHandle = document.getElementById( menuId );
                if (propertyMenuHandle !== null){
                  propertyMenuHandle.value = undefined;
                };
            }, // resetVariableMenuSelections

            addButtonClickEvent: function addButtonClickEvent(config){
                
                // First
                
                $("#" + config.buttonId).click(
                    function() {
                    
                        // Disable all buttons:
                        d3.selectAll("button").each(function(){$(this).prop("disabled", true)});
                      
                        // Make the dialog
                        $( "#" + config.containerId ).dialog({
                        draggable: false,
                        autoOpen: true,
                        modal: true,
                        buttons: {  "Ok"    :{text: "Ok",
                                              id: config.menuOkButtonId,
                                              disabled: true,
                                              click: function() {
                                                  // Add the plot row to the session.
                                                  config.ok(config);
                                              
                                                  // Close the dialogue.
                                                  $( this ).dialog( "close" )
                                                  
                                                  // Enable all relevant buttons.
                                                  addMenu.helpers.enableDisableAllButtons();
                                                          
                                                  // Delete the warning if present.
                                                  d3.select(this).selectAll(".warning").remove();
                                                  } // click
                                             }, // ok
                                    "Cancel":{text: "Cancel",
                                              id: config.menuCancelButtonId,
                                              disabled: false,
                                              click: function() { 
                                                  // Clearup the internal config objects
                                                  config.cancel(config)
                                            
                                                  $( this ).dialog( "close" ) 
                                                  
                                                  // Enable all buttons.
                                                  addMenu.helpers.enableDisableAllButtons();
                                                  
                                                  // Delete the warning if present.
                                                  d3.select(this).selectAll(".warning").remove();
                                                  } // click
                                             } // cancel
                                 }, // buttons
                        show: {effect: "fade",duration: 50},
                        hide: {effect: "fade", duration: 50}
                        }).parent().draggable();
                        
                        $(".ui-dialog-titlebar").remove();
                        $(".ui-dialog-buttonpane").attr("class", "card");
                    }
                ); // on click
            
            
            }, // addButtonClickEvent
                
            addVariableChangeEvent: function addVariableChangeEvent(config, variable){
                
                var idOfMenuToListenTo = config.containerId + variable + "Menu";
                
                d3.select("#" +  idOfMenuToListenTo).on("change", function(){ 
                  // Populate the 'newPlot' object.
                  var selectedVariable = $(this).val();
                  
                  config.newPlot.data[variable] = selectedVariable;
                  config.newPlot.layout.title   = selectedVariable;
                  
                  config.buttonActivationFunction(config);
                  
                });
                
            }, //addVariableChangeEent
        
            enableDisableAllButtons: function enableDisableAllButtons(){
                // This functionality decides which buttons should be enabled.
                var isDataInFilter = dbsliceData.filteredTaskIds.length !== undefined                  && dbsliceData.filteredTaskIds.length > 0;
                
                // "Add data" is always available!
                $("#getData").prop("disabled",false);
                
                // "Plot Selected Tasks" is on only when there are tasks in the filter, and any 'plotter' plot row has been configured.
                var isPlotterPlotRowCtrlDefined = addMenu.helpers.checkIfArrayKeyIsDefined(dbsliceData.session.plotRows, 'ctrl');
                if(isDataInFilter && isPlotterPlotRowCtrlDefined){
                    // Enable the button
                    $("#refreshTasksButton").prop("disabled",false)
                } else {
                    // Disable the button
                    $("#refreshTasksButton").prop("disabled",true)          
                }; // if
                
                // "Load session" only available after some data has been loaded.
                if(isDataInFilter){
                    // Enable the button
                    $("#getSessionButton").prop("disabled",false)
                } else {
                    // Disable the button
                    $("#getSessionButton").prop("disabled",true)          
                }; // if
                
                // "Add plot row" should be available.
                $("#addPlotRowButton").prop("disabled",false);
                
                // "Remove plot row" should always be available.
                var removePlotRowButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-danger")
                removePlotRowButtons.each(function(){$(this).prop("disabled", false)});
                
                // "Add plot" should only be available if the data is loaded.
                var addPlotButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-success");
                if(isDataInFilter){
                    addPlotButtons.each(function(){$(this).prop("disabled", false)})
                } else {
                    addPlotButtons.each(function(){$(this).prop("disabled", true)})
                }; // if
                
                // "Remove plot" should always be available.
                var removePlotButtons = d3.selectAll(".plotTitle").selectAll(".btn-danger");
                removePlotButtons.each(function(){$(this).prop("disabled", false)})
				
				
				
                
            }, // enableDisableAllButtons
            
            findLatestPlotRowInd: function findLatestPlotRowInd(){
                
                var latestRowInd = [];
                d3.selectAll(".plotRow").each(function(){
                    latestRowInd.push(d3.select(this).attr("plot-row-index"));
                })
                if(latestRowInd.length > 0){
                    latestRowInd = latestRowInd.map(Number);
                    var newRowInd = Math.max( ...latestRowInd ) + 1; // 'spread' operator used!
                } else {
                    var newRowInd = 0;
                }; // if
                
                return newRowInd;
                
            }, // findLatestPlotRowInd
            
            checkIfArrayKeyIsDefined: function checkIfArrayKeyIsDefined(array, key){
                
                // This function checks if any objects in the array <array> have a property called <key>, and if that property is not undefined. If there are no objects with the required property the function returns false. If the object has the property, but it isn't defined it returns false. Only if there are some objects with the required property, and it is defined does the function return true.
                
                var isKeyDefined = true;
                
                // First check if there are any objects in the arra. Otherwise return false.
                if(array.length > 0){
                    
                    // Now check if there are any plot rows with 'ctrl'
                    var compliantObjects = []
                    for(var i = 0; i<array.length; i++){
                        if(key in array[i]){
                            compliantObjects.push(array[i]);
                        }; // if
                    }; // for
                    
                    // If there are some, then check if their controls are defined.
                    if(compliantObjects.length > 0){
                        isKeyDefined = true;
                        for(var j = 0; j<compliantObjects.length; j++){
                            if(compliantObjects[j][key] !== undefined){
                                isKeyDefined = isKeyDefined && true;
                            } else {
                                isKeyDefined = isKeyDefined && false;
                            }; // if
                        }; // for
                        
                    } else {
                        isKeyDefined = false;
                    }; // if
                    
                } else {
                    isKeyDefined = false;
                }; // if
                
                return isKeyDefined;
                
            } // checkIfArrayKeyIsDefined
            
        } // helpers

    }; // addMenu
    
    
	var crossPlotHighlighting = {
		
		
		
		on: function on(d, sourcePlotName){
		
			// Functionality:
			//    - highlight points in scatter plots on other plots too on mouseover.
			//    - same for bar plots and histograms?
			
			// The input is a data object. For scatter plots this is the entire line from metadata.csv corresponding to a particular point.
			
			
			// For this datapoint find all other plots that might be interesting, determine what they are plotting, and which variables they are using, collect the elements belonging to the particular datapoint, and highlight it by updating it's style.
			
			// First go through all plot rows to see if there are data.
			
			// Note that different functionality must be allowed for different source and target plots. For each of the available plot types (bar, histogram, scatter, line, contour) for which the on-mouseover effects are required a different functionality might be needed.
			
			// Find all the data that needs to be highlighted.
			var allDataPoints = crossPlotHighlighting.helpers.findAllData(d, sourcePlotName);
			
			for(var i=0; i<dbsliceData.session.plotRows.length; i++){
				var plotRow = dbsliceData.session.plotRows[i];
				var plotRowDOM = $(".plotRow")[i];
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				d3.select(plotRowDOM).selectAll(".plotArea").each(function(plot, i){
					
					var plotDOM = this;
					
					// First all the elements need to be unhiglighted.
					crossPlotHighlighting.helpers.unHighlightAll(plotDOM, plot);
					
					// Now highlight the needed datapoints.
					allDataPoints.forEach(function(d){
						crossPlotHighlighting.helpers.highlightDataPoint(plotDOM, plot, d);
					}) // forEach
					
				}) // each
				
				
			}; // for
		
		}, // on
		
		off: function off(d, sourcePlotName){
		
			
			for(var i=0; i<dbsliceData.session.plotRows.length; i++){
				var plotRow = dbsliceData.session.plotRows[i];
				var plotRowDOM = $(".plotRow")[i];
				
				
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				d3.select(plotRowDOM).selectAll(".plotArea").each(function(plot, i){
					
					crossPlotHighlighting.helpers.setDefaultStyle(this, plot);
				}) // each
				
				
			}; // for
		
		}, // off
		
		helpers: {
			
			unHighlightAll: function unHighlightAll(element, plot){
				
				// This function highlights all elments in the plot corresponding to the 'plot' data object.
				switch(plot.plotFunc.name){
					case "cfD3Scatter":
						// Collect the appropriate circles, and change their style.
								
						// Find all the circles, and set them to appropriate values.
						d3.select(element).selectAll("circle")
						  .style("opacity", 0.2);
						
					  break;
					  
					case "cfD3BarChart":
					    // Find the appropriate rects, and change their border stroke.
						d3.select(element).selectAll("rect")
						  .attr("stroke", "none")
						  .attr("stroke-width", 3);
						
				      break;
					  
					case "cfD3Histogram":
						// Set opacity of bars to 0.2.
						d3.select(element).selectAll("rect")
						  .attr("opacity", 0.2)
						
					  break;
					  
					case "d3LineSeries":
						// Find all the circles, and set them to appropriate values.
						d3.select(element).selectAll(".line")
						  .style("opacity", 0.2);
						
					  break;
					  
					case "d3Contour2d":
						// Do nothing for this one.
					  break;
					  
					default:
					  break;
				} // switch
				
			}, // unHighlightAll
			
			highlightDataPoint: function highlightDataPoint(element, plot, d){
				// This function distributes the functionality. It has access to the plot information, data information, and the handle to the corresponding DOM plotArea element.

				// This handlercan be invoked for all data d that are found.
				
				switch(plot.plotFunc.name){
					case "cfD3Scatter":
						// Find the circle corresponding to the data point. Look for it by taskId.
						d3.select(element).selectAll("circle[task-id='" + d.taskId + "']")
						  .style("opacity", 1.0)
						  .attr("r", 7);
						
					  break;
					  
					case "cfD3BarChart":
					    // Find the appropriate rects, and change their border stroke.						  
						  
						// Instead of the border turn the text to bold??
						var labels = d3.select(element).selectAll('.keyLabel')._groups[0];
						labels.forEach(function(labelDOM){
							if(labelDOM.innerHTML == d[plot.data.xProperty]){
								// Turn the text bold.
								labelDOM.style.fontWeight = 'bold'
							} // if
						}); // forEach
						
				      break;
					  
					case "cfD3Histogram":
						// NOTE THAT THE TRANSITION EFFECTS CAUSE SLIGHT BUGS - THE MARKERS ARE CREATED BEFORE THE TRANSITION COMPLETES!
					
						// Find within which bar the point falls.
						var property = plot.data.xProperty;
						var bars = d3.select(element).selectAll("rect");
						 
						
						bars.each(function(barData, barInd){
							// d3 connects each of the bars with its data! here 'barData' is an array containing all the data points relating to it, as well as the range of values it represents.
							
							// Pick the corresponding marker.
							var marker = d3.select(element).selectAll('.tempMarker[ind="'+barInd+'"]');
							
							// If there is any data connected to this bar check if it needs to be highlighted.
							for(var i=0; i < barData.length; i++){
								
								// Check if the datapoint with the taskId is in this array. In this case check with a for loop (as opposed to forEach), as otherwise the x0 and x1 properties are interpreted as array elements too.
								if(d.taskId == barData[i].taskId){
									
									// Find the height corresponding to 1 task.
									var h = this.height.baseVal.value/barData.length;
									
									
									// Get the marker rectangle, and update its attributes.
									if(marker.empty()){
										// There is none, so append one.
										var n = 1;
										
										marker = d3.select(element)
										  .append("rect")
										    .attr("class", "tempMarker")
											.attr("height", n*h)
											.attr("transform", getTranslate(this, n, h))
											.attr("n", n)
											.attr("ind", barInd)
											.attr("width", this.width.baseVal.value)
											.attr("opacity", 1)
											.style("fill","cornflowerblue")
										
									} else {
										// Add to the height.
										var n = Number(marker.attr("n")) + 1;
										
										marker
											.attr("height", n*h)
											.attr("transform", getTranslate(this, n, h))
											.attr("n", n)
										
									} // if
									
								}; // if
								
							}; //if
							
							function getTranslate(barDOM, n, h){
								
								var plotHeight = d3.select(barDOM.parentElement.parentElement).attr("plotHeight");
								
								var leftEdgeX = barDOM.transform.baseVal[0].matrix.e + 1;
								var topEdgeY = plotHeight - n*h;
								var t = "translate(" + leftEdgeX + "," + topEdgeY + ")";
							  return t;
							} // getTranslate
							
						}); // each
						
					  break;
					  
					case "d3LineSeries":
						// Find the line corresponding to the data point. Look for it by taskId.
						d3.select(element).selectAll('.plotSeries[task-id="' + d.taskId + '"]').selectAll(".line")
						  .style("opacity", 1.0)
						  .style( "stroke-width", "4px" );
						
					  break;
					  
					case "d3Contour2d":
					    // Find the appropriate contour plot card, and draw a border around it.
					    if(d3.select(element).attr("task-id") == d.taskId){
							d3.select(element.parentElement.parentElement.parentElement)
							  .attr("class", "card border border-dark")
							  
							d3.select(element.parentElement.parentElement.parentElement).select(".plotTitle")
							  .style("font-weight", "bold")
						} // if
						
					  break;
					  
					default:
					  break;
				} // switch
				
			}, // highlightDataPoint
			
			setDefaultStyle: function setDefaultStyle(element, plot){
				// This function returns all expected elements on the plots back to their default styles.
				
				switch(plot.plotFunc.name){
					case "cfD3Scatter":
						// Find all the circles, style them appropriately.
						d3.select(element).selectAll("circle")
						  .style("opacity", 1)
						  .attr("r", 5);
						
					  break;
					  
					case "cfD3BarChart":
					    // Remove the text bolding.
						d3.select(element).selectAll('.keyLabel')
						  .style("font-weight", "")
						  
				      break;
					  
					case "cfD3Histogram":
						// Find within which bar the point falls.
						d3.select(element).selectAll(".tempMarker").remove()
						d3.select(element).selectAll("rect")
						  .attr("opacity", 1)
						
					  break;
					  
					case "d3LineSeries":
						// Revert the opacity and width.
						d3.select(element).selectAll(".line")
						  .style("opacity", 1.0)
                          .style( "stroke-width", "2.5px" );
						  
					  break;
						
					case "d3Contour2d":
						// Remove any border
						d3.select(element.parentElement.parentElement.parentElement)
						  .attr("class", "card");
						  
						d3.select(element.parentElement.parentElement.parentElement).select(".plotTitle")
							  .style("font-weight", "")
					  break;
					  
					default:
					  break;
				} // switch
				
			}, // setDefaultStyle
			
			findAllData: function findAllData(d, sourcePlotName){
				
				
				var allDataPoints;
			    switch(sourcePlotName){
					
					case "cfD3Scatter":
					    allDataPoints = [d];
					  break;
					  
					case "cfD3BarChart":
						// Collect all the relevant data points. An additional filter needs to be applied here!! DON'T USE FILTER - IT MESSES UP WITH ORIGINAL FUNCTIONALITY
						var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity)
						allDataPoints = cfDataPoints.filter(function(p){return p[d.keyProperty] == d.key})
					  break;
					  
					case "d3LineSeries":
						// Collect all the relevant data points by tskId.
						var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity)
						allDataPoints = cfDataPoints.filter(function(p){return p.taskId == d.taskId});
						// console.log(allDataPoints);
					  break;
					  
					case "d3Contour2d":
						// Find the datapoint by taskId.
						var cfDataPoints = dbsliceData.data.metaDims[0].top(Infinity)
						allDataPoints = cfDataPoints.filter(function(p){return p.taskId == d.data.taskId});
					  break;
					  
					default:
					  break;
				} // switch
				
				// ow the reults
				// console.log(allDataPoints)
				
			  return allDataPoints;
				
			} // findAllData
		} // helpers
		
	} // crossPlotHighlighting 
		
		
		
	
	

    function render(elementId, session) {
        var element = d3.select("#" + elementId);

        if (dbsliceData.filteredTaskIds !== undefined) {
            element.select(".filteredTaskCount").select("p")
              .html("Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length);
        } else {
            element.select(".filteredTaskCount").select("p")
              .html("<p> Number of Tasks in Filter = All </p>");
        }; // if
      
        // Remove all d3-tip elements because they end up cluttering the DOM.
		d3.selectAll(".d3-tip").remove();
      
	  
	  
	    // THIS CAN CURRENTLY RESOLVE PROBLEMS F THE DATA IS INCOMPATIBLE.
		// This should work both when new data is loaded and when a new session is loaded.
	    importExportFunctionality.helpers.onDataAndSessionChangeResolve()
		
	  
	  
	  
        var plotRows = element.selectAll(".plotRow").data(session.plotRows);
      
        // HANDLE ENTERING PLOT ROWS!
        var newPlotRows = plotRows.enter()
          .append("div")
            .attr("class", "card bg-light plotRow")
            .attr("style", "margin-bottom:20px")
            .attr("plot-row-index", function (d, i) {return i;});
      
        // Add in the container for the title of the plotting section.
        // Make this an input box so that it can be change on te go!
        var newPlotRowsHeader = newPlotRows
          .append("div")
            .attr("class", "card-header plotRowTitle")
            .attr("type", function (d){return d.type});
        newPlotRowsHeader
          .append("h3")
            .attr("style","display:inline")
            .html( function(data){return data.title} )
            .attr("spellcheck", "false")
            .attr("contenteditable", true);
      
        // Give all entering plot rows a body to hold the plots.
        var newPlotRowsBody = newPlotRows
          .append("div")
            .attr("class", "row no-gutters plotRowBody")
            .attr("plot-row-index", function (d, i){return i;})
            .attr("type", function (d){return d.type});
      
        // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.
        var newPlots = newPlotRowsBody.selectAll(".plot")
          .data(function (d){return d.plots;})
          .enter()
          .each(makeNewPlot);
      
      
      
        // UPDATE EXISTING PLOT ROWS!!
        // Based on the existing plotRowBodies, select all the plots in them, retrieve all the plotting data associated with this particular plot row, and assign it to the plots in the row. Then make any entering ones.
        plotRows.selectAll(".plotRowBody").selectAll(".plot")
          .data(function (d){return d.plots;})
          .enter()
          .each(makeNewPlot);
      
        // Update the previously existing plots.
        var plotRowPlots = plotRows.selectAll(".plot")
          .data(function (d){return d.plots;})
          .each(updatePlot);
      
      
        // This updates the headers of the plots because the titles might have changed.
        var plotRowPlotWrappers = plotRows.selectAll(".plotWrapper")
          .data(function (d) { return d.plots; })
          .each(function (plotData, index) {
              var plotWrapper = d3.select(this);
              var plotTitle = plotWrapper.select(".plotTitle").select("div")
                .html(plotData.layout.title)
          }); // each
      
      
        // HANDLE EXITING PLOT ROWS!!
        plotRows.exit().remove();
        plotRowPlotWrappers.exit().remove();
      
      
	  
	  
	    
	  
	  
	  
	  
	  
	  
        // FUNCTIONALITY
      
	  
	  
        // ADD PLOT ROW BUTTON.
        var addPlotRowButtonId = "addPlotRowButton";
        var addPlotRowButton   = d3.select("#" + addPlotRowButtonId);
        if (addPlotRowButton.empty()){
            // Add the button.
            d3.select("#" + dbsliceData.elementId)
              .append("button")
                .attr("id", addPlotRowButtonId)
                .attr("class", "btn btn-info btn-block")
                .html("+");
              
            addMenu.addPlotRowControls.make(addPlotRowButtonId);
        } else {
            // Move the button down
            var b = document.getElementById(addPlotRowButtonId);
            b.parentNode.appendChild(b);
        }; // if
      
      
      
        // REMOVE PLOT ROW
        newPlotRowsHeader.each(function(data){
            // Give each of the plot rows a delete button.
            d3.select(this).append("button")
              .attr("id", function(d,i){return "removePlotRowButton"+i; })
              .attr("class", "btn btn-danger float-right")
              .html("x")
              .on("click", function(){
                  // Select the parent plot row, and get its index.
                  var ownerPlotRowInd = d3.select(this.parentNode.parentNode).attr("plot-row-index")
                 
                  dbsliceData.session.plotRows.splice(ownerPlotRowInd,1);
                 
                  render(dbsliceData.elementId, dbsliceData.session);
                 
              }); // on
        }); // each
      
        // ADD PLOT BUTTONS - THESE CONTROLS SHOULD UPDATE. DO THEY?
        newPlotRowsHeader.each(function(){
            addMenu.addPlotControls.make( this );
        }); // each
      
        // REMOVE PLOT BUTTONS - THESE ALLOW PLOTS TO BE REMOVED.
        addMenu.removePlotControls();
      
      
      

	  
      
      
        // REPLACE CURRENT DATA OPTION:
		var dataReplace = createFileInputElement( importExportFunctionality.importData.load, "replace")
        d3.select("#replaceData")
          .on("click", function(){dataReplace.click()})
		  
		// ADD TO CURRENT DATA OPTION:
		var dataInput = createFileInputElement( importExportFunctionality.importData.load, "add")
        d3.select("#addData")
          .on("click", function(){dataInput.click()})
		  
		  
		  
		  
		// REMOVE SOME CURRENT DATA OPTION:
		// This requires a popup. The popup needs to be opened on clicking the option. Upon submitting a form the underlying functionality is then called.
		addMenu.removeDataControls.make("removeData")
      

	  
	  
	  
        // LOAD SESSION Button
	    var sessionInput = createFileInputElement( importExportFunctionality.loadSession.handler )
        d3.select("#getSession")
          .on("click", function(){sessionInput.click()})
      
        
		
		
		
        // Control all button and menu activity;
        addMenu.helpers.enableDisableAllButtons();
		
		
		
		
		
		// HELPER FUNCTIONS:
		function createFileInputElement(loadFunction, dataAction){
			
			
			
			
			// This button is already created. Just add the functionaity.
			var dataInput = document.createElement('input');
			dataInput.type = 'file';

			// When the file was selected include it in dbslice. Rerender is done in the loading function, as the asynchronous operation can execute rendering before the data is loaded otherwise.
			dataInput.onchange = function(e){
				// BE CAREFULT HERE: file.name IS JUST THE local name without any path!
				var file = e.target.files[0]; 
				// importExportFunctionality.importData.handler(file);
				loadFunction(file, dataAction)
			}; // onchange
			
		  return dataInput
			
		} // createGetDataFunctionality

      
    } // render

    function initialise(elementId, session, data) {
        var config = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {plotTasksButton: false};
      
      
        dbsliceData.data = cfDataManagement.cfInit( data );
        dbsliceData.session = session;
        dbsliceData.elementId = elementId;
        dbsliceData.config = config;
      
        var element = d3.select("#" + elementId);
      
        var sessionHeader = element.select(".sessionHeader");
        if (sessionHeader.empty()) {
            makeSessionHeader(element, session.title, session.subtitle, config);
        } // if
      
        render(elementId, session);
    } // initialise

    function makeSessionHeader(element, title, subtitle, config) {
        var sessionTitle = element
          .append("div")
            .attr("class", "row sessionHeader")
          .append("div")
            .attr("class", "col-md-12 sessionTitle");
     
        sessionTitle
          .append("br");
        
        sessionTitle
          .append("h1")
            .attr("style", "display:inline")
            .attr("spellcheck", "false")
            .html(title)
            .attr("contenteditable", true);
      
        if (config.plotTasksButton) {
            sessionTitle
              .append("button")
                .attr("class", "btn btn-success float-right")
                .attr("id", "refreshTasksButton")
                .html("Plot Selected Tasks");
        } // if

        if (subtitle !== undefined) {
            sessionTitle
              .append("p")
              .html(subtitle);
        } // if
      
        sessionTitle
          .append("br")
        sessionTitle
          .append("br");

        sessionTitle
          .append("div")
            .attr("class", "filteredTaskCount")
          .append("p")
            .attr("style", "display:inline");
        
		

		// CREATE THE MENU WITH SESSION OPTIONS
		var sessionGroup = sessionTitle
		  .append("div")
		    .attr("class", "btn-group float-right")
			.attr("style", "display:inline")
			
		sessionGroup
		  .append("button")
		    .attr("type", "button")
			.attr("class", "btn btn-info dropdown-toggle")
			.attr("data-toggle", "dropdown")
			.attr("aria-haspopup", true)
			.attr("aria-expanded", false)
			.html("Session options")
			
		var sessionMenu = sessionGroup
		  .append("div")
		    .attr("class", "dropdown-menu")
		  
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
		    .attr("id", "replaceData")
		    .html("Replace data")
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
		    .attr("id", "addData")
		    .html("Add data")
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
		    .attr("id", "removeData")
		    .html("Remove data")
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
			.attr("id", "getSession")
		    .html("Load session")
		  
		
			
			
			
          
        sessionTitle
          .append("br")
        sessionTitle
          .append("br")
          
        $("#refreshTasksButton").on("click", function () {
            refreshTasksInPlotRows();
        });
       
    } // makeSessionHeader



    function makePlotsFromPlotRowCtrl(ctrl) {
        var plotPromises = [];

        // A decision is made whether the ctrl dictates a 'slice' or 'task' plot should be made. 'Task' creates an individual plot for each task, and 'slice' ummaries many on the same plot.
         
        switch(ctrl.plotType){
            case "d3LineSeries":
                // Summary plot of all the selected task line plots.
                // The sliceIds are also variable names!
                ctrl.sliceIds.forEach(function (sliceId, sliceIndex) {
                    var plotPromise = makePromiseSlicePlot(ctrl, sliceId, sliceIndex);
                    plotPromises.push(plotPromise);
                }); // forEach
              break;
              
            case "d3Contour2d":
                // Individual task plot. Loop through the tasks and create a promise for each.
                var d = ctrl.data.dataDims[0].top(Infinity);
                
                for (var index = 0; index < ctrl.taskIds.length; ++index) {
                    
                    var url = d[index][ctrl.sliceIds];
                    
                    
                    var title = d[index].label;
                    var plotPromise = makePromiseTaskPlot(ctrl, url, title, ctrl.taskIds[index]);
                    plotPromises.push(plotPromise);
                } // for
                
                // Calculate the data limits. Here it is known what the properties are since this branch only executes for 'd3Contour2d'.
                Promise.all(plotPromises).then(function (plots){
                    
                    
                    // The input 'plots' is an array of objects, which all include their relevant data in the .data.surfaces property. In the case of a 2d contour there will only be one surface.
                    
                    // Find all the properties that are in all the loaded files. First collect the properties of all the files in an array of arrays.
                    var allPropertyNames = plotHelpers.collectAllPropertyNames(plots,         function(d){return d.data.surfaces})
                    
                    // Check which ones are in all of them.
                    var commonPropertyNames = plotHelpers.findCommonElements(allPropertyNames);
                    
                    // Loop over all the common properties and calculate their ranges.
                    for(var i = 0; i<commonPropertyNames.length; i++){
                        
                        var property = commonPropertyNames[i];
                        
                        ctrl.limits[property] = plotHelpers.getDomain(plots, function(d){return d.data.surfaces[property]})
                        
                    }; // for 
                    
                    // ctrl is from dbsliceData.session.plotRows.ctrl.
                    
                }) // Promise.all().then
                
                
              break;
              
            default:
              break;
              // Do nothing.
            
        }; // switch

        // Bundle all the promises together again?
        return Promise.all(plotPromises);
    } // makePlotsFromPlotRowCtrl

    function makePromiseTaskPlot(ctrl, url, title, taskId) {
        var promise = fetch(url)
          .then(function (response) {
              if (ctrl.csv === undefined) {return response.json();} // if
              if (ctrl.csv == true)       {return response.text();} // if 
          })
          .then(function (responseJson) {
            
              if (ctrl.csv == true) {responseJson = d3.csvParse(responseJson);} // if
            
              var plot = {};

              if (ctrl.formatDataFunc !== undefined) {
                  plot.data = ctrl.formatDataFunc(responseJson, taskId);
              } else {
                  plot.data = responseJson;
              } // if
			  
			  // Add the taskId for identification purposes.
			  plot.data.taskId = taskId;

              plot.layout = Object.assign({}, ctrl.layout);
              plot.plotFunc = ctrl.plotFunc;
              plot.layout.title = title;
              plot.data.newData = true;
            
            return plot;
          }); // then
      
      return promise;
    } // makePromiseTaskPlot

    function makePromiseSlicePlot(ctrl, sliceId, sliceIndex) {
        // This creates all the data retrieval promises required to make a 'slice' plot. 'Slice' plots summarise data of multiple tasks, as opposed to 'task' plots which produce an individual plot for each of the tasks.
      
        var slicePromisesPerPlot = [];
      
        // Determine the maximum number of plots if a limit is imposed.
        ctrl.maxTasks = ctrl.maxTasks !== undefined ? Math.min(ctrl.taskIds.length, ctrl.maxTasks) : undefined;

        // The data is selected here. As the filtering has already been applied in 'cfUpdateFilters' all of the data can be selected here, and will respect the filters.
        var d = ctrl.data.dataDims[0].top(Infinity);
        
        
        // Make all the promises required for a single plot.
        for (var index = 0; index < d.length; index++){
          
		    // The URL must be given in the data. The sliceId comes from the variable name in the data. The task Id is added to track the loaded data.
			var taskData = d[index];
            var url = taskData[sliceId];
            
            var slicePromise = makeSlicePromise(url, taskData.taskId);
            
			slicePromisesPerPlot.push(slicePromise);
        } // for



        // Bundle together all the promises required for the plot.
        return Promise.all(slicePromisesPerPlot)
            .then(function (responseJson) {
                if (ctrl.csv == true) {
                    var responseCsv = [];
                    responseJson.forEach(function (d) {
                        responseCsv.push(d3.csvParse(d));
                    });
                    responseJson = responseCsv;
                } // if

                var plot = {};

				
                if (ctrl.formatDataFunc !== undefined) {
                    plot.data = ctrl.formatDataFunc(responseJson);
                } else {
                    plot.data = responseJson;
                }; // if

                plot.layout = Object.assign({}, ctrl.layout);

                if (ctrl.layout.xRange !== undefined) {
                    if (ctrl.layout.xRange[1].length !== undefined) {
                        plot.layout.xRange = ctrl.layout.xRange[sliceIndex];
                    }; // if
                }; // if

                if (ctrl.layout.yRange !== undefined) {
                    if (ctrl.layout.yRange[1].length !== undefined) {
                        plot.layout.yRange = ctrl.layout.yRange[sliceIndex];
                    }; // if
                }; // if

                plot.plotFunc = ctrl.plotFunc;
                plot.layout.title = sliceId;
                plot.data.newData = true;
                
              return plot;
            }); // then
			
			
		function makeSlicePromise(url, taskId){
			// This is done in the following manner to allow the correct taskId to be added to each of hte loaded data sets. This allows the data in the files to not need the appropriate task id in order to be tracked on the plots.
			var slicePromise = fetch(url)
			  .then(function (response) {
					  var dataPromise = response.json();
					  
					  dataPromise.then(function(data){
						  data.taskId = taskId;
						  return data;
					  });
					  
					return dataPromise; 

              }); // fetch().then()
			
			
		  return slicePromise;
		} // makeSlicePromise

			
    } // makePromiseSlicePlot



    function refreshTasksInPlotRows() {
        var plotRows = dbsliceData.session.plotRows;
        var plotRowPromises = [];
      
        plotRows.forEach(function (plotRow) {
            
            // For now nothing happens as there are no plotRow.ctrl
            if (plotRow.ctrl !== undefined) {
                var ctrl = plotRow.ctrl;

                if (ctrl.plotFunc !== undefined) {
                    
                    // Get 
                    if (ctrl.tasksByFilter) {
                        ctrl.taskIds = dbsliceData.filteredTaskIds;
                        ctrl.taskLabels = dbsliceData.filteredTaskLabels;
                    } // if

                    // THIS DOES NOTHING FOR NOW!!
                    if (ctrl.tasksByList) {
                        ctrl.taskIds = dbsliceData.manualListTaskIds;
                    } // if

                    // Create all the promises, and when they're met push the plots.
                    var plotRowPromise = makePlotsFromPlotRowCtrl(ctrl)
					    .then( function (plots) {
                            plotRow.plots = plots;
                            
                            // The plot limits have to be assigned to the plots as they are passed into the plotting functions alone, without the rest of the plotRow object. This allows all the colorbars to be the same.
                            plotRow.plots.forEach(function(plot){
                                plot.data.limits = plotRow.ctrl.limits;
                            }); // forEach
					
                        }); // then
                    plotRowPromises.push(plotRowPromise);
                } // if
            } // if
        }); // forEach
        
        Promise.all(plotRowPromises).then(function () {
            // Render when all the data for all the plots in all plot rows has been loaded.
            render(dbsliceData.elementId, dbsliceData.session);
        }); // Promise
    } // refreshTasksInPlotRows




    function cfUpdateFilters(crossfilter) {
        // Crossfilter works by applying the filtering operations, and then selecting the data.
        // E.g.:
        //
        // var dim = dataArrayCfObject.dimension(function(d) { return d.[variable]; });
        // dim.filter(“Design A”)
        //
        // This created a 'crossfilter' dimension obeject on the first line, which operates on the poperty named by the string 'variable'. his objecathen be used to perform filtering operations onthe data.
        // On the second line a filter is added. In this case the filter selects only 'facts' (individual items of data), for which the 'variable' is equal to "Design A". The selection is applied directly on the dataArrayCfObject, so trying to retrive the top 10 data points using dataArrayCfObject.top(10) will return the first 10 points of "Design A".
        //
        // Thus the filters can be applied here, and will be observed in the rest of the code.
        
        // UPDATE THE CROSSFILTER DATA SELECTION:
        
        // Bar charts
        crossfilter.filterSelected.forEach(function (filters, i) {
            // if the filters array is empty: ie. all values are selected, then reset the dimension
            if (filters.length === 0) {
                //Reset all filters
                crossfilter.metaDims[i].filterAll();
            } else {
                crossfilter.metaDims[i].filter(function (d) {
                    return filters.indexOf(d) > -1;
                }); // filter
            }; // if
        }); // forEach
      
        // Histograms
        crossfilter.histogramSelectedRanges.forEach(function (selectedRange, i) {
            // Reset all filters
            crossfilter.dataDims[i].filterAll();

            if (selectedRange.length !== 0) {
                crossfilter.dataDims[i].filter(function (d) {
                  return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
                }); // filter
            }; // if
        }); // forEach



        // HERE THE SELECTED TASKIDS ARE UPDATED
        var currentMetaData = crossfilter.metaDims[0].top(Infinity);
        dbsliceData.filteredTaskIds = currentMetaData.map(function (d){return d.taskId;});

		
		if(currentMetaData.length > 0){
			if (currentMetaData[0].label !== undefined) {
				dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.label;});
			} else {
				dbsliceData.filteredTaskLabels = currentMetaData.map(function (d){return d.taskId;});
			} // if
		} else {	
			dbsliceData.filteredTaskLabels = [];
        } // if
    } // cfUpdateFilter

    

    
	var importExportFunctionality = {
		// This object controls all the behaviour exhibited when loading in data or session layouts, as well as all behaviour when saving the layout.
		
		// The loading of sessions and data must be available separately, and loading the session should include an option to load in a predefined dataset too.
		
		// It is possible that the session configuration and data will have incompatible variable names. In these cases the user should resolve the incompatibility, but the incompatibility should be presented to them!
		
		// Saving the session is done by downloading a created object. Therefore a session object should be written everytime the view is refreshed.
		
		// The views depending on "Plot Selected Tasks" to be pressed should be loaded in merely as configs in their plotrows, and the corresponding filtering values need to be loaded into their corresponding plots.
		
		
		importData : {
			// WIP: This has to be able to load in data from anywhere on the client computer, not just the server root.
			
			// WIP: It must be able to load in additional data. The user must be prompted to identify variables that are different in loaded, and to be loaded data.
			
			// DONE: It must be able to load both csv and json fle formats.
			
			// DONE/WIP: Must prompt the user if the variables don't include those in existing plots. Solution: does not prompt the user, but for now just removed any incompatible plots. The prompt for the user to resolve the incompatibility is the next step.
			
			load : function load(file, dataAction){
				
				// Create convenient handles.
				var ld = importExportFunctionality.importData
				
				
				// Split the name by the '.', then select the last part.
				var extension = file.name.split(".").pop();
				
				
				// Determine if the input adds new data, or if it replaces the data.
				switch(dataAction){
					case "add":
						var actionOnInternalStorage = cfDataManagement.cfAdd
					  break
					  
					case "replace":
						var actionOnInternalStorage = cfDataManagement.cfInit
					  break
					  
					default:
						var actionOnInternalStorage = cfDataManagement.cfInit
					  break
					
				} // switch
				
				
				
				switch(extension){
					
					case "csv":
						d3.csv(file.name, ld.helpers.convertNumbers, function(metadata){
							// Add the filename to the data.
							metadata.forEach(function(d){d.file = file.name})
							ld.csv(metadata, actionOnInternalStorage);
							
						}) // d3.csv
						break;
						
					case "json":
						d3.json(file.name, function(metadata){
							metadata.data.forEach(function(d){d.file = file.name})
							ld.json(metadata, actionOnInternalStorage);
							
						}) // d3.json
						break;
						
					default:
						window.alert("Selected file must be either .csv or .json")
						break;
				}; // switch
				
				
				
			}, // load
			
			
			
			csv: function csv(metadata, actionOnInternalStorage){
				// Process the metadata read in the csv format.
				var d = importExportFunctionality.importData.helpers.csv2json(metadata)
				
				// Perform the requested internal storage assignment.
				actionOnInternalStorage(d);
				// cfDataManagement.cfInit(d)
							
				render(dbsliceData.elementId, dbsliceData.session);
					
				
			}, // csv
			
			json : function json(metadata, actionOnInternalStorage){
				
				
				// Change any backslashes with forward slashes
				metadata.data.forEach(function(d){
					importExportFunctionality.importData.helpers.replaceSlashes(d, "taskId");
				}) // forEach
				
				// Initialise the crossfilter
				actionOnInternalStorage(metadata)
				// cfDataManagement.cfInit(metadata)
				
				
				render(dbsliceData.elementId, dbsliceData.session);
				
				
                
				
			}, // json
			
			helpers: {
				
				loadDataAndEvaluate: function loadDataAndEvaluate(){
					
					
					
				}, // loadDataAndEvaluate
				
				renameVariables: function renameVariables(data, oldVar, newVar){
						// This function renames the variable of a dataset.
						for(var j=0; j<data.length; j++){
							// Have to change the names individually.
							data[j][newVar] = data[j][oldVar];
							delete data[j][oldVar];
						}; // for
				}, // renameVariable
								
				convertNumbers: function convertNumbers(row) {
						// Convert the values from strings to numbers.
						var r = {};
						for (var k in row) {
							r[k] = +row[k];
							if (isNaN(r[k])) {
								r[k] = row[k];
							} // if
						} // for
					  return r;
				}, // convertNumbers
								
				replaceSlashes: function replaceSlashes(d, variable){
						// Replace all the slashes in the variable for ease of handling in the rest of the code.
						var variable_ = d[variable];
						d[variable] = variable_.replace(/\\/g, "/");
						
				}, // replaceSlashes
				
				csv2json: function csv2json(metadata){
					
					// Create a short handle to the helpers
					var h = importExportFunctionality.importData.helpers
					
					// Change this into the appropriate internal data format.
					var headerNames = d3.keys(metadata[0])
					
					// Assemble dataProperties, and metadataProperties.
					var dataProperties = [];
					var metadataProperties = [];
					var sliceProperties = [];
					var contourProperties = [];
					
					for(var i=0; i<headerNames.length;i++){
						
						// Look for a designator. This is either "o_" or "c_" prefix.
						var variable    = headerNames[i];
						var prefix      = variable.split("_")[0];
						var variableNew = variable.split("_").slice(1).join(" ");
						
						
						switch(prefix){
							case "o":
								// Ordinal variables.
								dataProperties.push( variableNew )
								
								h.renameVariables(metadata, variable, variableNew)
								break;
							case "c":
								// Categorical variables
								metadataProperties.push( variableNew )
								
								h.renameVariables(metadata, variable, variableNew)
								break;
							case "s":
								// Slices
								sliceProperties.push(variableNew);
								
								h.renameVariables(metadata, variable, variableNew)
								break;
								
							case "c2d":
								// Contours
								contourProperties.push(variableNew);
								
								h.renameVariables(metadata, variable, variableNew)
							  
							  break;
								
							case "taskId":
								// This is a special case, as it is advantageous that any '\' in the value of taskId be changed into '/'. It is intended that the taskId is the url to the location ofthe data, thus this can prove important.						
								metadata.forEach(function(d){
									h.replaceSlashes(d, "taskId");
								}) // forEach
								
							  break;
								
							default:
								
								break;
						
						}; // switch
						
					}; // for
					
					// Combine in an overall object.
					var d = {
						 data : metadata,
						 header: {
								  dataProperties :     dataProperties,
							  metaDataProperties : metadataProperties,
								 sliceProperties :    sliceProperties,
							   contourProperties :  contourProperties,
						 }
					};
					
				  return d
				} // csv2json
				
			} // helpers
			
		}, // loadData
		
		
		loadSession : {
			// WIP: Must be able to load a session file from anywhere.
			
			// DONE: Must load in metadata plots

			// WIP: Must be able to load in data automatically. If the data is already loaded the loading of additional data must be ignored. Or the user should be asked if they want to add it on top.
			
			// WIP: Must be able to load without data.
			
			// DONE: Must only load json files.
			
			// WIP: Must prompt the user if the variables don't include those in loaded data.
			
			handler: function handler(file){
            
				var ls = importExportFunctionality.loadSession
			
				// Split the name by the '.', then select the last part.
				var extension = file.name.split(".").pop();
				
				switch(extension){
					
					case "json":
						d3.json(file.name, function(sessionData){
							ls.json(sessionData);
						}) // d3.json
						break;
						
					default:
						window.alert("Selected file must be either .csv or .json")
						break;
				}; // switch
				
				
			}, // handler
			
			json: function json(sessionData){
				
				
				var h = importExportFunctionality.loadSession.helpers
				
				// Check if it is a session file!
				if (sessionData.isSessionObject === "true"){
					
					// To simplify handling updating the existing plot rows, they are simply deleted here as the new session is loaded in. NOT THE MOST ELEGANT, OR NICE TO SEE IN ACTION, BUT IT GETS THE JOB DONE.
					// This is done here in case a file that is not a json is selected.
					d3.selectAll(".plotRow").remove();
					
					
					var plotRows = h.assemblePlotRows(sessionData.plotRows);
					
					// Finalise the session object.
					var session = {
						title : sessionData.title,
						plotRows: plotRows
					};
					
					// Store into internal object
					dbsliceData.session = session;
					
					// Render!
					render(dbsliceData.elementId, dbsliceData.session)
					
				} else {
					window.alert("Selected file is not a valid session object.")
				}; // if
					
				
			}, // json
			
			helpers: {
            
				string2function: function string2function(string){
					
					var func;
					switch(string){
						case "cfD3BarChart":
							func = cfD3BarChart;
							break;
						case "cfD3Histogram":
							func = cfD3Histogram;
							break;
						case "cfD3Scatter":
							func = cfD3Scatter;
							break;
						default :
							func = undefined;
							break;
					}; // switch
					return func;
					
				}, // string2function
				
				assemblePlots: function assemblePlots(plotsData){
					
					var h = importExportFunctionality.loadSession.helpers
					
					// Assemble the plots.
					var plots = [];
					for(var j=0;j<plotsData.length;j++){
						
						var plotToPush = {
						  plotFunc : h.string2function( plotsData[j].type ),
						  layout : { title : plotsData[j].title, 
								  colWidth : 4, 
									height : 300 }, 
						  data : {  cfData : dbsliceData.data, 
								 xProperty : plotsData[j].xProperty, 
								 yProperty : plotsData[j].yProperty, 
								 cProperty : plotsData[j].cProperty}
						};
						plots.push(plotToPush);
						
					}; // for
					
					return plots;
					
				}, // assemblePlots
				
				assemblePlotRows: function assemblePlotRows(plotRowsData){
					
					var h = importExportFunctionality.loadSession.helpers
					
					// Loop over all the plotRows.
					var plotRows = [];
					for(var i=0;i<plotRowsData.length;i++){
						
						var plotRowToPush = {title: plotRowsData[i].title, 
											 plots: h.assemblePlots(plotRowsData[i].plots), 
											  type: plotRowsData[i].type,
									addPlotButton : true    }
						plotRows.push(plotRowToPush);
					}; // for
					
					return plotRows;
					
				} // assemblePlotRows
				
			} // helpers
			
		}, // loadSession
		
		
		helpers : {
			
			variableMatching : function variableMatching(){
				// Functionality that allows the user to resolve any issues between datasets with different names that hold th esame quantities.
			}, // variableMatching
			
			collectPlotProperties : function collectPlotProperties(){
				// Collect all the variables in the current plots (by type!), the variables in the current data, and return them.
				// If there is a variable in th eplot, but not in hthe new data it must either be given, or the plot needs to be removed.
				
		
				
				
				// First go through all the metadata plots and getthe variables. This is probably more conveniently done through the dbsliceData object.
				var metadataPlotRows = dbsliceData.session.plotRows.filter(function(plotRow){
					return plotRow.type == "metadata"
				}) // filter
				
				var plotProperties = []
				metadataPlotRows.forEach(function(metadataPlotRow){
					metadataPlotRow.plots.forEach(function(metadataPlot){
						
						plotProperties.push( metadataPlot.data.xProperty )
						if(metadataPlot.data.yProperty !== undefined){
							plotProperties.push( metadataPlot.data.yProperty )
						} // if
					}) // forEach
				}) // forEach
				
				
				// Remove any duplicates: 
				plotProperties = unique( plotProperties )

				
			  return plotProperties
				
				function unique(d){
				
					
					// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
					function onlyUnique(value, index, self) { 
						return self.indexOf(value) === index;
					} // unique
					
					return d.filter( onlyUnique )
				
				} // unique



				/*
				// CURRENTLY THE FLOW FIELD PLOTS DO NOT FEATURE SEPARATE PROPERTIES, THEREFORE IT's NOT REALLY POSSIBLE TO CAPTURE THIS FOR NOW.
				
				// Now go through the flow field plots and get the variables. These will either be plots with data from multiple plots on them (slice), or a single case (contour).
				var plotterPlotRows = dbsliceData.session.plotRows.filter(function(plotRow){
					return plotRow.type == "plotter"
				}) // filter
				
				var plotProperties = []
				plotterPlotRows.forEach(function(plotterPlotRow){
					
					plotterPlotRow.plots.forEach(function(plotterPlot){
						plotProperties.push( plotterPlot.d )
					}) // forEach
				}) // forEach
				*/
				
				// console.log(metadataPlotRow)
				// console.log(d)
				// console.log(dbsliceData)
				
			}, // collectPlotProperties
			

			onDataAndSessionChangeResolve : function onDataAndSessionChangeResolve(){
				// The data dominates what can be plotted. Perform a check between the session and data to see which properties are available, and if the plots want properties that are not in the data they are removed.
				
				// Resolve any issues between existing plots and data by removing any plots with variables that are not in the data.
				var plotProperties = importExportFunctionality.helpers.collectPlotProperties()
				
				
				// Find the variables that are on hte plots, but not in the data.
				var incompatibleProperties = plotProperties.filter(function(property){
					var isInMetadata = dbsliceData.data.metaDataProperties.includes(property)
					var isInData     = dbsliceData.data.dataProperties.includes(property)
				  return !(isInMetadata || isInData)
				}) // filter
				
				// Furthermore it is possible that the user has removed all data. In this case just remove all the plots, by specifying all plot properties as incompatible.
				if(dbsliceData.data !== undefined){
					if(dbsliceData.data.fileDim.top(Infinity).length < 1){
					incompatibleProperties = plotProperties
					} // if					
				} // if
				
				
				
				
				// Loop through all incompatible properties, and remove the plots that are not needed.
				dbsliceData.session.plotRows.forEach(function(plotRow){
					if(plotRow.type == "metadata"){
						var removeIndex = plotRow.plots.map(function(plot){
							// If the plot features an incompatible metadata or data property return true.	
							
						  return incompatibleProperties.includes( plot.data.xProperty ) ||
								 incompatibleProperties.includes( plot.data.yProperty )
							
						}) // map
						
						
						for(var i = removeIndex.length-1; i>=0; i--){
							// Negative loop facilitates the use of splice. Otherwise the indexes get messed up by splice as it reindexes the array upon removal.
							if(removeIndex[i]){
								plotRow.plots.splice(i,1)
							} // if
						} // for
						
					} // if
				}) // forEach
				
				
			} // onDataChangeResolve

			
			
			
		} // helpers
		
	} // importExportFunctionality




	
    exports.cfD3BarChart = cfD3BarChart;
    exports.cfD3Histogram = cfD3Histogram;
    exports.cfD3Scatter = cfD3Scatter;
    exports.d3LineSeries = d3LineSeries;
    exports.cfDataManagement = cfDataManagement;
    exports.cfUpdateFilters = cfUpdateFilters;
    exports.addMenu = addMenu;
    exports.makeNewPlot = makeNewPlot;
    exports.makePlotsFromPlotRowCtrl = makePlotsFromPlotRowCtrl;
    exports.makeSessionHeader = makeSessionHeader;
    exports.refreshTasksInPlotRows = refreshTasksInPlotRows;
    exports.initialise = initialise;
    exports.render = render;
    exports.updatePlot = updatePlot;
    exports.makePromiseSlicePlot = makePromiseSlicePlot;
	exports.importExportFunctionality = importExportFunctionality;

    return exports;

}({}));
