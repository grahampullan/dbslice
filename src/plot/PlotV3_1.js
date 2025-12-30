import { Component } from "board-box";
import * as d3 from "d3v7";
import { fetchPlotData } from "../core/fetchPlotData";

// Template base for the v3.1 plot lifecycle. Not wired into the app yet.
export class PlotV3_1 extends Component {
  constructor(options = {}) {
    super(options);
    this.itemId = options.itemId ?? null;
    this.layout = options.layout ?? {};
    this.layout.icons ??= [];
    this.layout.margin ??= { top: 0, right: 0, bottom: 0, left: 0 };

    this.marginAdd = { top: 0, right: 0, bottom: 0, left: 0 };

    this.data = options.data ?? {};
    this.fetchData = options.fetchData ?? null;

    this.headerOffset = 0;
    this.newData = true;
    this.fetchDataNow = true;
    this.fetchingData = false;
    this.lastData = null;

    this.componentType = null;
    this.icons = [];
    this.subscriptions = [];
    this._pendingFrame = false;
  }

  // ---- Structured shared state convenience ----
  get contextRaw() {
    return this.sharedStateByAncestorId?.context;
  }
  get contextState() {
    return this.contextRaw?.state ?? this.contextRaw;
  }
  get contextEvents() {
    return this.contextRaw?.events ?? {};
  }
  get contextServices() {
    return this.contextRaw?.services ?? this.contextRaw ?? {};
  }

  get boardStateRaw() {
    return this.sharedStateByAncestorId?.[this.boardId];
  }
  get boardState() {
    return this.boardStateRaw?.state ?? this.boardStateRaw;
  }
  get boardEvents() {
    return this.boardStateRaw?.events ?? {};
  }
  get boardServices() {
    return this.boardStateRaw?.services ?? this.boardStateRaw ?? {};
  }

  get plotGroupStateRaw() {
    const ids = (this.ancestorIds ?? []).filter((id) => id !== "context");
    const outer = ids[0];
    return outer ? this.sharedStateByAncestorId?.[outer] : null;
  }
  get plotGroupState() {
    return this.plotGroupStateRaw?.state ?? this.plotGroupStateRaw;
  }
  get plotGroupEvents() {
    return this.plotGroupStateRaw?.events ?? {};
  }
  get plotGroupServices() {
    return this.plotGroupStateRaw?.services ?? this.plotGroupStateRaw ?? {};
  }

  // ---- Geometry helpers ----
  get plotAreaWidth() {
    return (
      this.width -
      this.layout.margin.left -
      this.layout.margin.right -
      this.marginAdd.left -
      this.marginAdd.right
    );
  }

  get plotAreaHeight() {
    return (
      this.height -
      this.layout.margin.top -
      this.layout.margin.bottom -
      this.headerOffset -
      this.marginAdd.top -
      this.marginAdd.bottom
    );
  }

  get plotAreaLeft() {
    return this.layout.margin.left + this.marginAdd.left;
  }

  get plotAreaTop() {
    return this.layout.margin.top + this.headerOffset + this.marginAdd.top;
  }

  get marginTotal() {
    return {
      top: this.layout.margin.top + this.marginAdd.top,
      right: this.layout.margin.right + this.marginAdd.right,
      bottom: this.layout.margin.bottom + this.marginAdd.bottom,
      left: this.layout.margin.left + this.marginAdd.left,
    };
  }

  get plotAreaId() {
    return `${this.id}-plot-area`;
  }

  setLasts() {
    this.lastWidth = this.width;
    this.lastHeight = this.height;
    this.lastLeft = this.left;
    this.lastTop = this.top;
  }

  // ---- Lifecycle ----
  make() {
    this.updateHeader();
    this.createPlotArea();
    this.setLasts();
    this.initBindings();
    this.update();
  }

