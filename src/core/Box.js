import { Box as bbBox, Observable } from 'board-box';

class Box extends bbBox {
    constructor(options) {
        if (!options) { options={} }
        super(options);
        this.sharedState = {...this.sharedState, sharedCamera: new Observable({flag: false, state: {}})};
        this.locationForChildBoxes = options.locationForChildBoxes || "component-plot-area";
    }
}

export { Box };