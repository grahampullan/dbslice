import { dbsliceData } from './dbsliceData.js';

function getFilteredTaskLabels() {

	return dbsliceData.session.filteredTaskLabels;

}

export { getFilteredTaskLabels };
