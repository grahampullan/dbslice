import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { update } from '../core/update.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';

const cfD3Histogram = {

    make : function( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var dimId = data.cfData.dataProperties.indexOf( data.property );

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)

        var plotArea = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr( "class", "plotArea" )
            .attr( "dimId", dimId);

        var dim = data.cfData.dataDims[ dimId ];       
        var items = dim.top( Infinity );

        var xDomMax = d3.max( items, d => d[ data.property ] ) * 1.03; 
        plotArea.attr( "xDomMax", xDomMax);

        var xDomMin = d3.min( items, d => d[ data.property ] ) * 0.97;
        plotArea.attr( "xDomMin", xDomMin);

        var x = d3.scaleLinear()
            .domain( [ xDomMin, xDomMax ] )
            .rangeRound( [ 0, width ] );

        plotArea.append( "g" )
            .attr( "class", "xAxis")
            .attr( "transform", "translate(0," + height + ")" )
            .call( d3.axisBottom( x ) );


        var brush = d3.brushX()
            .extent( [
                [ 0, 0 ],
                [ width, height ]
            ] )
            .on( "start brush end", brushmoved );

        var gBrush = svg.append( "g" )
            .attr( "transform", "translate(" + margin.left + "," + margin.top + ")" )
            .attr( "class", "brush" )
            .call( brush );


        // style brush resize handle
        // https://github.com/crossfilter/crossfilter/blob/gh-pages/index.html#L466
        function brushResizePath( d ) {
            var e = +( d.type == "e" ),
                x = e ? 1 : -1,
                y = height / 2;
            return "M" + ( .5 * x ) + "," + y + "A6,6 0 0 " + e + " " + ( 6.5 * x ) + "," + ( y + 6 ) + "V" + ( 2 * y - 6 ) + "A6,6 0 0 " + e + " " + ( .5 * x ) + "," + ( 2 * y ) + "Z" + "M" + ( 2.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 ) + "M" + ( 4.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 );
        }

        var handle = gBrush.selectAll( "handleCustom" )
            .data( [ { type: "w" } , { type: "e" } ] )
            .enter().append( "path" )
                .attr( "class", "handleCustom" )
                .attr( "stroke", "#000" )
                .attr( "cursor", "ewResize" )
                .attr( "d", brushResizePath );


        var brushInit = true;
        gBrush.call( brush.move, x.domain().map( x ) );
        brushInit = false;


        function brushmoved() {
            var s = d3.event.selection;
            if ( s == null ) {
                handle.attr( "display", "none" );
                data.cfData.histogramSelectedRanges[ dimId ] = [];
                cfUpdateFilters(data.cfData);
                if ( brushInit == false ) update( dbsliceData.elementId , dbsliceData.session );
            } else {
                var sx = s.map( x.invert );
                handle.attr( "display", null ).attr( "transform", function( d, i ) {
                    return "translate(" + [ s[ i ], -height / 4 ] + ")";
                } );
                data.cfData.histogramSelectedRanges[ dimId ] = sx;
                cfUpdateFilters(data.cfData);
                if ( brushInit == false ) update( dbsliceData.elementId , dbsliceData.session );
            }
        }


        cfD3Histogram.update( element, data, layout );

    }, 

    update : function ( element, data, layout ) {
     
        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var plotArea = svg.select(".plotArea");
        var dimId = plotArea.attr("dimId");
        var dim = data.cfData.dataDims[ dimId ];
        var cf = data.cfData.cf;
        var property = data.property;

        var bars = plotArea.selectAll("rect");

        if ( layout.highlightTasks == true ) {

            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                bars.style( "stroke-width", "0px" );
                      
            } else {

                bars
                    .style( "stroke-width", "0px" )
                    .style( "stroke", "red" ); 
                dbsliceData.highlightTasks.forEach( function (taskId) {
                    let valueNow = dim.top(Infinity).filter(d => d.taskId==taskId)[0][data.property];
                    bars.filter( (d,i) => (d.x0 <= valueNow && d.x1 > valueNow) )
                        .style( "stroke-width", "4px" )
                });

            }

        } 

        var formatCount = d3.format( ",.0f" );

        var items = dim.top( Infinity );

        var xDomMax = plotArea.attr("xDomMax");
        var xDomMin = plotArea.attr("xDomMin");

        if ( layout.reBin == true ) {

            xDomMax = d3.max( items, d => d[ data.property ] ) * 1.03; 
            xDomMin = d3.min( items, d => d[ data.property ] ) * 0.97;
        
        }

        var x = d3.scaleLinear()
            .domain( [ xDomMin, xDomMax] )
            .rangeRound( [ 0, width ] );

        var histogram = d3.histogram()
            .value( d => d[ property ] )
            .domain( x.domain() )
            .thresholds( x.ticks( 20 ) );

        var bins = histogram( items );

        var y = d3.scaleLinear()
            .domain( [ 0, d3.max( bins, d => d.length ) ] )
            .range( [ height, 0 ] );

        bars = plotArea.selectAll( "rect" )
            .data( bins );

        var colour = ( layout.colour === undefined ) ? "cornflowerblue" : layout.colour;

        bars.enter()
            .append( "rect" )
                .attr( "transform", d => "translate(" + x( d.x0 ) + "," + y( d.length ) + ")" )
                .attr( "x", 1 )
                .attr( "width", d => x(d.x1)-x(d.x0)-1 )
                .attr( "height", d => height - y( d.length ) )
                .style( "fill", colour )
                .attr( "opacity", "1" );

        bars.transition()
            .attr( "transform", d => "translate(" + x( d.x0 ) + "," + y( d.length ) + ")" )
            .attr( "x", 1 )
            .attr( "width", d => x(d.x1)-x(d.x0)-1 )
            .attr( "height", d => height - y( d.length ) );

        bars.exit().remove();

        var yAxis = plotArea.select(".yAxis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "yAxis")
                .call( d3.axisLeft( y ) );
        } else {
            yAxis.transition().call( d3.axisLeft( y ) );
        }

        if ( layout.reBin == true ) {
            var xAxis = plotArea.select(".xAxis");
            if ( xAxis.empty() ) {
                plotArea.append("g")
                    .attr( "class", "xAxis")
                    .attr( "transform", "translate(0," + height + ")" )
                    .call( d3.axisBottom( x ) );
            } else {
                xAxis.transition().call( d3.axisBottom( x ) );
            }
        }


        var yAxisLabel = plotArea.select(".yAxis").select(".yAxisLabel");
        if ( yAxisLabel.empty() ) {
             plotArea.select(".yAxis").append("text")
                .attr("class", "yAxisLabel")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", -25)
                .attr("text-anchor", "end")
                .text("Number of tasks");
            }

        var xAxisLabel = plotArea.select(".yAxis").select(".xAxisLabel");
        if ( xAxisLabel.empty() ) {
            plotArea.select(".yAxis").append("text")
                .attr("class", "xAxisLabel")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", height+margin.bottom-2)
                .attr("text-anchor", "end")
                .text(property);
        }

         


    }

};


export { cfD3Histogram };