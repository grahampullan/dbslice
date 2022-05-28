import { dbsliceData } from '../core/dbsliceData.js';
import { update } from '../core/update.js';
import * as d3 from 'd3';
import d3tip from 'd3-tip';
import * as nd from 'nd4js';

const cfD3ResSurfScatter = {

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

        cfD3ResSurfScatter.update( element, data, layout );

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
        const inputProperties = data.inputProperties;
        var cProperty = data.cProperty;

        const cfData = dbsliceData.session.cfData;
        var dim = cfData.dataDims[ dimId ];
        var pointData = dim.top( Infinity );

        const Amat = [];
        pointData.forEach( d => {
            Amat.push( row(inputProperties.map( t => d[t]), data.model ));
        });

        const ymat = pointData.map( d => ([d[xProperty]]));

        const [u, singVals, vT] = nd.la.svd_decomp(Amat);
        const svd = {u,singVals,vT};
        const v = vT.T;
        const singValsRecip = svd.singVals.mapElems( (a_ij, i,j) => i==j ? a_ij : 1./a_ij );
        const sigmaInv = nd.la.diag_mat(singValsRecip);
        const pinv = nd.la.matmul(v, sigmaInv, u.T); // psuedo-inverse
        const beta = nd.la.matmul(pinv,ymat);


        const resSurfResult = [];
        pointData.forEach(d => {
            let x = row( inputProperties.map( t => d[t] ) , data.model );
            resSurfResult.push( nd.la.matmul( nd.array([x]), beta)(0,0) );
        });
        
        const scatterPlotData = pointData.map( (d,indx) => ( { x : d[xProperty], y : resSurfResult[indx], c : d[cProperty], taskId : d.taskId, label:d.label } ) );

        let sumErrorSq = d3.sum( scatterPlotData.map(d => ((d.y - d.x)**2) ));
        let m = d3.mean( scatterPlotData.map(d => d.x));
        let sumSq = d3.sum( scatterPlotData.map(d => ((d.x-m)**2) ));
        let r2 = 1 - sumErrorSq/sumSq;

        //console.log(pointData);

        if ( layout.xRange === undefined) {
            var xMin = d3.min( scatterPlotData, d => d.x  );
            var xMax = d3.max( scatterPlotData, d => d.x  );
            var xDiff = xMax - xMin;
            xMin -= 0.1 * xDiff;
            xMax += 0.1 * xDiff;
            var xRange = [xMin, xMax];
        } else {
            var xRange = layout.xRange;
        }

        //if ( layout.yRange === undefined) {
        //    var yMin = d3.min( scatterPlotData, d => d.y  );
        //    var yMax = d3.max( scatterPlotData, d => d.x  );
        //    var yDiff = yMax - yMin;
        //    yMin -= 0.1 * yDiff;
        //    yMax += 0.1 * yDiff;
        //    var yRange = [yMin, yMax];
        //} else {
        //    var yRange = layout.yRange;
        //}

        var xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        var xscale0 = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        var yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( xRange );

        var yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( xRange );

        var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
        colour.domain( cfData.metaDataUniqueValues[ cProperty ] );

        var opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        var plotArea = svg.select(".plotArea");

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
            .data( scatterPlotData );

        points.enter()
            .append( "circle" )
            .attr( "class", "point")
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d.x ) )
            .attr( "cy", d => yscale( d.y ) )
            .style( "fill", d => colour( d.c ) )
            .style( "opacity", opacity )
            .attr( "clip-path", "url(#"+clipId+")")
            .attr( "task-id", d => d.taskId )
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        points
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d.x ) )
            .attr( "cy", d => yscale( d.y ) )
            .style( "fill", d => colour( d.c ) )
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
                .text("Response surface output");
        } else {
            gY.transition().call( yAxis );
        }

        let exactLine = plotArea.select(".exact-line");
        if ( exactLine.empty() ) {
            plotArea.append("line")
                .attr("class","exact-line")
                .attr("x1", xscale(xRange[0]) )
                .attr("y1", yscale(xRange[0]) )
                .attr("x2", xscale(xRange[1]) )
                .attr("y2", yscale(xRange[1]) )
                .style("stroke", "steelblue")
                .style("stroke-width", 4)
                .style("opacity", 0.5);
        } else {
            exactLine.attr("x1", xscale(xRange[0]) )
            .attr("y1", yscale(xRange[0]) )
            .attr("x2", xscale(xRange[1]) )
            .attr("y2", yscale(xRange[1]) );
        }

        let r2text = plotArea.select(".r2-text");
        if ( r2text.empty() ) {
            plotArea.append("text")
                .attr("class", "r2-text")
                .attr("fill", "#000")
                .attr("x", 10)
                .attr("y", 10)
                .text("R2 = " + r2.toFixed(2) );
        } else {
            r2text.text("R2 = " + r2.toFixed(2) );
        }
        

        if ( layout.highlightTasks == true ) {
            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
                points
                    .style( "opacity" , opacity )
                    .style( "stroke-width", "0px")
                    .style( "fill", d => colour( d.c ) );
            } else {
                //points.style( "opacity" , 0.2);
                points.style( "fill" , "#d3d3d3");
                dbsliceData.highlightTasks.forEach( function (taskId) {
                    points.filter( (d,i) => d.taskId == taskId)
                        .style( "fill", d => colour( d.c ) )
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
                .attr( "cx", d => xscale( d.x ))
                .attr( "cy", d => yscale( d.y ));
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

export { cfD3ResSurfScatter };