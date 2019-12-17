import { dbsliceData } from './dbsliceData.js';
import { render } from './render.js';
import { makePlotsFromPlotRowCtrl } from './makePlotsFromPlotRowCtrl.js';


function refreshTasksInPlotRows() {
	var plotRows = dbsliceData.session.plotRows;
	var plotRowPromises = [];
  
	
	plotRows.forEach(function (plotRow) {
		
		// For now nothing happens as there are no plotRow.ctrl
		if (plotRow.ctrl !== undefined) {
			var ctrl = plotRow.ctrl;

			if (ctrl.plotFunc !== undefined) {
				
				// Get 
				if (ctrl.tasksByFilter) {
					ctrl.taskIds = dbsliceData.filteredTaskIds;
					ctrl.taskLabels = dbsliceData.filteredTaskLabels;
				} // if


				// This does nothing for now!!
				if (ctrl.tasksByList) {
					ctrl.taskIds = dbsliceData.manualListTaskIds;
				} // if

				// Create all the promises, and when they're met push the plots.
				var plotRowPromise = makePlotsFromPlotRowCtrl(ctrl).then(
					function (plots) {
						plotRow.plots = plots;
					});
				plotRowPromises.push(plotRowPromise);
			} // if
		} // if
	}); // forEach
	
	Promise.all(plotRowPromises).then(function () {
		// When all the data has been loaded rerender.
		render(dbsliceData.elementId, dbsliceData.session);
	}); // Promise
} // refreshTasksInPlotRows

export { refreshTasksInPlotRows };


