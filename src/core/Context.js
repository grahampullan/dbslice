import { Context as bbContext } from 'board-box';
import { Observable } from 'board-box';
import * as d3 from 'd3v7';
import * as THREE from 'three';

class Context extends bbContext {
    constructor() {
        super();
        const canvas = d3.select("body").append("canvas");
        //const canvas = d3.select("body").insert("canvas", ":first-child");
        canvas
            .attr("id", "dbslice-canvas")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("z-index", "1")
            .style("pointer-events", "none");
        const renderer = new THREE.WebGLRenderer({canvas: canvas.node(), alpha:true, logarithmicDepthBuffer: true, stencil: true, antialias: true});
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
        renderer.setScissorTest( true );
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.sharedState.renderer = renderer;
        this.metaData = {datasets:[], filters:[]};
        this.sharedState.filters = this.metaData.filters;
        this.sharedState.datasets = this.metaData.datasets;
        this.sharedState.showFilters = false;
        this.sharedState.derivedData = [];
        const requestCreateFilter = new Observable({flag: false, state: {}});
        requestCreateFilter.subscribe( this.createNewFilter.bind(this) );
        this.sharedState.requestCreateFilter = requestCreateFilter;
        const requestCreateDerivedDataStore = new Observable({flag: false, state: {}});
        requestCreateDerivedDataStore.subscribe( this.createDerivedDataStore.bind(this) );
        this.sharedState.requestCreateDerivedDataStore = requestCreateDerivedDataStore;
        const requestSaveToDerivedData = new Observable({flag: false, state: {}});
        requestSaveToDerivedData.subscribe( this.saveToDerivedData.bind(this) );
        this.sharedState.requestSaveToDerivedData = requestSaveToDerivedData;
        this.maxDataset = 0;
        this.maxFilter = 0;
    }

    addDataset(dataset) {
        const id = `dataset-${this.maxDataset}`;
        this.maxDataset++;
        dataset.id = id;
        this.metaData.datasets.push(dataset);   
    }

    addFilter(filter) {
        const id = `filter-${this.maxFilter}`;
        this.maxFilter++;
        filter.id = id;
        this.metaData.filters.push(filter);
    }

    createNewFilter(data) {
        datasetId = data.datasetId;
        const newFilter = this.datasets.find( dataset => dataset.id == datasetId ).createFilter();
        this.addFilter(newFilter);
    }

    createDerivedDataStore(data) {
        const derivedData = {name:data.name, data:[], newData: new Observable({flag: true, state:false})};
        this.sharedState.derivedData.push(derivedData);
    }

    saveToDerivedData(data) {
        let derivedData = this.sharedState.derivedData.find( d => d.name == data.name );
        if (!derivedData) {
            this.createDerivedDataStore({name:data.name});
            derivedData = this.sharedState.derivedData.find( d => d.name == data.name );
        }
        const itemId = data.itemId;
        const targetStore = derivedData.data.find( d => d.itemId == itemId );
        if (targetStore) {
            targetStore.data = data.data;
            targetStore.newDate = true;
        } else {
            derivedData.data.push({itemId, data:data.data, newDate:true});
        }
        derivedData.newData.state = true;
    }

}

export { Context };