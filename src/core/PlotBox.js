import { Box, Observable } from 'board-box';

class PlotBox extends Box {
    constructor(options) {
        if (!options) { options={} }
        super(options);
        this.sharedState = {...this.sharedState, sharedCamera: new Observable({flag: false, state: {}})};
        this.locationForChildBoxes = options.locationForChildBoxes || "component-plot-area";
    }
}

export { PlotBox };