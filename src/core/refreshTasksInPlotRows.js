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

				console.log ('refreshTasksInPlotRows: making plots... ');
				console.log (ctrl);
				plotRow.plots = makePlotsFromPlotRowCtrl( ctrl );
				console.log ("NOW");
				console.log (plotRow.plots);

			}

		}

	});

	render( dbsliceData.elementId, dbsliceData.session, false, false, false);

}

export { refreshTasksInPlotRows };