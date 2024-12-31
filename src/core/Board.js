import { Board as bbBoard, Observable } from 'board-box';
import { PlotGroup } from '../plot/PlotGroup.js';
import { Box } from './Box.js';
import * as d3 from 'd3v7';

class Board extends bbBoard {
    constructor(options) {
        if (!options) { options={} };
        super(options);
        const requestWebGLRender = new Observable({flag:true, state:false});
        requestWebGLRender.subscribe(this.webGLRenderOrderUpdate.bind(this));
        this.sharedState = {...this.sharedState, requestWebGLRender} 
    }

    make() {
        super.make();
        const boardDiv = d3.select(`#${this.id}`);
        const boundBoardClick = this.boardClick.bind(this);
        boardDiv.append("div")
            .attr("class", "modal")
            .attr("id", `${this.id}-modal`)
            .on("click", (event)=>{
                event.stopPropagation();
                })
            .append("div")
                .attr("class", "modal-content")
                .attr("id", `${this.id}-modal-content`);
        boardDiv.on("click", boundBoardClick);
    }

    boardClick() {
        if (!this.plotGroupDrop) {
            this.plotGroupModal();
        } else {
            this.positionPlotGroup();
        }
    }

    plotGroupModal() {
        const modal = d3.select(`#${this.id}-modal`);
        const modalContent = d3.select(`#${this.id}-modal-content`);
        const boundMakePlotGroupDetailed = this.makePlotGroupDetailed.bind(this);
        const boundMakePlotGroupFilter = this.makePlotGroupFilter.bind(this);
        modalContent.append("h4").html("Add plot container");
        modalContent.append("hr");
        const buttonContainer = modalContent.append("div")
            .attr("class", "button-container");
        buttonContainer.append("button")
            .attr("class", "button")
            .html("Detail")
            .on("click", () => {
                boundMakePlotGroupDetailed();
                modal.style("display", "none");
                modalContent.selectAll("*").remove();
            });
        buttonContainer.append("button")
            .attr("class", "button")
            .html("Filters")
            .on("click", () => {
                boundMakePlotGroupFilter();
                modal.style("display", "none");
                modalContent.selectAll("*").remove();
            });
        modal.style("display", "block");
    }

    positionPlotGroup() {
    }

    makePlotGroupDetailed() {
        const dataset = this.sharedStateByAncestorId["context"].datasets[0];
        const boxesToAdd = dataset.availablePlots;
        const plotGroupBox = new Box({x:200,y:100, width:800, height:500, margin:0, autoLayout:true, component: new PlotGroup({layout:{title:"Detail plots", icons:["filter"]}})});
        this.sharedState.requestUpdateBoxes.state = {boxesToAdd:[plotGroupBox]};
        const plotGroupBoxId = plotGroupBox.id;
        const parentBox = this.boxes.find( box => box.id == plotGroupBoxId );
        parentBox.sharedState.requestUpdateBoxes.state = {boxesToAdd, boxesToRemove:[]};   
    }

    makePlotGroupFilter() {
        this.sharedStateByAncestorId["context"].showFilters = true;
        const datasets = this.sharedStateByAncestorId["context"].datasets;
        const datasetId = datasets[0].id; // set to first dataset for now
        //this.sharedStateByAncestorId["context"].requestCreateFilter.state = {datasetId};
        const filters = this.sharedStateByAncestorId["context"].filters;
        const filterId = filters[filters.length-1].id;
        const plotGroupBox = new Box({x:200,y:100, width:800, height:500, margin:0, autoLayout:true, component: new PlotGroup({layout:{title:"Filter plots", filterPlots:true, datasetId, filterId, icons:["add"]}})});
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



    



}

export { Board };