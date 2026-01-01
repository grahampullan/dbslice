import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { WebGLPlotBase } from "./WebGLPlotBase.js";
import { interpolateSpectral } from "d3-scale-chromatic";
import * as d3 from "d3v7";
import { makeQuadTree, getLine } from "./cutQuadTrees.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

class TriMesh3D extends WebGLPlotBase {
  constructor(options = {}) {
    options.layout ??= {};
    options.layout.margin ??= { top: 2, right: 0, bottom: 0, left: 0 };
    options.layout.twoDSameScale ??= true;
    options.layout.cuts ??= [];
    options.layout.cutWhileBrushing ??= false;
    options.layout.filterId ??= null;
    options.layout.highlightItems ??= false;
    options.fetchData ??= {};
    super(options);
    if (this.layout.showXAxis) this.marginAdd.bottom += 32;
    if (this.layout.showYAxis) this.marginAdd.left += 35;
    if (this.layout.showColorBar) this.marginAdd.right += 50;
    this.componentType = options.componentType || "TriMesh3D";
    this._activeController = false;
    this.meshUuids = [];
    this.offsets = [];
    this.nSteps = 0;
    this.nSurfs = 0;
    this.vScale = [0, 1];
    this.colorScale = null;
    this.cuts = [];
    this.cutLineMeshes = new Map();
  }

  initBindings() {
    const filterId = this.layout.filterId;
    if (filterId && this.contextState?.filters) {
      this.filter = this.contextState.filters.find((f) => f.id === filterId);
      this.filterId = filterId;
      if (this.filter && this.layout.highlightItems && this.filter.highlightItemIds) {
        const obsId = this.filter.highlightItemIds.subscribe(this.highlightItems.bind(this));
        this.subscriptions.push({ observable: this.filter.highlightItemIds, id: obsId });
      }
    }

    const requestCreateDimension = this.contextEvents?.dimensions?.create;
    const dimensions = this.contextState?.dimensions;
    if (requestCreateDimension && dimensions && Array.isArray(this.layout.cuts)) {
      this.layout.cuts.forEach((cut) => {
        const name = cut.dimensionName;
        if (!name) return;
        requestCreateDimension.state = { name, value: cut.value ?? null };
        const dim = dimensions.find((d) => d.name === name);
        if (dim) {
          const obsId = dim.subscribe((data) => this.onCutDimensionChange(name, data));
          this.subscriptions.push({ observable: dim, id: obsId });
        }
      });
    }
    this.initCuts();

    // Dimension-driven URL fetching
    if (this.fetchData?.getUrlFromDimensions) {
      const dimNames = this.fetchData.getUrlFromDimensions.dimensionNames || [];
      const requestCreateDimension = this.contextEvents?.dimensions?.create;
      const dimensions = this.contextState?.dimensions;
      dimNames.forEach((dimName) => {
        requestCreateDimension?.(requestCreateDimension.state = { name: dimName, value: null });
        const dim = dimensions?.find((d) => d.name === dimName);
        if (dim) {
          const obsId = dim.subscribe((data) => this.handleDimensionChange(dimName, data));
          this.subscriptions.push({ observable: dim, id: obsId });
        }
      });
    }
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
    const cam = new THREE.PerspectiveCamera(60, aspect, 0.01, 10000);
    cam.position.set(0, 0, 2);
    this.camera = cam;
    this.cameraLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.cameraLight.position.set(0, 0, 1);
    this.camera.add(this.cameraLight);
    this.scene.add(this.camera);
  }

  ensureControls() {
    if (this.controls) return;
    const dom = this.contextServices.renderer?.domElement;
    if (!dom) return;
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.addEventListener("start", () => { this._activeController = true; });
    this.controls.addEventListener("end", () => { this._activeController = false; });
    this.controls.addEventListener("change", () => {
      if (this._activeController && this.layout.cameraSync) {
        this.publishSharedCameraState();
      }
      this.boardServices.scheduler?.markDirty?.();
    });
  }

  async updateSceneFromData() {
    if (this.camera?.isPerspectiveCamera) {
      const aspect = Math.max(1e-6, this.plotAreaWidth / Math.max(1, this.plotAreaHeight));
      if (Math.abs(this.camera.aspect - aspect) > 1e-6) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
      }
    }

    if (this.layout.cameraSync && !this._activeController) {
      this.applySharedCameraState();
    }

