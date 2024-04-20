import { Component } from 'board-box';
import { fetchPlotData } from '../core/fetchPlotData';
import { filterPlots } from './filterPlots.js';
import * as d3 from 'd3v7';
import { icon } from '@fortawesome/fontawesome-svg-core'
import { faXmark, faFilter, faPlus  } from '@fortawesome/free-solid-svg-icons'

//
// Plot is a class that extends Component. It is a base class for all plot types.
// It should provide the following methods:
// - plot titles
// - axis scales
// - colorbar

class Plot extends Component {
    constructor(options) {
        if (!options) { options={} }
        super(options);
        this.itemId = options.itemId || null;
        this.layout = options.layout || {};
        this.layout.icons = this.layout.icons || [];
        this.layout.margin = this.layout.margin || {top: 0, right: 0, bottom: 0, left: 0};
        this.data = options.data || {};
        this.fetchData = options.fetchData || null;
        this.headerOffset = 0;
        this.newData = true;
        this.fetchDataNow = true;
        this.icons = [];
        this.subscriptions = [];
        this.setCommonIcons();
    }

    get checkResize() {
        const ifResize = Math.round(this.width) !== Math.round(this.lastWidth) || Math.round(this.height) !== Math.round(this.lastHeight);
        return ifResize;
    }

    get checkMove() {
        const ifMove = Math.round(this.left) !== Math.round(this.lastLeft) || Math.round(this.top) !== Math.round(this.lastTop);
        return ifMove;
    }


    setLasts() {
        this.lastWidth = this.width;
        this.lastHeight = this.height;
        this.lastLeft = this.left;
        this.lastTop = this.top;
    }

    get plotAreaWidth() {
        return this.width - this.layout.margin.left - this.layout.margin.right;
    }

    get plotAreaHeight() {
        return this.height - this.layout.margin.top - this.layout.margin.bottom - this.headerOffset;
    }

    get plotAreaLeft() {
        return this.layout.margin.left;
    }

    get plotAreaTop() {
        return this.layout.margin.top + this.headerOffset;
    }

    get plotAreaId() {
        return `${this.id}-plot-area`;
    }

    addPlotAreaDiv() {
        const container = d3.select(`#${this.id}`);
        container.append("div")
            .attr("id", `${this.plotAreaId}`)
            .attr("class", "plot-area")
            .style("position", "absolute")
            .style("top", `${this.plotAreaTop}px`)
            .style("left", `${this.plotAreaLeft}px`)
            .style("width", `${this.plotAreaWidth}px`)
            .style("height", `${this.plotAreaHeight}px`)
            .attr("width", this.plotAreaWidth)
            .attr("height", this.plotAreaHeight);
        return;
    }

    addPlotAreaSvg() {
        const container = d3.select(`#${this.id}`);
        container.append("svg")
            .attr("id", `${this.plotAreaId}`)
            .attr("class", "plot-area")
            .style("position", "absolute")
            .style("top", `${this.plotAreaTop}px`)
            .style("left", `${this.plotAreaLeft}px`)
            .style("width", `${this.plotAreaWidth}px`)
            .style("height", `${this.plotAreaHeight}px`)
            .style("overflow", "visible")
            .attr("width", this.plotAreaWidth)
            .attr("height", this.plotAreaHeight);
        return;
    }

    updatePlotAreaSize() {
        const container = d3.select(`#${this.id}`);
        const plotArea = container.select(".plot-area");
        plotArea
            .style("top", `${this.plotAreaTop}px`)
            .style("left", `${this.plotAreaLeft}px`)
            .style("width", `${this.plotAreaWidth}px`)
            .style("height", `${this.plotAreaHeight}px`)
            .attr("width", this.plotAreaWidth)
            .attr("height", this.plotAreaHeight);
        return;
    }

    
    addTitle() {
        const container = d3.select(`#${this.id}`);
        if ( !this.layout.title ) {
            container.select(".plot-title").remove();
            return;
        }
        const title = container.select(".plot-title");
        if ( title.empty() ) {
            const newTitle = container.append("div")
                .attr("class", "plot-title")
                .attr("id", `${this.id}-plot-title`)
                .style("position", "absolute")
                .style("top", "0")
                .style("left", "0")
                .style("width", "100%")
                .text(this.layout.title);
            this.headerOffset = newTitle.node().clientHeight + 3;
        } else {
            title.text(this.layout.title);
            this.headerOffset = title.node().clientHeight + 3;
        }
    }

