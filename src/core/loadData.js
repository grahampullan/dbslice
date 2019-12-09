import { render } from '../core/render.js';
import { cfInit } from '../core/cfInit.js';
import { dbsliceData } from '../core/dbsliceData.js';

function loadData(filename){
		
		d3.json(filename, function(metadata){
			// The metadata has loaded. Add it to the already existing data.
			// data.push(metadata);
			
			// How do I join arrays?
			
			// Dummy functionality - for now replace the data.
			// This relies on the new data having the same variables!!
			dbsliceData.data = cfInit(metadata);
			
			// Reinitialise! - Cannot!
			render(dbsliceData.elementId, dbsliceData.session);
			
			// Update number of tasks in header.
			
		})
		
		
} // loadData

export { loadData };