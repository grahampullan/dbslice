import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { refreshTasksInPlotRows } from '../core/refreshTasksInPlotRows.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

const cfD3Buttons = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 20, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const width = container.node().offsetWidth - margin.left - margin.right;
        const height = this.layout.height - margin.top - margin.bottom;
        this.dimId = dbsliceData.session.cfData.categoricalProperties.indexOf( this.data.property );
        
        const div = container.append("div")
            .attr("class","button-container")
            .attr("id", `button-container-${this._prid}-${this._id}`)
            .style("position", "absolute")
            .style("width", `${width}px`)
            .style("height", `${height}px`)
            .style("left", `${margin.left}px`)
            .style("top", `${margin.top}px`)
            .style("display", "flex")
            .style("flex-wrap", "wrap");

        this.update();

    }, 

    update : function () {
     
        const marginDefault = {top: 20, right: 20, bottom: 20, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);
        const buttonContainer = container.select(".button-container");
        const layout = this.layout;

        const width = container.node().offsetWidth - margin.left - margin.right;
        const height = layout.height - margin.top - margin.bottom;

        const cfData = dbsliceData.session.cfData;
        const property = this.data.property;
        const dimId = this.dimId;
        const buttonNames = cfData.categoricalUniqueValues[ property ];

        let colour;

        if ( !this.layout.colourByProperty ) {
    
            if ( !this.layout.colour ) {
                colour = d3.scaleOrdinal( [ "cornflowerblue" ] );
            } else {
                colour = d3.scaleOrdinal( [ this.layout.colour ] );
            }
    
        } else {
    
            if ( !this.layout.colourMap ) {
                colour = d3.scaleOrdinal( d3.schemeTableau10 );
            } else {
                colour = d3.scaleOrdinal( this.layout.colourMap );
            }
                
        }
        colour.domain( buttonNames );

        let numCols = this.layout.numCols;
        if ( numCols === undefined ) {
            numCols = 2;
        }
        const buttonWidth = `calc(${100/numCols}% - 4px)`;

        buttonContainer.style("width", `${width}px`)

        const buttons = buttonContainer.selectAll(".grid-button")
            .data( buttonNames );

        buttons.enter()
            .append("button")
            .attr("class", "grid-button")
            .style("width", buttonWidth) 
            .style("background-color", d => {let col=d3.rgb(colour( d )); col.opacity=0.8; return col;})
            .style("border-radius", "10px")
            .style("border","none")
            .style("font-size", "1.0em")
            .style("margin", "2px")
            .text( d => d ) 
            .style("white-space", "nowrap") 
            .style("overflow", "hidden") 
            .style("text-overflow", "ellipsis")
            .style( "opacity", ( d ) => {
                if ( cfData.filterSelected[ dimId ] === undefined || cfData.filterSelected[ dimId ].length === 0 ) {
                    return 1.;
                } else {
                    return cfData.filterSelected[ dimId ].indexOf( d ) === -1 ? 0.2 : 1.;
                }
            })
            .on( "click", ( event, d ) => {
                if ( cfData.filterSelected[ dimId ] === undefined ) {
                     cfData.filterSelected[ dimId ] = [];
                }
                if ( cfData.filterSelected[ dimId ].indexOf( d ) !== -1 ) {
                    let ind = cfData.filterSelected[ dimId ].indexOf( d );
                    cfData.filterSelected[ dimId ].splice( ind, 1 );
                } else {
                    cfData.filterSelected[ dimId ].push( d );
                }
                cfUpdateFilters(cfData);
                dbsliceData.allowAutoFetch = true;
                refreshTasksInPlotRows( true );
                dbsliceData.allowAutoFetch = false;
            });

        buttons
            .style( "opacity", ( d ) => {
                if ( cfData.filterSelected[ dimId ] === undefined || cfData.filterSelected[ dimId ].length === 0 ) {
                    return 1;
                } else {
                    return cfData.filterSelected[ dimId ].indexOf( d ) === -1 ? 0.2 : 1;
                }
            });
        
    },

    highlightTasks : function () {
    
        if (!this.layout.highlightTasks) return;

        const cfData = dbsliceData.session.cfData;
        const dim = cfData.categoricalDims[ this.dimId ];
        const property = this.data.property;

        const container = d3.select(`#${this.elementId}`);
        const buttonContainer = container.select(".button-container");
        const buttons = buttonContainer.selectAll(".grid-button");

        if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
            buttons.style( "border", "none" );
        } else {
            buttons
                .style( "border-style", "solid" )
                .style( "border-width", "0px" )
                .style( "border-color", "red" ); 
            dbsliceData.highlightTasks.forEach( function (taskId) {
                let keyNow = dim.top(Infinity).filter(d => d.taskId==taskId)[0][property];
                buttons.filter( (d,i) => d == keyNow)
                    .style( "border-width", "4px" )
            });
        }


    }


};

export { cfD3Buttons };