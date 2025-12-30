# Board‑Box Plot Architecture – Unified Design Document

This document consolidates:

- Board-box Plot Framework – Deep Dive & Refactor Plan
- Scheduler-based Cut Handling
- PNG Export Architecture (SVG + WebGL)

It is intended to be the single authoritative architecture reference.

---


# Board-box Plot Framework – Deep Dive & Refactor Plan

This document summarizes the current architecture of your codebase built on top of **board-box**, and proposes a refactor path with clearer abstractions, better state handling, and potential `requestAnimationFrame` (`rAF`) utilisation.

---

## 1. High-level architecture today

### 1.1 Core layout / interaction: board-box + your extensions

You’re using **board-box** as the canvas / layout engine and then layering a plotting framework on top:

- **Context (your extension)**  
  - Creates a full-screen `<canvas>` and a shared `THREE.WebGLRenderer`.  
  - Owns *global* domain state: datasets, filters, derived data stores, dimensions.  
  - Exposes them via `this.sharedState` so all boards/boxes/plots can see them through `sharedStateByAncestorId["context"]`.

- **Board (your extension)**  
  - Extends `board-box`’s `Board`.  
  - Adds:
    - a modal overlay for UI (e.g. plot selection)  
    - top-right icons (download, traffic light)  
    - board-level observables:  
      - `requestWebGLRender` (plots subscribe to request a redraw)  
      - `requestSetTrafficLightColor` (data fetching status).  

- **Box (your extension)**  
  - Extends `board-box`’s `Box`.  
  - Adds a `boxes` array into `sharedState` for child plots and several “plot orchestration” observables:
    - `requestFetchDataByItemIds`
    - `requestFetchDataByFilter`
    - `requestAddFilterPlot`
    - `requestRemovePlot`
  - Used mainly inside plot containers (e.g. `PlotGroup`) to add/remove child plot boxes and drive their fetching.

So: **Context → Board → Box** provides a hierarchical “shell” with a global WebGL renderer, global domain state, and a per-box coordination layer.

---

### 1.2 Plot layer

On top of that you’ve built a **Plot framework**:

- **Base `Plot` (extends `Component` from board-box)**  
  Provides:
  - layout + margins (`plotAreaWidth/Height/Top/Left` and `marginAdd`)  
  - header/title + icons (remove/filter/add)  
  - plot area creation (`addPlotAreaDiv` / `addPlotAreaSvg` / `updatePlotAreaSize`)  
  - fetch plumbing (`fetchData`, `getData`, `fetchDataNow`, `newData`, traffic light updates)  
  - subscriptions bookkeeping.

- **SVG-based plots (2D, D3):**
  - `MetaDataHistogram`, `MetaDataScatter`, `MetaDataBarChart`, `MetaDataRankCorrBarChart`, `LineSeries` etc.  
  - All do roughly:
    - `make()` → header, `addPlotAreaSvg`, `setLasts`, set up filter subscriptions, `update()`
    - `update()` → `getData()`, adjust size, recompute scales/axes, render D3 shapes.

- **WebGL-based plots (Three.js + SVG overlay):**
  - `TriMesh3D`, `GLTFViewer`, `LineSeriesGL`, `ExtractTilesViewer`.  
  - Common patterns:
    - Use `context.renderer` (global `WebGLRenderer`).
    - Attach a scene/camera/OrbitControls.
    - Add an SVG overlay for axes / annotations.
    - Use ancestor box bounds + scissor/stencil to clip rendering to the plot’s DOM region.

- **Control / UI components**  
  - `DimensionSliders` – uses `Plot` layout but renders HTML sliders, not SVG/GL.  
    - Uses dimensions (`context.dimensions`) and `requestCreateDimension` / `requestSetDimension` to manage state.

- **PlotGroup (container plot)**  
  - A `Plot` subclass that holds a scrollable list of child boxes.  
  - Manages:
    - `sharedCamera` and `sharedCutValue` for 3D WebGL plots to sync camera and cut planes.
    - Data-driven creation/removal of child plots via box `sharedState.requestUpdateBoxes`.

---

## 2. What’s working well

### 2.1 Composition of responsibilities

- `Context` handles **global data & WebGL renderer** — nice separation of concerns.  
- `Board/Box` handle **layout, zoom, drag/resize, nesting**.  
- `Plot` and its subclasses handle **content**, not low-level layout.  
- WebGL plots share one global renderer, and use scissor/stencil to render only into their visible area – exactly the right pattern for multiple GL views in one canvas.

### 2.2 Use of Observables as a “signal bus”

You’re consistently using a simple `Observable` to:

- signal fetch requests (`requestFetchDataByItemIds`, `requestFetchDataByFilter`, `requestWebGLRender`…)  
- propagate filter/dimension/derived-data changes (`itemIdsInFilter`, `highlightItemIds`, dimension Observables, derivedDataStore.newData, etc.).  

It’s a nice, lightweight alternative to pulling in RxJS or a full global store.

### 2.3 The “family” of WebGL plots

The WebGL plots are particularly strong:

- They all share:
  - the same renderer
  - similar camera + controls patterns
  - similar overlay SVG axes
  - similar clipping/scissor logic inside overlapping boxes.
- `ExtractTilesViewer` shows you can plug in quite complex domain logic (`TileManager`) without changing the shell.

You’ve basically built a mini multi-viewport GL framework around board-box — that’s a big win.

---

## 3. Pain points / technical debt

### 3.1 Shared state is powerful but opaque

- Plots access shared state like:

  ```js
  this.sharedStateByAncestorId["context"].filters
  this.sharedStateByAncestorId[this.boardId].requestWebGLRender
  this.sharedStateByAncestorId[plotGroupId].sharedCamera
  ```

  This works, but it’s “stringy” and hard to read at a glance.

- There’s no explicit “schema” for:
  - `context.sharedState`
  - `board.sharedState`
  - `plotGroup.sharedState`
  - `box.sharedState`

You have to infer what’s there from usage scattered across the code.

### 3.2 Plot subclasses duplicate lifecycle patterns

Most plots do:

```js
make() {
  this.updateHeader();
  this.addPlotAreaSvg() / addPlotAreaDiv();
  this.setLasts();
  // subscriptions, bindings
  this.update();
}

async update() {
  if (this.fetchingData) return;
  await this.getData();
  if (!this.data || ...) return;

  this.updatePlotAreaSize();
  // do all rendering
}
```

…with small variations.

That means:

- data fetch logic is duplicated (and sometimes slightly diverges)
- different plots treat `newData` / resize checks inconsistently
- “bindings” (filters, dimensions, camera sync) are wired ad-hoc in each `make()`.

### 3.3 WebGL shell code is repeated

`TriMesh3D`, `GLTFViewer`, `LineSeriesGL`, `ExtractTilesViewer` all contain near-identical patterns around:

- getting the global renderer  
- creating/maintaining scene, camera, controls  
- computing DOM bounding rects for plots and parents  
- scissor / viewport / stencil rectangle logic  
- wiring `requestWebGLRender` subscriptions.

That’s textbook “wants a shared base class” territory.

### 3.4 No `requestAnimationFrame` throttling

Right now:

- box drag/resize → `Box.update` → component `update` → full SVG/WebGL/DOM updates, once per drag event.  
- Observables (filters, dimensions, TileManager) often trigger updates immediately as well.

On moderate data / plot complexity this is fine, but:

- drag events can fire **faster than 60 FPS**, so you can do redundant work between paints
- WebGL and SVG updates are expensive, so you can hit jank on more complex scenes or lower-end machines.

---

## 4. Recommended abstractions going forward

### 4.1 Strengthen `Plot` as a template base class

Right now `Plot` is mainly a utility holder. I’d turn it into a **template base** with clear hooks.

#### Goals

- All plots share the same lifecycle shape.
- Data fetching is centralised.
- Subscriptions and sharedState access are standardised.
- Backends (SVG, WebGL, pure HTML) just customise hooks.

#### Proposed `Plot` skeleton

