import { dbsliceData } from './dbsliceData.js';
import { render } from './render.js';
import { makePlotsFromPlotRowCtrl } from './makePlotsFromPlotRowCtrl.js';
import { onDemandDataLoading } from './onDemandDataLoading.js';


function refreshTasksInPlotRows() {
        var plotRows = dbsliceData.session.plotRows;
        var plotRowPromises = [];
      
        plotRows.forEach(function (plotRow) {
            
            // For now nothing happens as there are no plotRow.ctrl
            if (plotRow.ctrl !== undefined) {
                var ctrl = plotRow.ctrl;

                if (ctrl.plotFunc !== undefined) {
					
					// AK: HACK
					// Remove all the plots in all plotrows first. This should be ok as all plots are redrawn anyway.
					// It's required as the plots store an internal reference to the data loaded, which causes bugs if the plots are redrawn
					d3.selectAll(".plotRowBody[type='plotter']").selectAll(".plotWrapper").remove()
                    
                    // Get 
                    if (ctrl.tasksByFilter) {
                        ctrl.taskIds = dbsliceData.filteredTaskIds;
                        ctrl.taskLabels = dbsliceData.filteredTaskLabels;
                    } // if



                    // Create all the promises, and when they're met push the plots.
                    var plotRowPromise = onDemandDataLoading.makePlotsFromPlotRowCtrl(ctrl)
					    .then( function (plots) {
							
                            plotRow.plots = plots;
					
                        }); // then
                    plotRowPromises.push(plotRowPromise);
                } // if
            } // if
        }); // forEach
        
        Promise.all(plotRowPromises).then(function () {
            // Render when all the data for all the plots in all plot rows has been loaded.
			// console.log(dbsliceData)
            render(dbsliceData.elementId, dbsliceData.session);
        }); // Promise
    } // refreshTasksInPlotRows



export { refreshTasksInPlotRows };


