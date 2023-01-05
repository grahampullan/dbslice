import { dbsliceData } from '../core/dbsliceData.js';
import { update } from '../core/update.js';
import * as d3 from 'd3v7';

const cfD3GroupedVertBarChart = {

    make : function( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        console.log()
        var dimId = dbsliceData.session.cfData.metaDataProperties.indexOf( data.xProperty );

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

        cfD3GroupedVertBarChart.update( element, data, layout );

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

        var xProperty = data.xProperty;
        var yProperty = data.yProperty;
        var zProperty = data.zProperty;

        const cfData = dbsliceData.session.cfData;
        var dim = cfData.metaDims[ dimId ];

        let barDataAll = dim.top( Infinity );

        let barData;
        if ( layout.filterBy !== undefined ) {
            barData = barDataAll.filter(d => d[Object.keys(layout.filterBy)[0]] == Object.values(layout.filterBy)[0] );
        } else {
            barData = barDataAll;
        }

        barData = d3.groups(barData, d => d[xProperty]).sort( (a,b) => d3.ascending(a[0],b[0]) );

        let xDomain = barData.map( d => d[0]);
      
        barData = barData.map(d => d[1].sort( (a,b) => d3.ascending(a[zProperty],b[zProperty])));

        let barDataFlat = barData.flat();

        let zDomain = d3.union( ...barData.map( d => d.map( v => v[zProperty])));
        zDomain = Array.from(zDomain).sort( (a,b) => d3.ascending(a,b) );

        if ( layout.yRange === undefined) {
            var yMin = d3.min( barDataFlat, d => d[ yProperty ] );
            var yMax = d3.max( barDataFlat, d => d[ yProperty ] );
            var yDiff = yMax - yMin;
            yMin -= 0.1 * yDiff;
            yMax += 0.1 * yDiff;
            var yRange = [yMin, yMax];
        } else {
            var yRange = layout.yRange;
        }

        const xScale = d3.scaleBand()
            .range( [0, width] )
            .domain( xDomain )
            .paddingInner( 0.05 );

        const xzScale = d3.scaleBand()
            .range( [0, xScale.bandwidth()])
            .domain( zDomain )
            .padding( 0.05 );

        const yScale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const colour = d3.scaleOrdinal( d3.schemeTableau10 )
            .domain( zDomain );

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

        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }

        const bars = plotArea.selectAll( ".bar" )
            .data( barDataFlat );

        bars.enter()
            .append( "rect" )
            .attr( "class", "bar")
            .attr( "x", d => xScale( d[xProperty] ) + xzScale( d[zProperty] ))
            .attr( "y", d => {
                let yNow = d[yProperty];
                if ( yNow >= 0. ) {
                    return yScale( yNow );
                } else {
                    return yScale(0.);
                }})
            .attr( "width", xzScale.bandwidth())
            .attr( "height", d => {
                let yNow = d[yProperty];
                if ( yNow >= 0. ) {
                    return yScale( 0. ) - yScale( yNow );
                } else {
                    return yScale( yNow ) - yScale(0);
                }})
            .attr( "fill", d => colour( d[zProperty]))
            .style( "opacity", opacity )
            .attr( "clip-path", "url(#"+clipId+")")
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        bars
            .attr( "x", d => xScale( d[xProperty] ) + xzScale( d[zProperty] ))
            .attr( "y", d => {
                let yNow = d[yProperty];
                if ( yNow >= 0. ) {
                    return yScale( yNow );
                } else {
                    return yScale(0.);
                }})
            .attr( "width", xzScale.bandwidth())
            .attr( "height", d => {
                let yNow = d[yProperty];
                if ( yNow >= 0. ) {
                    return yScale( 0. ) - yScale( yNow );
                } else {
                    return yScale( yNow ) - yScale(0);
                }})
            .attr( "fill", d => colour( d[zProperty]));

        bars.exit().remove();

        const xAxis = d3.axisBottom( xScale );
        const yAxis = d3.axisLeft( yScale );

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
        
        function tipOn( event, d ) {
            plotArea.selectAll( ".bar" ).style( "opacity" , 0.2);
            let target = d3.select(event.target);
            target.style( "opacity" , 1.0);
            let label = zProperty + "=" + d[zProperty] + "; " + d[xProperty] + "=" + d[yProperty];
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html("<span>"+label+"</span>")
                .style("left", target.attr("x")+ "px")
                .style("top", target.attr("y") + "px");
        }

        function tipOff(event, d) {
            plotArea.selectAll( ".bar" ).style( "opacity" , opacity );
            container.select(".tool-tip").style("opacity", 0.0)
        }

    }
};

export { cfD3GroupedVertBarChart };