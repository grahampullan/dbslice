function makePlotsFromPlotRowCtrl( ctrl ) {

	var plotPromises = [];

	var slicePromises = [];

	if ( ctrl.sliceIds === undefined ) {

		var nTasks = ctrl.taskIds.length;

		if ( ctrl.maxTasks !== undefined ) nTasks = Math.min( nTasks, ctrl.maxTasks );

		for ( var index = 0; index < nTasks; ++index ) {

			if ( ctrl.urlTemplate == null ) {

				var url = ctrl.taskIds[ index ];

			} else {

				var url = ctrl.urlTemplate.replace( "${taskId}", ctrl.taskIds[ index ] );

			}

			var title = ctrl.taskLabels[ index ];

       		var plotPromise = fetch(url)

        		.then(function( response ) {

        			return response.json();

        		})

        		.then(function( responseJson ) {

        			var plot = {};

        			if (ctrl.formatDataFunc !== undefined) {

						plot.data = ctrl.formatDataFunc( responseJson );

					} else {

						plot.data = responseJson;

					}

					plot.layout = Object.assign({}, ctrl.layout);

					plot.plotFunc = ctrl.plotFunc;

					plot.layout.title = title;

					plot.data.newData = true;

					return plot;

        		} );

        	plotPromises.push(plotPromise);

        }

	} else {

		ctrl.sliceIds.forEach( function( sliceId, sliceIndex ) {

			var slicePromisesPerPlot = [];

			var nTasks = ctrl.taskIds.length;

			if ( ctrl.maxTasks !== undefined ) Math.min( nTasks, ctrl.maxTasks );

			for ( var index = 0; index < nTasks; ++index ) {

                var url = ctrl.urlTemplate
                	.replace( "${taskId}", ctrl.taskIds[ index ] )
                	.replace( "${sliceId}", sliceId );

                var slicePromise = fetch(url)

        			.then(function( response ) {

        				return response.json();

        		});

        		slicePromisesPerPlot.push( slicePromise );

			}

			slicePromises.push( slicePromisesPerPlot );

			var plotPromise = Promise.all( slicePromises[ sliceIndex ] ).then( function (responseJson) {

				var plot = {};

        		if (ctrl.formatDataFunc !== undefined) {

					plot.data = ctrl.formatDataFunc( responseJson );

				} else {

					plot.data = responseJson;

				}

				plot.layout = Object.assign({}, ctrl.layout);

				plot.plotFunc = ctrl.plotFunc;

				plot.layout.title = sliceId;

				plot.data.newData = true;

				return plot;

			});

			plotPromises.push(plotPromise);

		});

	}

    return Promise.all(plotPromises);

}

export { makePlotsFromPlotRowCtrl };