import { Component } from "board-box";
import * as d3 from "d3v7";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { faXmark, faFilter, faPlus } from "@fortawesome/free-solid-svg-icons";
import { fetchPlotData } from "../core/fetchPlotData";
import { filterPlots } from "./filterPlots.js";
class Plot extends Component {
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
    this.setCommonIcons();
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
    const nearest = ids.length ? ids[ids.length - 1] : null;
    return nearest ? this.sharedStateByAncestorId?.[nearest] : null;
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

    if (this.fetchData && !this.data) return;

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
  // ---- Header + icons ----
  addTitle() {
    const container = d3.select(`#${this.id}`);
    if (!this.layout.title) {
      container.select(".plot-title").remove();
      this.headerOffset = 0;
      return;
    }
    const title = container.select(".plot-title");
    if (title.empty()) {
      const newTitle = container
        .append("div")
        .attr("class", "plot-title")
        .attr("id", `${this.id}-plot-title`)
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        .text(this.layout.title);
      this.headerOffset = (newTitle.node()?.clientHeight ?? 0) + 3;
    } else {
      title.text(this.layout.title);
      this.headerOffset = (title.node()?.clientHeight ?? 0) + 3;
    }
  }

  addIcons() {
    const container = d3.select(`#${this.id}`);
    const iconList = this.icons;
    if (!iconList || !iconList.length) {
      container.select(".plot-icons").remove();
      return;
    }
    const title = container.select(".plot-title");
    let iconContainer = container.select(".plot-title").select(".plot-icons");
    if (iconContainer.empty()) {
      iconContainer = title.empty() ? container.append("div") : title.append("div");
      iconContainer
        .attr("class", "plot-icons")
        .attr("id", `${this.id}-plot-icons`)
        .style("position", "absolute")
        .style("top", "0")
        .style("right", "0");
    }

    const icons = iconContainer.selectAll(".plot-icon").data(iconList);

    icons
      .enter()
      .append("div")
      .attr("class", "plot-icon")
      .html((d) => icon(d.icon).html)
      .on("click", (e, d) => d.action());
    icons.exit().remove();
  }

  setCommonIcons() {
    const icons = this.icons;
    this.layout.icons.forEach((iconAlias) => {
      if (iconAlias === "remove") {
        icons.push({ icon: faXmark, action: () => { this.removePlot(); } });
      }
      if (iconAlias === "filter") {
        icons.push({ icon: faFilter, action: () => { this.selectItemIds(); } });
      }
      if (iconAlias === "add") {
        icons.push({ icon: faPlus, action: () => { this.addPlot(); } });
      }
    });
  }

  updateHeader() {
    this.addTitle();
    this.addIcons();
  }

  // ---- Item selection modal ----
  selectItemIds() {
    const boardId = this.boardId;
    if (!boardId) return;
    const modal = d3.select(`#${boardId}-modal`);
    const modalContent = d3.select(`#${boardId}-modal-content`);
    const dataset = this.contextState?.datasets?.[0];
    const allItemIds = dataset?.data?.map((d) => d.itemId) || [];
    const showFilters = this.contextState?.showFilters;
    modalContent.selectAll("*").remove();

    modalContent.append("h4").html("Select items");
    modalContent.append("hr");

    if (showFilters) {
      modalContent.append("h4").html("Filters:");
      const filtersContainer = modalContent.append("div").attr("class", "button-container");
      const filterIds = (this.contextState?.filters || []).map((f) => f.id);
      const buttonGrid = filtersContainer.append("div");
      buttonGrid
        .selectAll(".button")
        .data(filterIds)
        .enter()
        .append("button")
        .attr("class", "button")
        .text((d) => d)
        .on("click", (event, d) => {
          this.handleFilterSelected(d);
          modal.style("display", "none");
          modalContent.selectAll("*").remove();
        });
      modalContent.append("hr");
    }

    modalContent.append("h4").html("Items:");
    const currentItemIds = this.itemIds || [];
    const checkboxContainer = modalContent.append("div").attr("class", "checkbox-container");
    allItemIds.forEach((id) => {
      const checkboxDiv = checkboxContainer.append("div").attr("class", "checkbox");
      const checkboxInput = checkboxDiv.append("input").attr("type", "checkbox").attr("id", `checkbox-${id}`).attr("value", id);
      if (currentItemIds.includes(id)) checkboxInput.attr("checked", true);
      checkboxDiv.append("label").attr("for", `checkbox-${id}`).text(` ${id}`);
    });

    const buttonContainer = modalContent.append("div").attr("class", "button-container");
    buttonContainer
      .append("button")
      .attr("class", "button")
      .html("Apply")
      .on("click", () => this.handleCheckboxesApply());

    modal.node().scrollTop = 0;
    modalContent.node().scrollTop = 0;
    modal.style("display", "block");
  }

