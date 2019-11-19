// import "@babel/polyfill";
import 'whatwg-fetch';

export { cfD3BarChart } from './plot/cfD3BarChart.js';
export { cfD3Histogram } from './plot/cfD3Histogram.js';
export { cfD3Scatter } from './plot/cfD3Scatter.js';
export { render } from './core/render.js';
export { update } from './core/update.js';
export { makeNewPlot } from './core/makeNewPlot.js';
export { updatePlot } from './core/updatePlot.js';
export { cfInit } from './core/cfInit.js';
export { cfUpdateFilters } from './core/cfUpdateFilters.js';
export { makePlotsFromPlotRowCtrl } from './core/makePlotsFromPlotRowCtrl.js'; 
export { refreshTasksInPlotRows } from './core/refreshTasksInPlotRows.js'; 
export { makeSessionHeader } from './core/makeSessionHeader.js';
export { getFilteredTaskIds } from './core/getFilteredTaskIds.js';
export { getFilteredTaskLabels } from './core/getFilteredTaskLabels.js';
export { createAddPlotControls } from './core/createAddPlotControls.js';