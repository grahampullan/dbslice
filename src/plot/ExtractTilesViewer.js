import * as d3 from 'd3v7';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Plot } from './Plot.js';

class ExtractTilesViewer extends Plot {

    constructor(options) {
        if (!options) { options = {}; }
        options.layout = options.layout || {};
        options.layout.margin = options.layout.margin || {top: 5, right: 5, bottom: 5, left: 5};
        super(options);
        this.componentType = 'ExtractTilesViewer';
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.tileManager = null;
        this.stencilRects = [];
        this.renderObserverId = null;
        this.manifestVersion = 0;
        this.cameraSync = this.layout.cameraSync || false;
        this.cameraLight = null;
        this.cameraDimConfig = this.layout.setCameraFromDimensions || null;
        this.cameraDimSubs = [];
    }

    make() {
        this.updateHeader();
        this.addPlotAreaDiv();
        this.setLasts();

        const container = d3.select(`#${this.id}`);
        container.select('.svg-overlay').remove();

        const overlay = container.append('svg')
            .attr('class', 'svg-overlay')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('top', `${this.plotAreaTop}px`)
            .style('left', `${this.plotAreaLeft - this.marginTotal.left}px`)
            .attr('width', `${this.plotAreaWidth + this.marginTotal.left + this.marginTotal.right}`)
            .attr('height', `${this.plotAreaHeight + this.marginTotal.bottom}`);

        overlay.append('g').attr('class', 'axes-container');
        overlay.append('g').attr('class', 'colorbar-container');

        if (this.fetchData?.getUrlFromDimensions) {
            const requestCreateDimension = this.sharedStateByAncestorId['context'].requestCreateDimension;
            const dimensions = this.sharedStateByAncestorId['context'].dimensions;
            const dimensionNames = this.fetchData.getUrlFromDimensions.dimensionNames;

            dimensionNames.forEach(dimName => {
                requestCreateDimension.state = {name: dimName, value: null};
                const dimension = dimensions.find(d => d.name == dimName);
                const obsId = dimension.subscribe(this.handleDimensionChange.bind(this));
                this.subscriptions.push({observable: dimension, id: obsId});
            });
        }

        this.renderer = this.sharedStateByAncestorId['context'].renderer;
        this.ensureScene();

        const plotArea = d3.select(`#${this.plotAreaId}`);
        this.ensureCamera(this.plotAreaWidth, this.plotAreaHeight);
        this.initCameraSyncState();
        this.initCameraDimensionBindings();
        this.ensureControls(plotArea.node());
        this.setupRenderSubscription();
        this.update();
    }

    async update() {
        if (this.fetchingData) return;
        await this.getData();
        if (this.data === undefined) return;

        const container = d3.select(`#${this.id}`);
        const overlay = container.select('.svg-overlay');
        if (overlay.empty()) return;

        this.updateHeader();
        this.updatePlotAreaSize();
        overlay
            .style('top', `${this.plotAreaTop}px`)
            .style('left', `${this.plotAreaLeft - this.marginTotal.left}px`)
            .attr('width', `${this.plotAreaWidth + this.marginTotal.left + this.marginTotal.right}`)
            .attr('height', `${this.plotAreaHeight + this.marginTotal.bottom}`);

        this.ensureCamera(this.plotAreaWidth, this.plotAreaHeight);

        if (!this.tileManager) {
            this.tileManager = new TileManager({
                scene: this.scene,
                camera: this.camera,
                renderer: this.renderer,
                onSceneChanged: () => this.webGLUpdate(),
                options: this.layout.tileOptions || {}
            });
        } else {
            this.tileManager.updateSceneRefs({
                scene: this.scene,
                camera: this.camera,
                renderer: this.renderer
            });
        }

        this.tileManager.setOptions(this.layout.tileOptions || {});

        if (this.newData && this.tileManager) {
            const manifest = this.data?.manifest || this.data;
            const version = ++this.manifestVersion;
            const manifestUrl = this.fetchData?.url || this.fetchData?.getUrlFromDimensions?.lastUrl || null;
            await this.tileManager.loadManifest(manifest, version, manifestUrl);
            this.recenterCamera(manifest);
            this.tileManager.tick();
            this.webGLUpdate();
            this.newData = false;
        }

        this.setLasts();
    }

