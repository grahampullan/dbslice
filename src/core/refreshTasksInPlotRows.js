import { dbsliceData } from './dbsliceData.js';
import { update } from './update.js';
import { makePlotsFromPlotRowCtrl } from './makePlotsFromPlotRowCtrl.js';


function refreshTasksInPlotRows() {

	dbsliceData.fetchDataIsRequested = true;

	var plotRows = dbsliceData.session.plotRows;

	plotRows.forEach( function( plotRow ) {

		if (plotRow.ctrl !== undefined ) {

			var ctrl = plotRow.ctrl;

			if (ctrl.plotFunc !== undefined || ctrl.plotType !== undefined ) {

				if ( ctrl.tasksByFilter ) {

					ctrl.taskIds = dbsliceData.filteredTaskIds;
					ctrl.taskLabels = dbsliceData.filteredTaskLabels;
					
				}

				if ( ctrl.tasksByList ) {

					ctrl.taskIds = dbsliceData.manualListTaskIds;

				}

				plotRow.plots = makePlotsFromPlotRowCtrl( ctrl );
				plotRow.plots.forEach( (plot) => {
					++plotRow._maxPlotId;
					plot._id = plotRow._maxPlotId;
				} );

			}

		}

	});

	update();
	dbsliceData.fetchDataIsRequested = false;
	
}

export { refreshTasksInPlotRows };


