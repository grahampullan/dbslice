import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { refreshTasksInPlotRows } from '../core/refreshTasksInPlotRows.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';
import { Plot } from './Plot.js';

class MetaDataBarChart extends Plot {

    constructor(options) {
        if (!options) { options={} }
        options.layout = options.layout || {};
		options.layout.margin = options.layout.margin || {top:5, right:20, bottom:30, left:20};
        options.layout.highlightItems = options.layout.highlightItems || true;
        super(options);
    }

    make() {
        this.filterId = this.data.filterId;
        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        filter.itemIdsInFilter.subscribe( this.handleFilterChange.bind(this) );
        if ( this.layout.highlightItems ) {
            filter.highlightItemIds.subscribe( this.highlightItems.bind(this) );
        }
        this.dimId = filter.categoricalProperties.indexOf( this.data.property );
    
        this.updateHeader(); 
        this.addPlotAreaSvg();
        this.setLasts();

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

        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        const property = this.data.property;
        const dimId = this.dimId;
        const dim = filter.categoricalDims[ dimId ];
        const group = dim.group();
        const items = group.all();
        const selected = filter.categoricalFilterSelected[ dimId ];

        
        /* if ( this.layout.addSelectablePropertyToTitle ) {

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

        }*/

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
    
        colour.domain( filter.categoricalUniqueValues[ property ] );

        const bars = plotArea.selectAll( "rect" )
            .data( items, v => v.key );

        bars.enter()
            .append( "rect" )
            .on( "click", ( event, selectedItem ) => {
                filter.requestSetCategoricalFilter.state = { dimId, value: selectedItem.key, brushing: false };
            })
            .attr( "height", y.bandwidth() )
            .attr( "y", v => y(v.key) )
            .style( "fill", v => colour(v.key) )
            .style( "cursor", "pointer")
            .attr( "width", v => x( v.value ) )
            .attr( "opacity", ( v ) => {
                if ( selected === undefined || selected.length === 0 ) {
                    return 1;
                } else {
                    return selected.indexOf( v.key ) === -1 ? 0.2 : 1;
                }
            });

        // updating the bar chart bars
        bars
            .attr( "width", v => x( v.value ) )
            .attr( "y", v => y(v.key) )
            .attr( "height", y.bandwidth() )
            .attr( "opacity", ( v ) => {
                if ( selected === undefined || selected.length === 0 ) {
                    return 1;
                } else {
                    return selected.indexOf( v.key ) === -1 ? 0.2 : 1;
                }
            });

        bars.exit().remove();
          

        const xAxis = d3.axisBottom( x );
        if ( this.layout.xTickNumber !== undefined ) { xAxis.ticks(this.layout.xTickNumber); }
        if ( this.layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(this.layout.xTickFormat)); }

        let gX = plotArea.select(".x-axis");
        if ( gX.empty() ) {
            let axisLabel = "Number of Items";
            /*if (dbsliceData.session.uiConfig.replaceTasksNameWith !== undefined) {
                axisLabel = `Number of ${dbsliceData.session.uiConfig.replaceTasksNameWith}`;
            }*/
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
            gX.attr( "transform", `translate(0, ${height})` ).call( xAxis );
            gX.select(".x-axis-text").attr("x",width);
        }

        let yAxis = plotArea.select(".y-axis");
        if ( yAxis.empty() ) {
            plotArea.append("g")
                .attr( "class", "y-axis")
                .call( d3.axisLeft( y ).tickValues( [] ) );
        } else {
            yAxis.call( d3.axisLeft( y ).tickValues( []) );
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
        keyLabels
             .attr( "y", v => y(v.key) + 0.5*y.bandwidth() )
             .text( v => v.key );

        keyLabels.exit()
            .remove();

        /*function propertySelectChange(e) {
            this.data.property = e.target.value;
            this.update();
        }*/

    }

    highlightItems() {

        const container = d3.select(`#${this.id}`);
        const plotArea = container.select(".plot-area");
        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        const highlightItemIds = filter.highlightItemIds.state.itemIds;
        const bars = plotArea.selectAll( "rect" );
        const property = this.data.property;
        const dim = filter.continuousDims[ this.dimId ];

        if (highlightItemIds === undefined || highlightItemIds.length == 0) {
            bars.style( "stroke-width", "0px" );
        } else {
            bars
                .style( "stroke-width", "0px" )
                .style( "stroke", "red" ); 
            highlightItemIds.forEach( (itemId) => {
                let keyNow = dim.top(Infinity).filter(d => d.itemId==itemId)[0][property];
                bars.filter( (d,i) => d.key == keyNow)
                    .style( "stroke-width", "4px" )
            });
        }

    }

    handleFilterChange( data ) {
        this.update();
    }


};

export { MetaDataBarChart };