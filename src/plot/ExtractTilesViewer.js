import * as d3 from "d3v7";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { WebGLPlotBase } from "./WebGLPlotBase.js";

class ExtractTilesViewer extends WebGLPlotBase {
  constructor(options = {}) {
    options.layout = options.layout || {};
    options.layout.margin = options.layout.margin || { top: 5, right: 5, bottom: 5, left: 5 };
    options.layout.highlightItems ??= true;
    options.layout.cameraSync = options.layout.cameraSync ?? false;
    super(options);
    this.componentType = "ExtractTilesViewer";
    this.filter = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.tileManager = null;
    this.manifestVersion = 0;
    this.cameraLight = null;
    this.cameraDimConfig = this.layout.setCameraFromDimensions || null;
    this.cameraDimSubs = [];
    this._activeController = false;
  }

  initBindings() {
    super.initBindings();

    const filterId = this.layout.filterId || this.fetchData?.filterId || this.data?.filterId;
    if (filterId && this.contextState?.filters) {
      this.filter = this.contextState.filters.find(f => f.id === filterId) || null;
      if (this.filter && this.layout.highlightItems && this.filter.highlightItemIds) {
        const obsId = this.filter.highlightItemIds.subscribe(this.highlightItems.bind(this));
        this.subscriptions.push({ observable: this.filter.highlightItemIds, id: obsId });
      }
    }

    if (this.fetchData?.getUrlFromDimensions) {
      const requestCreateDimension = this.contextEvents?.dimensions?.create;
      const dimensions = this.contextState?.dimensions;
      const dimensionNames = this.fetchData.getUrlFromDimensions.dimensionNames || [];

      dimensionNames.forEach(dimName => {
        requestCreateDimension?.(requestCreateDimension.state = { name: dimName, value: null });
        const dimension = dimensions?.find(d => d.name == dimName);
        if (dimension) {
          const obsId = dimension.subscribe(this.handleDimensionChange.bind(this));
          this.subscriptions.push({ observable: dimension, id: obsId });
        }
      });
    }
    this.initCameraDimensionBindings();
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
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.01, 10000);
    this.camera.position.set(0, 0, 2);
    this.cameraLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.cameraLight.position.set(0, 0, 1);
    this.camera.add(this.cameraLight);
    this.scene.add(this.camera);
  }

  ensureControls() {
    if (this.controls) return;
    const dom = this.contextServices.renderer?.domElement;
    if (!dom) return;
    dom.style.touchAction = "none";
    dom.style.msTouchAction = "none";
    dom.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); }, { passive: false });
    ["pointermove", "pointerup", "pointercancel", "contextmenu"].forEach(type => {
      dom.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
    });
    dom.addEventListener("wheel", (e) => { e.preventDefault(); e.stopPropagation(); }, { passive: false });

    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = false;
    this.controls.addEventListener("start", () => { this._activeController = true; });
    this.controls.addEventListener("end", () => { this._activeController = false; });
    this.controls.addEventListener("change", () => {
      if (this._activeController && this.layout.cameraSync) {
        this.publishSharedCameraState();
      }
      if (this.tileManager) {
        this.tileManager.tick();
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

    if (this.layout.cameraSync && this.plotGroupState?.sharedCamera && !this._activeController) {
      this.applySharedCameraState();
    }

    if (!this.tileManager) {
      this.tileManager = new TileManager({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer || this.contextServices.renderer,
        onSceneChanged: () => this.boardServices.scheduler?.markDirty?.(),
        options: this.layout.tileOptions || {}
      });
    } else {
      this.tileManager.updateSceneRefs({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer || this.contextServices.renderer
      });
    }

    this.tileManager.setOptions(this.layout.tileOptions || {});

    if (this.data && this.data.series?.length) {
      // optional pattern match; primarily manifest-based usage
    }

    if (this.newData && this.data) {
      const manifest = this.data?.manifest || this.data;
      const version = ++this.manifestVersion;
      const manifestUrl = this.fetchData?.url || this.fetchData?.getUrlFromDimensions?.lastUrl || null;
      await this.tileManager.loadManifest(manifest, version, manifestUrl);
      this.recenterCamera(manifest);
      this.tileManager.tick();
      this.highlightItems();
      this.newData = false;
    }

    this.controls?.update();
    this.boardServices.scheduler?.markDirty?.();
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

  handleDimensionChange() {
        this.fetchDataNow = true;
        this.requestUpdate();
    }

  initCameraDimensionBindings() {
    if (!this.cameraDimConfig) return;
    const cfg = this.cameraDimConfig;
    const dims = this.contextState?.dimensions || [];
    const requestCreateDimension = this.contextEvents?.dimensions?.create;
    const names = new Set();
    ["position", "target", "up"].forEach(key => {
      const block = cfg[key];
      if (!block) return;
      Object.values(block).forEach(n => { if (typeof n === "string") names.add(n); });
    });
    ["zoom", "fov"].forEach(key => {
      const n = cfg[key];
      if (typeof n === "string") names.add(n);
    });
    names.forEach(name => {
      requestCreateDimension?.(requestCreateDimension.state = { name, value: null });
      const dim = dims.find(d => d.name === name);
      if (!dim) return;
      const id = dim.subscribe(this.applyCameraDimensions.bind(this));
      this.subscriptions.push({ observable: dim, id });
    });
    this.applyCameraDimensions();
  }

  applyCameraDimensions() {
    if (!this.camera || !this.cameraDimConfig) return;
    const cfg = this.cameraDimConfig;
    const dims = this.contextState?.dimensions || [];
    const getVal = (name) => {
      const dim = dims.find(d => d.name === name);
      return dim ? dim.state.value : undefined;
    };
    const applyBlock = (block, targetVec) => {
      if (!block) return;
      if ("thetaZ" in block) {
        const r = getVal(block.r);
        const theta = getVal(block.thetaZ);
        const radius = Number.isFinite(r) ? r : Math.hypot(targetVec.x, targetVec.y);
        if (Number.isFinite(radius) && Number.isFinite(theta)) {
          targetVec.x = Math.cos(theta) * radius;
          targetVec.y = Math.sin(theta) * radius;
        }
        const z = getVal(block.z);
        if (Number.isFinite(z)) {
          targetVec.z = z;
        }
      } else if ("thetaX" in block) {
        const r = getVal(block.r);
        const theta = getVal(block.thetaX);
        const radius = Number.isFinite(r) ? r : Math.hypot(targetVec.y, targetVec.z);
        if (Number.isFinite(radius) && Number.isFinite(theta)) {
          targetVec.y = Math.cos(theta) * radius;
          targetVec.z = Math.sin(theta) * radius;
        }
        const x = getVal(block.x);
        if (Number.isFinite(x)) {
          targetVec.x = x;
        }
      } else {
        const xv = getVal(block.x);
        const yv = getVal(block.y);
        const zv = getVal(block.z);
        if (Number.isFinite(xv)) targetVec.x = xv;
        if (Number.isFinite(yv)) targetVec.y = yv;
        if (Number.isFinite(zv)) targetVec.z = zv;
      }
    };
    const pos = this.camera.position.clone();
    const tgt = this.controls ? this.controls.target.clone() : null;
    applyBlock(cfg.position, pos);
    applyBlock(cfg.target, tgt || pos);
    if (!cfg.target && cfg.position?.thetaX && tgt) {
      const r = Math.hypot(tgt.y, tgt.z);
      const theta = getVal(cfg.position.thetaX);
      if (Number.isFinite(r) && Number.isFinite(theta)) {
        tgt.y = Math.cos(theta) * r;
        tgt.z = Math.sin(theta) * r;
      }
    } else if (!cfg.target && cfg.position?.thetaZ && tgt) {
      const r = Math.hypot(tgt.x, tgt.y);
      const theta = getVal(cfg.position.thetaZ);
      if (Number.isFinite(r) && Number.isFinite(theta)) {
        tgt.x = Math.cos(theta) * r;
        tgt.y = Math.sin(theta) * r;
      }
    }
    if (cfg.up) {
      const ux = getVal(cfg.up.x);
      const uy = getVal(cfg.up.y);
      const uz = getVal(cfg.up.z);
      if (Number.isFinite(ux)) this.camera.up.x = ux;
      if (Number.isFinite(uy)) this.camera.up.y = uy;
      if (Number.isFinite(uz)) this.camera.up.z = uz;
    }
    if (!cfg.up && tgt) {
      const view = tgt.clone().sub(pos);
      if (cfg.position?.thetaX) {
        const upVec = new THREE.Vector3(1, 0, 0).cross(view).normalize();
        if (upVec.lengthSq() > 1e-12) {
          this.camera.up.copy(upVec);
        }
      } else if (cfg.position?.thetaZ) {
        const upVec = new THREE.Vector3(0, 0, 1).cross(view).normalize();
        if (upVec.lengthSq() > 1e-12) {
          this.camera.up.copy(upVec);
        }
      }
    }
    this.camera.position.copy(pos);
    if (tgt && this.controls) {
      this.controls.target.copy(tgt);
    }
    if (typeof cfg.zoom === "string") {
      const z = getVal(cfg.zoom);
      if (Number.isFinite(z)) this.camera.zoom = z;
    }
    if (typeof cfg.fov === "string") {
      const f = getVal(cfg.fov);
      if (Number.isFinite(f)) this.camera.fov = f;
    }
    this.camera.updateProjectionMatrix();
    this.controls?.update();
    this.tileManager?.tick();
  }

  recenterCamera(manifest) {
    if (!this.camera || !manifest || !Array.isArray(manifest.tiles) || !manifest.tiles.length) return;
    if (this.layout.cameraSync && this.plotGroupState?.sharedCamera?.position) return;
    if (this.cameraDimConfig) return;
    const roots = manifest.tiles.filter(t => t.parent == null && t.aabbWorld);
    const candidates = roots.length ? roots : manifest.tiles;
    const bbox = new THREE.Box3();
    candidates.forEach(tile => {
      const lo = tile.aabbWorld?.[0];
      const hi = tile.aabbWorld?.[1];
      if (!Array.isArray(lo) || !Array.isArray(hi) || lo.length !== 3 || hi.length !== 3) return;
      bbox.expandByPoint(new THREE.Vector3().fromArray(lo));
      bbox.expandByPoint(new THREE.Vector3().fromArray(hi));
    });
    if (!isFinite(bbox.min.x) || !isFinite(bbox.max.x)) return;
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() * 0.5, 0.5);
    const distance = Math.max(radius * 2.5, 1.0);
    const direction = new THREE.Vector3(0, 0, 1);
    this.camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
    this.camera.lookAt(center);
    this.controls?.target.copy(center);
    this.controls?.update();
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

  handleDerivedDataChange() {
    this.fetchDataNow = true;
    this.requestUpdate();
  }

  remove() {
    this.removeSubscriptions();
    this.controls?.dispose?.();
    this.tileManager?.dispose?.();
    this.scene = null;
    this.camera = null;
    this.tileManager = null;
  }
}

function deduceTileBaseUrl(manifestUrl, manifest) {
  if (!manifestUrl) return null;
  try {
    const absoluteManifestUrl = new URL(manifestUrl, window.location.href);
    if (manifest && typeof manifest.tilesBasePath === "string" && manifest.tilesBasePath.length) {
      return new URL(manifest.tilesBasePath, absoluteManifestUrl).href;
    }
    const manifestDirUrl = new URL("./", absoluteManifestUrl);
    const dirParts = manifestDirUrl.pathname.split("/").filter(Boolean);
    const manifestIdx = dirParts.indexOf("manifest");
    if (manifestIdx !== -1) {
      const swapped = [...dirParts];
      swapped[manifestIdx] = "tiles";
      const path = `/${swapped.join("/")}/`;
      return new URL(path, absoluteManifestUrl).href;
    }
    return manifestDirUrl.href;
  } catch (err) {
    console.warn("Failed to deduce tile base URL", manifestUrl, err);
    return null;
  }
}

function resolveTileUrl(rawUrl, tileBaseUrl) {
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }
  if (rawUrl.startsWith("//")) {
    return `${window.location.protocol}${rawUrl}`;
  }
  if (rawUrl.startsWith("/")) {
    return rawUrl;
  }
  if (!tileBaseUrl) {
    return rawUrl;
  }
  try {
    return new URL(rawUrl, tileBaseUrl).href;
  } catch (err) {
    console.warn("Failed to resolve tile URL", rawUrl, tileBaseUrl, err);
    return rawUrl;
  }
}

class TileManager {
  constructor({ scene, camera, renderer, onSceneChanged, options = {} }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.onSceneChanged = onSceneChanged;
    this.loader = new GLTFLoader();
    this.manifest = null;
    this.version = 0;
    this.tiles = new Map();
    this.byId = new Map();
    this.rootTileIds = new Set();
    this.queue = [];
    this.inflight = 0;
    this.requestPriority = new Map();
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
    this._queueSeq = 0;
    this.levelGeMedian = new Map();
    this.options = {
      sseRefine: 25,
      sseCoarsen: 12.5,
      maxConcurrent: 4,
      maxActiveTiles: 400,
      wireframe: false,
      showBoundingBoxes: false,
      ...options
    };
    this._tickLock = false;
    this._tickPending = false;
  }

  updateSceneRefs({ scene, camera, renderer }) {
    this.scene = scene || this.scene;
    this.camera = camera || this.camera;
    this.renderer = renderer || this.renderer;
  }

  setOptions(opts = {}) {
    this.options = {
      ...this.options,
      ...opts
    };
    if (this.options.sseCoarsen === undefined) {
      this.options.sseCoarsen = this.options.sseRefine * 0.5;
    }
  }

  async loadManifest(manifest, version, manifestUrl) {
    this.version = version;
    this._resetTiles();
    this.manifest = manifest;
    this.manifestUrl = manifestUrl;
    this.tileBaseUrl = deduceTileBaseUrl(manifestUrl, manifest);
    this.byId.clear();
    this.rootTileIds.clear();
    this.levelGeMedian.clear();
    if (!manifest || !Array.isArray(manifest.tiles)) {
      console.warn("TileManager: manifest missing tiles array");
      return;
    }
    manifest.tiles.forEach(tile => {
      this.byId.set(tile.tileId, tile);
      if (tile.parent == null || tile.z === 0) {
        this.rootTileIds.add(tile.tileId);
      }
    });
    if (this.rootTileIds.size === 0 && manifest.tiles.length) {
      this.rootTileIds.add(manifest.tiles[0].tileId);
    }
    this._computeLevelGeStats();
  }

  tick() {
    if (!this.manifest) {
      return;
    }
    if (this._tickLock) {
      this._tickPending = true;
      return;
    }
    this._tickLock = true;
    this._runTickLoop();
  }

  async _runTickLoop() {
    try {
      do {
        this._tickPending = false;
        await this._tickOnce();
      } while (this._tickPending);
    } catch (err) {
      console.error("TileManager tick error", err);
    } finally {
      this._tickLock = false;
    }
  }

  async _tickOnce() {
    if (!this.scene || !this.camera || !this.renderer) {
      return;
    }
    this._updateFrustum();
    const desiredTiles = this._selectTiles();
    this._syncTiles(desiredTiles);
    await this._processQueue();
  }

  _updateFrustum() {
    this.camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  _selectTiles() {
    const want = new Set();
    const stack = [];
    const visited = new Set();
    if (this.rootTileIds.size) {
      this.rootTileIds.forEach(id => stack.push(id));
    }
    while (stack.length) {
      const id = stack.pop();
      if (visited.has(id)) continue;
      visited.add(id);
      const meta = this.byId.get(id);
      if (!meta) continue;
      if (!this._visible(meta)) continue;
      const sseNorm = this._sse(meta);
      this.requestPriority.set(id, sseNorm);
      const canRefine = Array.isArray(meta.children) && meta.children.length > 0;
      const refine = canRefine && sseNorm > this.options.sseRefine;
      const coarsen = sseNorm < this.options.sseCoarsen;
      if (refine) {
        meta.children.forEach(childId => stack.push(childId));
        if (!this._allChildrenLoaded(meta)) {
          want.add(id);
        }
      } else {
        want.add(id);
      }
    }
    if (want.size > this.options.maxActiveTiles) {
      const ordered = Array.from(want).sort((a, b) => {
        return (this.requestPriority.get(b) || 0) - (this.requestPriority.get(a) || 0);
      });
      want.clear();
      ordered.slice(0, this.options.maxActiveTiles).forEach(id => want.add(id));
    }
    if (want.size === 0 && this.rootTileIds.size) {
      this.rootTileIds.forEach(id => want.add(id));
    }
    return want;
  }

  _syncTiles(wantSet) {
    const toRemove = [];
    this.tiles.forEach((value, tileId) => {
      if (!wantSet.has(tileId)) {
        toRemove.push(tileId);
      }
    });
    toRemove.forEach(tileId => this._unloadTile(tileId));
    wantSet.forEach(tileId => {
      if (!this.tiles.has(tileId)) {
        this._enqueue(tileId);
      }
    });
  }

  async _processQueue() {
    if (!this.queue.length) return;
    const loads = [];
    while (this.queue.length && this.inflight < this.options.maxConcurrent) {
      if ((this.tiles.size + this.inflight) >= this.options.maxActiveTiles) {
        break;
      }
      const next = this.queue.shift();
      loads.push(this._loadTile(next.id));
    }
    if (loads.length) {
      await Promise.all(loads);
      if (this.queue.length && !this._tickPending) {
        this._tickPending = true;
        if (!this._tickLock) {
          this.tick();
        }
      }
    }
  }

  _enqueue(tileId) {
    if (this.queue.find(entry => entry.id === tileId)) {
      return;
    }
    const priority = this.requestPriority.get(tileId) || 0;
    this.queue.push({ id: tileId, priority, seq: this._queueSeq++ });
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.seq - b.seq;
    });
  }

  async _loadTile(tileId) {
    const meta = this.byId.get(tileId);
    if (!meta || !meta.url) {
      return;
    }
    const versionAtStart = this.version;
    this.inflight++;
    try {
      const tileUrl = resolveTileUrl(meta.url, this.tileBaseUrl);
      const gltf = await this.loader.loadAsync(tileUrl);
      if (versionAtStart !== this.version) {
        this._disposeGltf(gltf);
        return;
      }
      const obj = gltf.scene || new THREE.Group();
      obj.traverse(node => {
        if (node.isMesh && node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach(mat => {
            if (mat) {
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
            }
          });
        }
      });
      obj.userData.tileId = tileId;
      this.scene.add(obj);
      this.tiles.set(tileId, { object3d: obj, meta });
      this._applySimpleShading(obj);
      if (this.onSceneChanged) {
        this.onSceneChanged();
      }
    } catch (err) {
      console.error(`Failed to load tile ${tileId}`, err);
    } finally {
      this.inflight--;
    }
  }

  _disposeGltf(gltf) {
    if (!gltf) return;
    const nodes = [];
    if (gltf.scene) nodes.push(gltf.scene);
    while (nodes.length) {
      const node = nodes.pop();
      if (node.isMesh) {
        node.geometry?.dispose();
        if (Array.isArray(node.material)) {
          node.material.forEach(mat => mat?.dispose?.());
        } else {
          node.material?.dispose?.();
        }
      }
      node.children?.forEach(child => nodes.push(child));
    }
  }

  _applySimpleShading(root) {
    if (!root) return;
    root.traverse(obj => {
      if (!obj.isMesh || !obj.material) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      const newMats = materials.map(mat => {
        if (!mat) return mat;
        const hasVertexColors = !!mat.vertexColors;
        const baseColor = mat.color ? mat.color.clone() : new THREE.Color(0.8, 0.8, 0.8);
        const specularColor = baseColor.clone().lerp(new THREE.Color(1, 1, 1), 0.5);
        const phong = new THREE.MeshPhongMaterial({
          color: baseColor,
          vertexColors: hasVertexColors,
          side: THREE.DoubleSide,
          shininess: 60,
          specular: specularColor
        });
        mat.dispose?.();
        return phong;
      });
      obj.material = Array.isArray(obj.material) ? newMats : newMats[0];
      const geom = obj.geometry;
      if (geom && !geom.attributes?.normal) {
        geom.computeVertexNormals?.();
      }
    });
  }

  _unloadTile(tileId, notify = true) {
    const rec = this.tiles.get(tileId);
    if (!rec) return;
    this.scene.remove(rec.object3d);
    rec.object3d.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat?.dispose?.());
        } else {
          obj.material?.dispose?.();
        }
      }
    });
    this.tiles.delete(tileId);
    this.requestPriority.delete(tileId);
    if (notify && this.onSceneChanged) {
      this.onSceneChanged();
    }
  }

  _visible(meta) {
    if (!meta?.aabbWorld) {
      return true;
    }
    const min = new THREE.Vector3(...meta.aabbWorld[0]);
    const max = new THREE.Vector3(...meta.aabbWorld[1]);
    const box = new THREE.Box3(min, max);
    return this.frustum.intersectsBox(box);
  }

  _allChildrenLoaded(meta) {
    if (!Array.isArray(meta.children) || meta.children.length === 0) {
      return true;
    }
    return meta.children.every(id => this.tiles.has(id));
  }

  _computeLevelGeStats() {
    const perLevel = new Map();
    for (const tile of this.manifest?.tiles || []) {
      const ge = tile?.geometricError;
      if (!(typeof ge === "number") || ge <= 0) continue;
      if (!perLevel.has(tile.z)) {
        perLevel.set(tile.z, []);
      }
      perLevel.get(tile.z).push(ge);
    }
    this.levelGeMedian.clear();
    for (const [depth, values] of perLevel) {
      const sorted = values.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      this.levelGeMedian.set(depth, median);
    }
  }

  _sse(meta) {
    const min = meta.aabbWorld?.[0];
    const max = meta.aabbWorld?.[1];
    let raw = meta.geometricError || 0;
    if (min && max && this.camera && this.renderer) {
      const center = new THREE.Vector3().fromArray(min)
        .add(new THREE.Vector3().fromArray(max))
        .multiplyScalar(0.5);
      const dist = center.distanceTo(this.camera.position) + 1e-6;
      const ge = meta.geometricError || 0.01;
      const h = this.renderer.domElement?.clientHeight || 1;
      const fov = this.camera.fov * Math.PI / 180;
      raw = (ge / (dist * Math.tan(fov / 2))) * h;
    }
    const median = this.levelGeMedian.get(meta.z);
    const geVal = meta.geometricError;
    if (median && typeof geVal === "number" && geVal > 0) {
      return raw * (median / Math.max(geVal, 1e-9));
    }
    return raw;
  }

  _resetTiles() {
    const toUnload = Array.from(this.tiles.keys());
    toUnload.forEach(tileId => this._unloadTile(tileId, false));
    this.tiles.clear();
    this.byId.clear();
    this.rootTileIds.clear();
    this.queue = [];
    this.inflight = 0;
    this.requestPriority.clear();
    this._queueSeq = 0;
  }
}

export { ExtractTilesViewer };
