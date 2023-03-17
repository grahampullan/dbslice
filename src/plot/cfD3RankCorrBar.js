import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { update } from '../core/update.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';
import * as ss from 'simple-statistics';

const cfD3RankCorrBar = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        this.dimId = dbsliceData.session.cfData.continuousProperties.indexOf( this.data.outputProperty );

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);

        this.update();

    }, 

    update : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const plotArea = svg.select(".plot-area");

        const cfData = dbsliceData.session.cfData;
        const dimId = this.dimId;
        const dim = cfData.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );
        const inputProperties = this.data.inputProperties;
        const outputPropertyName = this.data.outputProperty;
        const outputProperty = pointData.map( d => d[outputPropertyName] );

        const rankCorrelation = inputProperties.map( d => ( { name : d, rankCorr : ss.sampleRankCorrelation( pointData.map ( t => t[d] ), outputProperty ) } ));
        const rankCorrelationSorted = rankCorrelation.sort( (a,b) => d3.ascending(Math.abs(a.rankCorr),Math.abs(b.rankCorr)))


        let removeZeroBar = ( this.layout.removeZeroBar === undefined ) ? false : this.layout.removeZeroBar;
        if ( removeZeroBar ) rankCorrelationSorted = rankCorrelationSorted.filter( item => item.value > 0);

        const x = d3.scaleLinear()
            .range( [0, width] )
            .domain( [ -1. , 1. ] );

        const y = d3.scaleBand()
            .range( [0, height] )
            .domain( rankCorrelationSorted.map( d => d.name ))
            .padding( [0.2] )
            .align([0.5]);

        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal().range( ["cornflowerblue"] ) : d3.scaleOrdinal( this.layout.colourMap );
        colour.domain( inputProperties );

        const bars = plotArea.selectAll("rect")
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

        let xAxis = plotArea.select(".x-axis");
        if ( xAxis.empty() ) {
            plotArea.append("g")
                .attr( "transform", `translate(0,${height})` )
                .attr( "class", "x-axis")
                .call( d3.axisBottom( x ) )
                .append("text")
                    .attr("class","x-axis-text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text("Rank correlation");
        } else {
            xAxis.attr( "transform", `translate(0,${height})` ).transition().call( d3.axisBottom( x ) );
            xAxis.select(".x-axis-text").attr("x", width);
        }

        let yAxis = plotArea.select(".y-axis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "y-axis")
                .attr( "transform", `translate(${x(0.0)},0)` )
                .call( d3.axisLeft( y ).tickValues( [] ) );
        } else {
            yAxis.transition().call( d3.axisLeft( y ).tickValues( []) );
        }

        const keyLabels = plotArea.selectAll( ".keyLabel" )
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

        keyLabels.transition()
             .attr( "y", d => y(d.name) + 0.5*y.bandwidth() )
             .text( d => d.name );

        keyLabels.exit()
            .remove();

    },

    highlightTasks : function() {

    }
};

export { cfD3RankCorrBar };