    addIcons() {
        const container = d3.select(`#${this.id}`);
        const iconList = this.icons;
        if (!iconList || iconList.length === 0) {
            container.select(".plot-icons").remove();
            return; 
        }
        const title = container.select(".plot-title");
        let iconContainer = container.select(".plot-title").select(".plot-icons");
        if ( iconContainer.empty() ) {
            if ( title.empty() ) {
                iconContainer = container.append("div");
            } else {
                iconContainer = title.append("div");
            }
            iconContainer
                .attr("class", "plot-icons")
                .attr("id", `${this.id}-plot-icons`)
                .style("position", "absolute")
                .style("top", "0")
                .style("right", "0");
        }

        const icons = iconContainer.selectAll(".plot-icon").data(iconList);

        icons.enter()
            .append("div")
            .attr("class", "plot-icon")
            .html(d => icon(d.icon).html)
            .on("click", (e,d) => {console.log("click");d.action()} );
        icons.exit().remove();
    }
    
    setCommonIcons() {
        const icons = this.icons;

        this.layout.icons.forEach( iconAlias => {
            if ( iconAlias === "remove" ) {
                icons.push({icon: faXmark, action: () => {this.removePlot()}});
            }
            if ( iconAlias === "filter" ) {
                icons.push({icon: faFilter, action: () => {this.selectItemIds()}});
            }
            if ( iconAlias === "add" ) {
                icons.push({icon: faPlus, action: () => {this.addPlot()}});
            }
        });
    
    }

    updateHeader() {
        this.addTitle();
        this.addIcons();
        return;
    }

    async getData() {
        if (!this.fetchData || !this.fetchDataNow){
            return;
        }
        this.fetchingData = true;
        this.data = await fetchPlotData(this.fetchData);
        this.fetchingData = false;
        this.fetchDataNow = false;
        this.newData = true;
    }

    removeSubscriptions() {
        this.subscriptions.forEach( sub => {
			sub.observable.unsubscribeById(sub.id);
		});
    }

    selectItemIds() {
        const boundHandleCheckboxesApply = this.handleCheckboxesApply.bind(this);
        const boundHandleFilterSelected = this.handleFilterSelected.bind(this);
        const boardId = this.ancestorIds[this.ancestorIds.length-1];
        const showFilters = this.sharedStateByAncestorId["context"].showFilters;
        const modal = d3.select(`#${boardId}-modal`);
        const modalContent = d3.select(`#${boardId}-modal-content`);
       
        modalContent.selectAll("*").remove();
        const dataset = this.sharedStateByAncestorId["context"].datasets[0];
        const allItemIds = dataset.data.map( d => d.itemId);


        modalContent.append("h4").html("Select items");
        modalContent.append("hr");
        if (showFilters) {
            modalContent.append("h4").html("Filters:");
            const filtersContainer = modalContent.append("div")
                .attr("class", "button-container");
        
            const filterIds = this.sharedStateByAncestorId["context"].filters.map( f => f.id );
      
            const buttonGrid = filtersContainer.append("div")
            buttonGrid.selectAll(".button")
                .data(filterIds)
                .enter()
                .append("button")
                .attr("class", "button")
                .text(function(d) { return d; })
                .on("click", (event, d) => {
                    const filterSelected = d;
                    modal.style("display", "none");
                    modalContent.selectAll("*").remove();
                    boundHandleFilterSelected(filterSelected);
            });
            modalContent.append("hr");
        }
        
        modalContent.append("h4").html("Items:");
        let currentItemIds = this.itemIds;
        if (!currentItemIds) {currentItemIds = [];}
        const checkboxContainer = modalContent.append("div")
            .attr("class", "checkbox-container");
        const checkboxes = checkboxContainer.selectAll(".checkbox")
            .data(allItemIds);
        checkboxes.enter().each( d => {
            const checkboxDiv = checkboxContainer.append("div").attr("class", "checkbox");
            const checkboxInput = checkboxDiv.append("input")
                .attr("type", "checkbox")
                .attr("id", `checkbox-${d}`)
                .attr("value", d);
            if (currentItemIds.indexOf(d) !== -1) {
                checkboxInput.attr("checked", true);
            }
            checkboxDiv.append("label")
                .attr("for", `checkbox-${d}`)
                .text(` ${d}`);
            });
        
        const buttonContainer = modalContent.append("div")
            .attr("class", "button-container");
        buttonContainer.append("button")
            .attr("class", "button")
            .html("Apply")
            .on("click", boundHandleCheckboxesApply);
        modal.node().scrollTop = 0;
        modalContent.node().scrollTop = 0;
        
        modal.style("display", "block");
        
    }