```js
// Plot.js (refined)
import { Component } from 'board-box';
import * as d3 from 'd3v7';
import { fetchPlotData } from '../core/fetchPlotData';

export class Plot extends Component {
  constructor(options = {}) {
    super(options);
    this.itemId = options.itemId ?? null;
    this.layout = options.layout ?? {};
    this.layout.icons = this.layout.icons ?? [];
    this.layout.margin = this.layout.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };

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

    this.setCommonIcons();
  }

  // ---- SharedState convenience getters ----

  get context() {
    return this.sharedStateByAncestorId["context"];
  }

  get boardState() {
    return this.sharedStateByAncestorId[this.boardId];
  }

  get plotGroupState() {
    const ids = this.ancestorIds.filter(id => id !== "context");
    const outer = ids[0];
    return this.sharedStateByAncestorId[outer];
  }

  // ---- Geometry helpers (unchanged) ----

  get plotAreaWidth() {
    return this.width - this.layout.margin.left - this.layout.margin.right
           - this.marginAdd.left - this.marginAdd.right;
  }

  get plotAreaHeight() {
    return this.height - this.layout.margin.top - this.layout.margin.bottom - this.headerOffset
           - this.marginAdd.top - this.marginAdd.bottom;
  }

  get plotAreaLeft() {
    return this.layout.margin.left + this.marginAdd.left;
  }

  get plotAreaTop() {
    return this.layout.margin.top + this.headerOffset + this.marginAdd.top;
  }

  get marginTotal() {
    return {
      top:    this.layout.margin.top    + this.marginAdd.top,
      right:  this.layout.margin.right  + this.marginAdd.right,
      bottom: this.layout.margin.bottom + this.marginAdd.bottom,
      left:   this.layout.margin.left   + this.marginAdd.left,
    };
  }

  get plotAreaId() {
    return `${this.id}-plot-area`;
  }

  // ---- Base lifecycle ----

  make() {
    this.updateHeader();
    this.createPlotArea();
    this.setLasts();
    this.initBindings();
    this.update();
  }

  // hooks to override
  createPlotArea() {}
  initBindings() {}
  async doUpdate() {}

  async update() {
    if (this.fetchingData) return;

    if (this.fetchData && this.fetchDataNow) {
      await this.getData();
    }

    // Some plots (e.g. pure UI) may not use fetchData
    if (this.fetchData && (!this.data || this.data.__noUpdate)) {
      return;
    }

    this.updateHeader();
    this.updatePlotAreaSize();
    await this.doUpdate();
    this.setLasts();
  }

  // ---- Data fetching ----

  async getData() {
    if (!this.fetchData || !this.fetchDataNow) return;
    const requestSetTrafficLightColor = this.boardState?.requestSetTrafficLightColor;

    this.fetchingData = true;
    if (requestSetTrafficLightColor) {
      requestSetTrafficLightColor.state = "fetching";
    }

    const derivedData = this.context.derivedData;
    const dimensions  = this.context.dimensions;
    this.data = await fetchPlotData(this.fetchData, derivedData, dimensions);

    if (this.data && this.data.__noUpdate) {
      this.data = this.lastData || this.data;
      this.newData = false;
      this.fetchingData = false;
      this.fetchDataNow = false;
      if (requestSetTrafficLightColor) {
        requestSetTrafficLightColor.state = "fetched";
      }
      return;
    }

    this.fetchingData = false;
    this.fetchDataNow = false;
    if (requestSetTrafficLightColor) {
      requestSetTrafficLightColor.state = "fetched";
    }
    this.newData = true;
    this.lastData = this.data;
  }

  // ---- DOM helpers (from existing Plot) ----

  addPlotAreaDiv() { /* as you have now */ }
  addPlotAreaSvg() { /* as you have now */ }
  updatePlotAreaSize() { /* as you have now */ }

  // header, icons: unchanged from existing implementation

  // ---- Subscription helpers ----

  subscribe(observable, handler) {
    const bound = handler.bind(this);
    const id = observable.subscribe(bound);
    this.subscriptions.push({ observable, id });
    return id;
  }

  removeSubscriptions() {
    this.subscriptions.forEach(sub => {
      sub.observable.unsubscribeById(sub.id);
    });
    this.subscriptions = [];
  }

  remove() {
    this.removeSubscriptions();
  }

  // ---- Filter / dimension helpers (see §4.4, 5.3) ----
}
```

That gives you a **single, predictable lifecycle** for every plot.

---

### 4.2 Backend-specific bases: SVG vs WebGL

On top of `Plot` (v3.1 base lives in `PlotV3_1.js`), introduce lightweight backend bases.

#### 4.2.1 `SvgPlotBase`

All your D3 2D plots share the same shape (SVG area, optional tooltip, filter bindings).

```js
// SvgPlotBase.js
import { Plot } from './PlotV3_1.js';
import * as d3 from 'd3v7';

export class SvgPlotBase extends Plot {
  createPlotArea() {
    this.addPlotAreaSvg();
    if (this.layout.enableTips !== false) {
      const container = d3.select(`#${this.id}`);
      container.select(".tool-tip").remove();
      container.append("div")
        .attr("class", "tool-tip")
        .style("opacity", 0);
    }
  }

  get plotAreaSel() {
    return d3.select(`#${this.plotAreaId}`);
  }

  initBindings() {
    // optional convention: if a filter is referenced, wire it up
    const filterId = this.data?.filterId ?? this.layout.filterId;
    if (!filterId) return;

    this.filter = this.context.filters.find(f => f.id === filterId);
    if (!this.filter) return;

    if (this.onFilterItemsChange) {
      this.subscribe(this.filter.itemIdsInFilter, this.onFilterItemsChange);
    }
    if (this.layout.highlightItems && this.onHighlightItemsChange) {
      this.subscribe(this.filter.highlightItemIds, this.onHighlightItemsChange);
    }
  }

  // subclasses implement:
  // async doUpdate()
  // optionally onFilterItemsChange(), onHighlightItemsChange()
}
```

**Example: `MetaDataScatter`** becomes:

```js
// MetaDataScatter.js
import { SvgPlotBase } from './SvgPlotBase.js';

