# DimensionSlidersRefactor

A refactored **DimensionSliders** remains a direct `Plot` subclass (no SVG/WebGL base),
and binds DOM controls to dimensions via structured events.

---

## Inheritance

```txt
Plot → DimensionSliders
```

---

## Skeleton

```js
export class DimensionSliders extends Plot {
  createPlotArea() { this.addPlotAreaDiv(); }

  initBindings() {
    for (const s of this.layout.sliders) {
      this.ensureDimension(s.name, s.initialValue ?? 0);
      this.bindDimension(s.name, () => this.requestUpdate());
    }
  }

  doUpdate() {
    // render sliders
    // on input: contextEvents.dimensions.set.state = { name, value, brushing:true }
    // on change: contextEvents.dimensions.set.state = { name, value, brushing:false }
  }
}
```
