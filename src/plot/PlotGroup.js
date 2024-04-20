import { Plot } from './Plot.js';
import { Box } from '../core/Box.js';
import { TriMesh3D } from './TriMesh3D.js';
import { Observable } from 'board-box';
import * as d3 from 'd3v7'

class PlotGroup extends Plot {

    constructor(options) {
		if (!options) { options={} }
		super(options);
        this.ctrl = options.ctrl || null;
    }

    make() {
        
        this.updateHeader();
        this.addPlotAreaDiv();
        const plotArea = d3.select(`#${this.plotAreaId}`);
        plotArea.style("overflow", "hidden")
            .style("overflow-y", "auto");
        const boundHandleScroll = this.handleScroll.bind(this);
        plotArea.on("scroll", boundHandleScroll);
        this.sharedState.scrolling = new Observable({flag: false, state: {}});
        this.setLasts();
        this.checkForCtrl();
        this.update();
    }

    update() {
        this.updateHeader();
        this.updatePlotAreaSize();
    }

    checkForCtrl() {
        if (!this.ctrl) {
            return;
        }
        if (this.ctrl.fetchData) {
            const fetchData = this.ctrl.fetchData;
            if (fetchData.getItemIdsFromFilter) {
                fetchData.itemIds =  this.sharedStateByAncestorId["context"].filters.find( f => f.id == fetchData.filterId ).itemIdsInFilter.state.itemIds;
            }
            if (fetchData.autoFetchOnFilterChange) {
                this.sharedStateByAncestorId["context"].filters.find( f => f.id == fetchData.filterId ).itemIdsInFilter.subscribe( this.refreshItemIds.bind(this) );
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
        const currentBoxes = this.sharedState.boxes;
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
            const plot = new TriMesh3D(plotOptions);
            const box = new Box({x:0, y:0, width:ctrl.layout.width, height:ctrl.layout.height, component: plot });
            boxesToAdd.push(box);
        });
        this.sharedState.requestUpdateBoxes.state = {boxesToRemove, boxesToAdd};
    }

    handleScroll() {
        this.sharedState.scrolling.state = {scrolling:true};
        /*clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout( () => {
            this.sharedState.scrolling.state = {scrolling:false};
            console.log("scrolling done")
        }, 200);*/
    }

}

export { PlotGroup };