  handleCheckboxesApply() {
    const boardId = this.boardId;
    if (!boardId) return;
    const modal = d3.select(`#${boardId}-modal`);
    const modalContent = d3.select(`#${boardId}-modal-content`);
    const checkedBoxes = modalContent.selectAll("input:checked");
    const itemIds = checkedBoxes.nodes().map((cb) => cb.value);
    modal.style("display", "none");
    modalContent.selectAll("*").remove();
    this.itemIds = itemIds;
    const fetchByItems = this.boxEvents?.data?.fetchByItemIds || this.boardEvents?.data?.fetchByItemIds || this.sharedState?.requestFetchDataByItemIds;
    fetchByItems && (fetchByItems.state = { itemIds });
  }

  handleFilterSelected(filterSelected) {
    const fetchByFilter = this.boxEvents?.data?.fetchByFilter || this.boardEvents?.data?.fetchByFilter || this.sharedState?.requestFetchDataByFilter;
    fetchByFilter && (fetchByFilter.state = { filterId: filterSelected });
  }

  // ---- Add new filter plot flow ----
  addPlot() {
    const boardId = this.boardId;
    if (!boardId) return;
    const modal = d3.select(`#${boardId}-modal`);
    const modalContent = d3.select(`#${boardId}-modal-content`);
    const buttonHandler = (plotType) => this.addNewFilterPlot(plotType);

    modalContent.selectAll("*").remove();
    modalContent
      .append("a")
      .attr("class", "cancel")
      .style("text-decoration", "none")
      .style("position", "absolute")
      .style("top", "0")
      .style("right", "10px")
      .style("cursor", "pointer")
      .html("cancel")
      .on("click", () => {
        modal.style("display", "none");
        modalContent.selectAll("*").remove();
      });
    modalContent.append("h4").html("Select plot type");
    modalContent.append("hr");
    const plotTypes = filterPlots.map((p) => p.name);
    const buttonGrid = modalContent.append("div").attr("class", "button-container");
    buttonGrid
      .selectAll(".button")
      .data(plotTypes)
      .enter()
      .append("button")
      .attr("class", "button")
      .text((d) => d)
      .on("click", (event, d) => {
        event.stopPropagation();
        buttonHandler(d);
      });
    modal.style("display", "block");
  }

