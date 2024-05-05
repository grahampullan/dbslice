import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { refreshTasksInPlotRows } from '../core/refreshTasksInPlotRows.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

const cfD3Histogram = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
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

        this.brushInitialised = false;

        this.update();

    }, 

    update : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
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
        let brushInit = false;

        const svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const plotArea = svg.select(".plot-area");

        let formatCount = d3.format( ",.0f" );

        if ( this.layout.addSelectablePropertyToTitle ) {

            const boundPropertySelectChange = propertySelectChange.bind(this);
            const plotTitle = d3.select(`#plot-title-text-${this._prid}-${this._id}`);
            let dropdown = plotTitle.select(".property-dropdown");
            let selectId = `prop-select-${this._prid}-${this._id}`;
            let selectableOptions = cfData.continuousProperties;
            if ( this.layout.selectableProperties !== undefined ) {
                selectableOptions = this.layout.selectableProperties;
            }
            if ( dropdown.empty() ) {
                let html = 
                    `<select name="${selectId}" id="${selectId}">
                        ${selectableOptions.map( prop => `<option value="${prop}" ${prop==property ? `selected`:``}>${prop}</option>`).join('')}
                    </select>`;
                plotTitle.html("")
                    .append("div")
                        .attr("class","property-dropdown")
                        .html(html);
                document.getElementById(selectId).addEventListener("change", boundPropertySelectChange);
            } 

        } else {

            const plotTitle = d3.select(`#plot-title-text-${this._prid}-${this._id}`);
            let dropdown = plotTitle.select(".property-dropdown");
            dropdown.remove();
            plotTitle.html(this.layout.title);

        }
      
        const items = dim.top( Infinity );
        let itemExtent = d3.extent( items, d => d[property]);

        if (!this.brushInitialised || this.layout.reBin ) {

            let axisExtent = itemExtent;
            if ( !this.brushInitialised ) {
                axisExtent = cfData.continuousDimsExtents[dimId];
            }

            let axisRange = axisExtent[1] - axisExtent[0];
            let xDomMax = axisExtent[1] + 0.05*axisRange; 
            let xDomMin = axisExtent[0] - 0.05*axisRange;
            this.xDomMax = xDomMax;
            this.xDomMin = xDomMin;

        }

        let xDomMin = this.xDomMin;
        let xDomMax = this.xDomMax;

        const x = d3.scaleLinear()
            .domain( [ xDomMin, xDomMax ] )
            .rangeRound( [ 0, width ] );

        const xAxis = d3.axisBottom( x );
        if ( this.layout.xTickNumber !== undefined ) { xAxis.ticks(this.layout.xTickNumber); }
        if ( this.layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(this.layout.xTickFormat)); }

        let gX = plotArea.select(".x-axis");
        if ( gX.empty() ) {
            gX = plotArea.append( "g" )
                .attr( "class", "x-axis")
                .attr( "transform", `translate(0,${height})`)
                .call( xAxis );
        } else {
            gX.call( xAxis );
        }


        const bins = d3.bin()
            .value( d => d[ property ] )
            .domain( x.domain() )
            .thresholds( x.ticks( 20 ) )(items);

        const y = d3.scaleLinear()
            .domain( [ 0, d3.max( bins, d => d.length ) ] )
            .range( [ height, 0 ] );

        let gBars = plotArea.select(".gbars");
        if ( gBars.empty() ) {
             gBars = plotArea.append("g")
                .attr("class", "gbars");
        }

        const bars = gBars.selectAll( ".bar" )
            .data( bins );

        const colour = ( this.layout.colour === undefined ) ? "cornflowerblue" : this.layout.colour;

        bars.enter()
            .append( "rect" )
                .attr( "class", "bar" )
                .attr( "transform", d => `translate(${x( d.x0 )},${y( d.length )})` )
                .attr( "x", 1 )
                .attr( "width", d => x(d.x1)-x(d.x0)-1 )
                .attr( "height", d => height - y( d.length ) )
                .style( "fill", colour )
                .attr( "opacity", "1" );

        bars
            .attr( "transform", d => `translate(${x( d.x0 )},${y( d.length )})` )
            .attr( "x", 1 )
            .attr( "width", d => x(d.x1)-x(d.x0)-1 )
            .attr( "height", d => height - y( d.length ) );

        bars.exit().remove();

        const brush = d3.brushX()
            .extent( [
                [ 0, 0 ],
                [ width, height ]
            ] )
            .on( "start brush", brushMoved )
            .on( "end", brushEnd );
        
        let gBrush = plotArea.select(".gbrush");
        let handle;
        if ( gBrush.empty() ) {
            gBrush = plotArea.append( "g" )
                .attr( "class", "gbrush" );
            handle = gBrush.selectAll( ".handle-custom");
            if ( handle.empty() ) {
                handle = gBrush.selectAll( ".handle-custom" )
                    .data( [ { type: "w" } , { type: "e" } ] )
                    .enter().append( "path" )
                        .attr( "class", "handle-custom" )
                        .attr( "stroke", "#000" )
                        .attr( "cursor", "ewResize" )
                        .attr( "d", brushResizePath );
            }
            brushInit = true;
            gBrush.call(brush);
            gBrush.call( brush.move, itemExtent.map( x ) );
            brushInit = false;
            this.brushInitialised = true;            
        }

        const yAxis = d3.axisLeft( y );
        if ( this.layout.yTickNumber !== undefined ) { yAxis.ticks(this.layout.yTickNumber); }
        if ( this.layout.yTickFormat !== undefined ) { yAxis.tickFormat(d3.format(this.layout.yTickFormat)); }

        let gY = plotArea.select(".y-axis");
        if ( gY.empty() ) {
            plotArea.append("g")
                .attr( "class", "y-axis")
                .call( yAxis );
        } else {
            gY.call( yAxis );
        }

        let yAxisLabel = plotArea.select(".y-axis").select(".y-axis-label");
        if ( yAxisLabel.empty() ) {
            let axisLabel = "Number of Tasks";
            if (dbsliceData.session.uiConfig.replaceTasksNameWith !== undefined) {
                axisLabel = `Number of ${dbsliceData.session.uiConfig.replaceTasksNameWith}`;
            }
             plotArea.select(".y-axis").append("text")
                .attr("class", "y-axis-label")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", -margin.left + 15)
                .attr("text-anchor", "end")
                .text(axisLabel);
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

        function propertySelectChange(e) {
            this.data.property = e.target.value;
            this.brushInitialised = false;
            this.update();
        }

        function brushResizePath( d ) {
            let e = +( d.type == "e" ),
                x = e ? 1 : -1,
                y = height / 2;
            return "M" + ( .5 * x ) + "," + y + "A6,6 0 0 " + e + " " + ( 6.5 * x ) + "," + ( y + 6 ) + "V" + ( 2 * y - 6 ) + "A6,6 0 0 " + e + " " + ( .5 * x ) + "," + ( 2 * y ) + "Z" + "M" + ( 2.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 ) + "M" + ( 4.5 * x ) + "," + ( y + 8 ) + "V" + ( 2 * y - 8 );
        }


        function brushMoved(event) {
            const s = event.selection;
            const handle = gBrush.selectAll(".handle-custom");

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

        function brushEnd(event) {
            dbsliceData.allowAutoFetch = true;
            if ( brushInit == false ) refreshTasksInPlotRows(true);
            dbsliceData.allowAutoFetch = false;
        }

        if (dbsliceData.windowResize ) {
            const brush = d3.brushX()
                .extent( [
                    [ 0, 0 ],
                    [ width, height ]
                ] )
                .on( "start brush", brushMoved )
                .on( "end", brushEnd )
         
            const gBrush = svg.select(".gbrush");
            
            gBrush.call(brush);
    
            const handle = gBrush.selectAll( ".handle-custom" );
            const s = cfData.histogramSelectedRanges[ dimId ].map( r => x(r) );
            console.log(s);
            console.log(dimId);

            brushInit = true;
            gBrush.call( brush.move, s );
            brushInit = false;

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