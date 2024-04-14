import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';
import { Plot } from './Plot.js';

class MetaDataScatter extends Plot {

    constructor(options) {
		if (!options) { options={} }
        options.layout = options.layout || {};
		options.layout.margin = options.layout.margin || {top:5, right:20, bottom:30, left:53};
        options.layout.highlightItems = options.layout.highlightItems || true;
        super(options);
    }

    make() {
        const container = d3.select(`#${this.id}`);
        this.updateHeader();
        this.addPlotAreaSvg();
        this.setLasts();
        
        this.filterId = this.data.filterId;
        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        this.dimId = filter.continuousProperties.indexOf( this.data.xProperty );
        filter.itemIdsInFilter.subscribe( this.handleFilterChange.bind(this) );
        if ( this.layout.highlightItems ) {
            filter.highlightItemIds.subscribe( this.highlightItems.bind(this) );
        }
        
        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        this.update();
    } 

    update() {

        const container = d3.select(`#${this.id}`);
        const layout = this.layout;
        const margin = layout.margin;
        const plotArea = container.select(".plot-area");
       
        this.updateHeader();
        this.updatePlotAreaSize();

        const width = this.plotAreaWidth;
        const height = this.plotAreaHeight;
        const clipId = `${this.id}-clip`
        
        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        const xProperty = this.data.xProperty;
        const yProperty = this.data.yProperty;
        const cProperty = this.data.cProperty;
        const highlightItemsFlag = layout.highlightItems;
        const highlightItemIds = filter.highlightItemIds;
        const dimId = this.dimId;
        const dim = filter.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );

        let xRange, yRange;
        if ( !layout.xRange ) {
            if ( !layout.noAxesAutoScale ) {
                let xMin = d3.min( pointData, d => d[ xProperty ] );
                let xMax = d3.max( pointData, d => d[ xProperty ] );
                let xDiff = xMax - xMin;
                xMin -= 0.1 * xDiff;
                xMax += 0.1 * xDiff;
                xRange = [xMin, xMax];
            } else {
                let extent = filter.continuousExtents[ xProperty ];
                let xMin = extent[0];
                let xMax = extent[1];
                let xDiff = xMax - xMin;
                xMin -= 0.1 * xDiff;
                xMax += 0.1 * xDiff;
                xRange = [xMin, xMax];
            }
        } else {
            xRange = layout.xRange;
        }

        if ( !layout.yRange ) {
            if ( !layout.noAxesAutoScale ) {
                let yMin = d3.min( pointData, d => d[ yProperty ] );
                let yMax = d3.max( pointData, d => d[ yProperty ] );
                let yDiff = yMax - yMin;
                yMin -= 0.1 * yDiff;
                yMax += 0.1 * yDiff;
                yRange = [yMin, yMax];
            } else {
                let extent = filter.continuousExtents[ yProperty ];
                let yMin = extent[0];
                let yMax = extent[1];
                let yDiff = yMax - yMin;
                yMin -= 0.1 * yDiff;
                yMax += 0.1 * yDiff;
                yRange = [yMin, yMax];
            }
        } else {
            yRange = layout.yRange;
        }

        const xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const xscale0 = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( layout.colourMap );
        colour.domain( filter.categoricalUniqueValues[ cProperty ] );

        const opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        const clipRect = plotArea.select(".clip-rect");

        if ( clipRect.empty() ) {
            plotArea.append("defs").append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("class","clip-rect")
                    .attr("width", width)
                    .attr("height", height);
        } else {
            clipRect.attr("width", width)
                .attr("height", height);
        }

        var zoom = d3.zoom()
            .scaleExtent([0.01, Infinity])
            .on("zoom", zoomed);

