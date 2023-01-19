import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

function makePlotsFromPlotRowCtrl( ctrl ) {

    const plots = [];

	if ( ctrl.sliceIds === undefined && ctrl.groupBy === undefined ) {

        // generate one plot per task

		let nTasks = ctrl.taskIds.length;
		if ( ctrl.fetchData.maxTasks !== undefined ) nTasks = Math.min( nTasks, ctrl.fetchData.maxTasks );

		for ( let index = 0; index < nTasks; ++index ) {

            let url;

			if ( ctrl.fetchData.urlTemplate == null && ctrl.fetchData.useTaskIdAsUrl) {

				url = ctrl.taskIds[ index ];

			} else {

				url = ctrl.fetchData.urlTemplate.replace( "${taskId}", ctrl.taskIds[ index ] );

			}

            let plot = {};
            plot.plotFunc = ctrl.plotFunc;
            plot.plotType = ctrl.plotType;
            plot.layout = Object.assign( {}, ctrl.layout );
            plot.layout.title = ctrl.taskLabels[ index ]; 
            plot.layout.taskId = ctrl.taskIds[ index ];
            plot.layout.newData = true;

            if ( url !== undefined ) {

                plot.fetchData = Object.assign( {}, ctrl.fetchData );
                plot.fetchData.url = url;
                plot.fetchData.urlTemplate = undefined;

            }

            plots.push(plot);

        }

    } 
    
    if ( ctrl.sliceIds !== undefined) {

        // generate one plot per slice 

    	ctrl.sliceIds.forEach( function( sliceId, sliceIndex ) {

            let urlTemplate;

            if (ctrl.fetchData !== undefined ) {
                urlTemplate = ctrl.fetchData.urlTemplate.replace( "${sliceId}", sliceId );
            }

            let plot = {};
            plot.plotFunc = ctrl.plotFunc;
            plot.plotType = ctrl.plotType;
            plot.layout = Object.assign( {}, ctrl.layout );
            plot.layout.title = sliceId;
            plot.layout.newData = true;

            if ( urlTemplate !== undefined ) {

                plot.fetchData = Object.assign( {}, ctrl.fetchData );
                plot.fetchData.urlTemplate = urlTemplate;

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

    if ( ctrl.groupBy !== undefined ) {

        // generate one plot per group

        let cfData = dbsliceData.session.cfData
        let dimId = cfData.categoricalProperties.indexOf( ctrl.groupBy );
        let metaDataInFilter = cfData.categoricalDims[dimId].top( Infinity );
        let metaDataInFilterGrouped = d3.groups( metaDataInFilter, d => d[ctrl.groupBy]).sort( (a,b) => d3.ascending(a[0],b[0]) );
        let groups = metaDataInFilterGrouped.map( d => d[0] );

        groups.forEach( group => {

            let plot = {};

            plot.plotFunc = ctrl.plotFunc;
            plot.plotType = ctrl.plotType;
            plot.layout = Object.assign( {}, ctrl.layout );
            plot.layout.title = group;
            plot.layout.filterBy = {}; 
            plot.layout.filterBy[ctrl.groupBy] = group;
            plot.layout.newData = true;

            if ( ctrl.fetchData !== undefined ) {

                plot.fetchData = Object.assign( {}, ctrl.fetchData );           

            }

            if ( ctrl.data !== undefined ) {

                plot.data = Object.assign( {}, ctrl.data);

            }

            plots.push(plot);

        })

    }

	return plots;

}

export { makePlotsFromPlotRowCtrl };