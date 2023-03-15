import { dbsliceData } from './dbsliceData.js';
import { update } from './update.js';
import { makePlotsFromPlotRowCtrl } from './makePlotsFromPlotRowCtrl.js';
import { makePlotObject } from './plot.js';

function refreshTasksInPlotRows( allowAutoFetch = false ) {

	var plotRows = dbsliceData.session.plotRows;

	plotRows.forEach( function( plotRow ) {

		if (plotRow.ctrl !== undefined ) {

			var ctrl = plotRow.ctrl;

			if ( !allowAutoFetch || ( allowAutoFetch && ctrl.autoFetchOnFilterChange ) ) {

				if (ctrl.plotFunc !== undefined || ctrl.plotType !== undefined ) {

					if ( ctrl.fetchData !== undefined ) {

						if ( ctrl.fetchData.tasksByFilter ) {

							ctrl.taskIds = dbsliceData.filteredTaskIds;
							ctrl.taskLabels = dbsliceData.filteredTaskLabels;
					
						}

						if ( ctrl.fetchData.tasksByList ) {

							ctrl.taskIds = dbsliceData.manualListTaskIds;

						}
						
					}

					plotRow.plots = makePlotsFromPlotRowCtrl( ctrl );
					plotRow.plots.forEach( (plot) => {
						plot = makePlotObject(plot);
						plotRow.assignPlotId(plot);
						if ( plot.fetchData !== undefined ) {
							plot.fetchData._fetchNow = true;
						}
					} );

				}
			}

		}

	});

	update();
	
}

export { refreshTasksInPlotRows };


