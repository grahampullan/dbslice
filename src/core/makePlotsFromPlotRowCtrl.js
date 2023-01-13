import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3v7';

function makePlotsFromPlotRowCtrl( ctrl ) {

    const fetchDataDefaults = {};
    if ( ctrl.csv !== undefined ) fetchDataDefaults.csv = ctrl.csv;
    if ( ctrl.text !== undefined ) fetchDataDefaults.text = ctrl.text;
    if ( ctrl.buffer !== undefined ) fetchDataDefaults.buffer = ctrl.buffer;
    if ( ctrl.dataFilterFunc !== undefined ) fetchDataDefaults.dataFilterFunc = ctrl.dataFilterFunc;
    if ( ctrl.formatDataFunc !== undefined ) fetchDataDefaults.formatDataFunc = ctrl.formatDataFunc;
    if ( ctrl.dataFilterType !== undefined ) fetchDataDefaults.dataFilterType = ctrl.dataFilterType;
    if ( ctrl.dataFilterConfig !== undefined ) fetchDataDefaults.dataFilterConfig = ctrl.dataFilterConfig;
    if ( ctrl.tasksByFilter !== undefined ) fetchDataDefaults.tasksByFilter = ctrl.tasksByFilter;

    const plots = [];

	if ( ctrl.sliceIds === undefined && ctrl.groupBy === undefined ) {

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

                plot.fetchData = Object.assign( {}, fetchDataDefaults);
                plot.fetchData.url = url;

            }

            plots.push(plot);

        }

    } 
    
    if ( ctrl.sliceIds !== undefined) {

        // generate one plot per slice 

    	ctrl.sliceIds.forEach( function( sliceId, sliceIndex ) {

            let urlTemplate = ctrl.urlTemplate.replace( "${sliceId}", sliceId );

            let plot = {};
            plot.plotFunc = ctrl.plotFunc;
            plot.plotType = ctrl.plotType;
            plot.layout = Object.assign( {}, ctrl.layout );
            plot.layout.title = sliceId;
            plot.layout.newData = true;

            if ( urlTemplate !== undefined ) {

                plot.fetchData = Object.assign( {}, fetchDataDefaults);
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

            if ( ctrl.urlTemplate !== undefined ) {

                plot.fetchData = Object.assign( {}, fetchDataDefaults);
                plot.fetchData.urlTemplate = ctrl.urlTemplate;                

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