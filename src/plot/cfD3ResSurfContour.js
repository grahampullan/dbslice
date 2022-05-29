import { dbsliceData } from '../core/dbsliceData.js';
import { update } from '../core/update.js';
import * as d3 from 'd3';
import d3tip from 'd3-tip';
import { contours } from 'd3-contour';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as nd from 'nd4js';

const cfD3ResSurfContour = {

    make : function( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var dimId = dbsliceData.session.cfData.dataProperties.indexOf( data.xProperty );

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr( "class", "plotArea" )
                .attr( "dimId", dimId);

        cfD3ResSurfContour.update( element, data, layout );

    }, 

    update : function ( element, data, layout ) {

        //console.log(data);

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        let plotRowIndex = container.attr("plot-row-index");
        let plotIndex = container.attr("plot-index");
        let clipId = "clip-"+plotRowIndex+"-"+plotIndex;

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var plotArea = svg.select(".plotArea");
        var dimId = plotArea.attr("dimId");

        //var cf = data.cfData.cf;
        const xProperty = data.xProperty;
        const yProperty = data.yProperty;
        const outputProperty = data.outputProperty;
        const inputProperties = [xProperty, yProperty];
        const cProperty = data.cProperty;

        const cfData = dbsliceData.session.cfData;
        var dim = cfData.dataDims[ dimId ];
        var pointData = dim.top( Infinity );

        const Amat = [];
        pointData.forEach( d => {
            Amat.push( row(inputProperties.map( t => d[t]), data.model ));
        });

        const ymat = pointData.map( d => ([d[outputProperty]]));

        const [u, singVals, vT] = nd.la.svd_decomp(Amat);
        const svd = {u,singVals,vT};
        const v = vT.T;
        const singValsRecip = svd.singVals.mapElems( (a_ij, i,j) => i==j ? a_ij : 1./a_ij );
        const sigmaInv = nd.la.diag_mat(singValsRecip);
        const pinv = nd.la.matmul(v, sigmaInv, u.T); // psuedo-inverse
        const beta = nd.la.matmul(pinv,ymat);


        if ( layout.xRange === undefined) {
            var xMin = d3.min( pointData, d => d[xProperty]  );
            var xMax = d3.max( pointData, d => d[xProperty]  );
            var xDiff = xMax - xMin;
            xMin -= 0.1 * xDiff;
            xMax += 0.1 * xDiff;
            var xRange = [xMin, xMax];
        } else {
            var xRange = layout.xRange;
        }

        if ( layout.yRange === undefined) {
            var yMin = d3.min( pointData, d => d[yProperty]  );
            var yMax = d3.max( pointData, d => d[yProperty]  );
            var yDiff = yMax - yMin;
            yMin -= 0.1 * yDiff;
            yMax += 0.1 * yDiff;
            var yRange = [yMin, yMax];
        } else {
            var yRange = layout.yRange;
        }

        if ( layout.vRange === undefined) {
            var vMin = d3.min( pointData, d => d[outputProperty]  );
            var vMax = d3.max( pointData, d => d[outputProperty]  );
            var vDiff = vMax - vMin;
            vMin -= 0.1 * vDiff;
            vMax += 0.1 * vDiff;
            var vRange = [vMin, vMax];
        } else {
            var vRange = layout.vRange;
            var vMin = vRange[0];
            var vMax = vRange[1];
        }


        const n = 21;
        const m = 21;
        const xCont = [];
        const yCont = [];
        const vCont = [];

        let k = 0;
        for ( let i=0; i<m; i++ ) {
            let xNow = xMin + i/m * (xMax - xMin);
            for ( let j=0; j<n; j++ ) {
                let yNow = yMin + j/n * (yMax - yMin);
                let x = row( [xNow, yNow] , data.model );
                let vNow = nd.la.matmul( nd.array([x]), beta)(0,0);
                vCont.push( vNow )
                xCont.push( xNow );
                yCont.push( yNow );
                k++;
                //console.log(xNow,yNow,vNow);
            }
        }

        var xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        var xscale0 = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        var yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        var yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );
        

        var colourPoints = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
        colourPoints.domain( cfData.metaDataUniqueValues[ cProperty ] );

        var opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        var plotArea = svg.select(".plotArea");

        var thresholds = d3.range( vMin , vMax , ( vMax - vMin ) / 21 );
        var colourCont = d3.scaleSequential( interpolateSpectral );
        colourCont.domain(d3.extent(thresholds));

        // configure a projection to map the contour coordinates returned by
		// d3.contours (px,py) to the input data (xgrid,ygrid)
        const projection = d3.geoTransform( {
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
                xnow = (1-xfrac)*(1-yfrac)*xCont[idx0] + xfrac*(1-yfrac)*xCont[idx1] + yfrac*(1-xfrac)*xCont[idx2] + xfrac*yfrac*xCont[idx3];
                ynow = (1-xfrac)*(1-yfrac)*yCont[idx0] + xfrac*(1-yfrac)*yCont[idx1] + yfrac*(1-xfrac)*yCont[idx2] + xfrac*yfrac*yCont[idx3];
                //console.log(xnow,ynow,xscale(xnow),yscale(ynow));
                this.stream.point(xscale(xnow), yscale(ynow));
            }
        });

        // initialise contours
        const conts = contours()
            .size([n, m])
            .smooth(true)
            .thresholds(thresholds);

        // make and project the contours
        const contpaths = plotArea.selectAll(".cont-path")
            .data(conts(vCont))

        contpaths.enter()
            .append("path")
            .attr("class","cont-path")
            .attr("d", d3.geoPath(projection))
            .attr("fill", function(d) { return colourCont(d.value); }); 
        
        contpaths
            .attr("d", d3.geoPath(projection))
            .attr("fill", function(d) { return colourCont(d.value); }); 

        contpaths.exit().remove();

        //console.log(conts(vCont));

        var clip = svg.append("clipPath")
            .attr("id", clipId)
            .append("rect")
                .attr("width", width)
                .attr("height", height);

        // var zoom = d3.zoom()
        //    .scaleExtent([0.01, Infinity])
        //    .on("zoom", zoomed);
        //svg.transition().call(zoom.transform, d3.zoomIdentity);
        //svg.call(zoom);

        var tip = d3tip()
            .attr('class', 'd3-tip')
            .offset([-20, 0])
            .html(function( d ) {
                return "<span>"+d.label+"</span>";
        });

        svg.call(tip);

        //plotArea.append("g")
        //    .style("display","none")
        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }

        var points = plotArea.selectAll( ".point" )
            .data( pointData );

        points.enter()
            .append( "circle" )
            .attr( "class", "point")
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d[xProperty] ) )
            .attr( "cy", d => yscale( d[yProperty] ) )
            .style( "fill", d => colourPoints( d[cProperty] ) )
            .style( "opacity", opacity )
            .attr( "clip-path", "url(#"+clipId+")")
            .attr( "task-id", d => d.taskId )
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        points
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d[xProperty] ) )
            .attr( "cy", d => yscale( d[yProperty] ) )
            .style( "fill", d => colourPoints( d[cProperty] ) )
            .attr( "task-id", d => d.taskId );

        points.exit().remove();

        var xAxis = d3.axisBottom( xscale );
        var yAxis = d3.axisLeft( yscale );

        var gX = plotArea.select(".axis--x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", "translate(0," + height + ")" )
                .attr( "class", "axis--x")
                .call( xAxis );
            gX.append("text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(xProperty);
        } else {
            gX.transition().call( xAxis );
        }

        var gY = plotArea.select(".axis--y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
                .attr( "class", "axis--y")
                .call( yAxis );
            gY.append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", -margin.left + 15)
                .attr("text-anchor", "end")
                .text(yProperty);
        } else {
            gY.transition().call( yAxis );
        }

        

        if ( layout.highlightTasks == true ) {
            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
                points
                    .style( "opacity" , opacity )
                    .style( "stroke-width", "0px")
                    .style( "fill", d => colourPoints( d[cProperty] ) );
            } else {
                //points.style( "opacity" , 0.2);
                points.style( "fill" , "#d3d3d3");
                dbsliceData.highlightTasks.forEach( function (taskId) {
                    points.filter( (d,i) => d.taskId == taskId)
                        .style( "fill", d => colourPoints( d[cProperty] ) )
                        .style( "opacity" , opacity)
                        .style( "stroke", "red")
                        .style( "stroke-width", "2px")
                        .raise();
                });
            }
        }

        function row(x, model) {
            const row = [1.];
            if ( model == "linear" ) {
                x.forEach( d => {
                    row.push(d);
                });
            }
            if ( model == "quadDiag" ) {
                x.forEach( d => {
                    row.push(d);
                    row.push(d**2);
                });
            }
            return row;
        }

        function zoomed() {
            var t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".point")
                .attr( "cx", d => xscale( d[xProperty] ))
                .attr( "cy", d => yscale( d[yProperty] ));
        }

        function tipOn( d ) {
            //console.log("mouse on")
            points.style( "opacity" , 0.2);
            //points.style( "fill" , "#d3d3d3");
            d3.select(this)
                .style( "opacity" , 1.0)
                .attr( "r", 7 );
            let focus = plotArea.select(".focus");
            focus.attr( "cx" , d3.select(this).attr("cx") )
                 .attr( "cy" , d3.select(this).attr("cy") );
            tip.show( d , focus.node() );
            //tip.show( d );s
            if ( layout.highlightTasks == true ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                update( dbsliceData.elementId, dbsliceData.session );
            }
        }

        function tipOff() {
            points.style( "opacity" , opacity );
            d3.select(this)
                .attr( "r", 5 );
            tip.hide();
            if ( layout.highlightTasks == true ) {
                dbsliceData.highlightTasks = [];
                update( dbsliceData.elementId, dbsliceData.session );
            }
        }
    }
};

export { cfD3ResSurfContour };