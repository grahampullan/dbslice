function makePlotsFromPlotRowCtrl( ctrl ) {

	var plots = [];

	if ( ctrl.sliceIds === undefined ) {

		var nTasks = ctrl.taskIds.length;

		if ( ctrl.maxTasks !== undefined ) nTasks = Math.min( nTasks, ctrl.maxTasks );

		for ( var index = 0; index < nTasks; ++index ) {

			var plot = {};

			plot.layout = Object.assign({}, ctrl.layout);

			if ( ctrl.urlTemplate == null ) {

				var url = ctrl.taskIds[ index ];

			} else {

				var url = ctrl.urlTemplate.replace( "${taskId}", ctrl.taskIds[ index ] );

			}
		 
			var rawData;
	
			// force a synchronous json load
			$.ajax({
  				dataType: "json",
  				url: url,
  				async: false,
  				success: function(data){rawData = data}
			});
				
			if (ctrl.formatDataFunc !== undefined) {

				plot.data = ctrl.formatDataFunc( rawData );

			} else {

				plot.data = rawData;

			}

			plot.plotFunc = ctrl.plotFunc;

			plot.layout.title = ctrl.taskLabels[index];

			plot.newData=true;

			plots.push(plot);

		}

	} else {

		ctrl.sliceIds.forEach( function( sliceId, index ) {

			var plot = {};

			plot.layout = Object.assign({}, ctrl.layout);

			var rawData = [];

			var nTasks = ctrl.taskIds.length;

			if ( ctrl.maxTasks !== undefined ) Math.min( nTasks, ctrl.maxTasks );

			for ( var index = 0; index < nTasks; ++index ) {

                var url = ctrl.urlTemplate
                	.replace( "${taskId}", ctrl.taskIds[ index ] )
                	.replace( "${sliceId}", sliceId );

                // force a synchronous json load
				$.ajax({
  					dataType: "json",
  					url: url,
  					async: false,
  					success: function(data){ rawData.push(data) }
				});

			}

			if (ctrl.formatDataFunc !== undefined) {

				plot.data = ctrl.formatDataFunc( rawData );

			} else {

				plot.data = rawData;

			}

			plot.plotFunc = ctrl.plotFunc;

			plot.layout.title = sliceId;

			plot.newData=true;

			plots.push(plot);

		}); 

	}

    return plots;

}

export { makePlotsFromPlotRowCtrl };