    if (this.plotAreaWidth <= 0 || this.plotAreaHeight <= 0) {
      this.clearMeshes();
      this.cutLineMeshes.forEach((_, name) => this.removeCutLineMesh(name));
      return;
    }

    if (!this.data) return;
    this.getOffsets();
    if (!this.offsets.length) return;

    this.prepareColorScale();
    this.clearMeshes();
    this.buildMeshesForStep(0);

    this.cuts.forEach((cut) => {
      this.setZp(cut);
      this.makeQuadTrees(cut);
      this.updateCutLines(cut.dimensionName);
    });

    this.addAxes();
    this.addColorBar();

    this.controls?.update();
    this.boardServices.scheduler?.markDirty?.();
  }

  prepareColorScale() {
    const layout = this.layout;
    const vScale = layout.vScale ?? [0, 1];
    this.vScale = vScale;
    const color = layout.colourMap
      ? d3.scaleSequential(layout.colourMap)
      : d3.scaleSequential((t) => interpolateSpectral(1 - t));
    color.domain([0, 1]);
    this.colorScale = color;
    const textureWidth = 512;
    const textureHeight = 1;
    const texData = new Uint8Array(4 * textureWidth * textureHeight);
    let k = 0;
    for (let i = 0; i < textureWidth; i++) {
      const t = i / (textureWidth - 1);
      const col = d3.rgb(color(t));
      texData[k++] = col.r;
      texData[k++] = col.g;
      texData[k++] = col.b;
      texData[k++] = 255;
    }
    this.textureLUT = new THREE.DataTexture(
      texData,
      textureWidth,
      textureHeight,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    this.textureLUT.colorSpace = THREE.SRGBColorSpace;
    this.textureLUT.generateMipmaps = false;
    this.textureLUT.minFilter = THREE.NearestFilter;
    this.textureLUT.magFilter = THREE.NearestFilter;
    this.textureLUT.wrapS = THREE.ClampToEdgeWrapping;
    this.textureLUT.wrapT = THREE.ClampToEdgeWrapping;
    this.textureLUT.anisotropy = 1;
    this.textureLUT.needsUpdate = true;
  }

  buildMeshesForStep(iStep) {
    if (!this.offsets?.length) return;
    for (let iSurf = 0; iSurf < (this.nSurfs || 0); iSurf++) {
      const surf = this.getSurface(iStep, iSurf);
      if (!surf) continue;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(surf.vertices, 3));
      geom.setAttribute("uv", new THREE.BufferAttribute(surf.uvs, 2));
      geom.setIndex(new THREE.BufferAttribute(surf.indices, 1));
      geom.computeVertexNormals();
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        wireframe: false,
        map: this.textureLUT,
        shininess: 60,
        specular: new THREE.Color(0xffffff),
        stencilWrite: true,
        stencilRef: 1,
        stencilFunc: THREE.NotEqualStencilFunc,
      });
      const mesh = new THREE.Mesh(geom, material);
      mesh.renderOrder = 1;
      this.meshUuids.push(mesh.uuid);
      this.scene.add(mesh);
    }
  }

  getOffsets() {
    const buffer = this.data;
    if (!buffer) return;
    let ii = 0;
    const nSteps = new Int32Array(buffer, ii, 1)[0];
    this.nSteps = nSteps;
    ii += 4;
    const nSurfs = new Int32Array(buffer, ii, 1)[0];
    this.nSurfs = nSurfs;
    ii += 4;
    const offsets = [];
    for (let iStep = 0; iStep < nSteps; iStep++) {
      const surfaces = [];
      for (let iSurf = 0; iSurf < nSurfs; iSurf++) {
        const surfNameBytes = new Int8Array(buffer, ii, 96);
        ii += 96;
        const surfName = String.fromCharCode(...surfNameBytes).trim().split("\u0000")[0];
        const ints = new Int32Array(buffer, ii, 3);
        ii += 12;
        let nVerts = ints[0];
        let nTris = ints[1];
        const nValues = ints[2];
        const floats = new Float32Array(buffer, ii, 7);
        ii += 28;
        const rMax = floats[0];
        const xRange = floats.slice(1, 3);
        const yRange = floats.slice(3, 5);
        const zRange = floats.slice(5, 7);
        let verticesOffset;
        let indicesOffset;
        if (nVerts > 0 && nTris === 0 && iStep > 0) {
          verticesOffset = offsets[0][iSurf].verticesOffset;
          indicesOffset = offsets[0][iSurf].indicesOffset;
          nTris = offsets[0][iSurf].nTris;
        } else {
          verticesOffset = ii;
          ii += nVerts * 3 * 4;
          indicesOffset = ii;
          ii += nTris * 3 * 4;
        }
        const valuesList = [];
        for (let iValue = 0; iValue < nValues; iValue++) {
          const valueNameBytes = new Int8Array(buffer, ii, 96);
          ii += 96;
          const valueName = String.fromCharCode(...valueNameBytes).trim().split("\u0000")[0];
          const valueRange = new Float32Array(buffer, ii, 2);
          ii += 8;
          const valuesOffset = ii;
          ii += nVerts * 4;
          valuesList.push({ name: valueName, range: valueRange, offset: valuesOffset });
        }
        surfaces.push({
          name: surfName,
          nVerts,
          nTris,
          nValues,
          rMax,
          xRange,
          yRange,
          zRange,
          verticesOffset,
          indicesOffset,
          values: valuesList,
        });
      }
      offsets.push(surfaces);
    }
    this.offsets = offsets;
  }

  getSurface(iStep, iSurf) {
    const buffer = this.data;
    const thisSurface = this.offsets?.[iStep]?.[iSurf];
    if (!thisSurface) return null;
    const { nVerts, nTris, verticesOffset, indicesOffset, values } = thisSurface;
    const vScale = this.vScale;
    const vertices = new Float32Array(buffer, verticesOffset, nVerts * 3);
    const indices = new Uint32Array(buffer, indicesOffset, nTris * 3);
    const valuesArr = new Float32Array(buffer, values[0].offset, nVerts);
    const uvs = new Float32Array(
      Array.from(valuesArr).map((d) => [(d - vScale[0]) / (vScale[1] - vScale[0]), 0.5]).flat()
    );
    return { vertices, indices, values: valuesArr, uvs, nVerts, nTris };
  }

  addAxes() {
    if (!this.layout.showXAxis && !this.layout.showYAxis) return;
    if (!this.camera?.isOrthographicCamera && !this.camera?.isPerspectiveCamera) return;

    // Raycast to find visible ranges in camera plane (following original logic)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const planeNormal = new THREE.Vector3(1, 0, 0);
    const plane = new THREE.Plane(planeNormal);
    pointer.x = -1;
    pointer.y = -1;
    raycaster.setFromCamera(pointer, this.camera);
    const intersectBottomLeft = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    pointer.x = 1;
    pointer.y = 1;
    raycaster.setFromCamera(pointer, this.camera);
    const intersectTopRight = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    const xRangeVisible = [intersectBottomLeft.y, intersectTopRight.y];
    const yRangeVisible = [intersectBottomLeft.z, intersectTopRight.z];
    this.xRangeVisible = xRangeVisible;
    this.yRangeVisible = yRangeVisible;

    const xScale = d3.scaleLinear().domain(xRangeVisible).range([0, this.plotAreaWidth]);
    const yScale = d3.scaleLinear().domain(yRangeVisible).range([this.plotAreaHeight, 0]);
    const overlay = d3.select(`#${this.id}`).select(".svg-overlay");
    const standOff = 2;

    if (this.layout.showXAxis) {
      const xAxis = d3.axisBottom(xScale);
      if (this.layout.xTickNumber) xAxis.ticks(this.layout.xTickNumber);
      let gX = overlay.select(".x-axis");
      if (gX.empty()) {
        gX = overlay
          .append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(${this.marginTotal.left},${this.plotAreaHeight + standOff})`)
          .style("pointer-events", "bounding-box")
          .call(xAxis);
        gX.selectAll(".tick").style("pointer-events", "none");
        gX.selectAll(".tick text").style("cursor", "default").style("user-select", "none");
        gX.style("cursor", "grab");
        gX.append("text")
          .attr("class", "x-axis-text")
          .attr("fill", "#000")
          .attr("x", this.plotAreaWidth)
          .attr("y", this.marginTotal.bottom - 5)
          .attr("text-anchor", "end")
          .style("pointer-events", "none")
          .style("user-select", "none")
          .text(this.layout.xAxisLabel);
      } else {
        gX
          .attr("transform", `translate(${this.marginTotal.left},${this.plotAreaHeight + standOff})`)
          .call(xAxis);
        gX.select(".x-axis-text").attr("x", this.plotAreaWidth);
      }
    }

    if (this.layout.showYAxis) {
      const yAxis = d3.axisLeft(yScale);
      if (this.layout.yTickNumber) yAxis.ticks(this.layout.yTickNumber);
      let gY = overlay.select(".y-axis");
      if (gY.empty()) {
        gY = overlay
          .append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${this.marginTotal.left - standOff},0)`)
          .style("pointer-events", "bounding-box")
          .call(yAxis);
        gY.selectAll(".tick").style("pointer-events", "none");
        gY.selectAll(".tick text").style("cursor", "default").style("user-select", "none");
        gY.style("cursor", "grab");
        gY
          .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("x", 0)
          .attr("y", -this.marginTotal.left + 15)
          .attr("text-anchor", "end")
          .style("pointer-events", "none")
          .style("user-select", "none")
          .text(this.layout.yAxisLabel);
      } else {
        gY.attr("transform", `translate(${this.marginTotal.left - standOff},0)`).call(yAxis);
      }
    }
  }

  addColorBar() {
    if (!this.layout.showColorBar || !this.colorScale) return;
    const overlay = d3.select(`#${this.id}`).select(".svg-overlay");
    const scaleHeight = this.plotAreaHeight / 2;
    const colorScale = this.colorScale;
    const vScale = this.vScale;

    let defs = overlay.select("defs");
    if (defs.empty()) defs = overlay.append("defs");
    const gradientId = `${this.id}-colorbar-gradient`;
    let gradient = defs.select(`#${gradientId}`);
    if (gradient.empty()) {
      gradient = defs.append("linearGradient").attr("id", gradientId).attr("x1", "0%").attr("y1", "100%").attr("x2", "0%").attr("y2", "0%");
    }
    gradient.selectAll("stop").remove();
    const nStops = 10;
    for (let i = 0; i <= nStops; i++) {
      const t = i / nStops;
      gradient.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", colorScale(t));
    }

    let g = overlay.select(".color-bar");
    if (g.empty()) {
      g = overlay.append("g").attr("class", "color-bar");
    }

    const x = this.plotAreaWidth + this.marginTotal.left + 10;
    const y = this.plotAreaHeight / 4;
    const width = 20;
    g.selectAll("rect.color-bar-rect")
      .data([null])
      .join("rect")
      .attr("class", "color-bar-rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", width)
      .attr("height", scaleHeight)
      .style("fill", `url(#${gradientId})`)
      .style("stroke", "black")
      .style("stroke-width", 1);

    const vAxisScale = d3.scaleLinear().domain(vScale).range([scaleHeight + y, y]);
    const vAxis = d3.axisRight(vAxisScale).ticks(5);
    g.selectAll("g.color-bar-axis")
      .data([null])
      .join("g")
      .attr("class", "color-bar-axis")
      .attr("transform", `translate(${x + width},0)`)
      .call(vAxis);
  }

  clearMeshes() {
    this.meshUuids.forEach((uuid) => {
      const old = this.scene.getObjectByProperty("uuid", uuid);
      if (!old) return;
      old.geometry?.dispose?.();
      if (Array.isArray(old.material)) old.material.forEach((m) => m?.dispose?.());
      else old.material?.dispose?.();
      this.scene.remove(old);
    });
    this.meshUuids = [];
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

  handleDimensionChange(dimName, data) {
    if (!this.fetchData) return;
    this.fetchDataNow = true;
    this.requestUpdate();
  }

  highlightItems() {
    if (!this.filter) return;
    const highlightItemIds = this.filter.highlightItemIds?.state?.itemIds;
    const container = d3.select(`#${this.id}`);
    const isHighlighted = highlightItemIds?.includes?.(this.itemId);
    if (!isHighlighted) {
      container.style("outline-width", "0px");
      return;
    }
    container
      .style("outline-style", "solid")
      .style("outline-color", "red")
      .style("outline-width", "4px")
      .style("outline-offset", "0px")
      .raise();
  }

  onCutDimensionChange(name, data) {
    const cut = this.cuts.find((c) => c.dimensionName === name);
    if (!cut) return;
    cut.value = data.value;
    this.updateCutLines(name);
    if (this.layout.cutWhileBrushing || !data.brushing) {
      this.scheduleCutEvaluation(name);
    }
    this.boardServices.scheduler?.markDirty?.();
  }

  initCuts() {
    this.cuts = [];
    const cuts = this.layout.cuts || [];
    cuts.forEach((cutCfg) => {
      const cut = { ...cutCfg, zps: [], sdists: [], quadtrees: [], value: cutCfg.value ?? 0 };
      this.cuts.push(cut);
    });
  }

  setZp(cut) {
    cut.zps = [];
    cut.sdists = [];
    for (let iSurf = 0; iSurf < this.nSurfs; iSurf++) {
      const surf = this.getSurface(0, iSurf);
      if (!surf) continue;
      const vertices = surf.vertices;
      const zp = new Float32Array(surf.nVerts);
      const sdist = new Float32Array(surf.nVerts);
      for (let iVert = 0; iVert < surf.nVerts; iVert++) {
        const vert = [vertices[iVert * 3], vertices[iVert * 3 + 1], vertices[iVert * 3 + 2]];
        if (cut.type == "x") {
          zp[iVert] = vert[1];
          sdist[iVert] = vert[2];
        } else if (cut.type == "y") {
          zp[iVert] = vert[2];
          sdist[iVert] = vert[1];
        } else if (cut.type == "r") {
          zp[iVert] = Math.sqrt(vert[1] ** 2 + vert[2] ** 2);
          const theta = Math.atan2(vert[1], vert[2]);
          sdist[iVert] = theta;
        } else if (cut.type == "theta") {
          zp[iVert] = Math.atan2(vert[2], vert[1]);
          sdist[iVert] = Math.sqrt(vert[1] ** 2 + vert[2] ** 2);
        }
      }
      cut.zps.push(zp);
      cut.sdists.push(sdist);
    }
  }

  makeQuadTrees(cut) {
    cut.quadtrees = [];
    for (let iSurf = 0; iSurf < this.nSurfs; iSurf++) {
      const surf = this.getSurface(0, iSurf);
      if (!surf) continue;
      const indices = surf.indices;
      const zp = cut.zps[iSurf];
      cut.quadtrees.push(makeQuadTree(indices, zp));
    }
  }

  getCutLine(cut) {
    let lineSegmentsAll = [];
    for (let iSurf = 0; iSurf < this.nSurfs; iSurf++) {
      const surf = this.getSurface(0, iSurf);
      if (!surf) continue;
      const line = getLine(
        { ...surf, zp: cut.zps[iSurf], sdist: cut.sdists[iSurf] },
        cut.quadtrees[iSurf],
        cut.value
      );
      lineSegmentsAll = lineSegmentsAll.concat(line);
    }
    return lineSegmentsAll;
  }

  scheduleCutEvaluation(dimensionName) {
    const cut = this.cuts.find((c) => c.dimensionName === dimensionName);
    if (!cut || !this.boardServices.scheduler) return;
    const key = `cut-eval:${this.boxId}:${dimensionName}`;
    this.boardServices.scheduler.scheduleJob(key, () => {
      const lineSegments = this.getCutLine(cut);
      const save = this.contextEvents?.derivedData?.save;
      if (save && cut.dataStoreName) {
        save.state = { name: cut.dataStoreName, itemId: this.itemId, data: lineSegments };
      }
      this.boardServices.scheduler.markDirty();
    });
  }

  updateCutLines(dimensionName) {
    const cut = this.cuts.find((c) => c.dimensionName === dimensionName);
    if (!cut) return;
    const lineSegments = this.getCutLine(cut);
    if (!lineSegments || !lineSegments.length) {
      this.removeCutLineMesh(dimensionName);
      return;
    }
    const positions = lineSegments.flat();
    const geom = new LineGeometry();
    geom.setPositions(positions);

    const mat = new LineMaterial({
      color: 0xd0d5db,
      linewidth: 3,
      worldUnits: false,
      dashed: false,
    });
    mat.stencilWrite = true;
    mat.stencilRef = 1;
    mat.stencilFunc = THREE.NotEqualStencilFunc;
    mat.depthTest = false;
    mat.resolution.set(this.plotAreaWidth, this.plotAreaHeight);

    const line = new Line2(geom, mat);
    line.computeLineDistances();
    line.renderOrder = 2;

    this.removeCutLineMesh(dimensionName);
    this.cutLineMeshes.set(dimensionName, line);
    this.scene.add(line);
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
}

export { TriMesh3D };
