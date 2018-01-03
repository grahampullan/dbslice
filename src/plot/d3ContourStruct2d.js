const d3ContourStruct2d = {

    make : function ( element, data, layout ) {

        d3ContourStruct2d.update ( element, data, layout )

    },

    update : function ( element, data, layout ) {

        if (data.newData == false) {
            return
        }

        var x, y, v, n, m;

        var marginDefault = {top: 20, right: 10, bottom: 20, left: 10};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
		    svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        container.select(".plotArea").remove();

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("class", "plotArea");

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



        // set x and y scale to maintain 1:1 aspect ratio  
        var domainAspectRatio = ( yMaxAll - yMinAll ) / ( xMaxAll - xMinAll );
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

        // color scale  
        var color = d3.scaleLinear()
            .domain(d3.extent(thresholds))
            .interpolate(function() { return d3.interpolateRdBu; });


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
            svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .selectAll("path")
                    .data(contours(v))
                    .enter().append("path")
                    .attr("d", d3.geoPath(projection))
                    .attr("fill", function(d) { return color(d.value); });

            data.newData = false;

        }
    }
}

export { d3ContourStruct2d };