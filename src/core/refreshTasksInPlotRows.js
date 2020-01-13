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


				// THIS DOES NOTHING FOR NOW!!
				if (ctrl.tasksByList) {
					ctrl.taskIds = dbsliceData.manualListTaskIds;
				} // if

				// Create all the promises, and when they're met push the plots.
				var plotRowPromise = makePlotsFromPlotRowCtrl(ctrl)
					.then( function (plots) {
						plotRow.plots = plots;
						
						// The plot limits have to be assigned to the plots as they are passed into the plotting functions alone, without the rest of the plotRow object. This allows all the colorbars to be the same.
						plotRow.plots.forEach(function(plot){
							plot.data.limits = plotRow.ctrl.limits;
						}); // forEach
					}); // then
				plotRowPromises.push(plotRowPromise);
			} // if
		} // if
	}); // forEach
	
	Promise.all(plotRowPromises).then(function () {
		// Render when all the data for all the plots in all plot rows has been loaded.
		render(dbsliceData.elementId, dbsliceData.session);
	}); // Promise
} // refreshTasksInPlotRows


export { refreshTasksInPlotRows };


