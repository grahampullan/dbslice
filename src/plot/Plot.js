import { Component } from 'board-box';

//
// Plot is a class that extends Component. It is a base class for all plot types.
// It should provide the following methods:
// - plot titles
// - axis scales
// - colorbar

class Plot extends Component {
    constructor(options) {
        super(options);
        this.layout = options.layout;
        this.data = options.data;
        this.fetchData = options.fetchData;
    }
}

export { Plot };