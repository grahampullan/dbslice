import { dbsliceData } from '../core/dbsliceData.js';

const crossPlotHighlighting = {
		
		
		
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
		
	

export { crossPlotHighlighting };