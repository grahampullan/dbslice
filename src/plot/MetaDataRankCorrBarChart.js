import * as d3 from "d3v7";
import * as ss from "simple-statistics";
import { SvgPlotBase } from "./SvgPlotBase.js";

class MetaDataRankCorrBarChart extends SvgPlotBase {
  constructor(options = {}) {
    options.layout = options.layout || {};
    options.layout.margin = options.layout.margin || { top: 5, right: 20, bottom: 30, left: 20 };
    super(options);
    this.componentType = options.componentType || "MetaDataRankCorrBarChart";
    this.filter = null;
    this.dimId = null;
  }

  initBindings() {
    const filterId = this.data?.filterId;
    this.filter = this.contextState?.filters?.find((f) => f.id === filterId);
    if (!this.filter) return;
    this.dimId = this.filter.continuousProperties.indexOf(this.data.outputProperty);
    const filterObsId = this.filter.itemIdsInFilter.subscribe(this.handleFilterChange.bind(this));
    this.subscriptions.push({ observable: this.filter.itemIdsInFilter, id: filterObsId });
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

    const dim = this.filter.continuousDims[this.dimId];
    const pointData = dim.top(Infinity);
    const inputProperties = this.data.inputProperties || [];
    const outputPropertyName = this.data.outputProperty;
    const outputValues = pointData.map((d) => d[outputPropertyName]);

    let rankCorrelation = inputProperties.map((name) => ({
      name,
      rankCorr: ss.sampleRankCorrelation(pointData.map((t) => t[name]), outputValues),
    }));
    rankCorrelation = rankCorrelation.sort((a, b) => d3.ascending(Math.abs(a.rankCorr), Math.abs(b.rankCorr)));

    const removeZeroBar = layout.removeZeroBar ?? false;
    if (removeZeroBar) {
      rankCorrelation = rankCorrelation.filter((item) => Math.abs(item.rankCorr) > 0);
    }

    const x = d3.scaleLinear().range([0, width]).domain([-1, 1]);
    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(rankCorrelation.map((d) => d.name))
      .padding([0.2])
      .align([0.5]);

    const colour = layout.colourMap === undefined ? d3.scaleOrdinal().range(["cornflowerblue"]) : d3.scaleOrdinal(layout.colourMap);
    colour.domain(inputProperties);

    const bars = plotArea.selectAll("rect").data(rankCorrelation, (d) => d.name);

    bars
      .enter()
      .append("rect")
      .attr("height", y.bandwidth())
      .attr("y", (d) => y(d.name))
      .attr("x", (d) => x(Math.min(d.rankCorr, 0)))
      .style("fill", (d) => colour(d.name))
      .merge(bars)
      .attr("x", (d) => x(Math.min(d.rankCorr, 0)))
      .attr("width", (d) => Math.abs(x(d.rankCorr) - x(0)))
      .attr("y", (d) => y(d.name))
      .attr("height", y.bandwidth());

    bars.exit().remove();

    let xAxis = plotArea.select(".x-axis");
    if (xAxis.empty()) {
      plotArea
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("class", "x-axis-text")
        .attr("fill", "#000")
        .attr("x", width)
        .attr("y", margin.bottom - 2)
        .attr("text-anchor", "end")
        .text("Rank correlation");
    } else {
      xAxis.attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
      xAxis.select(".x-axis-text").attr("x", width);
    }

    let yAxis = plotArea.select(".y-axis");
    if (yAxis.empty()) {
      plotArea
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${x(0)},0)`)
        .call(d3.axisLeft(y).tickValues([]));
    } else {
      yAxis.attr("transform", `translate(${x(0)},0)`).call(d3.axisLeft(y).tickValues([]));
    }

    const keyLabels = plotArea.selectAll(".keyLabel").data(rankCorrelation, (d) => d.name);

    keyLabels
      .enter()
      .append("text")
      .attr("class", "keyLabel")
      .attr("x", 0)
      .attr("y", (d) => y(d.name) + 0.5 * y.bandwidth())
      .attr("dx", 5)
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      .attr("font-size", "0.8em")
      .text((d) => d.name);

    keyLabels.attr("y", (d) => y(d.name) + 0.5 * y.bandwidth()).text((d) => d.name);

    keyLabels.exit().remove();
  }

  handleFilterChange() {
    this.fetchDataNow = true;
    this.requestUpdate();
  }
}

export { MetaDataRankCorrBarChart };
