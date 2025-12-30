# SvgPlotsRefactor

This document consolidates the SVG plot refactor guidance and includes the **MetaDataHistogram** example.

---

## SVG plots refactored pattern

# SVG plots (refactored pattern)

Applies to MetaDataScatter / Histogram / BarChart / RankCorr / LineSeries (SVG).

## Inheritance
```txt
PlotV3_1 → SvgPlotBase → YourPlot
```

## Conventions
- `initBindings()` is where subscriptions live.
- `doUpdate()` is render-only.
- Call `requestUpdate()` from handlers (rAF coalescing).

---

## Included example: MetaDataHistogram

# MetaDataHistogram (refactored)

This document illustrates how **MetaDataHistogram** would look after the refactor to:

- a template `PlotV3_1` base class (`make → createPlotArea → initBindings → doUpdate`)
- an SVG-specific base (`SvgPlotBase`)
- structured shared state accessors (`contextState/contextEvents/contextServices`)
- rAF-coalesced updates via `requestUpdate()`

---

## Inheritance

```txt
Component (board-box)
  └─ PlotV3_1
      └─ SvgPlotBase
          └─ MetaDataHistogram
```

---

## Responsibilities

- Fetch (or receive) histogram input data via `fetchData`
- Render bins, bars, and axes into the SVG plot area
- Drive filter extents via brushing
- Reflect filter membership and highlight state

---

## Expected inputs

Typical conventions (adapt as needed to match your `fetchPlotData` output):

- `this.data.values`: numeric array for histogram (or `{x: number}[]`)
- `this.data.property`: property name (for labeling)
- `this.data.filterId`: filter id to bind (or `layout.filterId`)

---

## Refactored class (illustrative)

```js
import * as d3 from "d3v7";
import { SvgPlotBase } from "./SvgPlotBase.js";

export class MetaDataHistogram extends SvgPlotBase {
  constructor(options = {}) {
    options.layout ??= {};
    options.layout.margin ??= { top: 5, right: 20, bottom: 30, left: 53 };
    options.layout.highlightItems ??= true;
    options.layout.xTickNumber ??= 5;
    options.layout.enableTips ??= true;

    super(options);
    this.componentType = "MetaDataHistogram";

    this.filter = null;
    this.brushInitialised = false;
    this._x = null;
    this._y = null;
    this._bins = null;
  }

  initBindings() {
    const filterId = this.data?.filterId ?? this.layout.filterId;
    if (!filterId) return;

    this.filter = this.contextState.filters.find(f => f.id === filterId) ?? null;
    if (!this.filter) return;

    this.subscribe(this.filter.itemIdsInFilter, () => {
      this.fetchDataNow = true;   // if your fetch depends on filter membership
      this.requestUpdate();      // rAF coalesced
    });

    if (this.layout.highlightItems) {
      this.subscribe(this.filter.highlightItemIds, () => {
        this.requestUpdate();
      });
    }
  }

  async doUpdate() {
    if (!this.data) return;

    const plotArea = this.plotAreaSel;
    const W = this.plotAreaWidth;
    const H = this.plotAreaHeight;

    const values = this.data.values ?? [];
    if (!values.length || W <= 0 || H <= 0) {
      plotArea.selectAll("*").remove();
      return;
    }

    const x = d3.scaleLinear()
      .domain(d3.extent(values) ?? [0, 1])
      .nice()
      .range([0, W]);

    const bins = d3.bin()
      .domain(x.domain())
      .thresholds(this.layout.xTickNumber)(values);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) ?? 0])
      .nice()
      .range([H, 0]);

    this._x = x;
    this._y = y;
    this._bins = bins;

    const g = plotArea.selectAll("g.root")
      .data([null])
      .join("g")
      .attr("class", "root");

    g.selectAll("rect.bar")
      .data(bins)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.x0))
      .attr("y", d => y(d.length))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", d => H - y(d.length));

    g.selectAll("g.x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(this.layout.xTickNumber));

    g.selectAll("g.y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(5));

    this.ensureBrush(g, x, H);
  }

  ensureBrush(g, x, H) {
    if (this.brushInitialised) return;

    const brush = d3.brushX()
      .extent([[0, 0], [this.plotAreaWidth, H]])
      .on("brush end", (event) => this.onBrush(event, x));

    g.selectAll("g.brush")
      .data([null])
      .join("g")
      .attr("class", "brush")
      .call(brush);

    this.brushInitialised = true;
  }

  onBrush(event, x) {
    if (!event.selection || !this.filter) return;

    const [px0, px1] = event.selection;
    const v0 = x.invert(px0);
    const v1 = x.invert(px1);

    // Option A: call into filter object
    // this.filter.setContinuousExtent(this.data.property, [v0, v1]);

    // Option B: signal via structured events
    // this.contextEvents.filters.setExtent.state = {
    //   filterId: this.filter.id,
    //   property: this.data.property,
    //   extent: [v0, v1]
    // };
  }
}
```

---

## What moved out of MetaDataHistogram

- Header rendering & icon wiring → `Plot`
- SVG plot-area creation & tooltip container → `SvgPlotBase`
- Fetch orchestration → `Plot.update()` / `Plot.getData()`
- Update coalescing → `Plot.requestUpdate()`
