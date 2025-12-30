# Plot Refactor Execution Plan (Step-by-step)

This document is a practical, low-risk sequence for refactoring the current plot system
towards the architecture described in:

- **SvgPlotsRefactor** (SVG template + MetaDataHistogram example)
- **WebGLPlotsRefactor** (WebGL template + TriMesh example)
- **DimensionSlidersRefactor** (control/UI plot template)

The guiding principle is **incremental migration**: introduce the new base classes and
infrastructure *without breaking existing plots*, then migrate plots one-by-one behind a
flag/registry switch.

---

## 0) Create a branch and baseline

1. Use the refactor branch:
   - `v3-plot-refactor`

2. Freeze a baseline:
   - create a small “smoke test board” (manual is fine) that renders:
     - one SVG plot (MetaDataHistogram)
     - one WebGL plot (GLTFViewer or TriMesh)
     - DimensionSliders
   - capture screenshots (or a short recording) as the “known good” reference.

Outcome: you can visually compare output after each refactor step.

---

## 1) Add new base classes (do not migrate plots yet)

Create the new v3.1 scaffolding *alongside* existing code so nothing breaks.

Add (suggested new files / folder):

- `PlotV3_1.js` (template method lifecycle)
- `SvgPlotBase.js`
- `WebGLPlotBase.js`
- `Scheduler.js` (board-level rAF coalescing; use for WebGL and optionally SVG/DOM)

Important: no existing plot should import these yet.

Outcome: foundations exist, but behaviour unchanged.

---

## 2) Add structured shared state access (with compatibility aliases)

Goal: improve clarity without affecting existing behaviour.

1) Add the new structured accessors in `PlotV3_1`:

- `contextState`, `contextEvents`, `contextServices`
- `boardState`, `boardEvents`, `boardServices`
- `plotGroupState` (and/or `plotGroupEvents`, `plotGroupServices` if you use them)

2) Maintain backwards compatibility:

- keep existing `sharedState.*` keys working
- optionally add alias getters that map old → new.

Outcome: new plots can be written cleanly; old plots keep working.

---

## 3) Integrate scheduler at board-level (keep old render triggers working)

Goal: plots (WebGL and optionally SVG/DOM) should call `scheduler.markDirty()` and
`scheduler.scheduleJob()` for rAF-coalesced work, but old code paths can still trigger
renders/updates as before.

1) Instantiate scheduler in Board services:
- `boardServices.scheduler = new Scheduler(requestWebGLRenderEvent)` (or a more general event)

2) Continue supporting the current WebGL render event (if any):
- scheduler drives it internally
- old code that toggles the event still works (during migration)

Outcome: a single rAF loop, coalesced renders, and a job queue for heavy work.

---

## 4) Introduce a plot registry switch (V3 ↔ V3.1)

Before migrating plots, decide how to select plot classes.

Options:
- a registry map: `plotType -> class`
- a layout flag: `layout.useV3_1 = true`
- an app-level feature flag

Recommended:
- default to V3
- allow V3.1 for select plots

Outcome: you can ship v3.1 plots without touching existing v3 plots.

---

## 5) Migrate the easiest plot first: MetaDataHistogram → SvgPlotBase

1) Create `MetaDataHistogramV3_1 extends SvgPlotBase`.
2) Move subscriptions into `initBindings()`.
3) Move rendering into `doUpdate()`.
4) Replace ad-hoc update triggers with `requestUpdate()`.

Enable it behind the registry/flag.

Outcome: proves the SVG lifecycle and base class are correct.

---

## 6) Migrate a minimal WebGL plot: GLTFViewer → WebGLPlotBase

Pick GLTFViewer as the first WebGL conversion because it is mostly:
- scene graph + camera + controls + loading
- minimal domain-specific compute

Steps:
1) Create `GLTFViewerV3_1 extends WebGLPlotBase`.
2) Ensure it does not call `renderer.render()` directly.
3) Use `boardServices.scheduler.markDirty()` after updates.
4) Keep scissor/viewport logic entirely inside `WebGLPlotBase`.

Enable behind the registry/flag.

Outcome: validates WebGL base rendering + clipping + scheduling.

---

## 7) Migrate DimensionSliders → PlotV3.1

