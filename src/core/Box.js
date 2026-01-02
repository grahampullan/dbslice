import { Box as bbBox, Observable } from 'board-box';
import { MetaDataHistogram } from '../plot/MetaDataHistogram.js';
import { MetaDataScatter } from '../plot/MetaDataScatter.js';
import { MetaDataBarChart } from '../plot/MetaDataBarChart.js';
import { MetaDataRankCorrBarChart } from '../plot/MetaDataRankCorrBarChart.js';
import * as d3 from 'd3v7';


class Box extends bbBox {
    constructor(options) {
        if (!options) { options={} }
        options.boxesSharedStateKeys = ["boxId", "itemId"];
        super(options);
        const requestFetchDataByItemIds = new Observable({flag: false, state: {}});
        requestFetchDataByItemIds.subscribe( this.fetchDataByItemIds.bind(this) );   
        const requestFetchDataByFilter = new Observable({flag: false, state: {}});
        requestFetchDataByFilter.subscribe( this.fetchDataByFilter.bind(this) );
        const requestAddFilterPlot = new Observable({flag: false, state: {}});
        requestAddFilterPlot.subscribe( this.addFilterPlot.bind(this) );
        const requestRemovePlot = new Observable({flag: false, state: {}});
        requestRemovePlot.subscribe( this.removePlot.bind(this));

        this.sharedState = {
            ...this.sharedState,
            state: {
                boxes: []
            },
            services: {},
            events: {
                data: {
                    fetchByItemIds: requestFetchDataByItemIds,
                    fetchByFilter: requestFetchDataByFilter
                },
                plots: {
                    addFilterPlot: requestAddFilterPlot,
                    removePlot: requestRemovePlot
                }
            }
        };

        this.locationForChildBoxes = options.locationForChildBoxes || "component-plot-area";
    }

    make() {
        super.make();
        const boxDiv = d3.select(`#${this.id}`);
        boxDiv.on("click", (event)=>{
            event.stopPropagation();})
    }

    fetchDataByItemIds(data) {
        //console.log("fetchDataByItemIds");
        const itemIds = data.itemIds;
        //console.log(itemIds);
        this.boxes.forEach( box => {
            const plot = box.component;
            //console.log(plot);
            if (plot.ctrl) {
                const fetchData = plot.ctrl.fetchData;
                fetchData.itemIds = itemIds;
                fetchData.getItemIdsFromFilter = false;
                fetchData.fetchDataNow = true;
                plot.refreshItemIds({itemIds:itemIds, brushing:false});
            } else if (plot.fetchData) {
                if (plot.fetchData.urlTemplate) {
                    plot.fetchData.getItemIdsFromFilter = false;
                    plot.handleFilterChange({itemIds:itemIds, brushing:false, noFilter:true});
                }
            }
        });
        //this.updateDescendants();
    }

    fetchDataByFilter(data) {
        //console.log("fetchDataByFilter");
        const filterId = data.filterId;
        const contextState = this.sharedStateByAncestorId?.context?.state;
        const filter = contextState?.filters?.find( f => f.id === filterId );
        if (!filter) return;
        const itemIds = filter.itemIdsInFilter.state.itemIds;
        this.boxes.forEach( box => {
            const plot = box.component;
            //console.log(plot);
            if (plot.ctrl) {
                const fetchData = plot.ctrl.fetchData;
                fetchData.itemIds = itemIds;
                fetchData.getItemIdsFromFilter = true;
                fetchData.fetchDataNow = true;
                plot.refreshItemIds({itemIds:itemIds, brushing:false});
            } else if (plot.fetchData) {
                if (plot.fetchData.urlTemplate) {
                    plot.fetchData.getItemIdsFromFilter = true;
                    plot.handleFilterChange({itemIds:itemIds, brushing:false});
                }
            }
        });
    }

    addFilterPlot(data) {
        //console.log(data);
        const plotType = data.plotType;
        const filterId = data.filterId;
        const dataProperties = data.dataProperties;
        if (plotType == "Histogram") {
            const title = dataProperties.property;
            const box = new Box({x:0,y:0, width:250, height:200, component: new MetaDataHistogram({data:{filterId, ...dataProperties}, layout:{title,icons:["remove"]}  })});
            this.updateBoxes({boxesToAdd:[box], boxesToRemove:[]});
        }
        if (plotType == "Scatter plot") {
            const title = dataProperties.yProperty;
            const box = new Box({x:0,y:0, width:250, height:200, component: new MetaDataScatter({data:{filterId, ...dataProperties}, layout:{title,icons:["remove"]}  })});
            this.updateBoxes({boxesToAdd:[box], boxesToRemove:[]});
        }
        if (plotType == "Bar chart") {
            const title = dataProperties.property;
            const box = new Box({x:0,y:0, width:250, height:200, component: new MetaDataBarChart({data:{filterId, ...dataProperties}, layout:{title,icons:["remove"]}  })});
            //console.log(box);
            this.updateBoxes({boxesToAdd:[box], boxesToRemove:[]});
        }
        if (plotType == "Rank correlation") {
            const title = `Correlation for ${dataProperties.outputProperty}`;
            const box = new Box({x:0,y:0, width:250, height:200, component: new MetaDataRankCorrBarChart({data:{filterId, ...dataProperties}, layout:{title,icons:["remove"]}  })});
            this.updateBoxes({boxesToAdd:[box], boxesToRemove:[]});
        }
    }

    removePlot(data) {
        //console.log("removePlot");
        //console.log(data);
        const idToRemove = data.id;
        this.updateBoxes({boxesToAdd:[], boxesToRemove:[idToRemove]});
    }

    customOnUpdateEnd() {
        const requestWebGLRender = this.sharedStateByAncestorId[this.boardId].requestWebGLRender;
        if (requestWebGLRender) requestWebGLRender.state = true;
    }
    

}

export { Box };
