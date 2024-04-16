import { Box as bbBox, Observable } from 'board-box';

class Box extends bbBox {
    constructor(options) {
        if (!options) { options={} }
        options.boxesSharedStateKeys = ["boxId", "itemId"];
        super(options);
        this.sharedState = {...this.sharedState, boxes:[], sharedCamera: new Observable({flag: false, state: {}})};
        this.locationForChildBoxes = options.locationForChildBoxes || "component-plot-area";
    }
}

export { Box };