1) Create `DimensionSlidersV3_1 extends PlotV3_1`.
2) Render UI in `doUpdate()`.
3) Subscribe to dimension changes in `initBindings()`.
4) Emit changes via structured events (recommended) or current dimension mutation.

Enable behind the registry/flag.

Outcome: validates non-SVG/non-WebGL plot lifecycle.

---

## 8) Migrate TriMesh3D → WebGLPlotBase + scheduler-based cuts

Only attempt this once WebGLPlotBase is validated via GLTFViewer.

1) Create `TriMesh3DV3_1 extends WebGLPlotBase`.
2) Convert rendering:
   - update scene graph
   - call `scheduler.markDirty()`
3) Implement two-phase cuts:

Preview (fast; during drag)
- update uniforms / cut lines / clip plane transforms
- `scheduler.markDirty()`

Evaluation (slow; deferred and coalesced)
- schedule heavy mesh-plane intersection compute via:
  - `scheduler.scheduleJob("cut-eval:<boxId>", fn)`
- prefer “evaluate on release” if dimension has `brushing === false`.

Enable behind the registry/flag.

Outcome: the most expensive interactive plot becomes smoother and more maintainable.

---

## 9) Extract shared behaviours (after 2–3 plots migrated)

Do this after GLTFViewerV3_1 and TriMesh3DV3_1 exist, so abstractions are based on real repetition.

Candidate behaviours:
- `CameraSyncBehaviour`
- `CutLinesBehaviour`
- `FilterBindingsHelper`
- `DimensionBindingsHelper`

Outcome: less duplication and more consistent architecture across plots.

---

## 10) Flip defaults to V3.1 and retire V3

When enough plots are migrated and stable:
1) Default the registry to V3.1 for migrated plot types.
2) Keep V3 as a fallback flag for a short period.
3) Migrate remaining plots incrementally.
4) Remove V3 base + legacy scaffolding once coverage is complete.

Outcome: the system converges to one clear plot architecture.

---

## Suggested PR breakdown

PR 1 – Foundations
- add PlotV3_1 + SvgPlotBase + WebGLPlotBase
- add scheduler (markDirty + scheduleJob)
- no plot changes

PR 2 – First SVG migration
- MetaDataHistogramV3_1 behind flag

PR 3 – First WebGL migration
- GLTFViewerV3_1 behind flag

PR 4 – Controls migration
- DimensionSlidersV3_1 behind flag

PR 5 – Heavy WebGL migration
- TriMesh3DV3_1 with scheduler-based cuts behind flag

---

## Steps checklist

- [ ] Add scaffolding files (unreferenced for now): `PlotV3_1.js`, `SvgPlotBase.js`, `WebGLPlotBase.js`, `Scheduler.js` with template lifecycle + requestUpdate throttling.
- [ ] Add structured shared-state accessors in `PlotV3_1` (context/board/plotGroup state/events/services) while keeping legacy aliases working.
- [ ] Wire a board-level `Scheduler` (rAF loop; markDirty/scheduleJob) to drive the existing WebGL render event; leave old triggers intact.
- [ ] Implement registry/flag to select V3 vs V3.1 classes (`layout.useV3_1` or map), defaulting to V3.
- [ ] Create V3.1 variants behind the flag: MetaDataHistogram → `SvgPlotBase`, GLTFViewer → `WebGLPlotBase`, DimensionSliders → `PlotV3_1`, TriMesh3D → `WebGLPlotBase` with scheduled cuts.
- [ ] Extract shared behaviors (camera sync, cut lines, filter/dimension helpers) once repetition appears after 2–3 migrations.
- [ ] Flip registry default to V3.1, drop suffixes (rename to canonical), remove V3 scaffolding.

---

## Deliverables checklist

- [ ] V3.1 base classes exist and are unused by default
- [ ] Scheduler integrated at board-level
- [ ] Registry/flag mechanism for choosing V3 vs V3.1 plot classes
- [ ] MetaDataHistogramV3_1 shipped
- [ ] GLTFViewerV3_1 shipped
- [ ] DimensionSlidersV3_1 shipped
- [ ] TriMesh3DV3_1 shipped with deferred cut evaluation
- [ ] Behaviours extracted (optional)
- [ ] V3.1 becomes default; V3 removed
