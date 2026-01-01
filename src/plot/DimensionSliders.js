import * as d3 from 'd3v7';
import { PlotV3_1 } from './PlotV3_1.js';

class DimensionSliders extends PlotV3_1 {

    constructor(options) {
		if (!options) { options={} }
        options.layout = options.layout || {};
		options.layout.margin = options.layout.margin || {top:5, right:5, bottom:5, left:5};
        super(options);
        this.componentType = "DimensionSliders";
        this.sliders = [];
    }

    createPlotArea() {
        this.addPlotAreaDiv();
        const plotArea = this.plotAreaSel;
        const slidersContainer = plotArea.select(".sliders-container");
        if (slidersContainer.empty()) {
            plotArea.append("div")
                .attr("class","sliders-container")
                .style("width","100%")
                .style("pointer-events","auto");
        }
    }

    initBindings() {
        this.initSliders();
    }

    async doUpdate() {
        this.updatePlotAreaSize();
        this.initSliders();
        this.addSliders();
    }

    remove() {
        this.removeSubscriptions();
    }

    initSliders() {
        if (!this.data?.sliders?.length) return;
        const requestCreateDimension = this.contextEvents?.dimensions?.create;
        const dimensions = this.contextState?.dimensions;
        this.data.sliders.forEach( slider => {
            if (this.sliders.map( d => d.dimensionName ).includes(slider.dimensionName)) {
                return;
            }
            const sliderToAdd = {
                name : slider.name || "slider",
                dimensionName : slider.dimensionName || "dim1",
                dimensionObserverId : undefined,
                min: slider.min ?? 0,
                max: slider.max ?? 1,
                step: slider.step ?? 0.01,
                sliderAdded : false,
                brushing : false,
                value : undefined
            };
            const initValue = slider.value ?? 0;
            const dimensionName = slider.dimensionName;
            if (requestCreateDimension) {
                requestCreateDimension.state = {name:dimensionName, value:initValue};
            }
            const dimension = dimensions?.find( d => d.name == dimensionName );
            const dimValue = dimension?.state?.value ?? initValue;
            sliderToAdd.value = dimValue;
            if (dimension) {
                const obsId = dimension.subscribe( (data) => {
                    const s = this.sliders.find( d => d.dimensionName == dimensionName );
                    if (!s) return;
                    s.value = data.value;
                    this.setSliderPosition(dimensionName);
                });
                this.subscriptions.push({observable:dimension, id:obsId});
            }
            this.sliders.push(sliderToAdd);

        });
    }
    

    addSliders() {
        if ( !this.sliders.length ) return;

        const sliderDragStart = (event,dimensionName) => {
            event.stopPropagation();
            const slider = this.sliders.find( d => d.dimensionName == dimensionName );
            if (slider) slider.brushing = true;
        }

        const sliderDragged = (event,dimensionName) => {
            const parent = d3.select(event.target.parentNode);
            const valueElement = parent.select(".dim-slider-value");
            valueElement.text(event.target.value);
            const slider = this.sliders.find( d => d.dimensionName == dimensionName );
            const value = +event.target.value;
            const requestSetDimension = this.contextEvents?.dimensions?.set;
            if (requestSetDimension) {
                requestSetDimension.state = { name:dimensionName, dimensionState:{value:value, brushing:slider?.brushing ?? false }};
            }
        }

        const sliderDragEnd = (event,dimensionName) => {
            const slider = this.sliders.find( d => d.dimensionName == dimensionName );
            if (slider) slider.brushing = false;
            const requestSetDimension = this.contextEvents?.dimensions?.set;
            if (requestSetDimension && slider) {
                requestSetDimension.state = { name:dimensionName, dimensionState:{value:slider.value, brushing:false }};
            }
        }

        const plotArea = this.plotAreaSel;
        const slidersContainer = plotArea.select(".sliders-container");
        this.sliders.forEach( slider => {
            if ( slider.sliderAdded ) return;
            const dimensionName = slider.dimensionName;
            const sliderContainer = slidersContainer.append("div")
                .attr("class", "dim-slider-container")
                .style("width","100%")
                .style("display","flex")
                .style("align-items","center");
            sliderContainer.append("span")
                .attr("class", "dim-slider-title")
                .text(dimensionName)
                .style("flex","1")
                .style("margin-right","5px");
            sliderContainer.append("input")
                .attr("class", "dim-slider")
                .attr("type","range")
                .attr("id", `${dimensionName}-slider`)
                .attr("min", slider.min)
                .attr("max", slider.max)
                .attr("value", slider.value)
                .attr("step", slider.step)
                .style("flex","2")
                .style("user-select","auto")
                .on("pointerdown mousedown", (event) => sliderDragStart(event, dimensionName))
                .on("input", (event) => sliderDragged(event, dimensionName))
                .on("pointerup pointercancel", (event) => sliderDragEnd(event, dimensionName));
            sliderContainer.append("span")
                .attr("class", "dim-slider-value")
                .text(slider.value)
                .style("margin-left","5px")
                .style("min-width","50px") ;

            slider.sliderAdded = true;
        } );
    }

    setSliderPosition(dimensionName) {
        const slider = this.sliders.find( d => d.dimensionName == dimensionName );
        const sliderElement = d3.select(`#${this.id}`).select(`#${dimensionName}-slider`);
        if (!sliderElement.empty() && slider) {
            sliderElement.node().value = slider.value;
            const parent = sliderElement.node().parentNode;
            d3.select(parent).select(".dim-slider-value").text(slider.value);
        }
    }
}

export { DimensionSliders };
