import { dbsliceData } from './dbsliceData.js';
import { render } from './render.js';
import { makePlotsFromPlotRowCtrl } from './makePlotsFromPlotRowCtrl.js';


function refreshTasksInPlotRows() {

	var plotRows = dbsliceData.session.plotRows;

	plotRows.forEach( function( plotRow ) {

		if (plotRow.ctrl !== undefined ) {

			var ctrl = plotRow.ctrl;

			if (ctrl.plotFunc !== undefined ) {

				if ( ctrl.tasksByFilter ) {

					ctrl.taskIds = dbsliceData.session.filteredTaskIds;
					ctrl.taskLabels = dbsliceData.session.filteredTaskLabels;
					
				}

				if ( ctrl.tasksByList ) {

					ctrl.taskIds = dbsliceData.session.manualListTaskIds;

				}

				plotRow.plots = makePlotsFromPlotRowCtrl( ctrl );

			}

		}

	});

	render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );

}

export { refreshTasksInPlotRows };