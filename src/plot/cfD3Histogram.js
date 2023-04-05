import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { refreshTasksInPlotRows } from '../core/refreshTasksInPlotRows.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';

const cfD3Histogram = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const cfData = dbsliceData.session.cfData;
        const property = this.data.property;
        this.dimId = cfData.continuousProperties.indexOf( property );
        const dimId = this.dimId;

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)

        const plotArea = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr( "class", "plot-area" )
            .attr( "id", `plot-area-${this._prid}-${this._id}`);

        const dim = cfData.continuousDims[ dimId ];       
        const items = dim.top( Infinity );

        let itemExtent = d3.extent( items, d => d[property]);
        let itemRange = itemExtent[1] - itemExtent[0];

        let xDomMax = itemExtent[1] + 0.05*itemRange; 
        let xDomMin = itemExtent[0] - 0.05*itemRange;
        this.xDomMax = xDomMax;
        this.xDomMin = xDomMin;

        const x = d3.scaleLinear()
            .domain( [ xDomMin, xDomMax ] )
            .rangeRound( [ 0, width ] );

        plotArea.append( "g" )
            .attr( "class", "x-axis")
            .attr( "transform", `translate(0,${height})`)
            .call( d3.axisBottom( x ) );

        const brush = d3.brushX()
            .extent( [
                [ 0, 0 ],
                [ width, height ]
            ] )
            .on( "start brush", brushmoved )
            .on( "end", brushend )

        const gBrush = svg.append( "g" )
            .attr( "transform", `translate(${margin.left}, ${margin.top})` )
            .attr( "class", "brush" )
            .call( brush );

        function brushResizePath( d ) {
            let e = +( d.type == "e" ),
                x = e ? 1 : -1,
                y = height / 2;
            return "M" + ( .5 * x ) + "," + y + "A6,6 0 0 " + e + " " + ( 6.5 * x ) + "," + ( y + 6 ) + "V" + ( 2 * y - 6 ) + "A6,6 0 0 " + e + " " + ( .5 * x ) + "," + ( 2 * y ) + "Z" + "M" + ( 2.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 ) + "M" + ( 4.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 );
        }

        const handle = gBrush.selectAll( ".handle-custom" )
            .data( [ { type: "w" } , { type: "e" } ] )
            .enter().append( "path" )
                .attr( "class", "handle-custom" )
                .attr( "stroke", "#000" )
                .attr( "cursor", "ewResize" )
                .attr( "d", brushResizePath );


        let brushInit = true;
        gBrush.call( brush.move, x.domain().map( x ) );
        brushInit = false;


        function brushmoved() {
            let s = d3.event.selection;
            if ( s == null ) {
                handle.attr( "display", "none" );
                cfData.histogramSelectedRanges[ dimId ] = [];
                cfUpdateFilters(cfData);
                if ( brushInit == false ) refreshTasksInPlotRows(true);
            } else {
                var sx = s.map( x.invert );
                handle.attr( "display", null ).attr( "transform", function( d, i ) {
                    return "translate(" + [ s[ i ], -height / 4 ] + ")";
                } );
                cfData.histogramSelectedRanges[ dimId ] = sx;
                cfUpdateFilters(cfData);
                if ( brushInit == false ) refreshTasksInPlotRows(true);
            }
        }

        function brushend() {
            dbsliceData.allowAutoFetch = true;
            if ( brushInit == false ) refreshTasksInPlotRows(true);
            dbsliceData.allowAutoFetch = false;
        }


        this.update();

    }, 

    update : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const cfData = dbsliceData.session.cfData;
        const property = this.data.property;
        this.dimId = cfData.continuousProperties.indexOf( property );
        const dimId = this.dimId;
        const dim = cfData.continuousDims[ dimId ]; 

        const svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const plotArea = svg.select(".plot-area");

        let formatCount = d3.format( ",.0f" );

        if ( this.layout.addSelectablePropertyToTitle ) {

            const plotTitle = d3.select(`#plot-title-text-${this._prid}-${this._id}`);
            let dropdown = plotTitle.select(".property-dropdown");
            if ( dropdown.empty() ) {
                let html = `<select name="prop-select-${this._prid}-${this._id}" id="prop-select-${this._prid}-${this._id}">`;
                html += `${cfData.continuousProperties.map( prop => `<option value="${prop}" ${prop==property ? `selected`:``}>${prop}</option>`).join('')}`;
                html += `</select>`;
                plotTitle.html("")
                    .append("div")
                        .attr("class","property-dropdown")
                        .html(html);
            } 

        } else {

            const plotTitle = d3.select(`#plot-title-text-${this._prid}-${this._id}`);
            let dropdown = plotTitle.select(".property-dropdown");
            dropdown.remove();
            plotTitle.html(this.layout.title);

        }

        const items = dim.top( Infinity );

        let xDomMax = this.xDomMax;
        let xDomMin = this.xDomMin;

        if ( this.layout.reBin == true ) {

            let itemExtent = d3.extent( items, d => d[property]);
            let itemRange = itemExtent[1] - itemExtent[0];
    
            xDomMax = itemExtent[1] + 0.05*itemRange; 
            xDomMin = itemExtent[0] - 0.05*itemRange;
            this.xDomMin = xDomMin;
            this.xDomMax = xDomMax;
        
        }

        const x = d3.scaleLinear()
            .domain( [ xDomMin, xDomMax] )
            .rangeRound( [ 0, width ] );

        const histogram = d3.histogram()
            .value( d => d[ property ] )
            .domain( x.domain() )
            .thresholds( x.ticks( 20 ) );

        const bins = histogram( items );

        const y = d3.scaleLinear()
            .domain( [ 0, d3.max( bins, d => d.length ) ] )
            .range( [ height, 0 ] );

        const bars = plotArea.selectAll( "rect" )
            .data( bins );

        const colour = ( this.layout.colour === undefined ) ? "cornflowerblue" : this.layout.colour;

        bars.enter()
            .append( "rect" )
                .attr( "transform", d => `translate(${x( d.x0 )},${y( d.length )})` )
                .attr( "x", 1 )
                .attr( "width", d => x(d.x1)-x(d.x0)-1 )
                .attr( "height", d => height - y( d.length ) )
                .style( "fill", colour )
                .attr( "opacity", "1" );

        bars.transition()
            .attr( "transform", d => `translate(${x( d.x0 )},${y( d.length )})` )
            .attr( "x", 1 )
            .attr( "width", d => x(d.x1)-x(d.x0)-1 )
            .attr( "height", d => height - y( d.length ) );

        bars.exit().remove();

        let yAxis = plotArea.select(".y-axis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "y-axis")
                .call( d3.axisLeft( y ) );
        } else {
            yAxis.transition().call( d3.axisLeft( y ) );
        }

        //if ( layout.reBin == true ) {
            let xAxis = plotArea.select(".x-axis");
            if ( xAxis.empty() ) {
                plotArea.append("g")
                    .attr( "class", "x-axis")
                    .attr( "transform", `translate(0,${height})` )
                    .call( d3.axisBottom( x ) );
            } else {
                xAxis.transition().call( d3.axisBottom( x ) );
            }
        //}


        let yAxisLabel = plotArea.select(".y-axis").select(".y-axis-label");
        if ( yAxisLabel.empty() ) {
             plotArea.select(".y-axis").append("text")
                .attr("class", "y-axis-label")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", -25)
                .attr("text-anchor", "end")
                .text("Number of Cases");
            }

        let xAxisLabel = plotArea.select(".x-axis").select(".x-axis-label");
        if ( xAxisLabel.empty() ) {
            plotArea.select(".x-axis").append("text")
                .attr("class", "x-axis-label")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", height+margin.bottom-2)
                .attr("text-anchor", "end")
                .text(property);
        } else {
            xAxisLabel.attr("x",width);
        }


        if (dbsliceData.windowResize ) {
            const brush = d3.brushX()
                .extent( [
                    [ 0, 0 ],
                    [ width, height ]
                ] )
                .on( "start brush", brushmoved )
                .on( "end", brushend )
         
            const gBrush = svg.select(".brush");
            
            gBrush.call(brush);
    
            const handle = gBrush.selectAll( ".handle-custom" );
            const s = cfData.histogramSelectedRanges[ dimId ].map( r => x(r) );

            var brushInit = true;
            gBrush.call( brush.move, s );
            brushInit = false;

            handle.attr( "display", null ).attr( "transform", function( d, i ) {
                return "translate(" + [ s[ i ], -height / 4 ] + ")";
                } );
        
            function brushmoved() {
                let s = d3.event.selection;
                if ( s == null ) {
                    handle.attr( "display", "none" );
                    cfData.histogramSelectedRanges[ dimId ] = [];
                    cfUpdateFilters(cfData);
                    if ( brushInit == false ) refreshTasksInPlotRows(true);
                } else {
                    var sx = s.map( x.invert );
                    handle.attr( "display", null ).attr( "transform", function( d, i ) {
                        return "translate(" + [ s[ i ], -height / 4 ] + ")";
                    } );
                    cfData.histogramSelectedRanges[ dimId ] = sx;
                    cfUpdateFilters(cfData);
                    if ( brushInit == false ) refreshTasksInPlotRows(true);
                }
            }
        
            function brushend() {
                dbsliceData.allowAutoFetch = true;
                if ( brushInit == false ) refreshTasksInPlotRows(true);
                dbsliceData.allowAutoFetch = false;
            }
        }

    },

    highlightTasks : function() {

        if (!this.layout.highlightTasks) return;

        const plotArea = d3.select(`#plot-area-${this._prid}-${this._id}`);
        const bars = plotArea.selectAll("rect");
        const property = this.data.property;
        const cfData = dbsliceData.session.cfData;
        const dim = cfData.continuousDims[ this.dimId ]; 

        if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

            bars.style( "stroke-width", "0px" );
                      
        } else {

            bars
                .style( "stroke-width", "0px" )
                .style( "stroke", "red" ); 
            dbsliceData.highlightTasks.forEach( function (taskId) {
                let valueNow = dim.top(Infinity).filter(d => d.taskId==taskId)[0][property];
                bars.filter( (d,i) => (d.x0 <= valueNow && d.x1 > valueNow) )
                    .style( "stroke-width", "4px" )
            });

        }

    } 

};


export { cfD3Histogram };