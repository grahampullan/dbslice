import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';

const d3Contour2d = {
        
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


export { d3Contour2d };