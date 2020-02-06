import { render } from './render.js';
import { dbsliceData } from './dbsliceData.js';
import { makeSessionHeader } from './makeSessionHeader.js';
import { cfDataManagement } from '../core/cfDataManagement.js';

function initialise(elementId, session, data) {
        var config = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {plotTasksButton: false};
      
      
        dbsliceData.data = cfDataManagement.cfInit( data );
        dbsliceData.session = session;
        dbsliceData.elementId = elementId;
        dbsliceData.config = config;
      
        var element = d3.select("#" + elementId);
      
        var sessionHeader = element.select(".sessionHeader");
        if (sessionHeader.empty()) {
            makeSessionHeader(element, session.title, session.subtitle, config);
        } // if
      
        render(elementId, session);
    } // initialise



export { initialise };