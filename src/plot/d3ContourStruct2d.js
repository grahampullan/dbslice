import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3';
import { contours } from 'd3-contour';
import { interpolateSpectral } from 'd3-scale-chromatic';


const d3ContourStruct2d = {

    make : function () {

        this.update();

    },

    update : function () {

        const container = d3.select(`#${this.elementId}`);

        if (this.layout.newData == false && dbsliceData.windowResize == false ) {
            return
        }

        let x, y, v, n, m;

        const marginDefault = {top: 20, right: 65, bottom: 20, left: 10};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;
        const highlightTasks = this.layout.highlightTasks;
        const taskId = this.taskId;

        const svgWidth = container.node().offsetWidth,
		    svgHeight = this.layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        container.select("svg").remove();

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );

        const plotArea = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .append("g")
                .attr("class", "plot-area");

        const scaleMargin = { "left" : svgWidth - 60, "top" : margin.top};

        const scaleArea = svg.append("g")
            .attr("class", "scale-area")
            .attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")")

        let xMinAll = d3.min( this.data.surfaces[0].x );
        let yMinAll = d3.min( this.data.surfaces[0].y );
        let vMinAll = d3.min( this.data.surfaces[0].v );

        let xMaxAll = d3.max( this.data.surfaces[0].x );
        let yMaxAll = d3.max( this.data.surfaces[0].y );
        let vMaxAll = d3.max( this.data.surfaces[0].v );

        const nDataSets = this.data.surfaces.length;

        for (let nds = 1; nds < nDataSets; ++nds ) {
            xMinAll = ( d3.min( this.data.surfaces[nds].x ) < xMinAll ) ? d3.min( this.data.surfaces[nds].x ) : xMinAll;
            yMinAll = ( d3.min( this.data.surfaces[nds].y ) < yMinAll ) ? d3.min( this.data.surfaces[nds].y ) : yMinAll;
            vMinAll = ( d3.min( this.data.surfaces[nds].v ) < vMinAll ) ? d3.min( this.data.surfaces[nds].v ) : vMinAll;
            xMaxAll = ( d3.max( this.data.surfaces[nds].x ) > xMaxAll ) ? d3.max( this.data.surfaces[nds].x ) : xMaxAll;
            yMaxAll = ( d3.max( this.data.surfaces[nds].y ) > yMaxAll ) ? d3.max( this.data.surfaces[nds].y ) : yMaxAll;
            vMaxAll = ( d3.max( this.data.surfaces[nds].v ) > vMaxAll ) ? d3.max( this.data.surfaces[nds].v ) : vMaxAll;
        }

        let xRange = xMaxAll - xMinAll;
        let yRange = yMaxAll - yMinAll;

        // set x and y scale to maintain 1:1 aspect ratio  
        let domainAspectRatio = yRange / xRange;
        let rangeAspectRatio = height / width;
  
        let xscale,yscale;
        if (rangeAspectRatio > domainAspectRatio) {
            xscale = d3.scaleLinear()
                .domain( [ xMinAll , xMaxAll ] )
                .range( [ 0 , width ] );
            yscale = d3.scaleLinear()
                .domain( [ yMinAll , yMaxAll ] )
                .range( [ domainAspectRatio * width , 0 ] );
        } else {
            xscale = d3.scaleLinear()
                .domain( [ xMinAll , xMaxAll ] )
                .range( [ 0 , height / domainAspectRatio ] );
            yscale = d3.scaleLinear()
                .domain( [ yMinAll , yMaxAll ] ) 
                .range( [ height , 0 ] );
        }

        if (this.layout.vScale !== undefined) {
            vMinAll = this.layout.vScale[0];
            vMaxAll = this.layout.vScale[1];
        }

        // array of threshold values 
        const thresholds = d3.range( vMinAll , vMaxAll , ( vMaxAll - vMinAll ) / 21 );

        // colour scale 
        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleSequential( interpolateSpectral ) : d3.scaleSequential( this.layout.colourMap );
        colour.domain(d3.extent(thresholds));

        var zoom = d3.zoom()
            .scaleExtent([0.5, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        for (let nds = 0; nds < nDataSets; ++nds) {
            x = this.data.surfaces[nds].x;
            y = this.data.surfaces[nds].y;
            v = this.data.surfaces[nds].v;
            m = this.data.surfaces[nds].size[0];
            n = this.data.surfaces[nds].size[1];

    	    // configure a projection to map the contour coordinates returned by
		    // d3.contours (px,py) to the input data (xgrid,ygrid)
            const projection = d3.geoTransform( {
                point: function( px, py ) {
                    let xfrac, yfrac, xnow, ynow;
                    let xidx, yidx, idx0, idx1, idx2, idx3;
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
            const conts = contours()
                .size([n, m])
                .smooth(true)
                .thresholds(thresholds);

            // make and project the contours
            plotArea.selectAll("path")
                .data(conts(v))
                .enter().append("path")
                    .attr("d", d3.geoPath(projection))
                    .attr("fill", d => colour(d.value));        

        }

        // colour scale 
        let scaleHeight = svgHeight/2
        const colourScale = ( this.layout.colourMap === undefined ) ? d3.scaleSequential( interpolateSpectral ) : d3.scaleSequential( this.layout.colourMap );
        colourScale.domain( [0, scaleHeight]);

        const scaleBars = scaleArea.selectAll(".scale-bar")
            .data(d3.range(scaleHeight), function(d) { return d; })
            .enter().append("rect")
                .attr("class", "scale-bar")
                .attr("x", 0 )
                .attr("y", function(d, i) { return scaleHeight - i; })
                .attr("height", 1)
                .attr("width", 20)
                .style("fill", function(d, i ) { return colourScale(d); })

        const cscale = d3.scaleLinear()
            .domain( d3.extent(thresholds) )
            .range( [scaleHeight, 0]);

        const cAxis = d3.axisRight( cscale ).ticks(5);

        scaleArea.append("g")
            .attr("transform", "translate(20,0)")
            .call(cAxis);

        function zoomed() {
            let t = d3.event.transform;
            plotArea.attr( "transform", t );
        }

        function tipOn() {
            if ( highlightTasks ) {
                container
                    .style("outline-style","solid")
                    .style("outline-color","red")
                    .style("outline-width","4px")
                    .style("outline-offset","-4px")
                    .raise();
                dbsliceData.highlightTasks = [taskId];
                highlightTasksAllPlots();
            }
        }

        function tipOff() {
            if ( highlightTasks ) {
                container.style("outline-width","0px")
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }
        }

        this.layout.newData = false;
    },

    highlightTasks : function() {

        if (!this.layout.highlightTasks) return;

        const container = d3.select(`#${this.elementId}`);
        const thisTaskId = this.taskId;

        if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
            container.style("outline-width","0px")
        } else {
            container.style("outline-width","0px")

            dbsliceData.highlightTasks.forEach( function (taskId) {

                    if ( taskId == thisTaskId ) {
                    
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


}

export { d3ContourStruct2d };