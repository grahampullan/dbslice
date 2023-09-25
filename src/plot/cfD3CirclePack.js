import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { refreshTasksInPlotRows } from '../core/refreshTasksInPlotRows.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

const cfD3CirclePack = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

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

        if (this.noUpdate) {
            this.noUpdate = false;
            return;
        }
     
        const marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const plotArea = svg.select(".plot-area");

        const cfData = dbsliceData.session.cfData;
        const property = this.data.property;
        this.dimId = cfData.categoricalProperties.indexOf( property );
        const dimId = this.dimId;
        const dim = cfData.categoricalDims[ dimId ];
        const items = dim.top(Infinity);

        const groupBy = this.layout.groupBy;
        const groupByDimIds = groupBy.map(d => cfData.categoricalProperties.indexOf(d));
        const keys = groupBy.map( v => (d => d[v]) );
        const rollupData = d3.rollup(items, d => d.length, ...keys);
        const childrenAccessorFn = ([ key, value ]) => value.size && Array.from(value);
        const hierarchyData = d3.hierarchy([null, rollupData], childrenAccessorFn)
            .sum(([key, value]) => value)
            .sort((a, b) => b.value - a.value);
        const root = d3.pack()
            .size([width,height])
            .padding(3)
            (hierarchyData);
        
        let colour;

        if ( !this.layout.colourByProperty ) {
    
            if ( !this.layout.colour ) {
                colour = d3.scaleOrdinal( [ "cornflowerblue" ] );
            } else {
                colour = d3.scaleOrdinal( [ this.layout.colour ] );
            }
    
        } else {
    
            if ( !this.layout.colourMap ) {
                colour = d3.scaleOrdinal( d3.schemeTableau10 ).unknown("LightGray");
            } else {
                colour = d3.scaleOrdinal( this.layout.colourMap ).unknown("LightGray");
            }
                
        }
    
        colour.domain( cfData.categoricalUniqueValues[ property ] );

        const nodes = plotArea.selectAll("circle")
            .data(root.descendants().slice(1));

        nodes.enter().append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.r)
            .style("fill", d => colour(d.data[0]))
            .style("opacity",0.8)
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style( "cursor", "pointer")
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
        
        nodes.transition()
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.r)
            .style("fill", d => colour(d.data[0]))
            .style("stroke", "black")
            .style("stroke-width", "1px");

        nodes.exit().remove();

        const labels = plotArea.selectAll(".circle-label")
            .data(root.descendants().slice(1).filter(d => !d.children && d.r > 5));

        labels.enter().append("text")
            .attr("class", "circle-label")
            .attr("font-size", 12)
            .attr("x", d => d.x)
            .attr("y", d => d.y + 6)
            .attr("text-anchor", "middle")
            .text(d => d.data[0] );

        labels.transition()
            .attr("x", d => d.x)
            .attr("y", d => d.y + 6)
            .text(d => d.data[0] );

        labels.raise();

        labels.exit().remove();    

        function tipOn( event, d ) {
            plotArea.selectAll( "circle" ).style( "opacity" , 0.2);
            let target = d3.select(event.target);
            target
                .style( "opacity" , 1.0);
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html(`<span>${d.data[0]}</span>`)
                .style("left", target.attr("cx")+ "px")
                .style("top", target.attr("cy") + "px");
        }

        function tipOff(event, d) {
            plotArea.selectAll( "circle" ).style( "opacity" , 0.8 );
            container.select(".tool-tip").style("opacity", 0.0)
        }

    },

    highlightTasks : function () {

        return;

    }

};

export { cfD3CirclePack };