export class MetaDataScatter extends SvgPlotBase {
  constructor(options = {}) {
    options.layout = options.layout || {};
    options.layout.margin = options.layout.margin || { top:5, right:20, bottom:30, left:40 };
    options.layout.highlightItems ??= true;
    super(options);
    this.componentType = "MetaDataScatter";
  }

  onFilterItemsChange() {
    this.fetchDataNow = true;
    this.requestUpdate ? this.requestUpdate() : this.update();
  }

  onHighlightItemsChange() {
    this.highlightItems(); // existing method from your class
  }

  async doUpdate() {
    // the current body of update(), minus getData() / header/size chores
    // use this.plotAreaSel instead of d3.select(`#${this.plotAreaId}`)
  }
}
```

You can migrate your other SVG plots the same way; they’ll all end up with very similar structure.

---

#### 4.2.2 `WebGLPlotBase`

This base encapsulates the **shared shell** used by `TriMesh3D`, `GLTFViewer`, `LineSeriesGL`, `ExtractTilesViewer`.

Key responsibilities:

- install a `<div class="plot-area">` plus an SVG overlay
- maintain `scene`, `camera`, `controls`, `renderer` references
- wire `requestWebGLRender` → `renderScene()`
- compute scissor/viewport from DOM rectangles & ancestors
- sync shared camera / cut value if needed

Sketch:

```js
// WebGLPlotBase.js
import { Plot } from './PlotV3_1.js';
import * as d3 from 'd3v7';
import * as THREE from 'three';

export class WebGLPlotBase extends Plot {
  constructor(options = {}) {
    super(options);
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.renderer = null;
    this.stencilRects = [];
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
    this.overlay = container.append("svg")
      .attr("class", "svg-overlay")
      .style("position","absolute")
      .style("pointer-events","none");
    this.updateOverlaySizeAndPos();
  }

  updateOverlaySizeAndPos() {
    this.overlay
      .style("top",  `${this.plotAreaTop}px`)
      .style("left", `${this.plotAreaLeft - this.marginTotal.left}px`)
      .attr("width",  this.plotAreaWidth + this.marginTotal.left + this.marginTotal.right)
      .attr("height", this.plotAreaHeight + this.marginTotal.bottom);
  }

  initBindings() {
    this.renderer = this.context.renderer;
    const requestWebGLRender = this.boardState.requestWebGLRender;

    if (requestWebGLRender && !this.renderObserverId) {
      this.renderObserverId = requestWebGLRender.subscribeWithData({
        observer: this.renderScene.bind(this),
        data: { boxId: this.boxId }
      });
      this.subscriptions.push({ observable: requestWebGLRender, id: this.renderObserverId });
    }

    this.ensureScene();
    this.ensureCamera();
    this.ensureControls();
  }

  ensureScene() {
    if (this.scene) return;
    this.scene = new THREE.Scene();
    // subclasses can extend, or we can provide default lights/background.
  }

  ensureCamera() {
    // subclasses must override
  }

  ensureControls() {
    // subclasses must override (OrbitControls setup etc.)
  }

  async update() {
    if (this.fetchingData) return;
    if (this.fetchData && this.fetchDataNow) {
      await this.getData();
    }

    if (this.fetchData && (!this.data || this.data.__noUpdate)) return;

    this.updateHeader();
    this.updatePlotAreaSize();
    this.updateOverlaySizeAndPos();

    await this.updateSceneFromData();   // hook
    this.setLasts();
  }

  async updateSceneFromData() {
    // subclasses implement; they can call webGLUpdate() if needed.
  }

