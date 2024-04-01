import { Plot } from './Plot.js';

class PlotGroup extends Plot {

    constructor(options) {
		if (!options) { options={} }
		super(options);
    }

    make() {
        this.updateHeader();
        this.addPlotAreaDiv();
        this.setLasts();
        this.update();
    }

    update() {
        this.updateHeader();
        this.updatePlotAreaSize();
    }

}

export { PlotGroup };