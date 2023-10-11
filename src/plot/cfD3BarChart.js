import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { refreshTasksInPlotRows } from '../core/refreshTasksInPlotRows.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

const cfD3BarChart = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 20};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const cfData = dbsliceData.session.cfData;
        const property = this.data.property;
        this.dimId = cfData.categoricalProperties.indexOf( property );
        
        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);

        this.update();

    }, 

    update : function () {
     
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
        const group = dim.group();
        const items = group.all();

        if ( this.layout.addSelectablePropertyToTitle ) {

            const boundPropertySelectChange = propertySelectChange.bind(this);
            const plotTitle = d3.select(`#plot-title-text-${this._prid}-${this._id}`);
            let dropdown = plotTitle.select(".property-dropdown");
            let selectId = `prop-select-${this._prid}-${this._id}`;
            let selectableOptions = cfData.categoricalProperties;
            if ( this.layout.selectableProperties !== undefined ) {
                selectableOptions = this.layout.selectableProperties;
            }
            if ( dropdown.empty() ) {
                let html = 
                    `<select name="${selectId}" id="${selectId}">
                        ${selectableOptions.filter(prop => (prop !='taskId' && prop !='label')).map( prop => `<option value="${prop}" ${prop==property ? `selected`:``}>${prop}</option>`).join('')}
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

        const removeZeroBar = ( this.layout.removeZeroBar === undefined ) ? false : this.layout.removeZeroBar;
        if ( removeZeroBar ) items = items.filter( item => item.value > 0);

        const x = d3.scaleLinear()
            .range( [0, width] )
            .domain( [ 0, d3.max( items, v => v.value ) ] );

        const y = d3.scaleBand()
            .range( [0, height] )
            .domain(items.map(function(d){ return d.key; }))
            .padding( [0.2] )
            .align([0.5]);

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
    
        colour.domain( cfData.categoricalUniqueValues[ property ] );

        const bars = plotArea.selectAll( "rect" )
            .data( items, v => v.key );

        bars.enter()
            .append( "rect" )
            .on( "click", ( event, selectedItem ) => {

                if ( cfData.filterSelected[ dimId ] === undefined ) {
                     cfData.filterSelected[ dimId ] = [];
                }

                // check if current filter is already active
                if ( cfData.filterSelected[ dimId ].indexOf( selectedItem.key ) !== -1 ) {

                    // already active
                    var ind = cfData.filterSelected[ dimId ].indexOf( selectedItem.key );
                    cfData.filterSelected[ dimId ].splice( ind, 1 );

                } else {

                    cfData.filterSelected[ dimId ].push( selectedItem.key );

                }

                cfUpdateFilters(cfData);
                dbsliceData.allowAutoFetch = true;
                refreshTasksInPlotRows( true );
                dbsliceData.allowAutoFetch = false;

            })
            .attr( "height", y.bandwidth() )
            .attr( "y", v => y(v.key) )
            .style( "fill", v => colour(v.key) )
            .style( "cursor", "pointer")
            .transition()
                .attr( "width", v => x( v.value ) )
                .attr( "opacity", ( v ) => {
                    if ( cfData.filterSelected[ dimId ] === undefined || cfData.filterSelected[ dimId ].length === 0 ) {
                        return 1;
                    } else {
                        return cfData.filterSelected[ dimId ].indexOf( v.key ) === -1 ? 0.2 : 1;
                    }
                });

        // updating the bar chart bars
        bars.transition()
            .attr( "width", v => x( v.value ) )
            .attr( "y", v => y(v.key) )
            .attr( "height", y.bandwidth() )
            .attr( "opacity", ( v ) => {
                if ( cfData.filterSelected[ dimId ] === undefined || cfData.filterSelected[ dimId ].length === 0 ) {
                    return 1;
                } else {
                    return cfData.filterSelected[ dimId ].indexOf( v.key ) === -1 ? 0.2 : 1;
                }
            } );

        bars.exit().transition()
            .attr( "width", 0)
            .remove();

        const xAxis = d3.axisBottom( x );
        if ( this.layout.xTickNumber !== undefined ) { xAxis.ticks(this.layout.xTickNumber); }
        if ( this.layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(this.layout.xTickFormat)); }

        let gX = plotArea.select(".x-axis");
        if ( gX.empty() ) {
            let axisLabel = "Number of Tasks";
            if (dbsliceData.session.uiConfig.replaceTasksNameWith !== undefined) {
                axisLabel = `Number of ${dbsliceData.session.uiConfig.replaceTasksNameWith}`;
            }
            plotArea.append("g")
                .attr( "transform", `translate(0, ${height})` )
                .attr( "class", "x-axis")
                .call( xAxis )
                .append("text")
                    .attr("class","x-axis-text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("y", margin.bottom-2)
                    .attr("text-anchor", "end")
                    .text(axisLabel);
        } else {
            gX.attr( "transform", `translate(0, ${height})` ).transition().call( xAxis );
            gX.select(".x-axis-text").attr("x",width);
        }

        var yAxis = plotArea.select(".y-axis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "y-axis")
                .call( d3.axisLeft( y ).tickValues( [] ) );
        } else {
            yAxis.transition().call( d3.axisLeft( y ).tickValues( []) );
        }

        var keyLabels = plotArea.selectAll( ".key-label" )
            .data( items, v => v.key );

        keyLabels.enter()
            .append( "text" )
            .attr( "class", "key-label" )
            .attr( "x", 0 )
            .attr( "y", v => y(v.key) + 0.5*y.bandwidth() )
            .attr( "dx", 5 )
            .attr( "dy", ".35em" )
            .attr( "text-anchor", "start" )
            .text( v => v.key );

        // updating meta Labels
        keyLabels.transition()
             .attr( "y", v => y(v.key) + 0.5*y.bandwidth() )
             .text( v => v.key );

        keyLabels.exit()
            .remove();

        function propertySelectChange(e) {
            this.data.property = e.target.value;
            this.update();
        }

    },

    highlightTasks : function () {

        if (!this.layout.highlightTasks) return;

        const cfData = dbsliceData.session.cfData;
        const dim = cfData.categoricalDims[ this.dimId ];
        const plotArea = d3.select(`#plot-area-${this._prid}-${this._id}`);
        const property = this.data.property;
        const bars = plotArea.selectAll("rect");

        if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
            bars.style( "stroke-width", "0px" );
        } else {
            bars
                .style( "stroke-width", "0px" )
                .style( "stroke", "red" ); 
            dbsliceData.highlightTasks.forEach( function (taskId) {
                let keyNow = dim.top(Infinity).filter(d => d.taskId==taskId)[0][property];
                bars.filter( (d,i) => d.key == keyNow)
                    .style( "stroke-width", "4px" )
            });
        }

    }


};

export { cfD3BarChart };