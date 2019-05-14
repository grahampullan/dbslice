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
        colour.domain( data.cfData.metaDataUniqueValues[ cProperty ] );

        var opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        var plotArea = svg.select(".plotArea");

        var clip = svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
                .attr("width", width)
                .attr("height", height);

        var zoom = d3.zoom()
            .scaleExtent([0.01, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function( d ) {
                return "<span>"+d.label+"</span>";
        });

        svg.call(tip);

        var points = plotArea.selectAll( "circle" )
            .data( pointData );

        points.enter()
            .append( "circle" )
            .attr( "r", 5 )
            .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
            .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
            .style( "fill", function( d ) { return colour( d[ cProperty ] ); } )
            .style( "opacity", opacity )
            .attr( "clip-path", "url(#clip)")
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        points.transition()
            .attr( "r", 5 )
            .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
            .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } )
            .style( "fill", function( d ) { return colour( d[ cProperty ] ); } ); 

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
                .text(yProperty);
        } else {
            gY.transition().call( yAxis );
        }

        function zoomed() {
            var t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll("circle")
                .attr( "cx", function( d ) { return xscale( d[ xProperty ] ); } )
                .attr( "cy", function( d ) { return yscale( d[ yProperty ] ); } );
        }

        function tipOn( d ) {
            plotArea.selectAll( "circle" ).style( "opacity" , 0.2);
            d3.select(this)
                .style( "opacity" , 1.0)
                .attr( "r", 7 );
            tip.show( d );
        }

        function tipOff() {
            plotArea.selectAll( "circle" ).style( "opacity" , opacity );
            d3.select(this)
                .attr( "r", 5 );
            tip.hide();
        }

    }
};

export { cfD3Scatter };