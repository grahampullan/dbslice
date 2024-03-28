import { Component } from 'board-box';
import * as d3 from 'd3v7';

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
        this.layout = options.layout || {};
        this.data = options.data || {};
        this.fetchData = options.fetchData || null;
        this.headerOffset = 0;
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

    get plotAreaWidth() {
        return this.width - this.layout.margin.left - this.layout.margin.right;
    }

    get plotAreaHeight() {
        return this.height - this.layout.margin.top - this.layout.margin.bottom - this.headerOffset;
    }

    get plotAreaLeft() {
        return this.layout.margin.left;
    }

    get plotAreaTop() {
        return this.layout.margin.top + this.headerOffset;
    }

    get plotAreaId() {
        return `${this.id}-plot-area`;
    }

    addPlotAreaDiv() {
        const container = d3.select(`#${this.id}`);
        container.append("div")
            .attr("id", `${this.plotAreaId}`)
            .attr("class", "plot-area")
            .style("position", "absolute")
            .style("top", `${this.plotAreaTop}px`)
            .style("left", `${this.plotAreaLeft}px`)
            .style("width", `${this.plotAreaWidth}px`)
            .style("height", `${this.plotAreaHeight}px`)
            .attr("width", this.plotAreaWidth)
            .attr("height", this.plotAreaHeight);
        return;
    }

    addPlotAreaSvg() {
        const container = d3.select(`#${this.id}`);
        container.append("svg")
            .attr("id", `${this.plotAreaId}`)
            .attr("class", "plot-area")
            .style("position", "absolute")
            .style("top", `${this.plotAreaTop}px`)
            .style("left", `${this.plotAreaLeft}px`)
            .style("width", `${this.plotAreaWidth}px`)
            .style("height", `${this.plotAreaHeight}px`)
            .style("overflow", "visible")
            .attr("width", this.plotAreaWidth)
            .attr("height", this.plotAreaHeight);
        return;
    }

    updatePlotAreaSize() {
        const container = d3.select(`#${this.id}`);
        const plotArea = container.select(".plot-area");
        plotArea
            .style("top", `${this.plotAreaTop}px`)
            .style("left", `${this.plotAreaLeft}px`)
            .style("width", `${this.plotAreaWidth}px`)
            .style("height", `${this.plotAreaHeight}px`)
            .attr("width", this.width)
            .attr("height", this.height);
        return;
    }

    
    setTitle() {
        const container = d3.select(`#${this.id}`);
        if ( !this.layout.title ) {
            container.select(".plot-title").remove();
            return;
        }
        const title = container.select(".plot-title");
        if ( title.empty() ) {
            const newTitle = container.append("div")
                .attr("class", "plot-title")
                .attr("id", `${this.id}-plot-title`)
                .style("position", "absolute")
                .style("top", "0")
                .style("left", "0")
                .style("width", "100%")
                .text(this.layout.title);
            this.headerOffset = newTitle.node().clientHeight + 3;
        } else {
            title.text(this.layout.title);
            this.headerOffset = title.node().clientHeight + 3;
        }
    }

    updateHeader() {
        this.setTitle();
        return;
    }


}

export { Plot };