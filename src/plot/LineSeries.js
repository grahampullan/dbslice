import * as d3 from 'd3v7';
import { SvgPlotBase } from './SvgPlotBase.js';

class LineSeries extends SvgPlotBase {
  constructor(options = {}) {
    options.layout = options.layout || {};
    options.layout.margin = options.layout.margin || { top: 5, right: 20, bottom: 30, left: 53 };
    options.layout.highlightItems = options.layout.highlightItems ?? true;
    super(options);
    this.componentType = options.componentType || "LineSeries";
    this.filter = null;
    this.cutDefaultColor = this.layout.cutLineColor || "#d0d5db";
    this.cuts = [];
    this.zoomSet = false;
    this.xScale = null;
    this.yScale = null;
    this.xScale0 = null;
    this.yScale0 = null;
    this.xRange = null;
    this.yRange = null;
  }

  initBindings() {
    if (this.layout.highlightItems) {
      const filterId = this.layout.filterId;
      this.filter = this.contextState?.filters?.find(f => f.id === filterId);
      if (this.filter?.highlightItemIds) {
        const obsId = this.filter.highlightItemIds.subscribe(this.highlightItems.bind(this));
        this.subscriptions.push({ observable: this.filter.highlightItemIds, id: obsId });
      }
    }

    if (this.fetchData?.urlTemplate && this.fetchData.filterId) {
      const filter = this.contextState?.filters?.find(fl => fl.id === this.fetchData.filterId);
      if (filter?.itemIdsInFilter) {
        const obsId = filter.itemIdsInFilter.subscribe(this.handleFilterChange.bind(this));
        this.subscriptions.push({ observable: filter.itemIdsInFilter, id: obsId });
        if (this.fetchData.getItemIdsFromFilter) {
          this.fetchData.itemIds = filter.itemIdsInFilter.state.itemIds;
        }
        if (this.fetchData.dataFilterConfig) {
          const config = this.fetchData.dataFilterConfig;
          const dataset = this.contextState?.datasets?.find(d => d.id == this.fetchData.datasetId);
          if (dataset) {
            config.itemLabels = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id)?.label);
            if (config.cProperty) {
              config.cPropertyValues = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id)?.[config.cProperty]);
            }
          }
        }
      }
    }

    if (this.fetchData?.derivedDataName) {
      const stores = this.contextState?.derivedData || [];
      let store = stores.find(d => d.name === this.fetchData.derivedDataName);
      if (!store && this.contextEvents?.derivedData?.createStore) {
        this.contextEvents.derivedData.createStore.state = { name: this.fetchData.derivedDataName };
        store = (this.contextState?.derivedData || []).find(d => d.name === this.fetchData.derivedDataName);
      }
      if (store?.newData) {
        const obsId = store.newData.subscribe(this.handleDerivedDataChange.bind(this));
        this.subscriptions.push({ observable: store.newData, id: obsId });
      }
    }

    if (this.fetchData?.getUrlFromDimensions) {
      const requestCreateDimension = this.contextEvents?.dimensions?.create;
      const dimensions = this.contextState?.dimensions;
      const dimNames = this.fetchData.getUrlFromDimensions.dimensionNames || [];
      dimNames.forEach((dimName) => {
        requestCreateDimension?.(requestCreateDimension.state = { name: dimName, value: null });
        const dim = dimensions?.find((d) => d.name === dimName);
        if (dim) {
          const obsId = dim.subscribe(this.handleDimensionChange.bind(this));
          this.subscriptions.push({ observable: dim, id: obsId });
        }
      });
    }
  }

  async doUpdate() {
    if (!this.data || !this.data.series?.length) return;
    const plotArea = this.plotAreaSel;
    const layout = this.layout;
    const width = this.plotAreaWidth;
    const height = this.plotAreaHeight;
    if (width <= 0 || height <= 0) {
      plotArea.selectAll("*").remove();
      return;
    }

    const highlightItemsFlag = layout.highlightItems;
    const lineWidth = layout.lineWidth || 2.5;
    const panZoomEnabled = layout.panZoom !== false;
    const cutDefaultColor = layout.cutLineColor || "#d0d5db";
    this.cutDefaultColor = cutDefaultColor;
    let highlightItemIds;
    if (highlightItemsFlag && this.filter) {
      highlightItemIds = this.filter.highlightItemIds;
    }
    const margin = layout.margin;
    const enableTips = layout.enableTips !== false;

    const colour = layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeTableau10) : d3.scaleOrdinal(layout.colourMap);
    if (layout.cSet !== undefined) {
      if (Array.isArray(layout.cSet)) {
        colour.domain(layout.cSet);
      } else if (this.filter) {
        colour.domain(this.filter.categoricalUniqueValues[layout.cSet]);
      }
    }

    const nSeries = this.data.series.length;
    const clipId = `${this.id}-clip`;

    this.setRanges();
    this.setScales();
    const xScale = this.xScale;
    const yScale = this.yScale;
    const xScale0 = this.xScale0;
    const yScale0 = this.yScale0;

    this.initCuts();

    let line;
    if (!layout.segmentedLine) {
      line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));
    } else {
      function segLine(lineSegs) {
        const l = d3.line()
          .x(d => xScale(d.x))
          .y(d => yScale(d.y));
        let path = "";
        lineSegs.forEach(d => {
          const seg = [{ x: d[0][0], y: d[0][1] }, { x: d[1][0], y: d[1][1] }];
          path += l(seg);
        });
        return path;
      }
      line = segLine;
    }
    this.line = line;

    const clipRect = plotArea.select(".clip-rect");
    if (clipRect.empty()) {
      plotArea.append("defs").append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("class", "clip-rect")
        .style("position", "absolute")
        .attr("width", width)
        .attr("height", height)
        .style("left", `${this.plotAreaLeft}px`)
        .style("top", `${this.plotAreaTop}px`);
    } else {
      clipRect.attr("width", width)
        .attr("height", height)
        .style("left", `${this.plotAreaLeft}px`)
        .style("top", `${this.plotAreaTop}px`);
    }

    if (!this.zoomSet) {
      const zoom = d3.zoom()
        .scaleExtent([0.5, Infinity])
        .on("zoom", (event) => zoomed(event));
      plotArea.call(zoom.transform, d3.zoomIdentity);
      plotArea.call(zoom);
      this.zoomSet = true;
    }

    let focus = plotArea.select(".focus");
    if (focus.empty()) {
      plotArea.append("circle")
        .attr("class", "focus")
        .attr("fill", "none")
        .attr("r", 1);
    }

    if (!layout.xAxisMean && !layout.yAxisMean) {
      const allSeries = plotArea.selectAll(".plot-series").data(this.data.series, k => k.itemId);

      const entered = allSeries.enter()
        .append("g")
        .attr("class", "plot-series")
        .attr("series-name", d => d.label)
        .attr("clip-path", `url(#${clipId})`);

      entered.append("path")
        .attr("class", "line")
        .attr("d", d => line(d.data))
        .style("stroke", d => (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue')
        .style("fill", "none")
        .style("stroke-width", `${lineWidth}px`)
        .attr("clip-path", `url(#${clipId})`)
        .on("mouseover", enableTips ? tipOn : null)
        .on("mouseout", enableTips ? tipOff : null);

      allSeries.select("path.line")
        .attr("d", d => line(d.data));

      allSeries.exit().remove();
    }

    let area;
    let areaData = [];
    if (layout.xAxisMean) {
      area = d3.area()
        .y(d => yScale(d.y))
        .x0(d => xScale(d.x0))
        .x1(d => xScale(d.x1));
      const grouped = Array.from(d3.group(this.data.series, d => d.cKey));
      grouped.forEach(s => {
        const areaNow = { c: s[0], data: [] };
        const nPts = s[1][0].data.length;
        for (let i = 0; i < nPts; i++) {
          const areaPt = {};
          const xValues = s[1].map(d => d.data[i].x);
          if (xValues.length === 1) xValues.push(xValues[0]);
          const xMean = d3.mean(xValues);
          const stdDev = d3.deviation(xValues);
          areaPt.y = s[1][0].data[i].y;
          areaPt.x = xMean;
          areaPt.x0 = xMean - stdDev;
          areaPt.x1 = xMean + stdDev;
          areaNow.data.push(areaPt);
        }
        areaData.push(areaNow);
      });
    }

    if (layout.yAxisMean) {
      area = d3.area()
        .x(d => xScale(d.x))
        .y0(d => yScale(d.y0))
        .y1(d => yScale(d.y1));
      const grouped = Array.from(d3.group(this.data.series, d => d.cKey));
      grouped.forEach(s => {
        const areaNow = { c: s[0], data: [] };
        const nPts = s[1][0].data.length;
        for (let i = 0; i < nPts; i++) {
          const areaPt = {};
          const yValues = s[1].map(d => d.data[i].y);
          if (yValues.length === 1) yValues.push(yValues[0]);
          const yMean = d3.mean(yValues);
          const stdDev = d3.deviation(yValues);
          areaPt.x = s[1][0].data[i].x;
          areaPt.y = yMean;
          areaPt.y0 = yMean - stdDev;
          areaPt.y1 = yMean + stdDev;
          areaNow.data.push(areaPt);
        }
        areaData.push(areaNow);
      });
    }

    if (layout.xAxisMean || layout.yAxisMean) {
      const areas = plotArea.selectAll(".area").data(areaData, k => k.c);
      areas.enter()
        .append("path")
        .attr("class", "area")
        .attr("fill", d => colour(d.c))
        .style("opacity", 0.5)
        .attr("clip-path", `url(#${clipId})`)
        .attr("d", d => area(d.data));

      areas
        .attr("d", d => area(d.data));

      areas.exit().remove();

      const meanLines = plotArea.selectAll(".mean-line").data(areaData, k => k.c);
      meanLines.enter()
        .append("path")
        .attr("class", "mean-line")
        .style("stroke", d => colour(d.c))
        .style("stroke-width", `${lineWidth}px`)
        .style("fill", "none")
        .attr("clip-path", `url(#${clipId})`)
        .attr("d", d => line(d.data))
        .on("mouseover", enableTips ? tipOnMeanLine : null)
        .on("mouseout", enableTips ? tipOffMeanLine : null);

      meanLines
        .attr("d", d => line(d.data))
        .raise();

      meanLines.exit().remove();
    }

    this.addCutLines();

    const xAxis = d3.axisBottom(xScale);
    if (layout.xTickNumber !== undefined) { xAxis.ticks(layout.xTickNumber); }
    if (layout.xTickFormat !== undefined) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

    const yAxis = d3.axisLeft(yScale);
    if (layout.yTickNumber !== undefined) { yAxis.ticks(layout.yTickNumber); }
    if (layout.yTickFormat !== undefined) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

    let gX = plotArea.select(".axis-x");
    if (gX.empty()) {
      gX = plotArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "axis-x")
        .style("pointer-events", "bounding-box")
        .call(xAxis);
      if (panZoomEnabled) {
        gX.call(d3.zoom().on("zoom", (event) => {
          xScale.domain(event.transform.rescaleX(xScale0).domain());
          gX.call(xAxis);
          plotArea.selectAll(".line").attr("d", d => line(d.data));
          plotArea.selectAll(".area").attr("d", d => area ? area(d.data) : null);
          plotArea.selectAll(".mean-line").attr("d", d => line(d.data));
          this.cuts.forEach(cut => this.setCutLinePosition(cut.dimensionName));
        }));
      }
      gX.append("text")
        .attr("class", "x-axis-text")
        .attr("fill", "#000")
        .attr("x", width)
        .attr("y", margin.bottom - 2)
        .attr("text-anchor", "end")
        .text(layout.xAxisLabel);
    } else {
      gX.attr("transform", `translate(0,${height})`);
      gX.call(xAxis);
      gX.select(".x-axis-text").attr("x", width);
      if (!panZoomEnabled) {
        gX.on(".zoom", null);
      }
    }

    let gY = plotArea.select(".axis-y");
    if (gY.empty()) {
      gY = plotArea.append("g")
        .attr("class", "axis-y")
        .style("pointer-events", "bounding-box")
        .call(yAxis);
      if (panZoomEnabled) {
        gY.call(d3.zoom().on("zoom", (event) => {
          yScale.domain(event.transform.rescaleY(yscale0).domain());
          gY.call(yAxis);
          plotArea.selectAll(".line").attr("d", d => line(d.data));
          plotArea.selectAll(".area").attr("d", d => area ? area(d.data) : null);
          plotArea.selectAll(".mean-line").attr("d", d => line(d.data));
          this.cuts.forEach(cut => this.setCutLinePosition(cut.dimensionName));
        }));
      }

      gY.append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "end")
        .text(layout.yAxisLabel);
    } else {
      gY.call(yAxis);
      if (!panZoomEnabled) {
        gY.on(".zoom", null);
      }
    }

    const zoomed = (event) => {
      if (!panZoomEnabled) return;
      const t = event.transform;
      xScale.domain(t.rescaleX(xScale0).domain());
      yScale.domain(t.rescaleY(yScale0).domain());
      gX.call(xAxis);
      gY.call(yAxis);
      plotArea.selectAll(".line").attr("d", d => line(d.data));
      plotArea.selectAll(".area").attr("d", d => area ? area(d.data) : null);
      plotArea.selectAll(".mean-line").attr("d", d => line(d.data));
      this.cuts.forEach(cut => this.setCutLinePosition(cut.dimensionName));
    };

    const tipOn = (event, d) => {
      const lines = plotArea.selectAll(".line");
      lines.style("stroke", "#d3d3d3");
      const target = d3.select(event.target);
      target
        .style("stroke", d => (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue')
        .style("stroke-width", "4px")
        .each(function () {
          this.parentNode.parentNode.appendChild(this.parentNode);
        });
      d3.select(`#${this.id}`).select(".tool-tip")
        .style("opacity", 1.0)
        .html(`<span>${d.label}</span>`)
        .style("left", d3.pointer(event)[0] + "px")
        .style("top", d3.pointer(event)[1] + "px");
      if (highlightItemsFlag && highlightItemIds) {
        highlightItemIds.state = { itemIds: [d.itemId] };
      }
    };

    const tipOff = () => {
      if (!layout.timeSync) {
        const lines = plotArea.selectAll(".line");
        lines
          .style("stroke", d => (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue')
          .style("stroke-width", "2.5px");
      }
      d3.select(`#${this.id}`).select(".tool-tip").style("opacity", 0.0);
      if (highlightItemsFlag && highlightItemIds) {
        highlightItemIds.state = { itemIds: [] };
      }
    };

    const tipOnMeanLine = (event, d) => {
      const lines = plotArea.selectAll(".mean-line");
      lines.style("stroke", "#d3d3d3");
      const areas = plotArea.selectAll(".area");
      areas.style("fill", "#d3d3d3");
      const targetSet = d.c;
      const targetLine = d3.select(event.target);
      const targetArea = areas.filter(k => k.c == targetSet);
      targetArea
        .style("fill", d => colour(d.c))
        .style("opacity", 0.7)
        .raise();
      targetLine
        .style("stroke", d => colour(d.c))
        .style("stroke-width", "4px")
        .raise();
      d3.select(`#${this.id}`).select(".tool-tip")
        .style("opacity", 1.0)
        .html(`<span>${d.c}</span>`)
        .style("left", d3.pointer(event)[0] + "px")
        .style("top", d3.pointer(event)[1] + "px");
    };

    const tipOffMeanLine = () => {
      const areas = plotArea.selectAll(".area");
      areas
        .style("fill", d => colour(d.c))
        .style("opacity", 0.5);
      const lines = plotArea.selectAll(".mean-line");
      lines
        .style("stroke", d => colour(d.c))
        .style("stroke-width", "2.5px")
        .raise();

      d3.select(`#${this.id}`).select(".tool-tip").style("opacity", 0.0);
    };
  }

  highlightItems() {
    if (!this.filter) return;
    const plotArea = this.plotAreaSel;
    const highlightItemIds = this.filter.highlightItemIds?.state?.itemIds;
    const lines = plotArea.selectAll(".line");
    const colour = this.layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeTableau10) : d3.scaleOrdinal(this.layout.colourMap);

    if (this.layout.cSet !== undefined) {
      if (Array.isArray(this.layout.cSet)) {
        colour.domain(this.layout.cSet);
      } else {
        colour.domain(this.filter.categoricalUniqueValues[this.layout.cSet]);
      }
    }

    if (!highlightItemIds || highlightItemIds.length === 0) {
      lines
        .style("stroke-width", "2.5px")
        .style("stroke", d => (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue');
    } else {
      lines
        .style("stroke-width", "2.5px")
        .style("stroke", "#d3d3d3");
      highlightItemIds.forEach((itemId) => {
        lines.filter(d => d.itemId == itemId)
          .style("stroke", d => (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue')
          .style("stroke-width", "4px")
          .each(function () {
            this.parentNode.parentNode.appendChild(this.parentNode);
          });
      });
    }
  }

  handleFilterChange(data) {
    if (data.brushing) return;
    if (this.fetchData?.getItemIdsFromFilter && !data.noFilter) {
      this.fetchData.itemIds = data.itemIds;
    }
    if (!this.fetchData?.getItemIdsFromFilter && data.noFilter) {
      this.fetchData.itemIds = data.itemIds;
    }
    this.fetchDataNow = true;
    if (this.fetchData?.dataFilterConfig) {
      const config = this.fetchData.dataFilterConfig;
      const dataset = this.contextState?.datasets?.find(d => d.id == this.fetchData.datasetId);
      if (dataset) {
        config.itemLabels = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id)?.label);
        if (config.cProperty) {
          config.cPropertyValues = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id)?.[config.cProperty]);
        }
      }
    }
    this.requestUpdate();
  }

  async handleDerivedDataChange() {
    this.fetchDataNow = true;
    await this.requestUpdate();
    this.fetchDataNow = true;
    this.requestUpdate();
  }

  initCuts() {
    if (!this.layout.cuts?.length) return;
    const requestCreateDimension = this.contextEvents?.dimensions?.create;
    const dimensions = this.contextState?.dimensions;
    this.layout.cuts.forEach((cut) => {
      if (this.cuts.map(d => d.dimensionName).includes(cut.dimensionName)) {
        return;
      }
      const cutToAdd = this.makeCutObject(cut);
      let avgValue;
      if (cut.type == "x") {
        avgValue = d3.mean(this.xDataRange);
      } else if (cut.type == "y") {
        avgValue = d3.mean(this.yDataRange);
      }
      const initValue = cut.value || avgValue;
      const dimensionName = cut.dimensionName;
      requestCreateDimension?.(requestCreateDimension.state = { name: dimensionName, value: initValue });
      const dimension = dimensions?.find(d => d.name == dimensionName);
      const dimValue = dimension?.state?.value ?? initValue;
      cutToAdd.value = dimValue;
      if (dimension) {
        cutToAdd.dimensionObserverId = dimension.subscribe((data) => {
          const c = this.cuts.find(d => d.dimensionName == dimensionName);
          if (!c) return;
          c.value = data.value;
          this.setCutLinePosition(dimensionName);
        });
        this.subscriptions.push({ observable: dimension, id: cutToAdd.dimensionObserverId });
      }
      this.cuts.push(cutToAdd);
    });
  }

  addCutLines() {
    if (!this.cuts.length) return;

    const cutLineDragStart = (event, dimensionName) => {
      const cut = this.cuts.find(d => d.dimensionName == dimensionName);
      if (cut) cut.brushing = true;
      this.setCutLinePosition(dimensionName);
    };

    const cutLineDragged = (event, dimensionName) => {
      const cut = this.cuts.find(d => d.dimensionName == dimensionName);
      if (!cut) return;
      const margin = 3;
      const dx = Math.abs(this.xScale.invert(margin) - this.xScale.invert(0));
      const dy = Math.abs(this.yScale.invert(margin) - this.yScale.invert(0));
      if (cut.type == "x") {
        let value = this.xScale.invert(event.x);
        value = d3.min([d3.max([value, this.xRange[0] + dx]), this.xRange[1] - dx]);
        cut.value = value;
      } else if (cut.type == "y") {
        let value = this.yScale.invert(event.y);
        value = d3.min([d3.max([value, this.yRange[0] + dy]), this.yRange[1] - dy]);
        cut.value = value;
      }
      const requestSetDimension = this.contextEvents?.dimensions?.set;
      if (requestSetDimension) {
        requestSetDimension.state = { name: dimensionName, dimensionState: { value: cut.value, brushing: cut.brushing } };
      }
      this.setCutLinePosition(dimensionName);
    };

    const cutLineDragEnd = (event, dimensionName) => {
      const cut = this.cuts.find(d => d.dimensionName == dimensionName);
      if (!cut) return;
      cut.brushing = false;
      const requestSetDimension = this.contextEvents?.dimensions?.set;
      if (requestSetDimension) {
        requestSetDimension.state = { name: dimensionName, dimensionState: { value: cut.value, brushing: cut.brushing } };
      }
      this.setCutLinePosition(dimensionName);
    };

    const plotArea = this.plotAreaSel;
    this.cuts.forEach(cut => {
      if (cut.lineAdded) return;
      const dimensionName = cut.dimensionName;
      let cutLine = plotArea.select(`#${dimensionName}-cut-line`);
      if (cutLine.empty()) {
        cutLine = plotArea.append("path")
          .attr("class", "cut-line")
          .attr("id", `${dimensionName}-cut-line`)
          .attr("fill", "none")
          .attr("stroke", this.cutDefaultColor)
          .attr("stroke-width", 3)
          .style("opacity", 0.9)
          .attr("d", "")
          .attr("clip-path", `url(#${this.id}-clip)`)
          .call(d3.drag()
            .on("start", (event) => cutLineDragStart(event, dimensionName))
            .on("drag", (event) => cutLineDragged(event, dimensionName))
            .on("end", (event) => cutLineDragEnd(event, dimensionName)));
        this.setCutLinePosition(dimensionName);
      }
      cut.lineAdded = true;
    });
  }

  setCutLinePosition(dimensionName) {
    const cut = this.cuts.find(d => d.dimensionName == dimensionName);
    if (!cut) return;
    const plotArea = this.plotAreaSel;
    const cutLine = plotArea.select(`#${dimensionName}-cut-line`);
    let pathData;
    if (cut.type == "x") {
      pathData = `M ${this.xScale(cut.value)} 0 L ${this.xScale(cut.value)} ${this.plotAreaHeight}`;
    } else if (cut.type == "y") {
      pathData = `M 0 ${this.yScale(cut.value)} L ${this.plotAreaWidth} ${this.yScale(cut.value)}`;
    }
    cutLine.attr("d", pathData);
    if (cut.brushing) {
      cutLine.style("stroke", "#42d4f5");
    } else {
      cutLine.style("stroke", this.cutDefaultColor || "#d0d5db");
    }
  }

  setRanges() {
    let xMin, xMax, yMin, yMax;
    if (!this.layout.segmentedLine) {
      xMin = d3.min(this.data.series, d => d3.min(d.data, d => d.x));
      xMax = d3.max(this.data.series, d => d3.max(d.data, d => d.x));
      yMin = d3.min(this.data.series, d => d3.min(d.data, d => d.y));
      yMax = d3.max(this.data.series, d => d3.max(d.data, d => d.y));
    } else {
      xMin = d3.min(this.data.series, d => d3.min(d.data, d => d[0][0]));
      xMax = d3.max(this.data.series, d => d3.max(d.data, d => d[0][0]));
      yMin = d3.min(this.data.series, d => d3.min(d.data, d => d[0][1]));
      yMax = d3.max(this.data.series, d => d3.max(d.data, d => d[0][1]));
    }

    this.xDataRange = [xMin, xMax];
    this.yDataRange = [yMin, yMax];

    let xDiff = xMax - xMin;
    xMin -= 0.05 * xDiff;
    xMax += 0.05 * xDiff;
    let yDiff = yMax - yMin;
    yMin -= 0.05 * yDiff;
    yMax += 0.05 * yDiff;

    this.xRange = this.layout.xRange || [xMin, xMax];
    this.yRange = this.layout.yRange || [yMin, yMax];
  }

  setScales() {
    if (!this.xScale || !this.layout.xRange) {
      if (this.layout.xscale == "time") {
        this.xScale = d3.scaleTime();
        this.xScale0 = d3.scaleTime();
      } else {
        this.xScale = d3.scaleLinear();
        this.xScale0 = d3.scaleLinear();
      }
      this.xScale.domain(this.xRange);
      this.xScale0.domain(this.xRange);
    }
    this.xScale.range([0, this.plotAreaWidth]);
    this.xScale0.range([0, this.plotAreaWidth]);

    if (!this.yScale || !this.layout.yRange) {
      this.yScale = d3.scaleLinear().domain(this.yRange);
      this.yScale0 = d3.scaleLinear().domain(this.yRange);
    }
    this.yScale.range([this.plotAreaHeight, 0]);
    this.yScale0.range([this.plotAreaHeight, 0]);
  }

  handleDimensionChange() {
    this.fetchDataNow = true;
    this.requestUpdate();
  }
}

export { LineSeries };
