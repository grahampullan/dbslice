import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { WebGLPlotBase } from "./WebGLPlotBase.js";

// GLTF viewer migrated to the v3.1 WebGL base.
export class GLTFViewer extends WebGLPlotBase {
  constructor(options = {}) {
    options.layout ??= {};
    options.layout.margin ??= { top: 5, right: 20, bottom: 30, left: 40 };
    options.layout.cameraSync ??= true;
    options.layout.highlightItems ??= false;
    super(options);

    this.componentType = options.componentType || "GLTFViewer";
    this.loader = new GLTFLoader();
    this.modelRoot = null;
    this.cameraLight = null;
    this._activeController = false;
    this._lastUrl = null;
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
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1e7);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
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
    this.controls.addEventListener("end",   () => { this._activeController = false; });

    this.controls.addEventListener("change", () => {
      if (this._activeController && this.layout.cameraSync) {
        this.publishSharedCameraState();
      }
      this.boardServices.scheduler?.markDirty?.();
    });
  }

  async updateSceneFromData() {
    // keep aspect updated
    if (this.camera?.isPerspectiveCamera) {
      const aspect = Math.max(1e-6, this.plotAreaWidth / Math.max(1, this.plotAreaHeight));
      if (Math.abs(this.camera.aspect - aspect) > 1e-6) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
      }
    }

    // consume shared camera unless actively controlling
    if (this.layout.cameraSync && !this._activeController) {
      this.applySharedCameraState();
    }

    const url = this.data?.url;
    if (!url) {
      this.clearModel();
      this.boardServices.scheduler?.markDirty?.();
      return;
    }

    if (url !== this._lastUrl) {
      await this.loadModel(url);
      this.frameModel();
      this._lastUrl = url;
    }

    this.controls?.update();
    this.boardServices.scheduler?.markDirty?.();
  }

  async loadModel(url) {
    this.clearModel();
    const gltf = await this.loader.loadAsync(url);
    this.modelRoot = gltf.scene;
    this.scene.add(this.modelRoot);
  }

  clearModel() {
    if (!this.modelRoot) return;
    this.scene.remove(this.modelRoot);
    this.modelRoot.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
        else obj.material?.dispose?.();
      }
    });
    this.modelRoot = null;
  }

  frameModel() {
    if (!this.modelRoot || !this.camera?.isPerspectiveCamera) return;
    const box = new THREE.Box3().setFromObject(this.modelRoot);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
    const dist = maxDim / (2 * Math.tan((Math.PI * this.camera.fov) / 360));
    const offset = 1.5 * dist;
    this.camera.position.copy(center).add(new THREE.Vector3(0, 0, offset));
    this.camera.lookAt(center);
    this.controls?.target.copy(center);
    this.controls?.update();
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
}
