import { dbsliceData } from '../core/dbsliceData.js';
import { update } from '../core/update.js';
import * as d3 from 'd3v7';

const cfD3Scatter = {

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

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        cfD3Scatter.update( element, data, layout );

    }, 

    update : function ( element, data, layout ) {

        if (layout._noUpdate) {
            layout._noUpdate = false;
            return;
        }

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
        svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        let plotRowIndex = container.attr("plot-row-index");
        let plotIndex = container.attr("plot-index");
        let clipId = "clip-"+plotRowIndex+"-"+plotIndex;

        var plotArea = svg.select(".plotArea");
        var dimId = plotArea.attr("dimId");

        //var cf = data.cfData.cf;
        var xProperty = data.xProperty;
        var yProperty = data.yProperty;
        var cProperty = data.cProperty;

        const cfData = dbsliceData.session.cfData;
        var dim = cfData.dataDims[ dimId ];
        var pointData = dim.top( Infinity );

        //console.log(pointData);

        if ( layout.xRange === undefined) {
            var xMin = d3.min( pointData, function (d) { return d[ xProperty ]; } );
            var xMax = d3.max( pointData, function (d) { return d[ xProperty ]; } );
            var xDiff = xMax - xMin;
            xMin -= 0.1 * xDiff;
            xMax += 0.1 * xDiff;
            var xRange = [xMin, xMax];
        } else {
            var xRange = layout.xRange;
        }

        if ( layout.yRange === undefined) {
            var yMin = d3.min( pointData, function (d) { return d[ yProperty ]; } );
            var yMax = d3.max( pointData, function (d) { return d[ yProperty ]; } );
            var yDiff = yMax - yMin;
            yMin -= 0.1 * yDiff;
            yMax += 0.1 * yDiff;
            var yRange = [yMin, yMax];
        } else {
            var yRange = layout.yRange;
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

        var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
        colour.domain( cfData.metaDataUniqueValues[ cProperty ] );

        var opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        var plotArea = svg.select(".plotArea");

        let clipRect = svg.select(".clip-rect");

        if ( clipRect.empty() ) {
            svg.append("defs").append("clipPath")
            .attr("id", clipId)
            .append("rect")
                .attr("class","clip-rect")
                .attr("width", width)
                .attr("height", height);
        } else {
            clipRect.attr("width", width)
        }

        var zoom = d3.zoom()
            .scaleExtent([0.01, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);
        //svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

       // const tip = d3tip()
       //     .attr('class', 'd3-tip')
       //     .offset([-20, 0])
       //     .html( function(event,d){ return "<span>"+d.label+"</span>"});
   
       // svg.call(tip);

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
            .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
            .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
            .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
            .style( "opacity", opacity )
            .attr( "clip-path", "url(#"+clipId+")")
            .attr( "task-id", function( d ) { return d.taskId; } )
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        points
            .attr( "r", 5 )
            .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
            .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
            .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
            .attr( "task-id", function( d ) { return d.taskId; } );

        points.exit().remove();

        const line = d3.line()
            .x( d => xscale( d[xProperty] ))
            .y( d => yscale( d[yProperty] ));

        if ( layout.groupBy !== undefined ) {
            const keys = layout.groupBy.map( v => (d => d[v]) );
            const group = d3.group(pointData, ...keys);
            const joiningLines = getLines(group);
            let sortedJoiningLines;
            if ( layout.orderBy !== undefined ) {
                sortedJoiningLines = joiningLines.map( d => d3.sort(d, d=>d[layout.orderBy]));
            } else {
                sortedJoiningLines = joiningLines.map( d => d3.sort(d, d=>d[xProperty]));
            }
            plotArea.selectAll(".joining-line").remove();
            const lines = plotArea.selectAll(".joining-lines").data(sortedJoiningLines);

            lines.enter()
                .append( "path" )
                .attr( "class", "joining-line" )
                    .attr( "d", d => line(d))
                    .style( "stroke", "#848484" )    
                    .style( "fill", "none" )
                    .style( "stroke-width", "2.5px" )
                    .attr( "clip-path", "url(#"+clipId+")")
                    .lower();
        }

        var xAxis = d3.axisBottom( xscale );
        var yAxis = d3.axisLeft( yscale );

        var gX = plotArea.select(".axis--x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", "translate(0," + height + ")" )
                .attr( "class", "axis--x")
                .call( xAxis );
            gX.append("text")
                .attr("class","x-axis-text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(xProperty);
        } else {
            gX.transition().call( xAxis );
            gX.select(".x-axis-text").attr("x",width);
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
                    .style( "fill", function( d ) { return colour( d[ cProperty ] ); } );
            } else {
                points.style( "opacity" , 0.2);
                points.style( "fill" , "#d3d3d3");
                dbsliceData.highlightTasks.forEach( function (taskId) {
                    points.filter( (d,i) => d.taskId == taskId)
                        .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
                        .style( "opacity" , opacity)
                        .style( "stroke", "red")
                        .style( "stroke-width", "2px")
                        .raise();
                });
            }
        }


        function zoomed(event) {
            var t = event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".point")
                .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
                .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } );
            plotArea.selectAll(".joining-line").attr( "d", d => line(d) );
        }

        function tipOn( event, d ) {
            plotArea.selectAll( ".point" ).style( "opacity" , 0.2);
            let target = d3.select(event.target);
            target
                .style( "opacity" , 1.0)
                .attr( "r", 7 );
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html("<span>"+d.label+"</span>")
                .style("left", target.attr("cx")+ "px")
                .style("top", target.attr("cy") + "px");
       
            if ( layout.highlightTasks == true ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                layout._noUpdate = true;
                update( dbsliceData.elementId, dbsliceData.session );
            }
        }

        function tipOff(event, d) {
            plotArea.selectAll( ".point" ).style( "opacity" , opacity );
            d3.select(event.target)
                .attr( "r", 5 );
            //tip.hide();
            container.select(".tool-tip").style("opacity", 0.0)
            if ( layout.highlightTasks == true ) {
                dbsliceData.highlightTasks = [];
                update( dbsliceData.elementId, dbsliceData.session );
            }
        }
        
        function getLines(map) {
            let lines=[];
            map.forEach( d => {
              if (d instanceof Map) {
                lines=[...lines,...getLines(d)];
              } else {
                if (d.length>1) {
                  lines.push(d);
                }
              }
            });
            return lines;          
        }
    }
};

export { cfD3Scatter };