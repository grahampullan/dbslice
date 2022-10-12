import { update } from './update.js';
import { cfInit } from './cfInit.js';
import { dbsliceData } from './dbsliceData.js';
import { makeSessionHeader } from './makeSessionHeader.js';
import * as d3 from 'd3v7';

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


    dbsliceData.session = session;
	dbsliceData.elementId = elementId;

    update( dbsliceData.elementId , dbsliceData.session );

}

export { start };