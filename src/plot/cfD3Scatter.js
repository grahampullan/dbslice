const cfD3Scatter = {

    make : function( element, data, layout ) {

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        var dimId = data.cfData.dataProperties.indexOf( data.xProperty );

        var svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr( "class", "plotArea" )
                .attr( "dimId", dimId);

        cfD3Scatter.update( element, data, layout );

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

        var cf = data.cfData.cf;
        var xProperty = data.xProperty;
        var yProperty = data.yProperty;
        var cProperty = data.cProperty;

        var dim = data.cfData.dataDims[ dimId ];
        var pointData = dim.top( Infinity );


        var xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( d3.extent( pointData, function (d) { return d[ xProperty ]; } ) );
        var yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( d3.extent( pointData, function (d) { return d[ yProperty ]; } ) );

        var colour = d3.scaleOrdinal( d3.schemeCategory20c );

        var plotArea = svg.select(".plotArea");

        var points = plotArea.selectAll( "circle" )
            .data( pointData );

        points.enter()
            .append( "circle" )
            .attr( "r", 5 )
            .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
            .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
            .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
            //.style( "fill-opacity", 1e-6)
            //.transition()
            //    .style( "fill-opacity", 1);

        points.transition()
            //.duration(5000)
            .attr( "r", 5 )
            .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
            .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
            .style( "fill", function( d ) { return colour( d[ cProperty ] ); } ); 

        points.exit().remove();

        var xAxis = plotArea.select(".xAxis");
        if ( xAxis.empty() ) {
            plotArea.append("g")
                .attr( "transform", "translate(0," + height + ")" )
                .attr( "class", "xAxis")
                .call( d3.axisBottom( xscale ) )
                .append("text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text(xProperty);
        } else {
            xAxis.attr( "transform", "translate(0," + height + ")" ).transition().call( d3.axisBottom( xscale ) );
        }

        var yAxis = plotArea.select(".yAxis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "yAxis")
                .call( d3.axisLeft( yscale ) )
                .append("text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0)
                    .attr("y", -margin.left + 15)
                    .attr("text-anchor", "end")
                    .text(yProperty);

        } else {
            yAxis.transition().call( d3.axisLeft( yscale ) );
        }

    }
};

export { cfD3Scatter };