import { PlotV3_1 } from './PlotV3_1.js';
import { Box } from '../core/Box.js';
//import { TriMesh3D } from './TriMesh3D.js';
import { Observable } from 'board-box';
import { getComponentFromType } from './getComponentFromType.js';
import * as d3 from 'd3v7'

class PlotGroup extends PlotV3_1 {

    constructor(options) {
		if (!options) { options={} }
		super(options);
        this.ctrl = options.ctrl || null;
        this.componentType = options.componentType || "PlotGroup";
    }

    createPlotArea() {
        this.addPlotAreaDiv();
        const plotArea = this.plotAreaSel;
        plotArea
            .style("will-change", "transform")
            .style("overflow", "hidden")
            .style("overflow-y", "auto");
        plotArea.on("scroll", this.handleScroll.bind(this));
    }

    initBindings() {
        this.sharedState = {
            state: {
                boxes: [],
                sharedCamera: {position:null, rotation:null, zoom:null}
            },
            services: {},
            events: {
                boxes: {
                    update: new Observable({flag: false, state: {boxesToAdd:[], boxesToRemove:[]}})
                }
            }
        };
        this.checkForCtrl();
    }

    async doUpdate() {
        this.updatePlotAreaSize();
    }

    checkForCtrl() {
        if (!this.ctrl) {
            return;
        }
        if (this.ctrl.fetchData) {
            const fetchData = this.ctrl.fetchData;
            if (fetchData.getItemIdsFromFilter) {
                const filter = this.contextState.filters.find( f => f.id == fetchData.filterId );
                fetchData.itemIds = filter?.itemIdsInFilter.state.itemIds;
            }
            if (fetchData.autoFetchOnFilterChange) {
                this.contextState.filters.find( f => f.id == fetchData.filterId )?.itemIdsInFilter.subscribe( this.refreshItemIds.bind(this) );
            }
            this.refreshItemIds({itemIds:fetchData.itemIds, brushing:false});
        }
    }

    refreshItemIds(data) {
        if (data.brushing) return;
        const ctrl = this.ctrl;
        const fetchData = ctrl.fetchData;
        let itemIds = fetchData.itemIds;
        if (fetchData.getItemIdsFromFilter) {
            itemIds = data.itemIds;
        }
        const currentBoxes = this.sharedState.state.boxes;
        const currentItemIds = currentBoxes.map( box => box.itemId );
        const itemIdsToAdd = itemIds.filter( itemId => !currentItemIds.includes( itemId ) );
        const itemIdsToRemove = currentItemIds.filter( itemId => !itemIds.includes( itemId ) );
        const boxesToRemove = currentBoxes.filter( box => itemIdsToRemove.includes( box.itemId ) ).map( box => box.boxId );
        const boxesToAdd = [];
        itemIdsToAdd.forEach( itemId => {
            const url = fetchData.urlTemplate.replace( "${itemId}", itemId );
            const plotFetchData = {...fetchData};
            delete plotFetchData.urlTemplate;
            const plotLayout = {...ctrl.layout};
            if (plotLayout.title) {
                plotLayout.title = plotLayout.title.replace( "${itemId}", itemId );
            }
            plotFetchData.url = url;
            const plotOptions = {itemId, fetchData:plotFetchData, layout:plotLayout};
            const componentClass = getComponentFromType(ctrl.type);
            const plot = new componentClass(plotOptions);
            const box = new Box({x:0, y:0, width:ctrl.layout.width, height:ctrl.layout.height, component: plot });
            boxesToAdd.push(box);
        });
        this.sharedState.events.boxes.update.state = {boxesToRemove, boxesToAdd};
    }

    handleScroll() {
        // no-op placeholder; kept for potential scroll-triggered renders
    }

}

export { PlotGroup };