    ensureScene() {
        if (this.scene) return;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xe0e0e0);
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(ambient);
        // Diagnostic axes helper (enable if needed)
        // this.axesHelper = new THREE.AxesHelper(5);
        // this.scene.add(this.axesHelper);
    }

    ensureCamera(width, height) {
        if (!width || !height) return;
        if (!this.camera) {
            this.camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 10000);
            this.camera.position.set(0, 0, 2);
            this.cameraLight = new THREE.DirectionalLight(0xffffff, 1.0);
            this.cameraLight.position.set(0, 0, 1);
            this.camera.add(this.cameraLight);
            this.scene.add(this.camera);
        }
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    ensureControls(domNode) {
        if (this.controls || !domNode) return;
        // inside ensureControls(domNode), before creating OrbitControls:
        domNode.style.touchAction = 'none';
        domNode.style.msTouchAction = 'none';
        
        domNode.addEventListener('pointerdown', (e) => {
            e.preventDefault();   // stops mouse-compat events (mousedown/mouseup/click)
            e.stopPropagation();
        }, { passive: false });

        ['pointermove','pointerup','pointercancel','contextmenu'].forEach(type => {
            domNode.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
        });

        // wheel needs non-passive preventDefault to block parent zoom
        domNode.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        this.controls = new OrbitControls(this.camera, domNode);
        this.controls.enableDamping = false;
        this.controls.addEventListener('change', () => {
            if (this.cameraSync) {
                this.publishSharedCameraState();
            }
            if (this.tileManager) {
                this.tileManager.tick();
            }
            this.webGLUpdate();
        });
    }

    initCameraSyncState() {
        if (!this.cameraSync) return;
        const plotGroupId = this.ancestorIds[this.ancestorIds.length - 1];
        let sharedCamera = this.sharedStateByAncestorId[plotGroupId].sharedCamera;
        if (!sharedCamera) {
            sharedCamera = {position: null, rotation: null, zoom: 1};
            this.sharedStateByAncestorId[plotGroupId].sharedCamera = sharedCamera;
        }
        this.sharedCameraState = sharedCamera;
        if (sharedCamera.position) {
            this.camera.position.copy(sharedCamera.position);
            this.camera.rotation.copy(sharedCamera.rotation);
            this.camera.zoom = sharedCamera.zoom || 1;
            this.camera.updateProjectionMatrix();
        } else {
            this.publishSharedCameraState();
        }
    }

    publishSharedCameraState() {
        if (!this.cameraSync || !this.sharedCameraState) return;
        this.sharedCameraState.position = this.camera.position.clone();
        this.sharedCameraState.rotation = this.camera.rotation.clone();
        this.sharedCameraState.zoom = this.camera.zoom;
    }

    setupRenderSubscription() {
        if (this.renderObserverId) return;
        const requestWebGLRender = this.sharedStateByAncestorId[this.boardId].requestWebGLRender;
        this.renderObserverId = requestWebGLRender.subscribeWithData({
            observer: this.renderScene.bind(this),
            data: {boxId: this.boxId}
        });
        this.subscriptions.push({observable: requestWebGLRender, id: this.renderObserverId});
    }

    renderScene() {
        if (!this.scene || !this.camera) return;
        const renderer = this.renderer;
        const container = d3.select(`#${this.id}`);
        const plotArea = container.select('.plot-area');
        if (plotArea.empty()) return;

        renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);
        const plotRect = plotArea.node().getBoundingClientRect();
        const rect = {left: plotRect.left, right: plotRect.right, top: plotRect.top, bottom: plotRect.bottom};

        const ancestorIds = this.ancestorIds.filter(d => d !== 'context' && d.includes('box'));
        for (let ancestorId of ancestorIds) {
            const plotGroup = d3.select(`#${ancestorId}-component-plot-area`);
            if (plotGroup.empty()) continue;
            const plotGroupRect = plotGroup.node().getBoundingClientRect();
            if (rect.right < plotGroupRect.left || rect.left > plotGroupRect.right ||
                rect.bottom < plotGroupRect.top || rect.top > plotGroupRect.bottom) {
                return;
            }
            if (rect.left < plotGroupRect.left && rect.right > plotGroupRect.left) {
                rect.left = plotGroupRect.left + 2;
            }
            if (rect.right > plotGroupRect.right && rect.left < plotGroupRect.right) {
                rect.right = plotGroupRect.right - 2;
            }
            if (rect.top < plotGroupRect.top && rect.bottom > plotGroupRect.top) {
                rect.top = plotGroupRect.top + 2;
            }
            if (rect.bottom > plotGroupRect.bottom && rect.top < plotGroupRect.bottom) {
                rect.bottom = plotGroupRect.bottom - 2;
            }
        }

        const overlappingDivsClipSpace = this.getOverlappingBoxesInClipSpace(plotRect);
        this.stencilRects.forEach(uuid => {
            const oldRect = this.scene.getObjectByProperty('uuid', uuid);
            if (oldRect) {
                oldRect.geometry.dispose();
                oldRect.material.dispose();
                this.scene.remove(oldRect);
            }
        });
        this.stencilRects = [];

        overlappingDivsClipSpace.forEach(d => {
            const margin = {left: 0.00, right: 0.02, top: 0.00, bottom: 0.02};
            const rectangleBufferGeometryForMesh = new THREE.BufferGeometry();
            const vertTopLeftClip = new THREE.Vector3(d.left - margin.left, d.top + margin.top, 0.5);
            const vertTopRightClip = new THREE.Vector3(d.right + margin.right, d.top + margin.top, 0.5);
            const vertBottomLeftClip = new THREE.Vector3(d.left - margin.left, d.bottom - margin.bottom, 0.5);
            const vertBottomRightClip = new THREE.Vector3(d.right + margin.right, d.bottom - margin.bottom, 0.5);
            const vertTopLeftWorld = vertTopLeftClip.unproject(this.camera);
            const vertTopRightWorld = vertTopRightClip.unproject(this.camera);
            const vertBottomLeftWorld = vertBottomLeftClip.unproject(this.camera);
            const vertBottomRightWorld = vertBottomRightClip.unproject(this.camera);

            const vertices = new Float32Array([
                vertTopLeftWorld.x, vertTopLeftWorld.y, vertTopLeftWorld.z,
                vertTopRightWorld.x, vertTopRightWorld.y, vertTopRightWorld.z,
                vertBottomRightWorld.x, vertBottomRightWorld.y, vertBottomRightWorld.z,
                vertBottomLeftWorld.x, vertBottomLeftWorld.y, vertBottomLeftWorld.z
            ]);
            const indices = new Uint32Array([0, 2, 1, 0, 3, 2]);
            rectangleBufferGeometryForMesh.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            rectangleBufferGeometryForMesh.setIndex(new THREE.BufferAttribute(indices, 1));

            const rectangleMaterial = new THREE.MeshBasicMaterial({color: 'red', wireframe: false});
            if (this.layout.showStencilRects) {
                rectangleMaterial.colorWrite = true;
            } else {
                rectangleMaterial.colorWrite = false;
            }
            rectangleMaterial.depthWrite = false;
            rectangleMaterial.depthTest = false;
            rectangleMaterial.stencilWrite = true;
            rectangleMaterial.stencilRef = 1;
            rectangleMaterial.stencilFunc = THREE.AlwaysStencilFunc;
            rectangleMaterial.stencilZPass = THREE.ReplaceStencilOp;
            const rectangle = new THREE.Mesh(rectangleBufferGeometryForMesh, rectangleMaterial);
            rectangle.renderOrder = 0;

            this.stencilRects.push(rectangle.uuid);
            this.scene.add(rectangle);
        });

        const scissorLeft = Math.floor(rect.left);
        const scissorBottom = Math.floor(renderer.domElement.clientHeight - rect.bottom);
        const scissorWidth = Math.floor(rect.right - rect.left);
        const scissorHeight = Math.floor(rect.bottom - rect.top);

        const viewLeft = Math.floor(plotRect.left);
        const viewBottom = Math.floor(renderer.domElement.clientHeight - plotRect.bottom);
        const viewWidth = Math.floor(plotRect.right - plotRect.left);
        const viewHeight = Math.floor(plotRect.bottom - plotRect.top);

        renderer.setScissorTest(true);
        renderer.setViewport(viewLeft, viewBottom, viewWidth, viewHeight);
        renderer.setScissor(scissorLeft, scissorBottom, scissorWidth, scissorHeight);
        if (this.cameraSync && this.sharedCameraState?.position) {
            this.camera.position.copy(this.sharedCameraState.position);
            this.camera.rotation.copy(this.sharedCameraState.rotation);
            this.camera.zoom = this.sharedCameraState.zoom || 1;
            this.camera.updateProjectionMatrix();
        }
        renderer.setClearColor(0xe0e0e0);
        renderer.clear(true, true, true);
        renderer.render(this.scene, this.camera);
        renderer.setScissorTest(false);
    }

    handleDimensionChange() {
        this.fetchDataNow = true;
        this.update();
    }

    initCameraDimensionBindings() {
        if (!this.cameraDimConfig) return;
        const cfg = this.cameraDimConfig;
        const dims = this.sharedStateByAncestorId['context']?.dimensions || [];
        const requestCreateDimension = this.sharedStateByAncestorId['context']?.requestCreateDimension;
        const names = new Set();
        ['position', 'target', 'up'].forEach(key => {
            const block = cfg[key];
            if (!block) return;
            Object.values(block).forEach(n => { if (typeof n === 'string') names.add(n); });
        });
        ['zoom', 'fov'].forEach(key => {
            const n = cfg[key];
            if (typeof n === 'string') names.add(n);
        });
        names.forEach(name => {
            if (requestCreateDimension) {
                requestCreateDimension.state = {name, value: null};
            }
            const dim = dims.find(d => d.name === name);
            if (!dim) return;
            const id = dim.subscribe(this.applyCameraDimensions.bind(this));
            this.subscriptions.push({observable: dim, id});
        });
        this.applyCameraDimensions();
    }

    applyCameraDimensions() {
        if (!this.camera || !this.cameraDimConfig) return;
        const cfg = this.cameraDimConfig;
        const dims = this.sharedStateByAncestorId['context']?.dimensions || [];
        const getVal = (name) => {
            const dim = dims.find(d => d.name === name);
            return dim ? dim.state.value : undefined;
        };
        const applyBlock = (block, targetVec) => {
            if (!block) return;
            if ('thetaZ' in block) {
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
            } else if ('thetaX' in block) {
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
        if (typeof cfg.zoom === 'string') {
            const z = getVal(cfg.zoom);
            if (Number.isFinite(z)) this.camera.zoom = z;
        }
        if (typeof cfg.fov === 'string') {
            const f = getVal(cfg.fov);
            if (Number.isFinite(f)) this.camera.fov = f;
        }
        this.camera.updateProjectionMatrix();
        if (this.controls) this.controls.update();
        if (this.tileManager) this.tileManager.tick();
        // Diagnostic log (commented out by default)
        // let thetaLogged = null;
        // if (cfg.position?.thetaX) {
        //     thetaLogged = Math.atan2(this.camera.position.z, this.camera.position.y);
        // } else if (cfg.position?.thetaZ) {
        //     thetaLogged = Math.atan2(this.camera.position.y, this.camera.position.x);
        // }
        // console.log('Camera pos', this.camera.position.x, this.camera.position.y, this.camera.position.z, 'theta', thetaLogged, 'position block', cfg.position, 'target block', cfg.target);
    }

    recenterCamera(manifest) {
        if (!this.camera || !manifest || !Array.isArray(manifest.tiles) || !manifest.tiles.length) return;
        if (this.cameraSync && this.sharedCameraState?.position) return;
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
        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }

    remove() {
        this.removeSubscriptions();
        if (this.controls) {
            this.controls.dispose();
        }
        if (this.tileManager) {
            this.tileManager.dispose();
        }
        this.scene = null;
        this.camera = null;
        this.tileManager = null;
    }
}

function deduceTileBaseUrl(manifestUrl, manifest) {
    if (!manifestUrl) return null;
    try {
        const absoluteManifestUrl = new URL(manifestUrl, window.location.href);
        if (manifest && typeof manifest.tilesBasePath === 'string' && manifest.tilesBasePath.length) {
            return new URL(manifest.tilesBasePath, absoluteManifestUrl).href;
        }
        const manifestDirUrl = new URL('./', absoluteManifestUrl);
        const dirParts = manifestDirUrl.pathname.split('/').filter(Boolean);
        const manifestIdx = dirParts.indexOf('manifest');
        if (manifestIdx !== -1) {
            const swapped = [...dirParts];
            swapped[manifestIdx] = 'tiles';
            const path = `/${swapped.join('/')}/`;
            return new URL(path, absoluteManifestUrl).href;
        }
        return manifestDirUrl.href;
    } catch (err) {
        console.warn('Failed to deduce tile base URL', manifestUrl, err);
        return null;
    }
}

function resolveTileUrl(rawUrl, tileBaseUrl) {
    if (!rawUrl) return null;
    if (/^https?:\/\//i.test(rawUrl)) {
        return rawUrl;
    }
    if (rawUrl.startsWith('//')) {
        return `${window.location.protocol}${rawUrl}`;
    }
    if (rawUrl.startsWith('/')) {
        return rawUrl;
    }
    if (!tileBaseUrl) {
        return rawUrl;
    }
    try {
        return new URL(rawUrl, tileBaseUrl).href;
    } catch (err) {
        console.warn('Failed to resolve tile URL', rawUrl, tileBaseUrl, err);
        return rawUrl;
    }
}

class TileManager {
    constructor({scene, camera, renderer, onSceneChanged, options = {}}) {
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

    updateSceneRefs({scene, camera, renderer}) {
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
            console.warn('TileManager: manifest missing tiles array');
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
            console.error('TileManager tick error', err);
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
                    want.add(id); // keep parent until children are present
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
        this.queue.push({id: tileId, priority, seq: this._queueSeq++});
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
            this.tiles.set(tileId, {object3d: obj, meta});
            this._applySimpleShading(obj);
            console.log('ExtractTilesViewer tiles displayed:', this.tiles.size);
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
        console.log('ExtractTilesViewer tiles displayed:', this.tiles.size);
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
            if (!(typeof ge === 'number') || ge <= 0) continue;
            if (!perLevel.has(tile.z)) {
                perLevel.set(tile.z, []);
            }
            perLevel.get(tile.z).push(ge);
        }
        this.levelGeMedian.clear();
        for (const [depth, values] of perLevel) {
            values.sort((a, b) => a - b);
            const mid = Math.floor(values.length / 2);
            const median = values.length % 2
                ? values[mid]
                : 0.5 * (values[mid - 1] + values[mid]);
            this.levelGeMedian.set(depth, median || values[mid] || 0);
        }
    }

    _sse(meta) {
        const min = meta.aabbWorld?.[0];
        const max = meta.aabbWorld?.[1];
        let raw = meta.geometricError || 0;
        if (min && max) {
            const center = new THREE.Vector3().fromArray(min)
                .add(new THREE.Vector3().fromArray(max))
                .multiplyScalar(0.5);
            const dist = center.distanceTo(this.camera.position) + 1e-6;
            const ge = meta.geometricError || 0.01;
            const h = this.renderer.domElement.clientHeight || 1;
            const fov = this.camera.fov * Math.PI / 180;
            raw = (ge / (dist * Math.tan(fov / 2))) * h;
        }
        const median = this.levelGeMedian.get(meta.z);
        const geVal = meta.geometricError;
        if (median && typeof geVal === 'number' && geVal > 0) {
            return raw * (median / Math.max(geVal, 1e-9));
        }
        return raw;
    }

    _resetTiles() {
        this.queue.length = 0;
        this.requestPriority.clear();
        this.levelGeMedian.clear();
        const ids = Array.from(this.tiles.keys());
        ids.forEach(tileId => this._unloadTile(tileId, false));
        this.tiles.clear();
        if (ids.length && this.onSceneChanged) {
            this.onSceneChanged();
        }
    }

    dispose() {
        this._resetTiles();
        this.manifest = null;
        this.byId.clear();
        this.rootTileIds.clear();
        this.queue.length = 0;
        this.version++;
    }
}

export { ExtractTilesViewer };
