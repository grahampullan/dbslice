import { update } from './update.js';
import { dbsliceData } from './dbsliceData.js';
import { makeSessionHeader } from './makeSessionHeader.js';

function render(elementId, session) {
  var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
	plotTasksButton: false
  };
  dbsliceData.session = session;
  dbsliceData.elementId = elementId;
  dbsliceData.config = config;
  var element = d3.select("#" + elementId);
  var sessionHeader = element.select(".sessionHeader");
  if (sessionHeader.empty()){
	  makeSessionHeader(element, session.title, session.subtitle, config)
  };
  update(elementId, session);
}

export { render };