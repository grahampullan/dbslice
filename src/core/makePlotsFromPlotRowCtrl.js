function makePlotsFromPlotRowCtrl( ctrl ) {

    const plots = [];

	if ( ctrl.sliceIds === undefined ) {

        // generate one plot per task

		let nTasks = ctrl.taskIds.length;
		if ( ctrl.maxTasks !== undefined ) nTasks = Math.min( nTasks, ctrl.maxTasks );

		for ( let index = 0; index < nTasks; ++index ) {

            let url;

			if ( ctrl.urlTemplate == null && ctrl.useTaskIdAsUrl) {

				url = ctrl.taskIds[ index ];

			} else {

				url = ctrl.urlTemplate.replace( "${taskId}", ctrl.taskIds[ index ] );

			}

            let plot = {};
            plot.plotFunc = ctrl.plotFunc;
            plot.plotType = ctrl.plotType;
            plot.layout = Object.assign( {}, ctrl.layout );
            plot.layout.title = ctrl.taskLabels[ index ];
            plot.layout.taskId = ctrl.taskIds[ index ];
            plot.layout.newData = true;

            if ( url !== undefined ) {

                let fetchData = {};
                fetchData.url = url;
                if ( ctrl.csv !== undefined ) fetchData.csv = ctrl.csv;
                if ( ctrl.text !== undefined ) fetchData.text = ctrl.text;
                if ( ctrl.buffer !== undefined ) fetchData.buffer = ctrl.buffer;
                if ( ctrl.dataFilterFunc !== undefined ) fetchData.dataFilterFunc = ctrl.dataFilterFunc;
                if ( ctrl.formatDataFunc !== undefined ) fetchData.formatDataFunc = ctrl.formatDataFunc;
                if ( ctrl.dataFilterType !== undefined ) fetchData.dataFilterType = ctrl.dataFilterType;
                if ( ctrl.dataFilterConfig !== undefined ) fetchData.dataFilterConfig = ctrl.dataFilterConfig;
                plot.fetchData = fetchData;
            }

            plots.push(plot);

        }

    } else {

        // generate one plot per slice 

        let nTasks = ctrl.taskIds.length;
		if ( ctrl.maxTasks !== undefined ) nTasks = Math.min( nTasks, ctrl.maxTasks );

    	ctrl.sliceIds.forEach( function( sliceId, sliceIndex ) {

            let urlTemplate = ctrl.urlTemplate.replace( "${sliceId}", sliceId );

            let plot = {};
            plot.plotFunc = ctrl.plotFunc;
            plot.plotType = ctrl.plotType;
            plot.layout = Object.assign( {}, ctrl.layout );
            plot.layout.title = sliceId;
            plot.layout.newData = true;

            if ( urlTemplate !== undefined ) {

                let fetchData = {};
                fetchData.urlTemplate = urlTemplate;
                if ( ctrl.csv !== undefined ) fetchData.csv = ctrl.csv;
                if ( ctrl.text !== undefined ) fetchData.text = ctrl.text;
                if ( ctrl.buffer !== undefined ) fetchData.buffer = ctrl.buffer;
                if ( ctrl.dataFilterFunc !== undefined ) fetchData.dataFilterFunc = ctrl.dataFilterFunc;
                if ( ctrl.formatDataFunc !== undefined ) fetchData.formatDataFunc = ctrl.formatDataFunc;
                if ( ctrl.dataFilterType !== undefined ) fetchData.dataFilterType = ctrl.dataFilterType;
                if ( ctrl.dataFilterConfig !== undefined ) fetchData.dataFilterConfig = ctrl.dataFilterConfig;
                if ( ctrl.tasksByFilter !== undefined ) fetchData.tasksByFilter = ctrl.tasksByFilter;
                plot.fetchData = fetchData;
            }

            if (ctrl.layout.xRange !== undefined) {
                if (ctrl.layout.xRange[1].length !== undefined) {
                    plot.layout.xRange = ctrl.layout.xRange[sliceIndex];
                }
            }
    
            if (ctrl.layout.yRange !== undefined) {
                if (ctrl.layout.yRange[1].length !== undefined) {    
                    plot.layout.yRange = ctrl.layout.yRange[sliceIndex];    
                }    
            }
    
            if (ctrl.layout.xAxisLabel !== undefined) {    
                if ( Array.isArray(ctrl.layout.xAxisLabel) ) {    
                    plot.layout.xAxisLabel = ctrl.layout.xAxisLabel[sliceIndex];    
                }    
            }
    
            if (ctrl.layout.yAxisLabel !== undefined) {    
                if ( Array.isArray(ctrl.layout.yAxisLabel) ) {    
                    plot.layout.yAxisLabel = ctrl.layout.yAxisLabel[sliceIndex];    
                }    
            }
    
            if (ctrl.layout.title !== undefined) {    
                if ( Array.isArray(ctrl.layout.title) ) {    
                    plot.layout.title = ctrl.layout.title[sliceIndex];    
                }    
            }

            plots.push(plot);

    	});
    }

	return plots;

}

export { makePlotsFromPlotRowCtrl };