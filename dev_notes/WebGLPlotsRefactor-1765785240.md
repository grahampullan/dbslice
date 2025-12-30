# WebGLPlotsRefactor

This document consolidates the WebGL plot refactor guidance and includes the **TriMesh3D** example (scheduler-based cuts) plus a second example (**GLTFViewer**) because it’s a good “minimal WebGL plot” reference.

---

## WebGL plots refactored pattern

# WebGL plots (refactored pattern)

Applies to TriMesh3D / LineSeriesGL / GLTFViewer / ExtractTilesViewer.

## Inheritance
```txt
PlotV3_1 → WebGLPlotBase → YourPlot
```

## Conventions
- Subclasses update scene graph; they do not render directly.
- Use `boardServices.scheduler.markDirty()` to request a frame.
- Coalesce heavy work via `scheduler.scheduleJob(key, fn)`.
- All scissor/viewport logic lives in `WebGLPlotBase`.

---

## Included example: TriMesh3D

# TriMesh3D (refactored)

This document shows the *post-refactor* architecture of **TriMesh3D**, including
scheduler-based cuts (cheap preview + deferred evaluation).

---

## Inheritance

```txt
PlotV3_1 → WebGLPlotBase → TriMesh3D
```

---

## Scheduler-based cuts

- Preview updates (uniforms/lines) happen frequently and just call `scheduler.markDirty()`.
- Heavy intersection evaluation is deferred:

```js
scheduler.scheduleJob(`cut-eval:${boxId}`, () => {
  evaluateCutGeometry();
  scheduler.markDirty();
});
```

Recommended: evaluate only on release (`brushing === false`).

---

## Refactored class skeleton (illustrative)

```js
export class TriMesh3D extends WebGLPlotBase {
  initBindings() {
    super.initBindings();
    this.bindDimension("cutValue", this.onCutChange);
  }

  onCutChange() {
    const { value, brushing } = this.getDim("cutValue");

    // cheap preview
    this.applyCutUniforms(value);
    this.updateCutPreviewVisuals(value);
    this.boardServices.scheduler.markDirty();

    // heavy (release-only)
    if (!brushing) this.scheduleCutEvaluation(value);
  }

  scheduleCutEvaluation(value) {
    const key = `cut-eval:${this.boxId}`;
    this.boardServices.scheduler.scheduleJob(key, () => {
      this.evaluateCutGeometry(value);
      this.boardServices.scheduler.markDirty();
    });
  }

  async updateSceneFromData() {
    this.ensureMeshFromData(this.data);
    this.boardServices.scheduler.markDirty();
  }
}
```

---

## Included example: GLTFViewer

# GLTFViewer (refactored)

This document illustrates how **GLTFViewer** would look after the refactor to:

- `WebGLPlotBase` (shared renderer, overlay, scissor/viewport, subscriptions)
- structured shared state (`contextServices.renderer`, `boardServices.scheduler`, etc.)
- rAF-coalesced rendering via the board scheduler

---

## Inheritance

```txt
Component (board-box)
  └─ PlotV3_1
      └─ WebGLPlotBase
          └─ GLTFViewer
```

---

## Refactored class (illustrative)

```js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { WebGLPlotBase } from "./WebGLPlotBase.js";

export class GLTFViewer extends WebGLPlotBase {
  constructor(options = {}) {
    options.layout ??= {};
    options.layout.margin ??= { top: 5, right: 20, bottom: 30, left: 40 };
    options.layout.cameraSync ??= true;

    super(options);

    this.componentType = "GLTFViewer";
    this.loader = new GLTFLoader();
    this.modelRoot = null;

    this.cameraSync = !!this.layout.cameraSync;
    this._suppressPublish = false;
    this._activeController = false;
    this._lastUrl = null;
  }

  ensureScene() {
    super.ensureScene();
    if (!this.scene.getObjectByName("defaultLightRig")) {
      const rig = new THREE.Group();
      rig.name = "defaultLightRig";
      rig.add(new THREE.AmbientLight(0xffffff, 0.6));

      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(5, 10, 7);
      rig.add(dir);

      this.scene.add(rig);
    }
  }

  ensureCamera() {
    if (this.camera) return;

    const aspect = Math.max(1e-6, this.plotAreaWidth / Math.max(1, this.plotAreaHeight));
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1e7);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
  }

  ensureControls() {
    if (this.controls) return;

    const dom = this.contextServices.renderer.domElement;
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;

    this.controls.addEventListener("start", () => { this._activeController = true; });
    this.controls.addEventListener("end",   () => { this._activeController = false; });

    this.controls.addEventListener("change", () => {
      if (this._suppressPublish) return;
      if (this._activeController) this.publishSharedCameraState();
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
    if (this.cameraSync && !this._activeController) {
      this.applySharedCameraState();
    }

    // example data contract: this.data.url
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

  frameModel() { /* fit camera to bounds */ }

  publishSharedCameraState() { /* write plotGroupState.state.sharedCamera */ }
  applySharedCameraState() { /* read plotGroupState.state.sharedCamera */ }
}
```

---

## What moved out of GLTFViewer

- DOM overlay creation/sizing → `WebGLPlotBase`
- scissor/viewport intersection → `WebGLPlotBase.renderScene()`
- render scheduling/coalescing → `boardServices.scheduler`