  async update() {
    if (this.fetchingData) return;

    if (this.fetchData && this.fetchDataNow) {
      await this.getData();
    }

    if (this.fetchData && (!this.data || this.data.__noUpdate)) {
      return;
    }

    this.updateHeader();
    this.updatePlotAreaSize();
    await this.doUpdate();
    this.setLasts();
  }

  requestUpdate() {
    if (this._pendingFrame) return;
    this._pendingFrame = true;
    requestAnimationFrame(async () => {
      this._pendingFrame = false;
      await this.update();
    });
  }

  // hooks to override in subclasses
  createPlotArea() {}
  initBindings() {}
  async doUpdate() {}
  updateHeader() {}

  // ---- Data fetching ----
  async getData() {
    if (!this.fetchData || !this.fetchDataNow) return;
    const trafficLight =
      this.boardEvents?.ui?.setTrafficLight ??
      this.boardStateRaw?.requestSetTrafficLightColor;

    this.fetchingData = true;
    if (trafficLight) trafficLight.state = "fetching";

    const derivedData = this.contextState?.derivedData ?? this.contextRaw?.derivedData;
    const dimensions = this.contextState?.dimensions ?? this.contextRaw?.dimensions;
    this.data = await fetchPlotData(this.fetchData, derivedData, dimensions);

    if (this.data && this.data.__noUpdate) {
      this.data = this.lastData || this.data;
      this.newData = false;
      this.fetchingData = false;
      this.fetchDataNow = false;
      if (trafficLight) trafficLight.state = "fetched";
      return;
    }

    this.fetchingData = false;
    this.fetchDataNow = false;
    this.newData = true;
    this.lastData = this.data;
    if (trafficLight) trafficLight.state = "fetched";
  }

  // ---- DOM helpers ----
  addPlotAreaDiv() {
    const container = d3.select(`#${this.id}`);
    container.style("pointer-events", "all");
    container
      .append("div")
      .attr("id", `${this.plotAreaId}`)
      .attr("class", "plot-area")
      .style("position", "absolute")
      .style("top", `${this.plotAreaTop}px`)
      .style("left", `${this.plotAreaLeft}px`)
      .style("width", `${this.plotAreaWidth}px`)
      .style("height", `${this.plotAreaHeight}px`)
      .attr("width", this.plotAreaWidth)
      .attr("height", this.plotAreaHeight)
      .style("pointer-events", "auto");
  }

  addPlotAreaSvg() {
    const container = d3.select(`#${this.id}`);
    container.style("pointer-events", "all");
    container
      .append("svg")
      .attr("id", `${this.plotAreaId}`)
      .attr("class", "plot-area")
      .style("position", "absolute")
      .style("top", `${this.plotAreaTop}px`)
      .style("left", `${this.plotAreaLeft}px`)
      .style("width", `${this.plotAreaWidth}px`)
      .style("height", `${this.plotAreaHeight}px`)
      .style("overflow", "visible")
      .attr("width", this.plotAreaWidth)
      .attr("height", this.plotAreaHeight)
      .style("pointer-events", "auto");
  }

  updatePlotAreaSize() {
    const container = d3.select(`#${this.id}`);
    const plotArea = container.select(".plot-area");
    if (plotArea.empty()) return;
    plotArea
      .style("top", `${this.plotAreaTop}px`)
      .style("left", `${this.plotAreaLeft}px`)
      .style("width", `${this.plotAreaWidth}px`)
      .style("height", `${this.plotAreaHeight}px`)
      .attr("width", this.plotAreaWidth)
      .attr("height", this.plotAreaHeight);
  }

  // ---- Subscription helpers ----
  subscribe(observable, handler) {
    if (!observable || !handler) return null;
    const bound = handler.bind(this);
    const id = observable.subscribe(bound);
    this.subscriptions.push({ observable, id });
    return id;
  }

  removeSubscriptions() {
    this.subscriptions.forEach((sub) => {
      sub.observable.unsubscribeById(sub.id);
    });
    this.subscriptions = [];
  }

  remove() {
    this.removeSubscriptions();
  }
}
