import { Component } from 'board-box';
import { fetchPlotData } from '../core/fetchPlotData';
import * as d3 from 'd3v7';
import { icon } from '@fortawesome/fontawesome-svg-core'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

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
        this.itemId = options.itemId || null;
        this.layout = options.layout || {};
        this.layout.icons = this.layout.icons || [];
        this.layout.margin = this.layout.margin || {top: 0, right: 0, bottom: 0, left: 0};
        this.data = options.data || {};
        this.fetchData = options.fetchData || null;
        this.headerOffset = 0;
        this.newData = true;
        this.fetchDataNow = true;
        this.icons = [];
        this.subscriptions = [];
        this.setCommonIcons();
    }

    get checkResize() {
        const ifResize = Math.round(this.width) !== Math.round(this.lastWidth) || Math.round(this.height) !== Math.round(this.lastHeight);
        return ifResize;
    }

    get checkMove() {
        const ifMove = Math.round(this.left) !== Math.round(this.lastLeft) || Math.round(this.top) !== Math.round(this.lastTop);
        return ifMove;
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
            .attr("width", this.plotAreaWidth)
            .attr("height", this.plotAreaHeight);
        return;
    }

    
    addTitle() {
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

    addIcons() {
        const container = d3.select(`#${this.id}`);
        const iconList = this.icons;
        if (!iconList || iconList.length === 0) {
            container.select(".plot-icons").remove();
            return; 
        }
        const title = container.select(".plot-title");
        let iconContainer = container.select(".plot-title").select(".plot-icons");
        if ( iconContainer.empty() ) {
            if ( title.empty() ) {
                iconContainer = container.append("div");
            } else {
                iconContainer = title.append("div");
            }
            iconContainer
                .attr("class", "plot-icons")
                .attr("id", `${this.id}-plot-icons`)
                .style("position", "absolute")
                .style("top", "0")
                .style("right", "0");
        }

        const icons = iconContainer.selectAll(".plot-icon").data(iconList);

        icons.enter()
            .append("div")
            .attr("class", "plot-icon")
            .html(d => icon(d.icon).html)
            .on("click", (e,d) => d.action() );
        icons.exit().remove();
    }
    
    setCommonIcons() {
        const icons = this.icons;

        this.layout.icons.forEach( iconAlias => {
            if ( iconAlias === "remove" ) {
                icons.push({icon: faXmark, action: () => {console.log(`remove plot id = ${this.id}`)}});
            }
        });
    
    }

    updateHeader() {
        this.addTitle();
        this.addIcons();
        return;
    }

    async getData() {
        if (!this.fetchData || !this.fetchDataNow){
            return;
        }
        this.fetchingData = true;
        this.data = await fetchPlotData(this.fetchData);
        this.fetchingData = false;
        this.fetchDataNow = false;
        this.newData = true;
    }

    removeSubscriptions() {
        this.subscriptions.forEach( sub => {
			sub.observable.unsubscribeById(sub.id);
		});
    }

}

export { Plot };