  renderScene() {
    if (!this.scene || !this.camera || !this.renderer) return;

    const container = d3.select(`#${this.id}`);
    const plotArea = container.select(".plot-area");

    // base rect from this plot
    const plotRect = plotArea.node().getBoundingClientRect();
    let rect = { left: plotRect.left, right: plotRect.right,
                 top: plotRect.top, bottom: plotRect.bottom };

    // intersect with ancestor boxes (like your current code)
    const ancestorIds = this.ancestorIds.filter(id => id !== "context" && id.includes("box"));
    for (let ancestorId of ancestorIds) {
      const el = d3.select(`#${ancestorId}-component-plot-area`);
      if (el.empty()) continue;
      const r = el.node().getBoundingClientRect();
      if (rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom) {
        return; // completely clipped
      }
      rect.left   = Math.max(rect.left,   r.left);
      rect.right  = Math.min(rect.right,  r.right);
      rect.top    = Math.max(rect.top,    r.top);
      rect.bottom = Math.min(rect.bottom, r.bottom);
    }

    // sync shared camera if layout.cameraSync && plotGroupState.sharedCamera
    if (this.layout.cameraSync && this.plotGroupState?.sharedCamera) {
      const sc = this.plotGroupState.sharedCamera;
      if (sc.position) this.camera.position.copy(sc.position);
      if (sc.rotation) this.camera.rotation.copy(sc.rotation);
      if (sc.zoom)     this.camera.zoom = sc.zoom;
      this.camera.updateProjectionMatrix();
    }

    // apply cut sync if desired (sharedCutValue pattern)
    // ...

    // finally, set WebGL viewport/scissor and render
    const canvasRect = this.renderer.domElement.getBoundingClientRect();
    const x = rect.left   - canvasRect.left;
    const y = canvasRect.bottom - rect.bottom;
    const w = rect.right  - rect.left;
    const h = rect.bottom - rect.top;

    this.renderer.setViewport(x, y, w, h);
    this.renderer.setScissor(x, y, w, h);
    this.renderer.setScissorTest(true);

    this.renderer.render(this.scene, this.camera);
  }
}
```

Then:

- `TriMesh3D`, `GLTFViewer`, `LineSeriesGL`, `ExtractTilesViewer` each:
  - extend `WebGLPlotBase`
  - override `ensureCamera`, `ensureControls`
  - implement `updateSceneFromData` (their domain-specific work)
  - reuse the shared `renderScene` logic.

---

### 4.3 Optional: lightweight “control” base

`DimensionSliders` already fits `Plot` fine — it just uses `addPlotAreaDiv` and dimension helpers. You *can* keep it as a direct `Plot` subclass.

If you find more of these appear (tables, inspectors, etc.), you might want a `ControlPlot` that:

- always uses a div plot area
- doesn’t call `getData()` at all
- only cares about dimensions/filters.

But that’s optional.

---

### 4.4 State & Observables helpers

Right now, every plot manually does the `requestCreateDimension` + `context.dimensions.find(...)` dance, and similar for filters.

It’s ripe for small helper methods in `Plot`:

#### Dimensions

```js
// in Plot
ensureDimension(name, initialValue = null) {
  const requestCreateDimension = this.context.requestCreateDimension;
  const dimensions = this.context.dimensions;

  requestCreateDimension.state = { name, value: initialValue };
  return dimensions.find(d => d.name === name);
}

bindDimension(name, handler, initialValue = null) {
  const dim = this.ensureDimension(name, initialValue);
  if (!dim) return null;
  const id = dim.subscribe(handler.bind(this));
  this.subscriptions.push({ observable: dim, id });
  return dim;
}
```

Then `DimensionSliders`, `TriMesh3D`, `ExtractTilesViewer`, `LineSeriesGL` can all use `bindDimension` instead of open-coding it.

#### Filters

```js
// in Plot
getFilter(filterId) {
  return this.context.filters.find(f => f.id === filterId);
}

