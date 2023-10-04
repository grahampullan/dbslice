import { dbsliceData } from '../core/dbsliceData.js';
//import { update } from '../core/update.js';
import * as d3 from 'd3v7';

const cfD3GroupedVertBarChart = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        this.dimId = dbsliceData.session.cfData.categoricalProperties.indexOf( this.data.xProperty );

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

        svg.append("text")
            .attr("class", "hidden-text")
            .attr("y", 0)
            .attr("dy", 0)
            .style("opacity",0);

        this.update();

    }, 

    update : function () {

        const layout = this.layout;

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const dimId = this.dimId;
        const plotRowIndex = dbsliceData.session.plotRows.findIndex( e => e._id == this._prid );
        const plotIndex = dbsliceData.session.plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );
        const clipId = `clip-${this._prid}-${this._id}`;
        const plotArea = svg.select(".plot-area");

        const xProperty = this.data.xProperty;
        const yProperty = this.data.yProperty;
        const zProperty = this.data.zProperty;

        const cfData = dbsliceData.session.cfData;
        const dim = cfData.categoricalDims[ dimId ];

        const barDataAll = dim.top( Infinity );

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

        let yMin, yMax, yRange;
        if ( layout.yRange === undefined) {
            yMin = d3.min( barDataFlat, d => d[ yProperty ] );
            yMax = d3.max( barDataFlat, d => d[ yProperty ] );
            let yDiff = yMax - yMin;
            if ( yMin > 0. && yMax > 0.) yMin = 0.
            if ( yMin < 0. && yMax < 0.) yMax = 0.
            yRange = [yMin, yMax];
        } else {
            yRange = layout.yRange;
        }

        const xScale = d3.scaleBand()
            .range( [0, width] )
            .domain( xDomain )
            .paddingInner( 0.05 );

        const xzScale = d3.scaleBand()
            .range( [0, xScale.bandwidth()])
            .domain( zDomain )
            .padding( 0.05 );

        let wrapWidth = xScale.bandwidth();

        let yOffset = margin.bottom;
        const hiddenText = d3.select(".hidden-text");
        xDomain.forEach( label => {
            hiddenText.text(label);
            wrapText(hiddenText, wrapWidth);
            yOffset = Math.max(hiddenText.node().getBBox().height, yOffset);
            hiddenText.selectAll("*").remove();
        });
        yOffset -= margin.bottom;

        const yScale = d3.scaleLinear()
            .range( [height-yOffset, 0] )
            .domain( yRange );

        const colour = d3.scaleOrdinal( d3.schemeTableau10 )
            .domain( cfData.categoricalUniqueValues[ zProperty ] );

        const opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

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
        if ( layout.xTickNumber !== undefined ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yScale );
        if ( layout.yTickNumber !== undefined ) { yAxis.ticks(layout.yTickNumber); }
        if ( layout.yTickFormat !== undefined ) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

        let gX = plotArea.select(".axis-x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", `translate(0,${height-yOffset})` )
                .attr( "class", "axis-x")
                .call( xAxis );
            gX.append("text")
                .attr("class","x-axis-text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom+yOffset-4)
                .attr("text-anchor", "end")
                .text(xProperty);
        } else {
            gX.attr( "transform", `translate(0,${height-yOffset})` );
            gX.call( xAxis );
            gX.select(".x-axis-text")
                .attr("x",width)
                .attr("y", margin.bottom+yOffset-4);
        }

        setTimeout(() => {
            gX.selectAll(".tick text")
                .call(wrap, xScale.bandwidth())
        },0);

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
                .text(yProperty);
        } else {
            gY.call( yAxis );
        }
        
        function tipOn( event, d ) {
            plotArea.selectAll( ".bar" ).style( "opacity" , 0.2);
            let target = d3.select(event.target);
            target.style( "opacity" , 1.0);

            let toolTipText, yVal;
            if ( layout.toolTipYFormat === undefined ) {
                yVal = d[ yProperty ];
            } else {
                yVal = d3.format(layout.toolTipYFormat)( d[ yProperty ] )
            }
            let valsText = `${yProperty}=${yVal}`;

            let toolTipProperties;
            if ( layout.toolTipProperties === undefined ) {
                toolTipProperties = [zProperty]
            } else {
                toolTipProperties = layout.toolTipProperties;
            }
            let props = toolTipProperties.map(prop => d[prop]);
            toolTipText = props.join("; ");
            toolTipText += `: ${valsText}`;

            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html(`<span>${toolTipText}</span>`)
                .style("left", target.attr("x")+ "px")
                .style("top", target.attr("y") + "px");
        }

        function tipOff(event, d) {
            plotArea.selectAll( ".bar" ).style( "opacity" , opacity );
            container.select(".tool-tip").style("opacity", 0.0)
        }

        function wrap(text, wrapWidth) {
            text.each(function() {
                let text = d3.select(this);
                wrapText(text, wrapWidth);
            });
            return ;
        }

        function wrapText(textSelection, wrapWidth) {
            let words = textSelection.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = textSelection.attr("y"),
                dy = parseFloat(textSelection.attr("dy")),
                tspan = textSelection.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", `${dy}em`);
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > wrapWidth && line.length > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = textSelection.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
            return;
        }

    },

    highlightTasks : function() {

        return;

    }
};

export { cfD3GroupedVertBarChart };