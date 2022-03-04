import { update } from './update.js';
import { cfInit } from './cfInit.js';
import { dbsliceData } from './dbsliceData.js';
import { makeSessionHeader } from './makeSessionHeader.js';
import * as d3 from 'd3';

async function start( elementId, session ) {

    if ( typeof(session) == 'string' ) {
        console.log("session is a string");
        let sessionUrl = session;
        let response = await fetch(sessionUrl);
        session = await response.json();
    }

    if ( typeof(session.metaData) == 'string') {
        console.log("metaData is a string");
        let metaDataUrl = session.metaData;
        let response = await fetch(metaDataUrl);
        session.metaData = await response.json();
    }

    session.cfData = cfInit( session.metaData );

    let element = d3.select( "#" + elementId );
	let sessionHeader = element.select(".sessionHeader");
    if ( sessionHeader.empty() ) makeSessionHeader( element, session.title, session.subtitle, session.config );

    dbsliceData.session = session;
	dbsliceData.elementId = elementId;

    update( dbsliceData.elementId , dbsliceData.session );

}

export { start };