        plotArea.transition().call(zoom.transform, d3.zoomIdentity);
        plotArea.call(zoom);

        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }

        const points = plotArea.selectAll( ".point" )
            .data( pointData );

        points.enter()
            .append( "circle" )
            .attr( "class", "point")
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d[ xProperty ] ))
            .attr( "cy", d => yscale( d[ yProperty ] ))
            .style( "fill", d => colour( d[ cProperty ] ))
            .style( "opacity", opacity )
            .attr( "clip-path", `url(#${clipId})`)
            .attr( "item-id", d => d.itemId )
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        points
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d[ xProperty ] ))
            .attr( "cy", d => yscale( d[ yProperty ] ))
            .style( "fill", d => colour( d[ cProperty ] ))
            .attr( "item-id", d => d.itemId )
      

        points.exit().remove();

        const line = d3.line()
            .x( d => xscale( d[xProperty] ))
            .y( d => yscale( d[yProperty] ));

        if ( layout.groupBy !== undefined ) {
            const keys = layout.groupBy.map( v => (d => d[v]) );
            const group = d3.group(pointData, ...keys);
            const joiningLines = getLines(group);
            let sortedJoiningLines;
            if ( layout.orderBy !== undefined ) {
                sortedJoiningLines = joiningLines.map( d => d3.sort(d, d=>d[layout.orderBy]));
            } else {
                sortedJoiningLines = joiningLines.map( d => d3.sort(d, d=>d[xProperty]));
            }
            plotArea.selectAll(".joining-line").remove();
            const lines = plotArea.selectAll(".joining-lines").data(sortedJoiningLines);

            lines.enter()
                .append( "path" )
                .attr( "class", "joining-line" )
                    .attr( "d", d => line(d))
                    .style( "stroke", "#848484" )    
                    .style( "fill", "none" )
                    .style( "stroke-width", "2.5px" )
                    .attr( "clip-path", `url(#${clipId})`)
                    .lower();
        }

        const xAxis = d3.axisBottom( xscale );
        if ( layout.xTickNumber ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yscale );
        if ( layout.yTickNumber ) { yAxis.ticks(layout.yTickNumber); }
        if ( layout.yTickFormat ) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

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
                .text(xProperty);
        } else {
            gX.attr( "transform", `translate(0,${height})` )
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
                .text(yProperty);
        } else {
            gY.call( yAxis );
        }


        function zoomed(event) {
            var t = event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".point")
                .attr( "cx", d => xscale( d[ xProperty ] ) )
                .attr( "cy", d => yscale( d[ yProperty ] ) );
            plotArea.selectAll(".joining-line").attr( "d", d => line(d) );
        }

        function tipOn( event, d ) {
            plotArea.selectAll( ".point" ).style( "opacity" , 0.2);
            let target = d3.select(event.target);
            target
                .style( "opacity" , 1.0)
                .attr( "r", 7 );

            let toolTipText, xVal, yVal;
            if ( layout.toolTipXFormat === undefined ) {
                xVal = d[ xProperty ];
            } else {
                xVal = d3.format(layout.toolTipXFormat)( d[ xProperty ] )
            }
            if ( layout.toolTipYFormat === undefined ) {
                yVal = d[ yProperty ];
            } else {
                yVal = d3.format(layout.toolTipYFormat)( d[ yProperty ] )
            }
            let valsText = `${xProperty}=${xVal}, ${yProperty}=${yVal}`;

            if ( layout.toolTipProperties === undefined ) {
                toolTipText = `${d.label}: ${valsText}`; 
            } else {
                let props = layout.toolTipProperties.map(prop => d[prop]);
                toolTipText = props.join("; ");
                toolTipText += `: ${valsText}`;
            }
           
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html(`<span>${toolTipText}</span>`)
                .style("left", target.attr("cx")+ "px")
                .style("top", target.attr("cy")-30 + "px");
       
            if ( highlightItemsFlag ) {
                highlightItemIds.state = { itemIds : [ d.itemId ] };
            }
        }

        function tipOff(event, d) {
            plotArea.selectAll( ".point" ).style( "opacity" , opacity );
            d3.select(event.target)
                .attr( "r", 5 );
            container.select(".tool-tip").style("opacity", 0.0);

            if ( highlightItemsFlag ) {
                highlightItemIds.state = { itemIds : [] };
            }
        }
        
        function getLines(map) {
            let lines=[];
            map.forEach( d => {
              if (d instanceof Map) {
                lines=[...lines,...getLines(d)];
              } else {
                if (d.length>1) {
                  lines.push(d);
                }
              }
            });
            return lines;          
        }

    }

    highlightItems(){

        const container = d3.select(`#${this.id}`);
        const layout = this.layout;
        const plotArea = container.select(".plot-area");
        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        const highlightItemIds = filter.highlightItemIds.state.itemIds;
        const opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;
        const cProperty = this.data.cProperty;
        const colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( layout.colourMap );
        colour.domain( filter.categoricalUniqueValues[ cProperty ] );
        const points = plotArea.selectAll( ".point" );

        if (highlightItemIds === undefined || highlightItemIds.length == 0) {
            points
                .style( "opacity" , opacity )
                .style( "stroke-width", "0px")
                .style( "fill", d => colour( d[ cProperty ] ));
        } else {
            points.style( "opacity" , 0.2);
            points.style( "fill" , "#d3d3d3");
            highlightItemIds.forEach( function (itemId) {
                points.filter( (d,i) => d.itemId == itemId)
                    .style( "fill", d => colour( d[ cProperty ] )  )
                    .style( "opacity" , opacity)
                    .style( "stroke", "red")
                    .style( "stroke-width", "2px")
                    .raise();
            });
        }
    }

    handleFilterChange( data ) {
        this.update();
    }

}

export { MetaDataScatter };