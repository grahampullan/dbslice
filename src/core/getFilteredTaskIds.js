import { dbsliceData } from './dbsliceData.js';

function getFilteredTaskIds() {

	return dbsliceData.session.filteredTaskIds;

}

export { getFilteredTaskIds };

