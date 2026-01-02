import * as d3 from "d3v7";
import { SvgPlotBase } from "./SvgPlotBase.js";

class MetaDataBarChart extends SvgPlotBase {
  constructor(options = {}) {
    options.layout = options.layout || {};
    options.layout.margin = options.layout.margin || { top: 5, right: 20, bottom: 30, left: 20 };
    options.layout.highlightItems = options.layout.highlightItems ?? true;
    super(options);
    this.componentType = options.componentType || "MetaDataBarChart";
    this.filter = null;
    this.dimId = null;
  }

  initBindings() {
    const filterId = this.data?.filterId;
    this.filter = this.contextState?.filters?.find((f) => f.id === filterId);
    if (!this.filter) return;

    this.dimId = this.filter.categoricalProperties.indexOf(this.data.property);

    const filterObsId = this.filter.itemIdsInFilter.subscribe(this.handleFilterChange.bind(this));
    this.subscriptions.push({ observable: this.filter.itemIdsInFilter, id: filterObsId });
    if (this.layout.highlightItems && this.filter.highlightItemIds) {
      const highlightObsId = this.filter.highlightItemIds.subscribe(this.highlightItems.bind(this));
      this.subscriptions.push({ observable: this.filter.highlightItemIds, id: highlightObsId });
    }
  }

  async doUpdate() {
    if (!this.filter) return;
    const plotArea = this.plotAreaSel;
    const layout = this.layout;
    const margin = layout.margin;
    const width = this.plotAreaWidth;
    const height = this.plotAreaHeight;
    if (width <= 0 || height <= 0) {
      plotArea.selectAll("*").remove();
      return;
    }

    const property = this.data.property;
    const dimId = this.dimId;
    const dim = this.filter.categoricalDims[dimId];
    const group = dim.group();
    let items = group.all();
    const selected = this.filter.categoricalFilterSelected[dimId];

    const removeZeroBar = layout.removeZeroBar ?? false;
    if (removeZeroBar) {
      items = items.filter((item) => item.value > 0);
    }

    const x = d3.scaleLinear().range([0, width]).domain([0, d3.max(items, (v) => v.value) || 0]);

    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(items.map((d) => d.key))
      .padding([0.2])
      .align([0.5]);

    let colour;
    if (!layout.colourByProperty) {
      if (!layout.colour) {
        colour = d3.scaleOrdinal(["cornflowerblue"]);
      } else {
        colour = d3.scaleOrdinal([layout.colour]);
      }
    } else {
      if (!layout.colourMap) {
        colour = d3.scaleOrdinal(d3.schemeTableau10);
      } else {
        colour = d3.scaleOrdinal(layout.colourMap);
      }
    }
    colour.domain(this.filter.categoricalUniqueValues[property]);

    const bars = plotArea.selectAll("rect").data(items, (v) => v.key);

    const barsEnter = bars
      .enter()
      .append("rect")
      .on("click", (event, selectedItem) => {
        this.filter.requestSetCategoricalFilter.state = { dimId, value: selectedItem.key, brushing: false };
      })
      .attr("height", y.bandwidth())
      .attr("y", (v) => y(v.key))
      .style("fill", (v) => colour(v.key))
      .style("cursor", "pointer");

    barsEnter.merge(bars)
      .attr("width", (v) => x(v.value))
      .attr("y", (v) => y(v.key))
      .attr("height", y.bandwidth())
      .attr("opacity", (v) => {
        if (!selected || selected.length === 0) {
          return 1;
        }
        return selected.indexOf(v.key) === -1 ? 0.2 : 1;
      });

    bars.exit().remove();

    const xAxis = d3.axisBottom(x);
    if (layout.xTickNumber !== undefined) xAxis.ticks(layout.xTickNumber);
    if (layout.xTickFormat !== undefined) xAxis.tickFormat(d3.format(layout.xTickFormat));

    let gX = plotArea.select(".x-axis");
    if (gX.empty()) {
      let axisLabel = "Number of Items";
      plotArea
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("class", "x-axis")
        .call(xAxis)
        .append("text")
        .attr("class", "x-axis-text")
        .attr("fill", "#000")
        .attr("x", width)
        .attr("y", margin.bottom - 2)
        .attr("text-anchor", "end")
        .text(axisLabel);
    } else {
      gX.attr("transform", `translate(0, ${height})`).call(xAxis);
      gX.select(".x-axis-text").attr("x", width);
    }

    let yAxis = plotArea.select(".y-axis");
    if (yAxis.empty()) {
      plotArea.append("g").attr("class", "y-axis").call(d3.axisLeft(y).tickValues([]));
    } else {
      yAxis.call(d3.axisLeft(y).tickValues([]));
    }

    const keyLabels = plotArea.selectAll(".key-label").data(items, (v) => v.key);

    keyLabels
      .enter()
      .append("text")
      .attr("class", "key-label")
      .attr("x", 0)
      .attr("y", (v) => y(v.key) + 0.5 * y.bandwidth())
      .attr("dx", 5)
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      .text((v) => v.key);

    keyLabels.attr("y", (v) => y(v.key) + 0.5 * y.bandwidth()).text((v) => v.key);

    keyLabels.exit().remove();
  }

  highlightItems() {
    if (!this.filter) return;
    const highlightItemIds = this.filter.highlightItemIds?.state?.itemIds;
    const plotArea = this.plotAreaSel;
    const bars = plotArea.selectAll("rect");
    const property = this.data.property;
    const dim = this.filter.categoricalDims[this.dimId];

    if (!highlightItemIds || highlightItemIds.length === 0) {
      bars.style("stroke-width", "0px");
      return;
    }

    bars.style("stroke-width", "0px").style("stroke", "red");
    highlightItemIds.forEach((itemId) => {
      const record = dim.top(Infinity).find((d) => d.itemId === itemId);
      const keyNow = record ? record[property] : undefined;
      bars
        .filter((d) => d.key === keyNow)
        .style("stroke-width", "4px");
    });
  }

  handleFilterChange() {
    this.fetchDataNow = true;
    this.requestUpdate();
  }
}

export { MetaDataBarChart };
