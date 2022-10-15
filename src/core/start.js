import { update } from './update.js';
import { cfInit } from './cfInit.js';
import { dbsliceData } from './dbsliceData.js';
import { makeSessionHeader } from './makeSessionHeader.js';
import * as d3 from 'd3v7';

// Import the modal.
import addPlotModal from './addPlotModal.js';



async function start( elementId, session ) {

    if ( typeof(session) == 'string' ) {
        let sessionUrl = session;
        let response = await fetch(sessionUrl);
        session = await response.json();
    }

    if ( typeof(session.metaData) == 'string') {

        let metaDataUrl = session.metaData;
        if ( session.metaDataCsv == undefined ) {
            let response = await fetch(metaDataUrl);
            session.metaData = await response.json();
        }

        if ( session.metaDataCsv == true ) {
            let metaData = await d3.csv( metaDataUrl, d3.autoType );
            if ( session.metaDataFilter == true ) {
                metaData = metaData.filter( d => d[session.metaDataFilterKey] == session.metaDataFilterValue);
                const metaDataProperties = [];
                const dataProperties = [];
                Object.entries(metaData[0]).forEach(entry => {
                    if (typeof(entry[1])=="string") {
                        metaDataProperties.push(entry[0]);
                    }
                    if (typeof(entry[1])=="number") {
                        dataProperties.push(entry[0]);
                    }
                });
                session.metaData = { data: metaData, header: {metaDataProperties, dataProperties} };
            }
        }
    }
	
	
	

    session.cfData = cfInit( session.metaData );

    let element = d3.select( "#" + elementId );
	let sessionHeader = element.select(".sessionHeader");
    if ( sessionHeader.empty() ) makeSessionHeader( element, session.title, session.subtitle, session.config );

    session._maxPlotRowId = 0;
    session.plotRows.forEach( (plotRow) => {
        ++session._maxPlotRowId;
        plotRow._id = session._maxPlotRowId;
        plotRow._maxPlotId = 0;
        plotRow.plots.forEach( (plot) => {
            ++plotRow._maxPlotId;
            plot._id = plotRow._maxPlotId;
        } );
    } );


    session.windowResize = false;

    dbsliceData.session = session;
	dbsliceData.elementId = elementId;
	
	
	
	
	var modalConfig = {
					
		plotType: ["select", "plotType", ["cfD3BarChart", "cfD3Scatter", "cfD3Histogram"]],
		
		data: {
			cfD3BarChart: [
				["select", "property", session.metaData.header.metaDataProperties]
			],
			
			cfD3Histogram: [
				["select", "property", session.metaData.header.dataProperties]
			],
			
			cfD3Scatter: [
				["select", "xProperty", session.metaData.header.dataProperties],
				["select", "yProperty", session.metaData.header.dataProperties],
				["select", "cProperty", session.metaData.header.metaDataProperties]
			],
		},
		
		layout: [
			["text", "title", ""],
			["number", "colWidth", [1,12], 3],
			["number", "height", [100, 600], 300],
			["checkbox", "highlightTasks", "", true]
		]
		
	} // modalConfig
	
	// Add the modal in. Modal needs to wait for data.
	let modal = new addPlotModal( modalConfig );
	document.getElementById( elementId ).appendChild( modal.node );
	dbsliceData.modal = modal;
	
	modal.onsubmit = function(){
		update( dbsliceData.elementId , dbsliceData.session );
	}
	
    function resizeEnd(func){
        var timer;
        return function(event){
          if(timer) clearTimeout(timer);
          timer = setTimeout(func,100,event);
        };
    }


	window.onresize = resizeEnd( function() {
        dbsliceData.session.windowResize = true;
        update();
        dbsliceData.session.windowResize = false;
    });

    update();

}

export { start };