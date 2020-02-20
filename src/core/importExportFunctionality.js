import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfDataManagement } from '../core/cfDataManagement.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';

const importExportFunctionality = {
		// This object controls all the behaviour exhibited when loading in data or session layouts, as well as all behaviour when saving the layout.
		
		// The loading of sessions and data must be available separately, and loading the session should include an option to load in a predefined dataset too.
		
		// It is possible that the session configuration and data will have incompatible variable names. In these cases the user should resolve the incompatibility, but the incompatibility should be presented to them!
		
		// Saving the session is done by downloading a created object. Therefore a session object should be written everytime the view is refreshed.
		
		// The views depending on "Plot Selected Tasks" to be pressed should be loaded in merely as configs in their plotrows, and the corresponding filtering values need to be loaded into their corresponding plots.
		
		
		importData : {
			// WIP: This has to be able to load in data from anywhere on the client computer, not just the server root.
			
			// WIP: It must be able to load in additional data. The user must be prompted to identify variables that are different in loaded, and to be loaded data.
			
			// DONE: It must be able to load both csv and json fle formats.
			
			// DONE/WIP: Must prompt the user if the variables don't include those in existing plots. Solution: does not prompt the user, but for now just removed any incompatible plots. The prompt for the user to resolve the incompatibility is the next step.
			
			load : function load(file, dataAction){
				
				// Create convenient handles.
				var ld = importExportFunctionality.importData
				
				
				// Split the name by the '.', then select the last part.
				var extension = file.name.split(".").pop();
				
				// Create a url link to allow files to be loaded fromanywhere on the local machine.
				var url = window.URL.createObjectURL(file)
				
				
				// Determine if the input adds new data, or if it replaces the data.
				switch(dataAction){
					case "add":
						var actionOnInternalStorage = cfDataManagement.cfAdd
					  break
					  
					case "replace":
						var actionOnInternalStorage = cfDataManagement.cfInit
					  break
					  
					default:
						var actionOnInternalStorage = cfDataManagement.cfInit
					  break
					
				} // switch
				
				
				
				switch(extension){
					
					case "csv":
						d3.csv(url, ld.helpers.convertNumbers, function(metadata){
							// Add the filename to the data.
							metadata.forEach(function(d){d.file = file.name})
							ld.csv(metadata, actionOnInternalStorage);
							
						}) // d3.csv
						break;
						
					case "json":
						d3.json(url, function(metadata){
							metadata.data.forEach(function(d){d.file = file.name})
							ld.json(metadata, actionOnInternalStorage);
							
						}) // d3.json
						break;
						
					default:
						window.alert("Selected file must be either .csv or .json")
						break;
				}; // switch
				
				
				
			}, // load
			
			
			
			csv: function csv(metadata, actionOnInternalStorage){
				// Process the metadata read in the csv format.
				var d = importExportFunctionality.importData.helpers.csv2json(metadata)
				
				// Perform the requested internal storage assignment.
				actionOnInternalStorage(d);
				// cfDataManagement.cfInit(d)
							
				render(dbsliceData.elementId, dbsliceData.session);
					
				
			}, // csv
			
			json : function json(metadata, actionOnInternalStorage){
				
				
				// Change any backslashes with forward slashes
				metadata.data.forEach(function(d){
					importExportFunctionality.importData.helpers.replaceSlashes(d, "taskId");
				}) // forEach
				
				// Initialise the crossfilter
				actionOnInternalStorage(metadata)
				// cfDataManagement.cfInit(metadata)
				
				
				render(dbsliceData.elementId, dbsliceData.session);
				
				
                
				
			}, // json
			
			helpers: {
				
				loadDataAndEvaluate: function loadDataAndEvaluate(){
					
					
					
				}, // loadDataAndEvaluate
				
				renameVariables: function renameVariables(data, oldVar, newVar){
						// This function renames the variable of a dataset.
						for(var j=0; j<data.length; j++){
							// Have to change the names individually.
							data[j][newVar] = data[j][oldVar];
							delete data[j][oldVar];
						}; // for
				}, // renameVariable
								
				convertNumbers: function convertNumbers(row) {
						// Convert the values from strings to numbers.
						var r = {};
						for (var k in row) {
							r[k] = +row[k];
							if (isNaN(r[k])) {
								r[k] = row[k];
							} // if
						} // for
					  return r;
				}, // convertNumbers
								
				replaceSlashes: function replaceSlashes(d, variable){
						// Replace all the slashes in the variable for ease of handling in the rest of the code.
						var variable_ = d[variable];
						d[variable] = variable_.replace(/\\/g, "/");
						
				}, // replaceSlashes
				
				csv2json: function csv2json(metadata){
					
					// Create a short handle to the helpers
					var h = importExportFunctionality.importData.helpers
					
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
								
								h.renameVariables(metadata, variable, variableNew)
								break;
							case "c":
								// Categorical variables
								metadataProperties.push( variableNew )
								
								h.renameVariables(metadata, variable, variableNew)
								break;
							case "s":
								// Slices
								sliceProperties.push(variableNew);
								
								h.renameVariables(metadata, variable, variableNew)
								break;
								
							case "c2d":
								// Contours
								contourProperties.push(variableNew);
								
								h.renameVariables(metadata, variable, variableNew)
							  
							  break;
								
							case "taskId":
								// This is a special case, as it is advantageous that any '\' in the value of taskId be changed into '/'. It is intended that the taskId is the url to the location ofthe data, thus this can prove important.						
								metadata.forEach(function(d){
									h.replaceSlashes(d, "taskId");
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
					
				  return d
				} // csv2json
				
			} // helpers
			
		}, // loadData
		
		
		loadSession : {
			// WIP: Must be able to load a session file from anywhere.
			
			// DONE: Must load in metadata plots

			// WIP: Must be able to load in data automatically. If the data is already loaded the loading of additional data must be ignored. Or the user should be asked if they want to add it on top.
			
			// WIP: Must be able to load without data.
			
			// DONE: Must only load json files.
			
			// WIP: Must prompt the user if the variables don't include those in loaded data.
			
			handler: function handler(file){
            
				var ls = importExportFunctionality.loadSession
			
				// Split the name by the '.', then select the last part.
				var extension = file.name.split(".").pop();
				
				// Create a url link to allow files to be loaded fromanywhere on the local machine.
				var url = window.URL.createObjectURL(file)
				
				
				
				switch(extension){
					
					case "json":
						d3.json(url, function(sessionData){
							ls.json(sessionData);
						}) // d3.json
						break;
						
					default:
						window.alert("Selected file must be either .csv or .json")
						break;
				}; // switch
				
				
			}, // handler
			
			json: function json(sessionData){
				
				
				var h = importExportFunctionality.loadSession.helpers
				
				// Check if it is a session file!
				if (sessionData.isSessionObject === "true"){
					
					// To simplify handling updating the existing plot rows, they are simply deleted here as the new session is loaded in. NOT THE MOST ELEGANT, OR NICE TO SEE IN ACTION, BUT IT GETS THE JOB DONE.
					// This is done here in case a file that is not a json is selected.
					d3.selectAll(".plotRow").remove();
					
					
					var plotRows = h.assemblePlotRows(sessionData.plotRows);
					
					// Finalise the session object.
					var session = {
						title : sessionData.title,
						plotRows: plotRows
					};
					
					// Store into internal object
					dbsliceData.session = session;
					
					// Render!
					render(dbsliceData.elementId, dbsliceData.session)
					
				} else {
					window.alert("Selected file is not a valid session object.")
				}; // if
					
				
			}, // json
			
			helpers: {
            
				string2function: function string2function(string){
					
					var func;
					switch(string){
						case "cfD3BarChart":
							func = cfD3BarChart;
							break;
						case "cfD3Histogram":
							func = cfD3Histogram;
							break;
						case "cfD3Scatter":
							func = cfD3Scatter;
							break;
						default :
							func = undefined;
							break;
					}; // switch
					return func;
					
				}, // string2function
				
				assemblePlots: function assemblePlots(plotsData){
					
					var h = importExportFunctionality.loadSession.helpers
					
					// Assemble the plots.
					var plots = [];
					for(var j=0;j<plotsData.length;j++){
						
						var plotToPush = {
						  plotFunc : h.string2function( plotsData[j].type ),
						  layout : { title : plotsData[j].title, 
								  colWidth : 4, 
									height : 300 }, 
						  data : {  cfData : dbsliceData.data, 
								 xProperty : plotsData[j].xProperty, 
								 yProperty : plotsData[j].yProperty, 
								 cProperty : plotsData[j].cProperty}
						};
						plots.push(plotToPush);
						
					}; // for
					
					return plots;
					
				}, // assemblePlots
				
				assemblePlotRows: function assemblePlotRows(plotRowsData){
					
					var h = importExportFunctionality.loadSession.helpers
					
					// Loop over all the plotRows.
					var plotRows = [];
					for(var i=0;i<plotRowsData.length;i++){
						
						var plotRowToPush = {title: plotRowsData[i].title, 
											 plots: h.assemblePlots(plotRowsData[i].plots), 
											  type: plotRowsData[i].type,
									addPlotButton : true    }
						plotRows.push(plotRowToPush);
					}; // for
					
					return plotRows;
					
				} // assemblePlotRows
				
			} // helpers
			
		}, // loadSession
		
		
		saveSession : {
			
			json: function json() {
				// This function should write a session file.
				// It should write which data is used, plotRows, and plots.
				// Should it also write the filter selections made?

				var sessionJson = '';
				write('{"isSessionObject": "true", ');
				write(' "title": "' + dbsliceData.session.title + '", ');
				write(' "plotRows": [');

				var metadataPlotRows = dbsliceData.session.plotRows.filter(function (plotRow){ return plotRow.type == "metadata"; });

				metadataPlotRows.forEach(function (plotRow, i) {
					
					writePlotRow(plotRow);

					if (i < metadataPlotRows.length - 1) {
						write(', ');
					} // if

				}); // forEach

				write("]");
				write('}');

				function write(s) {
					sessionJson = sessionJson + s;
				} // write


				function writePlotRow(plotRow) {
					
					var s = "{";
					s = s + '"title": "' + plotRow.title + '", ';
					s = s + '"type": "' + plotRow.type + '", ';
					s = s + '"plots": [';
					
					plotRow.plots.forEach(function (plot, i) {
					  s = s + '{';
					  s = s + '"type": "' + plot.plotFunc.name + '", ';
					  s = s + '"title": "' + plot.layout.title + '", ';
					  s = s + '"xProperty": "' + plot.data.xProperty + '"';

					  if (plot.data.yProperty !== undefined) {
						s = s + ', ';
						s = s + '"yProperty": "' + plot.data.yProperty + '"';
					  } // if


					  s = s + '}';

					  if (i < plotRow.plots.length - 1) {
						s = s + ', ';
					  } // if

					}); // forEach

					s = s + ']';
					s = s + '}';
					sessionJson = sessionJson + s;
				} // writePlotRow


			  return sessionJson;
			} // json
			
		}, // saveSession
		
		helpers : {
			
			variableMatching : function variableMatching(){
				// Functionality that allows the user to resolve any issues between datasets with different names that hold th esame quantities.
			}, // variableMatching
			
			collectPlotProperties : function collectPlotProperties(){
				// Collect all the variables in the current plots (by type!), the variables in the current data, and return them.
				// If there is a variable in th eplot, but not in hthe new data it must either be given, or the plot needs to be removed.
				
		
				
				
				// First go through all the metadata plots and getthe variables. This is probably more conveniently done through the dbsliceData object.
				var metadataPlotRows = dbsliceData.session.plotRows.filter(function(plotRow){
					return plotRow.type == "metadata"
				}) // filter
				
				var plotProperties = []
				metadataPlotRows.forEach(function(metadataPlotRow){
					metadataPlotRow.plots.forEach(function(metadataPlot){
						
						plotProperties.push( metadataPlot.data.xProperty )
						if(metadataPlot.data.yProperty !== undefined){
							plotProperties.push( metadataPlot.data.yProperty )
						} // if
					}) // forEach
				}) // forEach
				
				
				// Remove any duplicates: 
				plotProperties = unique( plotProperties )

				
			  return plotProperties
				
				function unique(d){
				
					
					// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
					function onlyUnique(value, index, self) { 
						return self.indexOf(value) === index;
					} // unique
					
					return d.filter( onlyUnique )
				
				} // unique



				/*
				// CURRENTLY THE FLOW FIELD PLOTS DO NOT FEATURE SEPARATE PROPERTIES, THEREFORE IT's NOT REALLY POSSIBLE TO CAPTURE THIS FOR NOW.
				
				// Now go through the flow field plots and get the variables. These will either be plots with data from multiple plots on them (slice), or a single case (contour).
				var plotterPlotRows = dbsliceData.session.plotRows.filter(function(plotRow){
					return plotRow.type == "plotter"
				}) // filter
				
				var plotProperties = []
				plotterPlotRows.forEach(function(plotterPlotRow){
					
					plotterPlotRow.plots.forEach(function(plotterPlot){
						plotProperties.push( plotterPlot.d )
					}) // forEach
				}) // forEach
				*/
				
				// console.log(metadataPlotRow)
				// console.log(d)
				// console.log(dbsliceData)
				
			}, // collectPlotProperties
			

			onDataAndSessionChangeResolve : function onDataAndSessionChangeResolve(){
				// The data dominates what can be plotted. Perform a check between the session and data to see which properties are available, and if the plots want properties that are not in the data they are removed.
				
				// Resolve any issues between existing plots and data by removing any plots with variables that are not in the data.
				var plotProperties = importExportFunctionality.helpers.collectPlotProperties()
				
				
				// Find the variables that are on hte plots, but not in the data.
				var incompatibleProperties = plotProperties.filter(function(property){
					var isInMetadata = dbsliceData.data.metaDataProperties.includes(property)
					var isInData     = dbsliceData.data.dataProperties.includes(property)
				  return !(isInMetadata || isInData)
				}) // filter
				
				// Furthermore it is possible that the user has removed all data. In this case just remove all the plots, by specifying all plot properties as incompatible.
				if(dbsliceData.data !== undefined){
					if(dbsliceData.data.fileDim.top(Infinity).length < 1){
					incompatibleProperties = plotProperties
					} // if					
				} // if
				
				
				
				
				// Loop through all incompatible properties, and remove the plots that are not needed.
				dbsliceData.session.plotRows.forEach(function(plotRow){
					if(plotRow.type == "metadata"){
						var removeIndex = plotRow.plots.map(function(plot){
							// If the plot features an incompatible metadata or data property return true.	
							
						  return incompatibleProperties.includes( plot.data.xProperty ) ||
								 incompatibleProperties.includes( plot.data.yProperty )
							
						}) // map
						
						
						for(var i = removeIndex.length-1; i>=0; i--){
							// Negative loop facilitates the use of splice. Otherwise the indexes get messed up by splice as it reindexes the array upon removal.
							if(removeIndex[i]){
								plotRow.plots.splice(i,1)
							} // if
						} // for
						
					} // if
				}) // forEach
				
				
			} // onDataChangeResolve

			
			
			
		} // helpers
		
	} // importExportFunctionality

	

export { importExportFunctionality };