  addNewFilterPlot(plotType) {
    const requestAddFilterPlot =
      this.boxEvents?.plots?.addFilterPlot || this.boardEvents?.plots?.addFilterPlot || this.sharedState?.requestAddFilterPlot;
    if (!requestAddFilterPlot) return;

    const filterId = "filter-0"; // legacy default
    const filters = this.contextState?.filters || [];
    const filter = filters.find((f) => f.id === filterId);
    const continuousProperties = filter?.continuousProperties || [];
    const categoricalProperties = filter?.categoricalProperties || [];
    const propertyOptions = {
      continuous: [...continuousProperties].sort(),
      categorical: [...categoricalProperties].sort(),
    };

    const boardId = this.boardId;
    const modal = boardId ? d3.select(`#${boardId}-modal`) : null;
    const modalContent = boardId ? d3.select(`#${boardId}-modal-content`) : null;
    modalContent?.on("click", (event) => event.stopPropagation());

    const dataNeeded = filterPlots.find((p) => p.name === plotType)?.dataNeeded || [];
    const dataNeededProps = dataNeeded.filter((d) => !d.array);
    const dataNeededArrays = dataNeeded.filter((d) => d.array);

    modalContent?.append("hr");
    modalContent?.select(".dropdown-container").remove();
    const dropdownContainer = modalContent?.append("div").attr("class", "dropdown-container");
    const dropdowns = dropdownContainer
      ?.selectAll(".dropdown")
      .data(dataNeededProps)
      .enter()
      .append("div");

    dropdowns
      ?.append("label")
      .text((d) => d.name);
    dropdowns
      ?.append("select")
      .on("click", (event) => {
        event.stopPropagation();
      })
      .on("change input drag", (event) => {
        event.stopPropagation();
      })
      .selectAll("option")
      .data((d) => propertyOptions[d.type] || [])
      .enter()
      .append("option")
      .text((d) => d);

    dataNeededArrays.forEach((d) => {
      const checkboxContainer = dropdowns?.append("div");
      checkboxContainer?.append("p").html(d.name);
      const propOptions = propertyOptions[d.type] || [];
      propOptions.forEach((p) => {
        const checkboxDiv = checkboxContainer?.append("div").attr("class", "checkbox");
        const checkboxInput = checkboxDiv?.append("input").attr("type", "checkbox").attr("id", `checkbox-${d.name}-${p}`).attr("value", p);
        checkboxDiv?.append("label").attr("for", `checkbox-${d.name}-${p}`).text(` ${p}`);
      });
    });

    dropdownContainer
      ?.append("button")
      .attr("class", "button")
      .text("Make plot")
      .on("click", () => {
        const dropdownValues = {};
        dropdowns?.each(function (d, i) {
          const dropdown = d3.select(this).select("select");
          const selectedValue = dropdown.property("value");
          dropdownValues[dataNeededProps[i].name] = selectedValue;
        });
        dataNeededArrays.forEach((d) => {
          const propOptions = propertyOptions[d.type] || [];
          const selectedValues = [];
          propOptions.forEach((p) => {
            const checkbox = d3.select(`#checkbox-${d.name}-${p}`);
            if (checkbox.property("checked")) {
              selectedValues.push(p);
            }
          });
          dropdownValues[d.name] = selectedValues;
        });

        requestAddFilterPlot.state = { plotType, filterId, dataProperties: dropdownValues };
        modal?.style("display", "none");
        modalContent?.selectAll("*").remove();
        if (this.boardStateRaw) {
          this.boardStateRaw.preventZoom = false;
        }
      });
  }

  removePlot() {
    const parentId = this.boardId;
    const updateBoxes =
      this.boardEvents?.boxes?.update || this.sharedStateByAncestorId?.[parentId]?.requestUpdateBoxes || this.sharedState?.requestUpdateBoxes;
    if (updateBoxes) {
      updateBoxes.state = { boxesToAdd: [], boxesToRemove: [this.boxId] };
    }
  }

  // ---- Data fetching ----
  async getData() {
    if (!this.fetchData || !this.fetchDataNow) return;
    const trafficLight = this.boardEvents?.ui?.setTrafficLight;

    this.fetchingData = true;
    if (trafficLight) trafficLight.state = "fetching";

    const derivedData = this.contextState?.derivedData;
    const dimensions = this.contextState?.dimensions;
    this.data = await fetchPlotData(this.fetchData, derivedData, dimensions);

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

  get plotAreaSel() {
    return d3.select(`#${this.plotAreaId}`);
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

export { Plot };
