import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

const cfD3Table = {

    make : function() {

        const marginDefault = {top: 10, right: 10, bottom: 10, left: 10};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const width = container.node().offsetWidth - margin.left - margin.right;
        const height = this.layout.height - margin.top - margin.bottom;
    
        const background = container.append("div")
            .attr("class","table-background")
            .style("width", `${container.node().offsetWidth}px`)
            .style("height", `${this.layout.height}px`)
            .style("overflow-y", "auto");

        const table = background.append("table")
            .attr("class", "table table-striped")
            .style("border-collapse", "collapse")
            .style("position", "relative")
            .style("width", `${width}px`)
            .style("height", `${height}px`)
            .style("left", `${margin.left}px`)
            .style("top", `${margin.top}px`);

        this.update();

    }, 

    update : function () {
     
        const marginDefault = {top: 20, right: 20, bottom: 20, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);
        const tableBackground = container.select(".table-background");
        const table = tableBackground.select(".table");
    
        const layout = this.layout;

        const width = container.node().offsetWidth - margin.left - margin.right;
        const height = layout.height - margin.top - margin.bottom;

        const cfData = dbsliceData.session.cfData;
        const dim = cfData.categoricalDims[ 0 ];

        const tableData = dim.top( Infinity );

        if ( this.data.sortBy ) {
            tableData.sort((a, b) => {
            for (let {property, order} of this.data.sortBy) {
                let comp;
                if ( order == "ascend" ) {
                    comp = d3.ascending(a[property], b[property]);
                } else if ( order == "descend" ) {
                    comp = d3.descending(a[property], b[property]);
                }
                if (comp !== 0) return comp; 
            }
            return 0; 
            });
        }

        const columns = this.data.columns;

        tableBackground.style("width", `${container.node().offsetWidth}px`)
        table.style("width", `${width}px`)

        table.selectAll("*").remove();

        table.append("thead")
            .append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
                .text(d => d.property)
                .style("border", "1px solid black")
                .style("padding", "8px")
                .style("text-align", "left")
                .style("background-color", "cornflowerblue")
                .style("opacity", 0.8)
                .style("color", "black");

        const tbody = table.append("tbody");

        const rows = tbody.selectAll("tr")
            .data(tableData)
            .enter()
                .append("tr")
                .style("background-color", "blue");

        rows.selectAll("td")
            .data( d => columns.map( col => {
                if ( col.format ) {
                    return d3.format( col.format )( d[col.property] );
                } else {
                    return d[col.property];
                }
            }))
            .enter()
                .append("td")
                .text( d => d )
                .style("border", "1px solid black")
                .style("font-size", "0.8em")
                .style("padding", "4px")
                .style("text-align", "left");
 
    },

    highlightTasks : function () {
    
    }


};

export { cfD3Table };