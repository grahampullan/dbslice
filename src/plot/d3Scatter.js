const d3Scatter = {

    make : function ( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = svgWidth;

        console.log(svgWidth);

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr( "class", "plotArea" );

        d3Scatter.update (element, data, layout);

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

        var xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( d3.extent( data.data, function (d) { return d.x; } ) );
        var yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( d3.extent( data.data, function (d) { return d.y; } ) );

        var colour = d3.scaleOrdinal( d3.schemeCategory20c );

        var plotArea = svg.select(".plotArea");

        var points = plotArea.selectAll( "circle" )
            .data( data.data );

        points.enter()
            .append( "circle" )
            .attr( "r", 5 )
            .attr( "cx", function( d ) { return xscale( d.x ); } )
            .attr( "cy", function( d ) { return yscale( d.y ); } )
            .style( "fill", function( d ) { return colour( d.colField ); } )
            //.style( "fill-opacity", 1e-6)
            //.transition()
            //    .style( "fill-opacity", 1);

        points.transition()
            //.duration(5000)
            .attr( "r", 5 )
            .attr( "cx", function( d ) { return xscale( d.x ); } )
            .attr( "cy", function( d ) { return yscale( d.y ); } )
            .style( "fill", function( d ) { return colour( d.colField ); } ); 

        points.exit().remove();

        var xAxis = plotArea.select(".xAxis");
        if ( xAxis.empty() ) {
            plotArea.append("g")
                .attr( "transform", "translate(0," + height + ")" )
                .attr( "class", "xAxis")
                .call( d3.axisBottom( xscale ) );
        } else {
            xAxis.attr( "transform", "translate(0," + height + ")" ).transition().call( d3.axisBottom( xscale ) );
        }

        var yAxis = plotArea.select(".yAxis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "yAxis")
                .call( d3.axisLeft( yscale ) );
        } else {
            yAxis.transition().call( d3.axisLeft( yscale ) );
        }

    }

};


export { d3Scatter };