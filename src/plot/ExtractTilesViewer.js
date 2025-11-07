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
                onSceneChanged: () => this.webGLUpdate()
            });
        }

        if (this.newData && this.tileManager) {
            const manifest = this.data?.manifest || this.data;
            const version = ++this.manifestVersion;
            await this.tileManager.loadManifest(manifest, version);
            this.tileManager.tick();
            this.webGLUpdate();
            this.newData = false;
        }

        this.setLasts();
    }

    ensureScene() {
        if (this.scene) return;
        this.scene = new THREE.Scene();
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(1, 1, 1);
        this.scene.add(ambient);
        this.scene.add(directional);
        this.light = directional;
    }

    ensureCamera(width, height) {
        if (!width || !height) return;
        if (!this.camera) {
            this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000);
            this.camera.position.set(0, 0, 10);
        }
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        if (this.light) {
            this.light.position.copy(this.camera.position);
        }
    }

    ensureControls(domNode) {
        if (this.controls || !domNode) return;
        this.controls = new OrbitControls(this.camera, domNode);
        this.controls.enableDamping = true;
        this.controls.addEventListener('change', () => {
            if (this.tileManager) {
                this.tileManager.tick();
            }
            this.webGLUpdate();
        });
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
        renderer.clear(true, true, true);
        renderer.render(this.scene, this.camera);
        renderer.setScissorTest(false);
    }

    handleDimensionChange() {
        this.fetchDataNow = true;
        this.update();
    }

    remove() {
        this.removeSubscriptions();
        if (this.controls) {
            this.controls.dispose();
        }
        if (this.tileManager) {
            this.tileManager.clear();
        }
        this.scene = null;
        this.camera = null;
        this.tileManager = null;
    }
}

class TileManager {
    constructor({scene, camera, renderer, onSceneChanged}) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.onSceneChanged = onSceneChanged;
        this.loader = new GLTFLoader();
        this.manifest = null;
        this.version = 0;
    }

    async loadManifest(manifest, version) {
        this.version = version;
        this.manifest = manifest;
        // Future implementation: process manifest tiles and kick off streaming loads.
    }

    tick() {
        // Placeholder for visibility / streaming logic.
    }

    clear() {
        this.manifest = null;
    }
}

export { ExtractTilesViewer };
