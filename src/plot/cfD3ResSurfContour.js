import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';
import d3tip from 'd3-tip';
import { contours } from 'd3-contour';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as nd from 'nd4js';

const cfD3ResSurfContour = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        this.dimId = dbsliceData.session.cfData.continuousProperties.indexOf( this.data.xProperty );

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        this.update();

    }, 

    update : function () {

        const layout = this.layout;

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.select("svg");
        svg.attr("width", svgWidth).attr("height", svgHeight);

        const clipId = `clip-${this._prid}-${this._id}`;
        const cfData = dbsliceData.session.cfData;
        const dimId = this.dimId;
        const dim = cfData.continuousDims[ dimId ];

        const xProperty = this.data.xProperty;
        const yProperty = this.data.yProperty;
        const outputProperty = this.data.outputProperty;
        const inputProperties = [xProperty, yProperty];
        const cProperty = this.data.cProperty;
        const dataModel = this.data.model;
        const highlightTasks = layout.highlightTasks;

        const pointData = dim.top( Infinity );

        const Amat = [];
        pointData.forEach( d => {
            Amat.push( row(inputProperties.map( t => d[t]), dataModel ));
        });

        const ymat = pointData.map( d => ([d[outputProperty]]));

        const [u, singVals, vT] = nd.la.svd_decomp(Amat);
        const svd = {u,singVals,vT};
        const v = vT.T;
        const singValsRecip = svd.singVals.mapElems( (a_ij, i,j) => i==j ? a_ij : 1./a_ij );
        const sigmaInv = nd.la.diag_mat(singValsRecip);
        const pinv = nd.la.matmul(v, sigmaInv, u.T); // psuedo-inverse
        const beta = nd.la.matmul(pinv,ymat);

        let xRange, xMin, xMax;
        if ( layout.xRange === undefined) {
            xMin = d3.min( pointData, d => d[xProperty]  );
            xMax = d3.max( pointData, d => d[xProperty]  );
            let xDiff = xMax - xMin;
            xMin -= 0.1 * xDiff;
            xMax += 0.1 * xDiff;
            xRange = [xMin, xMax];
        } else {
            xRange = layout.xRange;
        }

        let yRange, yMin, yMax;
        if ( layout.yRange === undefined) {
            yMin = d3.min( pointData, d => d[yProperty]  );
            yMax = d3.max( pointData, d => d[yProperty]  );
            let yDiff = yMax - yMin;
            yMin -= 0.1 * yDiff;
            yMax += 0.1 * yDiff;
            yRange = [yMin, yMax];
        } else {
            yRange = layout.yRange;
        }

        let vRange, vMin, vMax;
        if ( layout.vRange === undefined) {
            vMin = d3.min( pointData, d => d[outputProperty]  );
            vMax = d3.max( pointData, d => d[outputProperty]  );
            let vDiff = vMax - vMin;
            vMin -= 0.1 * vDiff;
            vMax += 0.1 * vDiff;
            vRange = [vMin, vMax];
        } else {
            vRange = layout.vRange;
            vMin = vRange[0];
            vMax = vRange[1];
        }

        let cRange, cMin, cMax;
        if ( cfData.continuousProperties.includes(cProperty) ) {
            if ( layout.cRange === undefined) {
                cMin = d3.min( pointData, d => d[cProperty]  );
                cMax = d3.max( pointData, d => d[cProperty]  );
                let cDiff = cMax - cMin;
                cMin -= 0.1 * cDiff;
                cMax += 0.1 * cDiff;
                cRange = [cMin, cMax];
            } else {
                cRange = layout.cRange;
                cMin = cRange[0];
                cMax = cRange[1];
            }
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
                let x = row( [xNow, yNow] , dataModel );
                let vNow = nd.la.matmul( nd.array([x]), beta)(0,0);
                vCont.push( vNow )
                xCont.push( xNow );
                yCont.push( yNow );
                k++;
            }
        }

        const xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const xscale0 = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );
        
        let colourPoints;
        if ( cfData.categoricalProperties.includes(cProperty) ) {
            colourPoints = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
            colourPoints.domain( cfData.categoricalUniqueValues[ cProperty ] );
        }

        if ( cfData.continuousProperties.includes(cProperty) ) {
            colourPoints = ( layout.colourMap === undefined ) ? d3.scaleSequential( interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
            colourPoints.domain( [cMin, cMax ] );
        }
        this.colourPoints = colourPoints;

        const opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        const plotArea = svg.select(".plot-area");

        const thresholds = d3.range( vMin , vMax , ( vMax - vMin ) / 21 );
        const colourCont = d3.scaleSequential( interpolateSpectral );
        colourCont.domain([vMin, vMax]);

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
            .attr("fill", d => colourCont(d.value)); 
        
        contpaths
            .attr("d", d3.geoPath(projection))
            .attr("fill", d => colourCont(d.value)); 

        contpaths.exit().remove();

        //console.log(conts(vCont));

        const clip = svg.append("clipPath")
            .attr("id", clipId)
            .append("rect")
                .attr("width", width)
                .attr("height", height);

        const tip = d3tip()
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

        const points = plotArea.selectAll( ".point" )
            .data( pointData );

        points.enter()
            .append( "circle" )
            .attr( "class", "point")
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d[xProperty] ) )
            .attr( "cy", d => yscale( d[yProperty] ) )
            .style( "fill", d => colourPoints( d[cProperty] ) )
            .style( "opacity", opacity )
            .attr( "clip-path", `url(#${clipId})`)
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

        const xAxis = d3.axisBottom( xscale );
        if ( layout.xTickNumber !== undefined ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yscale );
        if ( layout.yTickNumber !== undefined ) { yAxis.ticks(layout.yTickNumber); }
        if ( layout.yTickFormat !== undefined ) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

        let gX = plotArea.select(".axis-x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", `translate(0, ${height})` )
                .attr( "class", "axis-x")
                .call( xAxis );
            gX.append("text")
                .attr("class", "x-axis-text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(xProperty);
        } else {
            gX.transition().call( xAxis );
            gX.select(".x-axis-text").attr("x", width);
        }

        let gY = plotArea.select(".axis-y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
                .attr( "class", "axis-y")
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

        function tipOn( event, d ) {
            plotArea.selectAll( ".point" ).style( "opacity" , 0.2);
            let target = d3.select(event.target);
            target
                .style( "opacity" , 1.0)
                .attr( "r", 7 );
                
            let toolTipText, xVal, yVal, cVal;
            if ( layout.toolTipXFormat === undefined ) {
                xVal = d[ xProperty ];
            } else {
                xVal = d3.format(layout.toolTipXFormat)( d[ xProperty ] )
            }
            if ( layout.toolTipYFormat === undefined ) {
                yVal = d[ yProperty ];
            } else {
                yVal = d3.format(layout.toolTipYFormat)( d[ yProperty ] )
            }
            if ( layout.toolTipCFormat === undefined ) {
                cVal = d[ cProperty ];
            } else {
                cVal = d3.format(layout.toolTipCFormat)( d[ cProperty ] )
            }
            let valsText = `${xProperty}=${xVal}, ${yProperty}=${yVal}, ${cProperty}=${cVal}`;

            if ( layout.toolTipProperties === undefined ) {
                toolTipText = `${d.label}: ${valsText}`; 
            } else {
                let props = layout.toolTipProperties.map(prop => d[prop]);
                toolTipText = props.join("; ");
                toolTipText += `: ${valsText}`;
            }
           
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html(`<span>${toolTipText}</span>`)
                .style("left", target.attr("cx")+ "px")
                .style("top", target.attr("cy") + "px");
       
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                highlightTasksAllPlots();
            }
        }

        function tipOff(event, d) {
            plotArea.selectAll( ".point" ).style( "opacity" , opacity );
            d3.select(event.target)
                .attr( "r", 5 );
            container.select(".tool-tip").style("opacity", 0.0)
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }
        }

    },

    highlightTasks : function() {

        if (!this.layout.highlightTasks) return;

        const cfData = dbsliceData.session.cfData;
        const plotArea = d3.select(`#plot-area-${this._prid}-${this._id}`);
        const opacity = ( this.layout.opacity === undefined ) ? 1.0 : this.layout.opacity;
        const cProperty = this.data.cProperty;
        const colourPoints = this.colourPoints;
        const points = plotArea.selectAll( ".point" );

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
};

export { cfD3ResSurfContour };