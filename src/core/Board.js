import { Board as bbBoard, Observable } from 'board-box';

class Board extends bbBoard {
    constructor(options) {
        if (!options) { options={} };
        super(options);
        const requestWebGLRender = new Observable({flag:true, state:false});
        this.sharedState = {...this.sharedState, requestWebGLRender};
    }
}

export { Board };