    handleCheckboxesApply() {
        const boardId = this.ancestorIds[this.ancestorIds.length-1];
        const modal = d3.select(`#${boardId}-modal`);
        const modalContent = d3.select(`#${boardId}-modal-content`);
        const checkedBoxes = modalContent.selectAll("input:checked");
        const itemIds = checkedBoxes.nodes().map( cb => cb.value);
        modal.style("display", "none");
        modalContent.selectAll("*").remove();
        console.log(itemIds);
        this.itemIds = itemIds;
        this.sharedState.requestFetchDataByItemIds.state = {itemIds: itemIds};
        // this.sharedState.requestFetchDataByFilter.state = {filterId: filterId};

    }

    handleFilterSelected(filterSelected) {
        console.log("filterSelected");
        console.log(filterSelected);
        this.sharedState.requestFetchDataByFilter.state = {filterId: filterSelected};
    }

    addPlot() {
        console.log("add plot");
        console.log(this);
        console.log(filterPlots);
        const boundAddNewFilterPlot = this.addNewFilterPlot.bind(this);
        const boardId = this.ancestorIds[this.ancestorIds.length-1];
        this.sharedStateByAncestorId[boardId].preventZoom = true;
        const modal = d3.select(`#${boardId}-modal`);
        const modalContent = d3.select(`#${boardId}-modal-content`);
        modalContent.selectAll("*").remove();
        modalContent.append("h4").html("Select plot type");
        modalContent.append("hr");
        const plotTypes = filterPlots.map( p => p.name );
        const buttonGrid = modalContent.append("div")
            .attr("class", "button-container");
        buttonGrid.selectAll(".button")
            .data(plotTypes)
            .enter()
            .append("button")
            .attr("class", "button")
            .text(function(d) { return d; })
            .on("click", (event, d) => {
                const plotType = d;
                //modal.style("display", "none");
                //modalContent.selectAll("*").remove();
                event.stopPropagation();
                boundAddNewFilterPlot(plotType);
        });
        modal.style("display", "block");
      

        //this.sharedState.requestAddNewFilterPlot.state = {type, data};
    }

    addNewFilterPlot(plotType) {
        console.log("addNewFilterPlot");
        console.log(plotType);
        const requestAddFilterPlot = this.sharedState.requestAddFilterPlot;
        const dataNeeded = filterPlots.find( p => p.name === plotType ).dataNeeded;
        console.log(dataNeeded);
        const filterId = "filter-0"; // hard coded for now
        const continuousProperties = this.sharedStateByAncestorId["context"].filters.find( f => f.id == filterId ).continuousProperties;
        const categoricalProperties = this.sharedStateByAncestorId["context"].filters.find( f => f.id == filterId ).categoricalProperties;
        const propertyOptions = {};
        propertyOptions.continuous = continuousProperties;
        propertyOptions.categorical = categoricalProperties;
        console.log(propertyOptions);

        const boardId = this.ancestorIds[this.ancestorIds.length-1];
        const boardSharedState = this.sharedStateByAncestorId[boardId];
        console.log(boardId);
        const modal = d3.select(`#${boardId}-modal`);
        const modalContent = d3.select(`#${boardId}-modal-content`);
        modalContent.on("click", (event) => {
            event.stopPropagation();
        });
        modalContent.append("hr");
        modalContent.select(".dropdown-container").remove();
        const dropdownContainer = modalContent.append("div")
            .attr("class", "dropdown-container");
        const dropdowns = dropdownContainer.selectAll(".dropdown").data(dataNeeded)
            .enter().append("div");
        dropdowns.append("label")
            .text(function(d) { return d.name; });
        dropdowns.append("select")
            .on("click", (event) => {
                console.log("click");
                console.log(event);
            })
            .on("change input drag", (event) => {
                console.log(event);
                event.stopPropagation();})
            .selectAll("option")
            .data( d => propertyOptions[d.type] )
            .enter()
                .append("option")
                .text(function(d) { return d; });
            
        dropdownContainer.append("button")
            .attr("class", "button")
            .text("Make plot")
            .on("click", function() {
                const dropdownValues = {};
                dropdowns.each(function(d, i) {
                    const dropdown = d3.select(this).select("select");
                    let selectedValue = dropdown.property("value");
                    dropdownValues[dataNeeded[i].name] = selectedValue;
                });
                requestAddFilterPlot.state={plotType, filterId, dataProperties:dropdownValues};
                modal.style("display","none");
                modalContent.selectAll("*").remove();
                boardSharedState.preventZoom = false;
            
            });       
    }

    removePlot() {
        console.log("removePlot");
        const parentId = this.ancestorIds[this.ancestorIds.length-1];
        console.log(parentId);
        this.sharedStateByAncestorId[parentId].requestRemovePlot.state = {id:this.id};
    }
            
       
        

       

}

export { Plot };