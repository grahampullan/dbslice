import { Plot } from './Plot.js';
import * as d3 from 'd3v7'

class PlotGroup extends Plot {

    constructor(options) {
		if (!options) { options={} }
		super(options);
    }

    make() {
        this.updateHeader();
        this.addPlotAreaDiv();
        d3.select(`#${this.plotAreaId}`).style("overflow", "hidden");
        this.setLasts();
        this.update();
    }

    update() {
        this.updateHeader();
        this.updatePlotAreaSize();
    }

}

export { PlotGroup };