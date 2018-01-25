const d3LineSeries = {

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

        d3LineSeries.update( element, data, layout );

    },

    update : function ( element, data, layout ) {

        if (data.newData == false) {
            return
        }

        var marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        var margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        var container = d3.select(element);

        var svg = container.select("svg");

        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");

        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;


        var nseries = data.series.length;

        var xmin = d3.min( data.series[0].data, function(d) { return d.x; } );
        var xmax = d3.max( data.series[0].data, function(d) { return d.x; } );
        var ymin = d3.min( data.series[0].data, function(d) { return d.y; } );
        var ymax = d3.max( data.series[0].data, function(d) { return d.y; } );

        for (var n = 1; n < nseries; ++n) {
            var xminNow =  d3.min( data.series[n].data, function(d) { return d.x; } );
            ( xminNow < xmin ) ? xmin = xminNow : xmin = xmin;
            var xmaxNow =  d3.max( data.series[n].data, function(d) { return d.x; } );
            ( xmaxNow > xmax ) ? xmax = xmaxNow : xmax = xmax;
            var yminNow =  d3.min( data.series[n].data, function(d) { return d.y; } );
            ( yminNow < ymin ) ? ymin = yminNow : ymin = ymin;
            var ymaxNow =  d3.max( data.series[n].data, function(d) { return d.y; } );
            ( ymaxNow > ymax ) ? ymax = ymaxNow : ymax = ymax;
        }

        if ( layout.xscale == "time" ) {
            var xscale = d3.scaleTime(); 
            var xscale0 = d3.scaleTime();        
        } else {
            var xscale = d3.scaleLinear();
            var xscale0 = d3.scaleLinear();
        }

        xscale.range( [0, width] )
              .domain( [xmin, xmax] );

        xscale0.range( [0, width] )
              .domain( [xmin, xmax] );

        var yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( [ymin, ymax] );

        var yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( [ymin, ymax] );

        var colour = d3.scaleOrdinal( d3.schemeCategory20c );

        var line = d3.line()
            .x( function( d ) { return xscale( d.x ); } )
            .y( function( d ) { return yscale( d.y ); } );

        var plotArea = svg.select(".plotArea");

        var clip = svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
                .attr("width", width)
                .attr("height", height);

        var zoom = d3.zoom()
            .scaleExtent([0.5, Infinity])
            .on("zoom", zoomed);

        var allSeries = plotArea.selectAll( ".plotSeries" ).data( data.series );

        allSeries.enter()
            .each( function() {
                var series = d3.select( this );
                var seriesLine = series.append( "g" )
                    .attr( "class", "plotSeries")
                    .attr( "series-name", function( d ) { return d.name; } )
                    .append( "path" )
                        .attr( "class", "line" )
                        .attr( "d", function( d ) { return line( d.data ); } )
                        .style( "stroke", function( d ) { return colour( d.name ); } )    
                        .style( "fill", "none" )
                        .style( "stroke-width", "2px" )
                        .attr( "clip-path", "url(#clip)")
                        .on( "mouseover", function( d ) {
                            plotArea.selectAll( ".line" ).style( "opacity" , 0.2);
                            d3.select(this)
                                .style( "opacity" , 1.0)
                                .style( "stroke-width", "4px" );
                        })
                        .on( "mouseout", function( d ) {
                            plotArea.selectAll( ".line" ).style( "opacity" , 1.0);
                            d3.select(this)
                                .style( "stroke-width", "2px" );
                        });
        } );

        allSeries.each( function() {
            var series = d3.select( this );
            var seriesLine = series.select( "path.line" );
            seriesLine.transition()
                    .attr( "d", function( d ) { return line( d.data ); } );
        } );

        allSeries.exit().remove();

        var xAxis = d3.axisBottom( xscale ).ticks(5);
        var yAxis = d3.axisLeft( yscale );


        var gX = plotArea.select(".axis--x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                //.attr( "transform", "translate(" + margin.left + "," + (margin.top + height) + ")" )
                .attr( "transform", "translate(0," + height + ")" )
                .attr( "class", "axis--x")
                .call( xAxis );
            gX.append("text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom)
                .attr("text-anchor", "end")
                .text(layout.xAxisLabel);
        } else {
            gX.transition().call( xAxis );
        }

        var gY = plotArea.select(".axis--y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
                //.attr( "transform", "translate(" + margin.left + "," + margin.top + ")" )
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

        svg.call(zoom);

        function zoomed() {
            var t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".line").attr( "d", function( d ) { return line( d.data ); } );
        }

        data.newData = false;

    }
};

export { d3LineSeries };