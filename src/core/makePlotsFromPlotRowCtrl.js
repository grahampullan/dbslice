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

       		var plotPromise = makePromiseTaskPlot( ctrl, url, title, ctrl.taskIds[ index ] ); 

        	plotPromises.push( plotPromise );

        }

    } else {

    	ctrl.sliceIds.forEach( function( sliceId, sliceIndex ) {

    		var plotPromise = makePromiseSlicePlot ( ctrl, sliceId );

    		plotPromises.push( plotPromise );

    	});
    }

	return Promise.all(plotPromises);

}


function makePromiseTaskPlot( ctrl, url, title, taskId ) { 

	return fetch(url)

	.then(function( response ) {

        if ( ctrl.csv === undefined ) {

            return response.json();

        }

        if ( ctrl.csv == true ) {

            return response.text() ;

        }

    })

    .then(function( responseJson ) {

        if ( ctrl.csv == true ) {

            responseJson = d3.csvParse( responseJson );

        }

    	var plot = {};

    	if (ctrl.formatDataFunc !== undefined) {

    		plot.data = ctrl.formatDataFunc( responseJson, taskId ); 

    	} else {

    		plot.data = responseJson;

        }

        plot.layout = Object.assign( {}, ctrl.layout );

        plot.plotFunc = ctrl.plotFunc;

        plot.layout.title = title;

        plot.data.newData = true;

        return plot;

    } );

}

function makePromiseSlicePlot( ctrl, sliceId ) {

	var slicePromisesPerPlot = [];
    var tasksOnPlot = [];

	var nTasks = ctrl.taskIds.length;

	if ( ctrl.maxTasks !== undefined ) Math.min( nTasks, ctrl.maxTasks );

	for ( var index = 0; index < nTasks; ++index ) {

        tasksOnPlot.push( ctrl.taskIds[index] );

		var url = ctrl.urlTemplate
			.replace( "${taskId}", ctrl.taskIds[ index ] )
			.replace( "${sliceId}", sliceId );

            //console.log(url);

			var slicePromise = fetch(url).then( function( response ) {

				if ( ctrl.csv === undefined ) {

                    return response.json();

                }

                if ( ctrl.csv == true ) {

                    return response.text() ;

                }

			});

		slicePromisesPerPlot.push( slicePromise );

	}

    // slicePromises.push( slicePromisesPerPlot );

    return Promise.all( slicePromisesPerPlot ).then( function ( responseJson ) {

        if ( ctrl.csv == true ) {

            var responseCsv = [];

            responseJson.forEach( function(d) {

                responseCsv.push( d3.csvParse(d) );

            });

            responseJson = responseCsv;

        }

    	var plot = {};

    	if (ctrl.formatDataFunc !== undefined) {

    		plot.data = ctrl.formatDataFunc( responseJson, tasksOnPlot );

    	} else {

    		plot.data = responseJson;

    	}

    	plot.layout = Object.assign({}, ctrl.layout);

    	plot.plotFunc = ctrl.plotFunc;

    	plot.layout.title = sliceId;

    	plot.data.newData = true;

    	return plot;

    });

}

export { makePlotsFromPlotRowCtrl };