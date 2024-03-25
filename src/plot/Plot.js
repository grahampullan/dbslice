import { Component } from 'board-box';

//
// Plot is a class that extends Component. It is a base class for all plot types.
// It should provide the following methods:
// - plot titles
// - axis scales
// - colorbar

class Plot extends Component {
    constructor(options) {
        if (!options) { options={} }
        super(options);
        this.containerClassName = options.containerClassName || "plot-area";
        this.layout = options.layout || {};
        this.data = options.data || {};
        this.fetchData = options.fetchData || null;
        //this.lastWidth = this.width;
        //this.lastHeight = this.height;
        this.newData = true;
    }

    get checkResize() {
        const ifResize = Math.round(this.width) !== Math.round(this.lastWidth) || Math.round(this.height) !== Math.round(this.lastHeight);
        const ifMove = Math.round(this.left) !== Math.round(this.lastLeft) || Math.round(this.top) !== Math.round(this.lastTop);
        return ifResize || ifMove;
    }

    setLasts() {
        this.lastWidth = this.width;
        this.lastHeight = this.height;
        this.lastLeft = this.left;
        this.lastTop = this.top;
    }

}

export { Plot };