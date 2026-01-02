import * as d3 from "d3v7";
import { Plot } from "./Plot";

// Base for SVG/D3 plots in the v3.1 architecture. Unused until wiring is added.
export class SvgPlotBase extends Plot {
  createPlotArea() {
    this.addPlotAreaSvg();
    if (this.layout.enableTips === false) return;
    const container = d3.select(`#${this.id}`);
    container.select(".tool-tip").remove();
    container
      .append("div")
      .attr("class", "tool-tip")
      .style("opacity", 0);
  }
}
