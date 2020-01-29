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
			
			
			// Change any backslashes with forward slashes
			metadata.data.forEach(function(d){
				loadData.helpers.replaceSlashes(d, "taskId");
			}) // forEach
			
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
			var contourProperties = [];
			
			for(var i=0; i<headerNames.length;i++){
				
				// Look for a designator. This is either "o_" or "c_" prefix.
				var variable    = headerNames[i];
				var prefix      = variable.split("_")[0];
				var variableNew = variable.split("_").slice(1).join(" ");
				
				
				switch(prefix){
					case "o":
						// Ordinal variables.
						dataProperties.push( variableNew )
						
						loadData.helpers.renameVariables(metadata, variable, variableNew)
						break;
					case "c":
						// Categorical variables
						metadataProperties.push( variableNew )
						
						loadData.helpers.renameVariables(metadata, variable, variableNew)
						break;
					case "s":
						// Slices
						sliceProperties.push(variableNew);
						
						loadData.helpers.renameVariables(metadata, variable, variableNew)
						break;
						
					case "c2d":
						// Contours
						contourProperties.push(variableNew);
						
						loadData.helpers.renameVariables(metadata, variable, variableNew)
					  
					  break;
						
					case "taskId":
						// This is a special case, as it is advantageous that any '\' in the value of taskId be changed into '/'. It is intended that the taskId is the url to the location ofthe data, thus this can prove important.						
						metadata.forEach(function(d){
							loadData.helpers.replaceSlashes(d, "taskId");
						}) // forEach
						
					  break;
						
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
						 sliceProperties :    sliceProperties,
					   contourProperties :  contourProperties,
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
		}, // convertNumbers
						
		replaceSlashes: function replaceSlashes(d, variable){
			
			var variable_ = d[variable];
			d[variable] = variable_.replace(/\\/g, "/");
				
		} // replaceSlashes

	} // helpers
	
} // loadData

export { loadData };