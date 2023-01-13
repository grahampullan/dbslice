import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { update } from '../core/update.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';
import * as ss from 'simple-statistics';

const cfD3RankCorrBar = {

    make : function( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var dimId = dbsliceData.session.cfData.continuousProperties.indexOf( data.outputProperty );

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr( "class", "plotArea" )
                .attr( "dimId", dimId);

        cfD3RankCorrBar.update( element, data, layout );

    }, 

    update : function ( element, data, layout ) {
     
        var marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        svg.attr("width", svgWidth).attr("height", svgHeight);

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var plotArea = svg.select(".plotArea");
        var dimId = plotArea.attr("dimId");

        const cfData = dbsliceData.session.cfData;
        var dim = cfData.continuousDims[ dimId ];
        var pointData = dim.top( Infinity );

        var bars = plotArea.selectAll("rect");

        if ( layout.highlightTasks == true ) {

            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                bars.style( "stroke-width", "0px" );
                      
            } else {

                bars
                    .style( "stroke-width", "0px" )
                    .style( "stroke", "red" ); 
                dbsliceData.highlightTasks.forEach( function (taskId) {
                	let keyNow = dim.top(Infinity).filter(d => d.taskId==taskId)[0][data.property];
                	bars.filter( (d,i) => d.key == keyNow)
                        .style( "stroke-width", "4px" )
                });

            }

        } 

    
        const inputProperties = data.inputProperties;
        const outputProperty = pointData.map( d => d[data.outputProperty] );

        const rankCorrelation = inputProperties.map( d => ( { name : d, rankCorr : ss.sampleRankCorrelation( pointData.map ( t => t[d] ), outputProperty ) } ));
        const rankCorrelationSorted = rankCorrelation.sort( (a,b) => d3.ascending(Math.abs(a.rankCorr),Math.abs(b.rankCorr)))


        var removeZeroBar = ( layout.removeZeroBar === undefined ) ? false : layout.removeZeroBar;
        if ( removeZeroBar ) rankCorrelationSorted = rankCorrelationSorted.filter( item => item.value > 0);

        var x = d3.scaleLinear()
            .range( [0, width] )
            .domain( [ -1. , 1. ] );

        var y = d3.scaleBand()
            .range( [0, height] )
            .domain( rankCorrelationSorted.map( d => d.name ))
            .padding( [0.2] )
            .align([0.5]);

        var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal().range( ["cornflowerblue"] ) : d3.scaleOrdinal( layout.colourMap );
        colour.domain( inputProperties );

        bars = plotArea.selectAll( "rect" )
            .data( rankCorrelationSorted, d => d.name );

        bars.enter()
            .append( "rect" )
            .attr( "height", y.bandwidth() )
            .attr( "y", d => y(d.name) )
            .attr( "x", d => x(d3.min([d.rankCorr,0])))
            .attr( "width", d => (x(Math.abs(d.rankCorr)) - x(0.)) ) 
            .style( "fill", d => colour(d.name) )
            .transition()
                .attr( "width", d => (x(Math.abs(d.rankCorr)) - x(0.)) )

        bars.transition()
            .attr( "x", d => x(d3.min([d.rankCorr,0])))
            .attr( "width", d => (x(Math.abs(d.rankCorr)) - x(0.)) )
            .attr( "y", d => y(d.name)  )
            .attr( "height", y.bandwidth() );
       
        bars.exit().transition()
            .attr( "width", 0)
            .remove();

        var xAxis = plotArea.select(".xAxis");
        if ( xAxis.empty() ) {
            plotArea.append("g")
                .attr( "transform", "translate(0," + height + ")" )
                .attr( "class", "xAxis")
                .call( d3.axisBottom( x ) )
                .append("text")
                    .attr("class","x-axis-text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text("Rank correlation");
        } else {
            xAxis.attr( "transform", "translate(0," + height + ")" ).transition().call( d3.axisBottom( x ) );
            xAxis.select(".x-axis-text").attr("x", width);
        }

        var yAxis = plotArea.select(".yAxis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "yAxis")
                .attr( "transform", "translate(" + x(0.0) + ",0)" )
                .call( d3.axisLeft( y ).tickValues( [] ) );
        } else {
            yAxis.transition().call( d3.axisLeft( y ).tickValues( []) );
        }

        var keyLabels = plotArea.selectAll( ".keyLabel" )
            .data( rankCorrelation, d => d.name );

        keyLabels.enter()
            .append( "text" )
            .attr( "class", "keyLabel" )
            .attr( "x", 0 )
            .attr( "y", d => y(d.name) + 0.5*y.bandwidth() )
            .attr( "dx", 5 )
            .attr( "dy", ".35em" )
            .attr( "text-anchor", "start" )
            .text( d => d.name );

        // updating meta Labels
        keyLabels.transition()
             .attr( "y", d => y(d.name) + 0.5*y.bandwidth() )
             .text( d => d.name );

        keyLabels.exit()
            .remove();

    }
};

export { cfD3RankCorrBar };