import * as THREE from "three";
import * as d3 from "d3v7";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { WebGLPlotBase } from "./WebGLPlotBase.js";

class LineSeriesGL extends WebGLPlotBase {
  constructor(options = {}) {
    options.layout ??= {};
    options.layout.margin ??= { top: 5, right: 20, bottom: 30, left: 53 };
    options.layout.highlightItems ??= true;
    options.layout.lineWidth ??= 2.5;
    super(options);
    this.componentType = options.componentType || "LineSeriesGL";
    this.filter = null;
    this.lineUuids = [];
    this.cuts = [];
    this.cutLineMeshes = new Map();
    this._activeController = false;
  }

  initBindings() {
    const filterId = this.layout.filterId || this.fetchData?.filterId;
    if (filterId && this.contextState?.filters) {
      this.filter = this.contextState.filters.find((f) => f.id === filterId);
      if (this.filter && this.layout.highlightItems && this.filter.highlightItemIds) {
        const obsId = this.filter.highlightItemIds.subscribe(this.highlightItems.bind(this));
        this.subscriptions.push({ observable: this.filter.highlightItemIds, id: obsId });
      }
      if (this.filter?.itemIdsInFilter && this.fetchData?.urlTemplate) {
        const obsId = this.filter.itemIdsInFilter.subscribe(this.handleFilterChange.bind(this));
        this.subscriptions.push({ observable: this.filter.itemIdsInFilter, id: obsId });
        if (this.fetchData.getItemIdsFromFilter) {
          this.fetchData.itemIds = this.filter.itemIdsInFilter.state.itemIds;
        }
      }
    }

    if (this.fetchData?.derivedDataName) {
      const stores = this.contextState?.derivedData || [];
      let store = stores.find((d) => d.name == this.fetchData.derivedDataName);
      if (!store && this.contextEvents?.derivedData?.createStore) {
        this.contextEvents.derivedData.createStore.state = { name: this.fetchData.derivedDataName };
        store = (this.contextState?.derivedData || []).find((d) => d.name == this.fetchData.derivedDataName);
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

    this.initCuts();
  }

  ensureScene() {
    if (this.scene) return;
    super.ensureScene();
    this.scene.background = new THREE.Color(0xe0e0e0);
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambient);
  }

  ensureCamera() {
    if (this.camera) return;
    const aspect = Math.max(1e-6, this.plotAreaWidth / Math.max(1, this.plotAreaHeight));
    const cam = new THREE.OrthographicCamera(-1, 1, 1 / aspect, -1 / aspect, 0.0001, 1e6);
    cam.position.set(0, 0, 10);
    cam.lookAt(0, 0, 0);
    this.camera = cam;
  }

  ensureControls() {
    if (this.controls) return;
    const dom = this.plotAreaSel?.node?.();
    if (!dom) return;
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.enableRotate = false;
    this.controls.addEventListener("start", () => { this._activeController = true; });
    this.controls.addEventListener("end", () => { this._activeController = false; });
    this.controls.addEventListener("change", () => {
      if (this._activeController && this.layout.cameraSync) {
        this.publishSharedCameraState();
      }
      this.boardServices.scheduler?.markDirty?.();
      this.updateCutLines();
      this.addAxes();
    });
  }

  async updateSceneFromData() {
    if (this.camera?.isOrthographicCamera) {
      const aspect = Math.max(1e-6, this.plotAreaWidth / Math.max(1, this.plotAreaHeight));
      const viewHeight = Math.max(1e-6, this.plotAreaHeight);
      const viewWidth = Math.max(1e-6, this.plotAreaWidth);
      this.camera.left = -viewWidth / 2;
      this.camera.right = viewWidth / 2;
      this.camera.top = viewHeight / 2;
      this.camera.bottom = -viewHeight / 2;
      this.camera.updateProjectionMatrix();
    }

    if (this.layout.cameraSync && !this._activeController) {
      this.applySharedCameraState();
    }

    if (!this.data || !this.data.series?.length) {
      this.clearLines();
      this.cutLineMeshes.forEach((_, name) => this.removeCutLineMesh(name));
      return;
    }

    this.setRanges();
    this.ensureCamera(); // adjust after ranges
    this.ensureControls();

    this.clearLines();
    this.buildLines();

    this.addAxes();
    this.cuts.forEach((cut) => {
      if (!cut.lineAdded) this.addCutLine(cut);
      this.setCutLinePosition(cut.dimensionName);
    });

    this.controls?.update();
    this.boardServices.scheduler?.markDirty?.();
  }

  setRanges() {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    this.data.series.forEach((series) => {
      series.data.forEach((pt) => {
        xMin = Math.min(xMin, pt.x);
        xMax = Math.max(xMax, pt.x);
        yMin = Math.min(yMin, pt.y);
        yMax = Math.max(yMax, pt.y);
      });
    });
    const xDiff = xMax - xMin;
    const yDiff = yMax - yMin;
    this.xRange = this.layout.xRange || [xMin - 0.05 * xDiff, xMax + 0.05 * xDiff];
    this.yRange = this.layout.yRange || [yMin - 0.05 * yDiff, yMax + 0.05 * yDiff];
    this.xMid = (this.xRange[0] + this.xRange[1]) / 2;
    this.yMid = (this.yRange[0] + this.yRange[1]) / 2;
  }

  buildLines() {
    const colour = this.layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeTableau10) : d3.scaleOrdinal(this.layout.colourMap);
    if (this.layout.cSet !== undefined && this.filter) {
      colour.domain(Array.isArray(this.layout.cSet) ? this.layout.cSet : this.filter.categoricalUniqueValues[this.layout.cSet]);
    }
    const width = this.plotAreaWidth;
    const height = this.plotAreaHeight;

    this.data.series.forEach((series) => {
      if (!series.data || series.data.length < 2) return;
      const positions = [];
      series.data.forEach((pt) => {
        positions.push(pt.x, pt.y, 0);
      });
      const geom = new LineGeometry();
      geom.setPositions(positions);
      const mat = new LineMaterial({
        color: (series.cKey !== undefined) ? colour(series.cKey) : 0x6495ed,
        linewidth: this.layout.lineWidth || 2.5,
        resolution: new THREE.Vector2(width, height)
      });
      mat.stencilWrite = true;
      mat.stencilRef = 1;
      mat.stencilFunc = THREE.NotEqualStencilFunc;

      const line = new Line2(geom, mat);
      line.computeLineDistances();
      line.renderOrder = 10;
      line.userData = { seriesData: series };
      this.scene.add(line);
      this.lineUuids.push(line.uuid);
    });
  }