bindFilter(filterId, { onItemsChange, onHighlightChange }) {
  const filter = this.getFilter(filterId);
  if (!filter) return null;

  if (onItemsChange) {
    this.subscribe(filter.itemIdsInFilter, onItemsChange);
  }
  if (onHighlightChange) {
    this.subscribe(filter.highlightItemIds, onHighlightChange);
  }
  return filter;
}
```

Then SVG plots just declare:

```js
initBindings() {
  const filterId = this.layout.filterId || this.data.filterId;
  this.filter = this.bindFilter(filterId, {
    onItemsChange:  this.onFilterItemsChange,
    onHighlightChange: this.layout.highlightItems ? this.onHighlightItemsChange : null,
  });
}
```

---

### 4.5 Clarifying `sharedState` “schemas”

Add (in comments) explicit shapes for each shared state object:

#### Context sharedState

```js
// Context.sharedState:
//
// {
//   renderer: THREE.WebGLRenderer,
//   datasets: Dataset[],
//   filters: Filter[],
//   derivedData: { name, data, newData: Observable }[],
//   dimensions: Observable[], // each observable.state = { value, brushing }
//   showFilters: boolean,
//   requestCreateFilter: Observable,
//   requestCreateDerivedDataStore: Observable,
//   requestSaveToDerivedData: Observable,
//   requestCreateDimension: Observable,
//   requestSetDimension: Observable,
// }
```

#### Board.sharedState

```js
// Board.sharedState:
//
// {
//   requestWebGLRender: Observable,           // used by WebGL plots
//   requestSetTrafficLightColor: Observable, // "green" | "fetching" | "fetched"
//   // plus whatever board-box already has
// }
```

#### PlotGroup.sharedState

```js
// PlotGroup.sharedState:
//
// {
//   boxes: Box[],                // child boxes
//   sharedCamera: { position, rotation, zoom },
//   sharedCutValue: { cutValue },
//   requestCutEvaluate: Observable,
//   requestUpdateBoxes: Observable, // from Box.sharedState
//   // ... possibly others
// }
```

#### Box.sharedState (your extension)

```js
// Box.sharedState:
//
// {
//   boxes: Box[],   // children
//   requestFetchDataByItemIds: Observable,
//   requestFetchDataByFilter: Observable,
//   requestAddFilterPlot: Observable,
//   requestRemovePlot: Observable,
//   // board-box's native sharedState entries...
// }
```

Even without TypeScript, this makes it much easier for future you to know what lives where.

---

## 5. Potential `requestAnimationFrame` utilisation

You’re already close to where `rAF` becomes valuable because:

- SVG plots do heavy D3 work per drag/update.  
- WebGL plots do heavy scene updates + renders.

### 5.1 Where rAF helps the most

1. **Throttling expensive DOM/SVG updates**  
   When boxes move/resize during drag, you can update the *model* immediately (`x`, `y`, `width`, `height`) but only re-run `plot.update()` at most once per frame.

2. **Centralising WebGL renders**  
   Instead of a WebGL plot calling `renderer.render` in response to each signal, maintain a per-frame render loop that checks “which views need redraw?” and renders them all once.

### 5.2 Simple pattern for plots: rAF-guarded `update`

Inside `Plot` (or `SvgPlotBase`), add:

```js
constructor(options) {
  super(options);
  this._pendingFrame = false;
}

requestUpdate() {
  if (this._pendingFrame) return;
  this._pendingFrame = true;
  requestAnimationFrame(async () => {
    this._pendingFrame = false;
    await this.update();
  });
}
```

Then, instead of calling `this.update()` directly on every drag/resize/filter event, call `this.requestUpdate()`.

You can still call `update()` directly if you need a synchronous one-off (e.g. initial layout).

### 5.3 rAF for WebGL rendering

You already have `requestWebGLRender` as a sort of signal bus. The missing piece is a loop that:

- runs once per animation frame
- polls “is there any pending render request?” for any board
- calls `renderScene()` on all WebGL plots that need it.

A straightforward pattern in `Board`:

```js
constructor(options = {}) {
  super(options);
  this._webGLNeedsRender = false;
  this._startRenderLoop();
}

