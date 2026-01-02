import * as d3 from "d3v7";
import * as THREE from "three";
import { Plot } from "./Plot";

// Shared WebGL shell for v3.1 plots. Not wired into existing plots yet.
export class WebGLPlotBase extends Plot {
  constructor(options = {}) {
    super(options);
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.renderer = null;
    this.overlay = null;
    this.renderObserverId = null;
    this.stencilRects = [];
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
    this.renderer = this.contextServices?.renderer ?? null;
    const renderEvent = this.boardEvents?.webgl?.render ?? null;

    if (renderEvent && !this.renderObserverId) {
      const subId = renderEvent.subscribeWithData?.({
        observer: this.renderScene.bind(this),
        data: { boxId: this.boxId },
      });
      if (subId) {
        this.renderObserverId = subId;
        this.subscriptions.push({ observable: renderEvent, id: subId });
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
    if (this.fetchData && !this.data) return;

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

    const plotArea = this.plotAreaSel;
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
    const pixelRatio = this.renderer.getPixelRatio ? this.renderer.getPixelRatio() : window.devicePixelRatio || 1;
    const x = (rect.left - canvasRect.left) * pixelRatio;
    const y = (canvasRect.bottom - rect.bottom) * pixelRatio;
    const w = (rect.right - rect.left) * pixelRatio;
    const h = (rect.bottom - rect.top) * pixelRatio;

    if (this.layout?.useStencil !== false) {
      this.refreshStencilRects(plotRect);
    }

    this.renderer.setScissorTest(true);
    this.renderer.setViewport(x, y, w, h);
    this.renderer.setScissor(x, y, w, h);
    this.renderer.clear(true, true, false);
    this.renderer.render(this.scene, this.camera);
  }

  refreshStencilRects(plotRect) {
    const overlaps = this.getOverlappingBoxesInClipSpace(plotRect);

    // remove previous rects
    this.stencilRects.forEach((uuid) => {
      const oldRect = this.scene.getObjectByProperty("uuid", uuid);
      if (!oldRect) return;
      oldRect.geometry?.dispose?.();
      oldRect.material?.dispose?.();
      this.scene.remove(oldRect);
    });
    this.stencilRects = [];

    // reset stencil to 0 over the plot area
    this.addStencilRect({ left: -1, right: 1, top: 1, bottom: -1 }, 0, true);

    overlaps.forEach((d) => {
      const margin = { left: 0.0, right: 0.02, top: 0.0, bottom: 0.02 };
      this.addStencilRect(
        {
          left: d.left - margin.left,
          right: d.right + margin.right,
          top: d.top + margin.top,
          bottom: d.bottom - margin.bottom,
        },
        1,
        !!this.layout?.showStencilRects
      );
    });
  }

  addStencilRect(rectClip, ref, colorWrite) {
    const geom = new THREE.BufferGeometry();
    const vertsClip = [
      new THREE.Vector3(rectClip.left, rectClip.top, 0.5),
      new THREE.Vector3(rectClip.right, rectClip.top, 0.5),
      new THREE.Vector3(rectClip.right, rectClip.bottom, 0.5),
      new THREE.Vector3(rectClip.left, rectClip.bottom, 0.5),
    ];
    const vertsWorld = vertsClip.map((v) => v.unproject(this.camera));
    const vertices = new Float32Array([
      vertsWorld[0].x,
      vertsWorld[0].y,
      vertsWorld[0].z,
      vertsWorld[1].x,
      vertsWorld[1].y,
      vertsWorld[1].z,
      vertsWorld[2].x,
      vertsWorld[2].y,
      vertsWorld[2].z,
      vertsWorld[3].x,
      vertsWorld[3].y,
      vertsWorld[3].z,
    ]);
    const indices = new Uint32Array([0, 2, 1, 0, 3, 2]);
    geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));

    const mat = new THREE.MeshBasicMaterial({ color: "red", wireframe: false });
    mat.colorWrite = colorWrite;
    mat.depthWrite = false;
    mat.depthTest = false;
    mat.stencilWrite = true;
    mat.stencilRef = ref;
    mat.stencilFunc = THREE.AlwaysStencilFunc;
    mat.stencilZPass = THREE.ReplaceStencilOp;

    const mesh = new THREE.Mesh(geom, mat);
    mesh.renderOrder = -1;
    this.stencilRects.push(mesh.uuid);
    this.scene.add(mesh);
  }

  getOverlappingBoxesInClipSpace(currentRect) {
    const currentBoxId = this.boxId;
    const parts = (currentBoxId || "").split("-");
    const allBoxNodes = d3.select(`#${this.boardId}`).selectAll(".board-box").nodes();
    const allBoxIds = allBoxNodes.map((box) => box.id);

    const ancestors = new Set();
    for (let i = parts.length; i > 1; i -= 2) {
      ancestors.add(parts.slice(0, i).join("-"));
    }

    const possibleOverlappingBoxesSet = new Set();
    for (let i = parts.length; i > 1; i -= 2) {
      const parentPrefix = parts.slice(0, i - 2).join("-");
      const siblings = allBoxIds.filter(
        (id) =>
          id.startsWith(parentPrefix) &&
          id.split("-").length === i &&
          !ancestors.has(id)
      );
      siblings.forEach((sibling) => possibleOverlappingBoxesSet.add(sibling));
    }
    const possibleOverlappingBoxes = Array.from(possibleOverlappingBoxesSet);
    possibleOverlappingBoxes.push(currentBoxId);

    const possibleOverlappingBoxNodes = allBoxNodes.filter((node) =>
      possibleOverlappingBoxes.includes(node.id)
    );
    const currentBoxNodeIndex = possibleOverlappingBoxNodes.findIndex(
      (node) => node.id === currentBoxId
    );
    const nearerBoxNodes = possibleOverlappingBoxNodes.filter(
      (_, index) => currentBoxNodeIndex < index
    );
    const nearerBoxRects = nearerBoxNodes.map((node) =>
      node.getBoundingClientRect()
    );
    const nearerBoxesClipSpace = nearerBoxRects.map((d) => {
      const left = (d.left - currentRect.left) / currentRect.width * 2 - 1;
      const right = (d.right - currentRect.left) / currentRect.width * 2 - 1;
      const top =
        (currentRect.top + currentRect.height - d.top) / currentRect.height * 2 - 1;
      const bottom =
        (currentRect.top + currentRect.height - d.bottom) / currentRect.height * 2 - 1;
      const overlap = left < 1 && right > -1 && bottom < 1 && top > -1;
      return { left, right, top, bottom, overlap };
    });
    return nearerBoxesClipSpace.filter((d) => d.overlap === true);
  }
}
