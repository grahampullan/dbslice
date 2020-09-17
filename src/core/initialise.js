import { render } from './render.js';
import { dbsliceData } from './dbsliceData.js';
import { builder } from './builder.js';
import { cfDataManagement } from '../core/cfDataManagement.js';

function initialise(elementId, session, data) {
		
		
		let dataInitPromise = new Promise(function(resolve, reject){
		    // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
		  
		    // resolve and reject are in-built names. They allow the user to handle the following scenarios. Resolve allows the user to pass inputs onto the branch which is taken when the promise was resolved. Reject allows the same, but in case of a rejected promise, and allows error handling. Both of these scenarios happen in the '.then' functionality below.
		  
		    // Here the promise is used to wait until the execution of the data initialisation is completed before the app is drawn.
			
			
			// Initialise the crossfilter.
			cfDataManagement.cfInit( data );
			
			// Store the app configuration and anchor.
			dbsliceData.session = session;
			dbsliceData.elementId = elementId;
			

			// The state is ready.
			resolve("")
			
			
		}) // Promise 

		Promise.all([dataInitPromise])
		  .then(function(successInputs){
			
			// Draw the header.
			builder.makeSessionHeader()
		  
			// Draw the rest of the app.
			render()
			},
			function(error){
				// The reject hasn't been called, so this shouldn't run at all.
				console.log("I shouldn't have run, why did I?")
			})
		  
		  
		

	    
    } // initialise





export { initialise };