  clearLines() {
    this.lineUuids.forEach((uuid) => {
      const obj = this.scene.getObjectByProperty("uuid", uuid);
      if (!obj) return;
      obj.geometry?.dispose?.();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.());
      else obj.material?.dispose?.();
      this.scene.remove(obj);
    });
    this.lineUuids = [];
  }

  addAxes() {
    const overlay = d3.select(`#${this.id}`).select(".svg-overlay");
    const layout = this.layout;
    const xScale = d3.scaleLinear().domain(this.xRange).range([0, this.plotAreaWidth]);
    const yScale = d3.scaleLinear().domain(this.yRange).range([this.plotAreaHeight, 0]);
    const standOff = 2;

    const xAxis = d3.axisBottom(xScale);
    if (layout.xTickNumber !== undefined) xAxis.ticks(layout.xTickNumber);
    if (layout.xTickFormat !== undefined) xAxis.tickFormat(d3.format(layout.xTickFormat));
    const yAxis = d3.axisLeft(yScale);
    if (layout.yTickNumber !== undefined) yAxis.ticks(layout.yTickNumber);
    if (layout.yTickFormat !== undefined) yAxis.tickFormat(d3.format(layout.yTickFormat));

    let gX = overlay.select(".axis-x");
    if (gX.empty()) {
      gX = overlay.append("g")
        .attr("transform", `translate(${this.marginTotal.left},${this.plotAreaHeight + standOff})`)
        .attr("class", "axis-x")
        .style("pointer-events", "bounding-box")
        .call(xAxis);
      gX.append("text")
        .attr("class", "x-axis-text")
        .attr("fill", "#000")
        .attr("x", this.plotAreaWidth)
        .attr("y", this.marginTotal.bottom - 5)
        .attr("text-anchor", "end")
        .style("pointer-events", "none")
        .style("user-select", "none")
        .text(layout.xAxisLabel);
    } else {
      gX.attr("transform", `translate(${this.marginTotal.left},${this.plotAreaHeight + standOff})`)
        .call(xAxis);
      gX.select(".x-axis-text").attr("x", this.plotAreaWidth);
    }

    let gY = overlay.select(".axis-y");
    if (gY.empty()) {
      gY = overlay.append("g")
        .attr("transform", `translate(${this.marginTotal.left - standOff},0)`)
        .attr("class", "axis-y")
        .style("pointer-events", "bounding-box")
        .call(yAxis);
      gY.append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -this.marginTotal.left + 15)
        .attr("text-anchor", "end")
        .style("pointer-events", "none")
        .style("user-select", "none")
        .text(layout.yAxisLabel);
    } else {
      gY.attr("transform", `translate(${this.marginTotal.left - standOff},0)`)
        .call(yAxis);
    }
  }

  publishSharedCameraState() {
    if (!this.plotGroupState) return;
    this.plotGroupState.sharedCamera = {
      position: this.camera.position.clone(),
      rotation: this.camera.rotation.clone(),
      zoom: this.camera.zoom
    };
  }

  applySharedCameraState() {
    const shared = this.plotGroupState?.sharedCamera;
    if (!shared || !this.camera) return;
    if (shared.position) this.camera.position.copy(shared.position);
    if (shared.rotation) this.camera.rotation.copy(shared.rotation);
    if (shared.zoom) this.camera.zoom = shared.zoom;
    this.camera.updateProjectionMatrix();
  }

  highlightItems() {
    if (!this.filter) return;
    const highlightItemIds = this.filter.highlightItemIds?.state?.itemIds;
    const colour = this.layout.colourMap === undefined ? d3.scaleOrdinal(d3.schemeTableau10) : d3.scaleOrdinal(this.layout.colourMap);
    if (this.layout.cSet !== undefined) {
      colour.domain(Array.isArray(this.layout.cSet) ? this.layout.cSet : this.filter.categoricalUniqueValues[this.layout.cSet]);
    }
    this.scene.children.forEach((obj) => {
      if (!obj.userData.seriesData) return;
      if (!highlightItemIds || highlightItemIds.length === 0) {
        obj.material.color.set((obj.userData.seriesData.cKey !== undefined) ? colour(obj.userData.seriesData.cKey) : 0x6495ed);
        obj.material.linewidth = this.layout.lineWidth || 2.5;
      } else {
        obj.material.color.set(0xd3d3d3);
        obj.material.linewidth = this.layout.lineWidth || 2.5;
        highlightItemIds.forEach((itemId) => {
          if (obj.userData.seriesData.itemId == itemId) {
            obj.material.color.set((obj.userData.seriesData.cKey !== undefined) ? colour(obj.userData.seriesData.cKey) : 0x6495ed);
            obj.material.linewidth = (this.layout.lineWidth || 2.5) * 1.5;
          }
        });
      }
      obj.material.needsUpdate = true;
    });
    this.boardServices.scheduler?.markDirty?.();
  }

  handleFilterChange(data) {
    if (data.brushing) return;
    if (this.fetchData?.getItemIdsFromFilter && !data.noFilter) {
      this.fetchData.itemIds = data.itemIds;
    }
    if (!this.fetchData?.getItemIdsFromFilter && data.noFilter) {
      this.fetchData.itemIds = data.itemIds;
    }
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
    this.fetchDataNow = true;
    this.requestUpdate();
  }

  async handleDerivedDataChange() {
    this.fetchDataNow = true;
    await this.requestUpdate();
    this.fetchDataNow = true;
    this.requestUpdate();
  }

  handleDimensionChange() {
    this.fetchDataNow = true;
    this.requestUpdate();
  }

  initCuts() {
    if (!this.layout.cuts?.length) return;
    const requestCreateDimension = this.contextEvents?.dimensions?.create;
    const dimensions = this.contextState?.dimensions;
    this.cuts = [];
    this.layout.cuts.forEach((cut) => {
      if (this.cuts.map((d) => d.dimensionName).includes(cut.dimensionName)) return;
      const cutToAdd = { ...cut, lineAdded: false, line: null, point: new THREE.Vector3(), brushing: false };
      let avgValue;
      if (cut.type == "x") {
        avgValue = d3.mean(this.xRange);
      } else if (cut.type == "y") {
        avgValue = d3.mean(this.yRange);
      }
      const initValue = cut.value ?? avgValue;
      requestCreateDimension?.(requestCreateDimension.state = { name: cut.dimensionName, value: initValue });
      const dimension = dimensions?.find((d) => d.name == cut.dimensionName);
      const dimValue = dimension?.state?.value ?? initValue;
      cutToAdd.value = dimValue;
      if (dimension) {
        const obsId = dimension.subscribe((data) => {
          const c = this.cuts.find((d) => d.dimensionName == cut.dimensionName);
          if (!c) return;
          c.value = data.value;
          this.setCutLinePosition(cut.dimensionName);
        });
        this.subscriptions.push({ observable: dimension, id: obsId });
      }
      this.cuts.push(cutToAdd);
    });
  }

  addCutLine(cut) {
    const width = this.plotAreaWidth;
    const height = this.plotAreaHeight;
    let positions;
    if (cut.type == "x") {
      positions = [cut.value, this.yRange[0], 0, cut.value, this.yRange[1], 0];
    } else {
      positions = [this.xRange[0], cut.value, 0, this.xRange[1], cut.value, 0];
    }
    const geom = new LineGeometry();
    geom.setPositions(positions);
    const mat = new LineMaterial({
      color: cut.brushing ? 0x42d4f5 : 0xd0d5db,
      linewidth: 3,
      resolution: new THREE.Vector2(width, height)
    });
    mat.stencilWrite = true;
    mat.stencilRef = 1;
    mat.stencilFunc = THREE.NotEqualStencilFunc;
    mat.depthTest = false;
    const line = new Line2(geom, mat);
    line.computeLineDistances();
    line.renderOrder = 15;
    cut.line = line;
    cut.lineAdded = true;
    this.cutLineMeshes.set(cut.dimensionName, line);
    this.scene.add(line);
  }

  setCutLinePosition(dimensionName) {
    const cut = this.cuts.find((d) => d.dimensionName == dimensionName);
    if (!cut || !cut.line) return;
    let positions;
    if (cut.type == "x") {
      positions = [cut.value, this.yRange[0], 0, cut.value, this.yRange[1], 0];
    } else {
      positions = [this.xRange[0], cut.value, 0, this.xRange[1], cut.value, 0];
    }
    cut.line.geometry.setPositions(positions);
    cut.line.computeLineDistances();
    cut.line.material.color.set(cut.brushing ? 0x42d4f5 : 0xd0d5db);
    cut.line.material.needsUpdate = true;
  }

  updateCutLines() {
    this.cuts.forEach((cut) => this.setCutLinePosition(cut.dimensionName));
  }

  removeCutLineMesh(name) {
    const existing = this.cutLineMeshes.get(name);
    if (!existing) return;
    existing.geometry?.dispose?.();
    if (Array.isArray(existing.material)) existing.material.forEach((m) => m?.dispose?.());
    else existing.material?.dispose?.();
    this.scene.remove(existing);
    this.cutLineMeshes.delete(name);
  }

  remove() {
    this.removeSubscriptions();
    this.clearLines();
    this.cutLineMeshes.forEach((_, name) => this.removeCutLineMesh(name));
  }
}

export { LineSeriesGL };
