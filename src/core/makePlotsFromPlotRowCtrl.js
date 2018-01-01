function makePlotsFromPlotRowCtrl( ctrl ) {

	var plots = [];

	if ( ctrl.sliceIds === undefined ) {

		ctrl.taskIds.forEach( function( taskId, index ) {

			var plot = {};

			plot.layout = Object.assign({}, ctrl.layout);

			if ( ctrl.urlTemplate == null ) {

				var url = taskId;

			} else {

				var url = ctrl.urlTemplate.replace( "${taskId}", taskId );

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

		});

	} else {

		ctrl.sliceIds.forEach( function( sliceId, index ) {

			var plot = {};

			plot.layout = Object.assign({}, ctrl.layout);

			var rawData = [];

			ctrl.taskIds.forEach (function (taskId) {

                var url = ctrl.urlTemplate
                	.replace( "${taskId}", taskId )
                	.replace( "${sliceId}", sliceId );

                // force a synchronous json load
				$.ajax({
  					dataType: "json",
  					url: url,
  					async: false,
  					success: function(data){ rawData.push(data) }
				});

			});

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