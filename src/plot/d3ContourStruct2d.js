import { dbsliceData } from '../core/dbsliceData.js';

const d3ContourStruct2d = {

    make : function ( element, data, layout ) {

        d3ContourStruct2d.update ( element, data, layout )

    },

    update : function ( element, data, layout ) {

        var container = d3.select(element);

        if ( layout.highlightTasks == true ) {

            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                container.style("outline-width","0px")
 
            } else {

                container.style("outline-width","0px")

                dbsliceData.highlightTasks.forEach( function (taskId) {

                    if ( taskId == layout.taskId ) {
                    
                        container
                            .style("outline-style","solid")
                            .style("outline-color","red")
                            .style("outline-width","4px")
                            .style("outline-offset","-4px")
                            .raise();

                    }

                });
            }
        }


        if (data.newData == false) {
            return
        }

        var x, y, v, n, m;

        var marginDefault = {top: 20, right: 65, bottom: 20, left: 10};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var svgWidth = container.node().offsetWidth,
		    svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        container.select("svg").remove();

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);
            //.style("stroke-width","0px");

        var plotArea = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .append("g")
                .attr("class", "plotArea");

        var scaleMargin = { "left" : svgWidth - 60, "top" : margin.top};

        var scaleArea = svg.append("g")
            .attr("class", "scaleArea")
            .attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")")

        var xMinAll = d3.min( data.surfaces[0].x );
        var yMinAll = d3.min( data.surfaces[0].y );
        var vMinAll = d3.min( data.surfaces[0].v );

        var xMaxAll = d3.max( data.surfaces[0].x );
        var yMaxAll = d3.max( data.surfaces[0].y );
        var vMaxAll = d3.max( data.surfaces[0].v );

        var nDataSets = data.surfaces.length;

        for (var nds = 1; nds < nDataSets; ++nds ) {
            xMinAll = ( d3.min( data.surfaces[nds].x ) < xMinAll ) ? d3.min( data.surfaces[nds].x ) : xMinAll;
            yMinAll = ( d3.min( data.surfaces[nds].y ) < yMinAll ) ? d3.min( data.surfaces[nds].y ) : yMinAll;
            vMinAll = ( d3.min( data.surfaces[nds].v ) < vMinAll ) ? d3.min( data.surfaces[nds].v ) : vMinAll;
            xMaxAll = ( d3.max( data.surfaces[nds].x ) > xMaxAll ) ? d3.max( data.surfaces[nds].x ) : xMaxAll;
            yMaxAll = ( d3.max( data.surfaces[nds].y ) > yMaxAll ) ? d3.max( data.surfaces[nds].y ) : yMaxAll;
            vMaxAll = ( d3.max( data.surfaces[nds].v ) > vMaxAll ) ? d3.max( data.surfaces[nds].v ) : vMaxAll;
        }

        var xRange = xMaxAll - xMinAll;
        var yRange = yMaxAll - yMinAll;

        // set x and y scale to maintain 1:1 aspect ratio  
        var domainAspectRatio = yRange / xRange;
        var rangeAspectRatio = height / width;
  
        if (rangeAspectRatio > domainAspectRatio) {
            var xscale = d3.scaleLinear()
                .domain( [ xMinAll , xMaxAll ] )
                .range( [ 0 , width ] );
            var yscale = d3.scaleLinear()
                .domain( [ yMinAll , yMaxAll ] )
                .range( [ domainAspectRatio * width , 0 ] );
        } else {
            var xscale = d3.scaleLinear()
                .domain( [ xMinAll , xMaxAll ] )
                .range( [ 0 , height / domainAspectRatio ] );
            var yscale = d3.scaleLinear()
                .domain( [ yMinAll , yMaxAll ] ) 
                .range( [ height , 0 ] );
        }

        if (layout.vScale !== undefined) {
            vMinAll = layout.vScale[0];
            vMaxAll = layout.vScale[1];
        }

        // array of threshold values 
        var thresholds = d3.range( vMinAll , vMaxAll , ( vMaxAll - vMinAll ) / 21 );

        // colour scale 
        var colour = ( layout.colourMap === undefined ) ? d3.scaleSequential( d3.interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
        colour.domain(d3.extent(thresholds));

        var zoom = d3.zoom()
            .scaleExtent([0.5, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        for (var nds = 0; nds < nDataSets; ++nds) {
            x = data.surfaces[nds].x;
            y = data.surfaces[nds].y;
            v = data.surfaces[nds].v;
            m = data.surfaces[nds].size[0];
            n = data.surfaces[nds].size[1];

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
                }
            });

            // initialise contours
            var contours = d3.contours()
                .size([n, m])
                .smooth(true)
                .thresholds(thresholds);

            // make and project the contours
            plotArea.selectAll("path")
                .data(contours(v))
                .enter().append("path")
                    .attr("d", d3.geoPath(projection))
                    .attr("fill", function(d) { return colour(d.value); });        

        }

        // colour scale 
        var scaleHeight = svgHeight/2
        var colourScale = ( layout.colourMap === undefined ) ? d3.scaleSequential( d3.interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
        colourScale.domain( [0, scaleHeight]);

        var scaleBars = scaleArea.selectAll(".scaleBar")
            .data(d3.range(scaleHeight), function(d) { return d; })
            .enter().append("rect")
                .attr("class", "scaleBar")
                .attr("x", 0 )
                .attr("y", function(d, i) { return scaleHeight - i; })
                .attr("height", 1)
                .attr("width", 20)
                .style("fill", function(d, i ) { return colourScale(d); })

        var cscale = d3.scaleLinear()
            .domain( d3.extent(thresholds) )
            .range( [scaleHeight, 0]);

        var cAxis = d3.axisRight( cscale ).ticks(5);

        scaleArea.append("g")
            .attr("transform", "translate(20,0)")
            .call(cAxis);


        function zoomed() {
            var t = d3.event.transform;
            plotArea.attr( "transform", t );
        }

        data.newData = false;
    }
}

export { d3ContourStruct2d };