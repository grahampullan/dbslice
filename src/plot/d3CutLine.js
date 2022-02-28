import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import * as d3 from 'd3';
import { tip } from 'd3-tip';

const d3CutLine = {

    make : function ( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr( "class", "plotArea" );

        d3CutLine.update( element, data, layout );

    },

    update : function ( element, data, layout ) {

        var container = d3.select(element);
        var svg = container.select("svg");
        var plotArea = svg.select(".plotArea");

        //if (data.newData == false) {
        //    return
        //}

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        let plotRowIndex = container.attr("plot-row-index");
        let plotIndex = container.attr("plot-index");
        let clipId = "clip-"+plotRowIndex+"-"+plotIndex; 

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        const cutLine=dbsliceData.xCut;

        const xData = cutLine.map(d => d[0][0]);
        const yData = cutLine.map(d => d[0][1]);

        if ( layout.xRange === undefined ) {
            var xRange = d3.extent(xData);
        } else {
            var xRange = layout.xRange;
        }

        if ( layout.yRange === undefined ) {
            var yRange = d3.extent(yData);
        } else {
            var yRange = layout.yRange;
        }

        if ( layout.xscale == "time" ) {
            var xscale = d3.scaleTime(); 
            var xscale0 = d3.scaleTime();        
        } else {
            var xscale = d3.scaleLinear();
            var xscale0 = d3.scaleLinear();
        }

        xscale.range( [0, width] )
              .domain( xRange );

        xscale0.range( [0, width] )
              .domain( xRange );

        var yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        var yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        //var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
        //if ( layout.cSet !== undefined) colour.domain( layout.cSet );

        var line = d3.line()
            .x( function( d ) { return xscale( d.x ); } )
            .y( function( d ) { return yscale( d.y ); } );

        function segLine(lineSegs) {
            let path="";
            lineSegs.forEach(d => {
                let seg=[{x:d[0][0], y:d[0][1]},{x:d[1][0],y:d[1][1]}];
                path += line(seg);
            });
            return path;
        }

        var clip = svg.append("defs").append("clipPath")
            .attr("id", clipId)
            .append("rect")
                .attr("width", width)
                .attr("height", height);

        var zoom = d3.zoom()
           .scaleExtent([0.5, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        var tip = tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function( d ) {
                return "<span>"+d.label+"</span>";
        });

        svg.call(tip);

        var focus = plotArea.append("g")
            .style("display","none")
            .append("circle")
                .attr("r",1);

        let linePath = plotArea.select(".line");
        if (linePath.empty()) {
            plotArea.append("path")
                .attr("class","line")
                .datum(cutLine)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("d", segLine);
        } else {
            linePath.datum(cutLine).attr("d",segLine);
        }


        var xAxis = d3.axisBottom( xscale ).ticks(5);
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
                .text(layout.xAxisLabel);
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
                    .text(layout.yAxisLabel);
        } else {
            gY.transition().call( yAxis );
        }



        function zoomed() {
            var t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            //plotArea.selectAll(".line").attr( "d", function( d ) { return line( d.data ); } );
            plotArea.select(".line").datum(cutLine).attr("d",segLine);
        }


        data.newData = false;
    }
};

export { d3CutLine };