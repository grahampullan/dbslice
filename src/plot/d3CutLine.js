import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';
//import d3tip from 'd3-tip';

const d3CutLine = {

    make : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`)

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);
                
        
        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);
    
        this.update();

    },

    update : function () {

        const layout = this.layout;
        const container = d3.select(`#${this.elementId}`);
        const svg = container.select("svg");
        const plotArea = svg.select(".plot-area");
        const plotRowIndex = dbsliceData.session.plotRows.findIndex( e => e._id == this._prid );
        const plotIndex = dbsliceData.session.plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        const clipId = `clip-${this._prid}-${this._id}`;

        const svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        let cutLineData = [[[0,0],[0,0]]];
        if (dbsliceData.derived[this.data.cutDataId] !== undefined) {
            cutLineData = dbsliceData.derived[this.data.cutDataId];
        }

        const xData = cutLineData.map(d => d[0][0]);
        const yData = cutLineData.map(d => d[0][1]);

        let xRange, yRange;
        if ( layout.xRange === undefined ) {
            xRange = d3.extent(xData);
        } else {
            xRange = layout.xRange;
        }

        if ( layout.yRange === undefined ) {
            yRange = d3.extent(yData);
        } else {
            yRange = layout.yRange;
        }

        let xscale = d3.scaleLinear();
        let xscale0 = d3.scaleLinear();

        xscale.range( [0, width] )
              .domain( xRange );

        xscale0.range( [0, width] )
              .domain( xRange );

        let yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        let yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        //var colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( layout.colourMap );
        //if ( layout.cSet !== undefined) colour.domain( layout.cSet );


        const line = d3.line()
            .x( d => xscale( d.x ) )
            .y( d => yscale( d.y ) );

        function segLine(lineSegs) {
            let path="";
            lineSegs.forEach(d => {
                let seg=[{x:d[0][0], y:d[0][1]},{x:d[1][0],y:d[1][1]}];
                path += line(seg);
            });
            return path;
        }

        const clipRect = svg.select(".clip-rect");

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

        // no zoom 
        //const zoom = d3.zoom()
        //   .scaleExtent([0.5, Infinity])
        //   .on("zoom", zoomed);
        //svg.transition().call(zoom.transform, d3.zoomIdentity);
        //svg.call(zoom);

        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }

        let linePath = plotArea.select(".line");
        if (linePath.empty()) {
            plotArea.append("path")
                .attr("class","line")
                .attr( "clip-path", `url(#${clipId})` )
                .datum(cutLineData)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("d", segLine);
        } else {
            linePath.datum(cutLineData).attr("d",segLine);
        }

        const xAxis = d3.axisBottom( xscale );
        if ( layout.xTickNumber !== undefined ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yscale );
        if ( layout.yTickNumber !== undefined ) { yAxis.ticks(layout.yTickNumber); }
        if ( layout.yTickFormat !== undefined ) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

        let gX = plotArea.select(".axis-x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", `translate(0,${height})` )
                .attr( "class", "axis-x")
                .call( xAxis );
            gX.append("text")
                .attr("class","x-axis-text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(layout.xAxisLabel);
        } else {
            gX.call( xAxis );
            gX.select(".x-axis-text").attr("x", width)
        }

        let gY = plotArea.select(".axis-y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
                .attr( "class", "axis-y")
                .call( yAxis );
            gY.append("text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0)
                    .attr("y", -margin.left + 15)
                    .attr("text-anchor", "end")
                    .text(layout.yAxisLabel);
        } else {
            gY.call( yAxis );
        }

        function zoomed(event) {
            const t = event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.select(".line").datum(cutLineData).attr("d",segLine);
        }

        layout.newData = false;
    },

    highlightTasks : function() {
        
        return;

    }
};

export { d3CutLine };