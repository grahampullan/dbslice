import { Board as bbBoard, Observable } from 'board-box';
import { PlotGroup } from '../plot/PlotGroup.js';
import { Box } from './Box.js';
import * as d3 from 'd3v7';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { faDownload  } from '@fortawesome/free-solid-svg-icons';
import { createBoxFromJson } from './Context.js';
//import cloneDeep from 'lodash/cloneDeep';

class Board extends bbBoard {
    constructor(options) {
        if (!options) { options={} };
        super(options);
        const requestWebGLRender = new Observable({flag:true, state:false});
        requestWebGLRender.subscribe(this.webGLRenderOrderUpdate.bind(this));
        const requestSetTrafficLightColor = new Observable({flag:false, state:"green"});
        requestSetTrafficLightColor.subscribe( this.setTrafficLightColor.bind(this) );
        if (options.downloadIcon === undefined) {
            this.downloadIcon = true;
        } else {
            this.downloadIcon = options.downloadIcon;
        }
        this.sharedState = {...this.sharedState, requestWebGLRender, requestSetTrafficLightColor}; 
        this.fetchCount = 0;
    }

    make() {
        super.make();
        const boardDiv = d3.select(`#${this.id}`);
        const boundBoardClick = this.boardClick.bind(this);
        boardDiv.append("div")
            .attr("class", "modal")
            .attr("id", `${this.id}-modal`)
            .on("click mousedown wheel", (event)=>{
                event.stopPropagation();
                })
            .append("div")
                .attr("class", "modal-content")
                .attr("id", `${this.id}-modal-content`);
        boardDiv.on("click", boundBoardClick);
        const boardTopRightContainer = boardDiv.append("div")
            .attr("class", "board-top-right-container")
            .style("position", "absolute")
            .style("top", "3px")
            .style("right", "3px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("pointer-events", "auto")
            .style("border", "1px solid lightgrey")
            .style("border-radius", "4px")
            .style("background-color", "white")
            .style("padding", "2px");
        const boardIconsContainer = boardTopRightContainer.append("div")
            .attr("class", "board-icons-container plot-icons");
        const boardTafficLightContainer = boardTopRightContainer.append("div")
            .attr("class", "board-traffic-light-container plot-icons")
            .style("width", "20px")
            .style("height", "20px");

        if (this.downloadIcon) {
            boardIconsContainer.append("div")
                .attr("class", "plot-icon")
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center")
                .style("border-radius", "4px")
                .style("background-color", "lightgrey" )
                .style("width", "20px")
                .style("height", "20px")
                .html(icon(faDownload).html)
                .on("click", (event) => {
                    event.stopPropagation();
                    this.downloadJson();
                });
        }

        boardTafficLightContainer.append("svg")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("align-items", "center")
            .attr("width", 20)
            .attr("height", 20)
            .append("circle")
                .attr("class", "board-traffic-light")
                .attr("cx", 10)
                .attr("cy", 10)
                .attr("r", 8)
                .attr("fill", "green");

        if (this.showPlotGroupModalOnStart) {
            this.plotGroupModal();
        }
    }

    boardClick() {
        //console.log("board click");
        if (!this.plotGroupDrop) {
            this.plotGroupModal();
        } else {
            this.positionPlotGroup();
        }
        //console.log("downloading json");
        //this.downloadJson();
    }

    plotGroupModal() {
        this.clearWebGLRenderer();
        const modal = d3.select(`#${this.id}-modal`);
        const modalContent = d3.select(`#${this.id}-modal-content`);
        const boundMakePlotGroupDetailed = this.makePlotGroupDetailed.bind(this);
        const boundMakePlotGroupFilter = this.makePlotGroupFilter.bind(this);
        modalContent.append("a")
            .attr("class", "cancel")
            .style("text-decoration", "none")
            .style("position", "absolute")
            .style("top", "0")
            .style("right", "10px")
            .style("cursor", "pointer")
            .html("cancel")
            .on("click", () => {
                modal.style("display", "none");
                modalContent.selectAll("*").remove();
        });
        modalContent.append("h4").html("Add plot container");
        modalContent.append("hr");
        const buttonContainer = modalContent.append("div")
            .attr("class", "button-container");
        const detailedButton = buttonContainer.append("button")
            .attr("class", "button")
            .html("Detail")
            .on("click", () => {
                boundMakePlotGroupDetailed();
                modal.style("display", "none");
                modalContent.selectAll("*").remove();
            });
        if (this.detailedContainer) detailedButton.attr("disabled", true);

        const filterButton = buttonContainer.append("button")
            .attr("class", "button")
            .html("Filters")
            .on("click", () => {
                boundMakePlotGroupFilter();
                modal.style("display", "none");
                modalContent.selectAll("*").remove();
            });
        if (this.filterContainer) filterButton.attr("disabled", true);

        modal.style("display", "block");
    }

    positionPlotGroup() {
    }

    makePlotGroupDetailed() {
        this.detailedContainer = true;
        const dataset = this.sharedStateByAncestorId["context"].datasets[0];
        const boxesToAdd = dataset.availablePlots.map( plotJson => createBoxFromJson(plotJson) );              
        const plotGroupBox = new Box({x:200,y:100, width:800, height:500, margin:0, autoLayout:true, component: new PlotGroup({layout:{title:"Detail plots", icons:["filter"]}})});
        this.sharedState.requestUpdateBoxes.state = {boxesToAdd:[plotGroupBox]};
        const plotGroupBoxId = plotGroupBox.id;
        const parentBox = this.boxes.find( box => box.id == plotGroupBoxId );
        parentBox.sharedState.requestUpdateBoxes.state = {boxesToAdd, boxesToRemove:[]};   
    }

    makePlotGroupFilter() {
        this.filterContainer = true;
        this.sharedStateByAncestorId["context"].showFilters = true;
        const datasets = this.sharedStateByAncestorId["context"].datasets;
        const datasetId = datasets[0].id; // set to first dataset for now
        //this.sharedStateByAncestorId["context"].requestCreateFilter.state = {datasetId};
        const filters = this.sharedStateByAncestorId["context"].filters;
        const filterId = filters[filters.length-1].id;
        const plotGroupBox = new Box({x:200,y:100, width:500, height:500, margin:0, autoLayout:true, component: new PlotGroup({layout:{title:"Filter plots", filterPlots:true, datasetId, filterId, icons:["add"]}})});
        this.sharedState.requestUpdateBoxes.state = {boxesToAdd:[plotGroupBox]};
    }

    webGLRenderOrderUpdate() {
        const board = d3.select(`#${this.id}`);
        const allBoxIdsInDOMOrder = board.selectAll(".board-box").nodes().map( node => node.id );
        let observers = this.sharedState.requestWebGLRender.observers.slice(1);
        if (observers.length == 0) {return;};
        const sortedObservers = allBoxIdsInDOMOrder.map( id => observers.find( observer => observer.data.boxId == id ) ).filter(Boolean);
        this.sharedState.requestWebGLRender.observers.splice(1, sortedObservers.length, ...sortedObservers);
    }

    customOnUpdateEnd() {
        const requestWebGLRender = this.sharedState.requestWebGLRender;
        requestWebGLRender.state = true;
    }

    clearWebGLRenderer() {
        const renderer = this.sharedStateByAncestorId["context"].renderer;
        renderer.setClearColor(0x000000, 0); 
        renderer.clear();
    }

    setTrafficLightColor(status) {
        if (status == "fetching") this.fetchCount++;
        if (status == "fetched") this.fetchCount--;
        const board = d3.select(`#${this.id}`);
        if (this.fetchCount > 0) {
            board.select(".board-traffic-light").attr("fill","yellow");
        } else {
            board.select(".board-traffic-light").attr("fill", "green");
        }
    }

}

export { Board };