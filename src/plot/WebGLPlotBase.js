import * as d3 from "d3v7";
import * as THREE from "three";
import { PlotV3_1 } from "./PlotV3_1";

// Shared WebGL shell for v3.1 plots. Not wired into existing plots yet.
export class WebGLPlotBase extends PlotV3_1 {
  constructor(options = {}) {
    super(options);
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.renderer = null;
    this.overlay = null;
    this.renderObserverId = null;
  }

  make() {
    this.updateHeader();
    this.addPlotAreaDiv();
    this.initOverlaySvg();
    this.setLasts();
    this.initBindings();
    this.update();
  }

  initOverlaySvg() {
    const container = d3.select(`#${this.id}`);
    container.select(".svg-overlay").remove();
    this.overlay = container
      .append("svg")
      .attr("class", "svg-overlay")
      .style("position", "absolute")
      .style("pointer-events", "none");
    this.updateOverlaySizeAndPos();
  }

  updateOverlaySizeAndPos() {
    if (!this.overlay) return;
    this.overlay
      .style("top", `${this.plotAreaTop}px`)
      .style("left", `${this.plotAreaLeft - this.marginTotal.left}px`)
      .attr(
        "width",
        this.plotAreaWidth + this.marginTotal.left + this.marginTotal.right
      )
      .attr("height", this.plotAreaHeight + this.marginTotal.bottom);
  }

  initBindings() {
    this.renderer = this.contextServices?.renderer ?? this.contextRaw?.renderer ?? null;
    const renderEvent =
      this.boardEvents?.webgl?.render ?? this.boardStateRaw?.requestWebGLRender;

    if (renderEvent && !this.renderObserverId) {
      this.renderObserverId = renderEvent.subscribeWithData?.({
        observer: this.renderScene.bind(this),
        data: { boxId: this.boxId },
      });
      if (this.renderObserverId) {
        this.subscriptions.push({ observable: renderEvent, id: this.renderObserverId });
      }
    }

    this.ensureScene();
    this.ensureCamera();
    this.ensureControls();
  }

  ensureScene() {
    if (this.scene) return;
    this.scene = new THREE.Scene();
  }

  // subclasses should override
  ensureCamera() {}
  ensureControls() {}

  async update() {
    if (this.fetchingData) return;
    if (this.fetchData && this.fetchDataNow) {
      await this.getData();
    }
    if (this.fetchData && (!this.data || this.data.__noUpdate)) return;

    this.updateHeader();
    this.updatePlotAreaSize();
    this.updateOverlaySizeAndPos();
    await this.updateSceneFromData();
    this.setLasts();
  }

  async updateSceneFromData() {
    // to be implemented by subclasses
  }

  renderScene() {
    if (!this.scene || !this.camera || !this.renderer) return;

    const container = d3.select(`#${this.id}`);
    const plotArea = container.select(".plot-area");
    if (plotArea.empty()) return;

    const plotRect = plotArea.node().getBoundingClientRect();
    let rect = {
      left: plotRect.left,
      right: plotRect.right,
      top: plotRect.top,
      bottom: plotRect.bottom,
    };

    const ancestorIds = (this.ancestorIds ?? []).filter(
      (id) => id !== "context" && id.includes("box")
    );
    for (const ancestorId of ancestorIds) {
      const el = d3.select(`#${ancestorId}-component-plot-area`);
      if (el.empty()) continue;
      const r = el.node().getBoundingClientRect();
      if (
        rect.right < r.left ||
        rect.left > r.right ||
        rect.bottom < r.top ||
        rect.top > r.bottom
      ) {
        return;
      }
      rect.left = Math.max(rect.left, r.left);
      rect.right = Math.min(rect.right, r.right);
      rect.top = Math.max(rect.top, r.top);
      rect.bottom = Math.min(rect.bottom, r.bottom);
    }

    const canvasRect = this.renderer.domElement.getBoundingClientRect();
    const x = rect.left - canvasRect.left;
    const y = canvasRect.bottom - rect.bottom;
    const w = rect.right - rect.left;
    const h = rect.bottom - rect.top;

    this.renderer.setViewport(x, y, w, h);
    this.renderer.setScissor(x, y, w, h);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.camera);
  }
}
