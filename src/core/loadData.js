import { render } from '../core/render.js';
import { cfInit } from '../core/cfInit.js';
import { dbsliceData } from '../core/dbsliceData.js';

const loadData = {
		
	handler: function handler(file){
		
		
		
		// Split the name by the '.', then select the last part.
		var extension = file.name.split(".").pop();
		
		switch(extension){
			
			case "csv":
				loadData.csv(file.name);
				break;
			case "json":
				loadData.json(file.name);
				break;
				
			default:
				window.alert("Selected file must be either .csv or .json")
				break;
		}; // switch
	}, // handler

	json: function json(filename){
	
		d3.json(filename, function(metadata){
			// The metadata has loaded. Add it to the already existing data.
			// How do I join arrays?
			
			
			// Dummy functionality - for now replace the data.
			dbsliceData.data = cfInit(metadata);
			
			render(dbsliceData.elementId, dbsliceData.session);
			
		})
	
	}, // json
	
	csv: function csv(filename){
	
		d3.csv(filename, loadData.helpers.convertNumbers, function(metadata){
			// Change this into the appropriate internal data format.
			var headerNames = d3.keys(metadata[0])
			
			// Assemble dataProperties, and metadataProperties.
			var dataProperties = [];
			var metadataProperties = [];
			var sliceProperties = [];
			
			for(var i=0; i<headerNames.length;i++){
				
				// Look for a designator. This is either "o_" or "c_" prefix.
				var variable    = headerNames[i];
				var variableNew = "";
				var prefix = variable.slice(0,2);
				
				switch(prefix){
					case "o_":
						// Ordinal variables.
						variableNew = variable.slice(2);
						dataProperties.push( variableNew )
						
						loadData.helpers.renameVariables(metadata, variable, variableNew)
						break;
					case "c_":
						// Categorical variables
						variableNew = variable.slice(2);
						metadataProperties.push( variableNew )
						
						loadData.helpers.renameVariables(metadata, variable, variableNew)
						break;
					case "s_":
						// Slices the text into available slices. These must be separated by , and single space!
						
						metadata.map(function(item){ 
							item[variable] = item[variable].split(', ');
							return item;
						});
						
						variableNew = variable.slice(2);
						sliceProperties.push(variableNew);
						
						loadData.helpers.renameVariables(metadata, variable, variableNew)
					default:
						
						break;
				
				}; // switch
				
			}; // for
			
			
			
			// Combine in an overall object.
			var d = {
				 data : metadata,
				 header: {
						  dataProperties :     dataProperties,
					  metaDataProperties : metadataProperties,
						 sliceProperties :    sliceProperties
				 }
			};
			
			// Store internally
			dbsliceData.data = cfInit(d);
			
			render(dbsliceData.elementId, dbsliceData.session);
			
		}) // d3.csv
	}, // csv
	
	helpers: {
		
		renameVariables: function renameVariables(data, oldVar, newVar){
			
							for(var j=0; j<data.length; j++){
								// Have to change the names individually.
								data[j][newVar] = data[j][oldVar];
								delete data[j][oldVar];
							}; // for
						}, // renameVariable
						
		convertNumbers: function convertNumbers(row) {
						  var r = {};
						  for (var k in row) {
							r[k] = +row[k];
							if (isNaN(r[k])) {
							  r[k] = row[k];
							}
						  }
						  return r;
						} // convertNumbers

	} // helpers
	
} // loadData

export { loadData };