_startRenderLoop() {
  const loop = () => {
    if (this._webGLNeedsRender) {
      this._webGLNeedsRender = false;
      this.sharedState.requestWebGLRender.state = { redraw: true };
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

markWebGLDirty() {
  this._webGLNeedsRender = true;
}
```

In WebGL plots:

- call `this.boardState.markWebGLDirty?.()` whenever something changes that requires a render:
  - TileManager tick
  - camera controls `change` event
  - data changes

If you don’t want to change `Board`’s API, a lighter version is:

- keep `requestWebGLRender` as an Observable
- only ever set its state inside a rAF loop, so multiple “please render” signals coalesce.

### 5.4 rAF and drags

- The board-box `Box` drag/resize handlers currently call `update("move")` / `update("normal")` synchronously.  
- If you modify `Box` so that it calls a `requestUpdate` on its component (if present), you can get rAF batching for free.

For example, in your Box subclass:

```js
drag(event) {
  this.x = event.x;
  this.y = event.y;
  this.fx = event.x;
  this.fy = event.y;
  this.setQuantise();
  this.raiseDiv();
  if (this.component?.requestUpdate) {
    this.component.requestUpdate();
  } else {
    this.update("move");
  }
  this.updateDescendants("move");
  this.customOnUpdateEnd?.();
  this.requestParentAutoNoOverlap(false, this.id);
}
```

This way, simple components keep the old behaviour; heavy plots opt into rAF by implementing `requestUpdate`.

---

## 6. Summary

- Your current codebase is already a **well-structured mini visualization framework** on top of board-box, with clear layering and a flexible Observable system.
- The main issues are **duplication** (especially in plot lifecycles and WebGL shells) and **implicit sharedState contracts**.
- Moving to:
  - a stronger `Plot` base with a **template lifecycle**,  
  - backend-specific bases (`SvgPlotBase`, `WebGLPlotBase`),  
  - small helpers for filters/dimensions/sharedState, and  
  - rAF-based throttling for heavy updates  

  will make new plot types **cheaper to write**, behaviour **more predictable**, and performance **more scalable**, without changing your mental model for how the system works.

This document is intended as a living design reference you can keep alongside the code and evolve as the framework grows.


---

## 4.6 Structured `sharedState` (State / Events / Services)

This section refines the earlier `sharedState` discussion into a concrete, incremental proposal.

### Motivation

Your existing `sharedStateByAncestorId` mechanism is powerful and flexible. The issue is not the mechanism, but that each `sharedState` object currently mixes:

- persistent **state** (data you read)
- imperative **services** (things you call/use)
- **events / commands** (Observables you emit to request actions)

This makes the system harder to reason about as it grows.

The proposal is to **structure** shared state into three explicit buckets, while keeping full backward compatibility.

---

### Core rule

Each sharedState object should follow this shape:

```js
sharedState = {
  state: {},     // readable, persistent data
  events: {},    // Observables / signals
  services: {}   // shared objects with behaviour/lifecycle
}
```

You still use `sharedStateByAncestorId`; this only changes *what lives inside* each entry.

---

### Context sharedState (proposed)

```js
context.sharedState = {
  state: {
    datasets: Dataset[],
    filters: Filter[],
    derivedData: { name, data, newData }[],
    dimensions: Observable[], // observable.state = { value, brushing }
    showFilters: boolean,
  },

  services: {
    renderer: THREE.WebGLRenderer,
  },

  events: {
    filters: {
      create: requestCreateFilter,
    },
    derivedData: {
      createStore: requestCreateDerivedDataStore,
      save: requestSaveToDerivedData,
    },
    dimensions: {
      create: requestCreateDimension,
      set: requestSetDimension,
    }
  }
};
```

Usage becomes intentional:

```js
const dims = this.context.state.dimensions;
const renderer = this.context.services.renderer;
this.context.events.dimensions.create.state = { name, value };
```

---

### Board sharedState (proposed)

```js
board.sharedState = {
  state: {
    trafficLight: "green", // optional mirror of UI state
  },

  events: {
    webgl: {
      render: requestWebGLRender,
    },
    ui: {
      setTrafficLight: requestSetTrafficLightColor,
    }
  },

  services: {
    scheduler: webGLScheduler, // see §5.5
  }
};
```

---

### PlotGroup sharedState (proposed)

```js
plotGroup.sharedState = {
  state: {
    boxes: Box[],
    sharedCamera: { position, rotation, zoom },
    sharedCutValue: { cutValue },
  },

  events: {
    cut: {
      evaluate: requestCutEvaluate,
    },
    boxes: {
      update: requestUpdateBoxes,
    }
  }
};
```

---

### Box sharedState (proposed)

```js
box.sharedState = {
  state: {
    boxes: Box[],
    gridXMax: number,
  },

  events: {
    plots: {
      addFilterPlot: requestAddFilterPlot,
      removePlot: requestRemovePlot,
    },
    data: {
      fetchByItemIds: requestFetchDataByItemIds,
      fetchByFilter: requestFetchDataByFilter,
    }
  }
};
```

---

### Backward-compatible migration strategy

You do **not** need to update everything at once.

Example (Context):

```js
this.sharedState = {
  state: { datasets, filters, derivedData, dimensions },
  services: { renderer },
  events: { dimensions: { create: requestCreateDimension } }
};

// legacy aliases
this.sharedState.datasets = this.sharedState.state.datasets;
this.sharedState.filters = this.sharedState.state.filters;
this.sharedState.derivedData = this.sharedState.state.derivedData;
this.sharedState.dimensions = this.sharedState.state.dimensions;
this.sharedState.renderer = this.sharedState.services.renderer;
this.sharedState.requestCreateDimension =
  this.sharedState.events.dimensions.create;
```

This lets old and new code coexist safely.

---

### Semantic getters on Plot

To avoid stringly access everywhere:

```js
get contextState()    { return this.context.state; }
get contextEvents()   { return this.context.events; }
get contextServices() { return this.context.services; }

get boardState()      { return this.boardStateRaw.state; }
get boardEvents()     { return this.boardStateRaw.events; }
get boardServices()   { return this.boardStateRaw.services; }
```

This makes plot code much more readable and self-documenting.

---

## 5.5 Scheduler & `requestAnimationFrame` coalescing

This section formalises rAF usage into a small, explicit scheduler instead of ad‑hoc throttling.

---

### Motivation

Currently:

- Box drag/resize events can fire faster than the screen refresh rate
- Each event may trigger expensive SVG or WebGL updates
- WebGL plots may render multiple times per frame

A scheduler ensures:
- **at most one render per frame**
- multiple update requests are coalesced
- responsibilities are clearly separated

---

### Plot-level scheduler (SVG / DOM)

In `Plot`:

```js
constructor(options) {
  super(options);
  this._pendingFrame = false;
}

requestUpdate() {
  if (this._pendingFrame) return;
  this._pendingFrame = true;
  requestAnimationFrame(async () => {
    this._pendingFrame = false;
    await this.update();
  });
}
```

Usage:

- drag/resize → `plot.requestUpdate()`
- filter/dimension change → `plot.requestUpdate()`
- initial layout can still call `plot.update()` directly

---

### Board-level scheduler

A minimal scheduler lives at board level (driving WebGL renders; can be extended to SVG/DOM coalescing).

```js
class Scheduler {
  constructor(renderEvent) {
    this.renderEvent = renderEvent;
    this.dirty = false;
    this.loop();
  }

  markDirty() {
    this.dirty = true;
  }

  loop() {
    if (this.dirty) {
      this.dirty = false;
      this.renderEvent.state = { redraw: true };
    }
    requestAnimationFrame(this.loop.bind(this));
  }
}
```

Board setup:

```js
const requestWebGLRender = new Observable();

const scheduler = new Scheduler(requestWebGLRender);

board.sharedState = {
  state: {},
  events: { webgl: { render: requestWebGLRender } },
  services: { scheduler }
};
```

WebGL plots request redraws by intent:

```js
this.boardServices.scheduler.markDirty();
```

Actual rendering still happens in `WebGLPlotBase.renderScene()`.

---

### Drag / resize integration

In your Box subclass:

```js
drag(event) {
  this.x = event.x;
  this.y = event.y;
  this.fx = event.x;
  this.fy = event.y;

  this.setQuantise();
  this.raiseDiv();

  if (this.component?.requestUpdate) {
    this.component.requestUpdate();
  } else {
    this.update("move");
  }

  this.updateDescendants("move");
  this.customOnUpdateEnd?.();
}
```

This allows:
- lightweight components to remain immediate
- heavy plots to opt into rAF batching

---

### Benefits

- Clear ownership of **when** rendering happens
- SVG and WebGL follow the same mental model
- Fewer redundant renders under interaction
- Much easier performance tuning later

---

## Closing note

With:

1. Structured `sharedState`
2. Template-based plot classes
3. Backend-specific plot bases
4. Explicit scheduling

…your architecture becomes:
- easier to reason about
- cheaper to extend
- safer to optimise
- still fully imperative where it needs to be

And crucially: **you keep the editor‑like feel** that React-only approaches struggle to achieve.


---

## Scheduler-based Cut Handling

# Scheduler-based cut handling

This document supplements the main design doc and focuses on how **cuts** (planes,
lines, intersections) should be handled using the board-level scheduler.

## Motivation

Cuts are computationally expensive, but users expect smooth interaction while dragging
sliders or brushes.

We therefore split cut handling into two phases:

1. **Cheap per-frame updates**
   - Move cut plane / line
   - Update shader uniforms
   - Update overlay visuals
   - Request a render

2. **Expensive evaluation (scheduled)**
   - Compute mesh–plane intersections
   - Generate polylines / meshes
   - Update derived data stores
   - Upload new GPU buffers

The expensive work is **coalesced and deferred** via the scheduler.

## Scheduler support

```js
scheduler.markDirty();
scheduler.scheduleJob(key, fn);
```

## Example

```js
onCutDimensionChange() {
  const v = this.getCutValueFromDimension();
  this.setSharedCutValue(v);
  this.applyCutUniforms(v);
  this.updateCutLines(this.meshBounds);
  this.boardServices.scheduler.markDirty();
  this.scheduleCutEvaluation();
}
```


---

## Plot Export to PNG (Client + Server)

### Motivation

Plots should support export to PNG for:

1. User-driven download of individual plots
2. Server-side rendering (SSR)

---

### Plot-level Export Hook

```js
async exportPng(opts = {}) {
  await this.update?.();
  return await this._exportPngImpl(opts);
}
```

---

### SVG Plot Export (`SvgPlotBase`)

- Serialize SVG
- Rasterize via adapter

---

### WebGL Plot Export (`WebGLPlotBase`)

- Render at export resolution
- Read pixels
- Encode PNG

---

### Export Adapters

```js
exportAdapters = { svgToPng, rgbaToPng }
```

---

## Summary

This unified document captures the intended architecture and refactor direction.
