import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfDataManagement } from '../core/cfDataManagement.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';
import { cfD3Line } from '../plot/cfD3Line.js';

var importExportFunctionality = {
		// This object controls all the behaviour exhibited when loading in data or session layouts, as well as all behaviour when saving the layout.
		
		// The loading of sessions and data must be available separately, and loading the session should include an option to load in a predefined dataset too.
		
		// It is possible that the session configuration and data will have incompatible variable names. In these cases the user should resolve the incompatibility, but the incompatibility should be presented to them!
		
		// Saving the session is done by downloading a created object. Therefore a session object should be written everytime the view is refreshed.
		
		// The views depending on "Plot Selected Tasks" to be pressed should be loaded in merely as configs in their plotrows, and the corresponding filtering values need to be loaded into their corresponding plots.
		
		
		importing : {
			// WIP: This has to be able to load in data from anywhere on the client computer, not just the server root.
			
			// WIP: It must be able to load in additional data. The user must be prompted to identify variables that are different in loaded, and to be loaded data.
			
			// DONE: It must be able to load both csv and json fle formats.
			
			// DONE/WIP: Must prompt the user if the variables don't include those in existing plots. Solution: does not prompt the user, but for now just removed any incompatible plots. The prompt for the user to resolve the incompatibility is the next step.
			
			metadata : function metadata(file, dataAction){
				
				// Create convenient handles.
				var ld = importExportFunctionality.importing
				
				
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
				
				
				// Handle the case based on the file type.
				switch(extension){
					
					case "csv":
						d3.csv(url).then(function(metadata){
							
							// All the numbers are read in as strings - convert them to strings straight away.
							data = []
							metadata.forEach(function(d){
								data.push( ld.helpers.convertNumbers(d) )
							})
					
									
							// Add the source file to tha data
							data.forEach(function(d){
								d.file = file.name
							})
							
							
							// Process the metadata read in the csv format.
							var d = importExportFunctionality.importing.helpers.csv2json(data)
							
							// Perform the requested internal storage assignment.
							actionOnInternalStorage(d);
							
										
							render();
							
						}) // d3.csv
						break;
						
					case "json":
						d3.json(url, function(metadata){
							
							// Add the source file to tha data
							metadata.data.forEach(function(d){d.file = file.name})
							
							
							// Change any backslashes with forward slashes
							metadata.data.forEach(function(d){
								importExportFunctionality.importing.helpers.replaceSlashes(d, "taskId");
							}) // forEach
							
							// Store the data appropriately
							actionOnInternalStorage(metadata)
							
							render();
							
						}) // d3.json
						break;
						
					default:
						window.alert("Selected file must be either .csv or .json")
						break;
				}; // switch
				
				
				
			}, // metadata
			
			session : function session(file){
				// WIP: Must be able to load a session file from anywhere.
				
				// DONE: Must load in metadata plots

				// WIP: Must be able to load in data automatically. If the data is already loaded the loading of additional data must be ignored. Or the user should be asked if they want to add it on top.
				
				// WIP: Must be able to load without data.
				
				// DONE: Must only load json files.
				
				// WIP: Must prompt the user if the variables don't include those in loaded data.

				var h = importExportFunctionality.importing.helpers
			
				// Split the name by the '.', then select the last part.
				var extension = file.name.split(".").pop();
				
				// Create a url link to allow files to be loaded fromanywhere on the local machine.
				var url = window.URL.createObjectURL(file)
				
				
				
				switch(extension){
					
					case "json":
						d3.json(url).then(function(sessionData){
							h.assembleSession(sessionData);
						}) // d3.json
						break;
						
					default:
						window.alert("Selected file must be .json")
						break;
				}; // switch
				
			}, // session
		
		    line: {
				
				createFilePromise: function(file){
					
					var i = importExportFunctionality.importing.helpers
					
					// The extension must be either json or csv
					var extension = file.url.split(".").pop()
					
					switch(extension){
						case "json":
						
						   file.promise = d3.json(file.url).then(function(data){
								file.data = i.json2line( data )
							}).catch(function(d){
								console.log("Loading of a file failed.")
							}) // d3.csv 
						
						  break;
						  
						  
						case "csv":
						
							file.promise = d3.csv(file.url).then(function(data){
								file.data = i.csv2line( data )
							}).catch(function(d){
								console.log("Loading of a file failed.")
							}) // d3.csv 
						
						  break;
						
					} // switch
					
					return file
					
				}, // createFilePromise
				
				
				
				
				
				
				
				// MOVE TO THE LIBRARY INSTEAD!!
				// But at the moment there is no special library. There is only the attribute in the dbsliceData object.
				getLineDataVals: function getLineDataVals(file, ctrl){
					// Make a distinction between accessing explicit and implicit data files.
					
					var f = helpers.findObjectByAttribute
					
					// Available properties after applying all the options.
					// Retrieve the properties
					var properties = file.data.properties
				
					// Apply all user selected options.	
					ctrl.view.options.forEach(function(option){
						properties = f( properties, option.name, [option.val], false)
					})
					
					var xProperties = f(properties,"varName",ctrl.view.xVarOption.val,true)
					var yProperties = f(properties,"varName",ctrl.view.yVarOption.val,true)
					
					
					// Assemble the names of the properties to plot.
					var plotData
					switch( file.data.type ){
						case "explicit":
							// The options in the ctrl cannot be associated with the actual variable names in the files. The same menu options may correspond to different file variables if the sub-part of the file selected changes.

						
							plotData = file.data.vals.map(function(d){
								return {x: d[xProperties.val], y: d[yProperties.val]}
							})
							break;
							
						case "implicit":
							// Handle the combination of ps/ss, and x/y.
							// NOTE THAT SS PS IS OPTIONAL! HANDLE THIS SEPARATELY AS WELL!!
							var xSS = f(xProperties,"side", ["ss"], true)
							var xPS = f(xProperties,"side", ["ps"], true)
							var ySS = f(yProperties,"side", ["ss"], true)
							var yPS = f(yProperties,"side", ["ps"], true)
						
							var ss = file.data.vals.map(function(d){
								return {x: d[xSS.val], y: d[ySS.val]}
							})
							var ps = file.data.vals.map(function(d){
								return {x: d[xPS.val], y: d[yPS.val]}
							})
							
							plotData = ss.concat(ps)
							
							break;
					
					} // switch
					
					plotData.task = file.task
					
					return plotData
				
				
					
					
				}, // getLineDataVals
				
				
				
			}, // line
		
			
			
			
			helpers: {
				
				// METADATA
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
					// FOR METADATA!!
					
					// Create a short handle to the helpers
					var h = importExportFunctionality.importing.helpers
					
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
				}, // csv2json
				
				// SESSION
				
				getPlottingFunction: function getPlottingFunction(string){
					// This only creates a function when there are somne properties for that function to use.
					var isDataAvailable = dbsliceData.data.dataProperties.length > 0
					var isMetadataAvailable = dbsliceData.data.metaDataProperties.length > 0
					var isSliceDataAvailable = dbsliceData.data.sliceProperties.length > 0
					
					var func;
					switch(string){
						case "cfD3BarChart":
							func = isMetadataAvailable? cfD3BarChart : undefined;
							break;
						case "cfD3Histogram":
							func = isDataAvailable? cfD3Histogram : undefined;
							break;
						case "cfD3Scatter":
							func = isDataAvailable? cfD3Scatter : undefined;
							break;
						case "cfD3Line":
							func = isSliceDataAvailable? cfD3Line : undefined;
							break;
							
						default :
							func = undefined;
							break;
					}; // switch
					return func;
					
				}, // getPlottingFunction
				
				assemblePlots: function assemblePlots(plotsData, plotRow){
					
					var h = importExportFunctionality.importing.helpers
					
					// Assemble the plots.
					var plots = [];
					plotsData.forEach(function(plotData){
						
						var f = h.getPlottingFunction(plotData.type)
						
						if(f != undefined){
						
							var plotToPush = f.helpers.createLoadedControl(plotData)
							
							// Position the new plot row in hte plot container.
							plotToPush = positioning.newPlot(plotRow, plotToPush)
						
							plotRow.plots.push(plotToPush);
							
						} else {
							// The plotData type is not valid
							window.alert(plotData.type + " is not a valid plot type.")
							
							
						} // if
						
						
					}); // forEach
					
					return plotRow;
					
				}, // assemblePlots
				
				assemblePlotRows: function assemblePlotRows(plotRowsData){
					
					var h = importExportFunctionality.importing.helpers
					
					// Loop over all the plotRows.
					var plotRows = [];
					plotRowsData.forEach(function(plotRowData){
						var plotRowToPush = {title: plotRowData.title, 
											 plots: [], 
											  type: plotRowData.type,
											  grid: {nx: 12, ny: undefined},
									 addPlotButton: true    }
									
						// Assemble hte plots 
						plotRowToPush = h.assemblePlots(plotRowData.plots, plotRowToPush)
									
						plotRows.push(plotRowToPush);
					})
					
					return plotRows;
					
				}, // assemblePlotRows
				
				assembleSession: function assembleSession(sessionData){
					
					var h = importExportFunctionality.importing.helpers
				
					// Check if it is a session file!
					if (sessionData.isSessionObject === "true"){
						
						// To simplify handling updating the existing plot rows, they are simply deleted here as the new session is loaded in. Not the most elegant, but it gets the job done.
						// This is done here in case a file that is not a json is selected.
						d3.select("#" + dbsliceData.elementId).selectAll(".plotRow").remove();
						
						
						var plotRows = h.assemblePlotRows(sessionData.plotRows);
						
						// Finalise the session object.
						var session = {
							title : sessionData.title,
							plotRows: plotRows
						};
						
						// Store into internal object
						dbsliceData.session = session;
						
						// Render!
						render()
						
					} else {
						window.alert("Selected file is not a valid session object.")
					}; // if
					
				}, // assembleSession
				
				
				// CFD3LINE
				handlePropertyNames: function handlePropertyNames(properties){
			
					// NOTES
					// First of all it is important to observe that the _ separates both property name parts, as well as the variable name parts (e.g. it separates the units from the flow property names). This also means that once separated by _ the names can have different amounts of substrings.
					
					// Also note that the bl param file and the distribution files MUST specify bot hthe x and y coordinates of all lines (see notes above). Therefore it is relatively safe to assume that they will have an 'x' and 'y' token in their names. It is also likely that these will be the last tokens.
					
					// If it is assumed that all the properties follow the same naming structure, and that the hierarchy follows along: height - side - property - coordinate, then the variables can be handled after the split from radial file names has been made. This can be made if it is found that no tokens are the same.
					
					// For every nested part the flow variables should reappear n-times, where n is the number of different nesting parts. What if a property is missing from just a single height?
					
					// QUESTIONS:
					// NOTE: parsing all the files in a folder from the browser is not possible. A 'dir' file could be written, but it defeats the purpose. If file selection rules are created to access the files (taskId + token + token, ...) then any tasks without those files will produce errors on loading. Furthermore, appropriate files will have to be provided to include them, which will possibly become misleading. Furthermore, this complicates attempts to visualise tasks with slightly different file naming systems/folder structure.
					
					// Q: What should the files containe (e.g. each file a different line, each file a different variable at different locations, each file all variables at a single position)?
					// A: 
					// 1.) If each file contains a different line then the user will have to select the data to be loaded from a large list of possibilities, in this case 168. Thius could be simplified by allowing the user to pick parts of the name from a list, but that would be awkward. In essence, something like that is being done now anyway, but having the options moved to different controls.
					// 2 & 3.) Different file data separations would then require appropriate interpreters. This would also require even more entries into the metadata such that these files could be located. In this case there are already 6*23 files, and this is after (!) many of the files have been combined. Originally there were 19*23 files to pick from. If each line had an individual file there would be tens of thousands of them.
					
					// Q: Where should the data transformation take place (on load, after loading but before drawing, or on draw)?
					// A: 
					// On draw: The d3 process will assign data to the DOM object on the screen. If the dat ais transformed before the plotting it means that the entire transformed file data will be assigned to an individual line on plotting. This could end up using a lot of memory. It is therefore preferred if the data is already transformed when passed to the plotting, such that only the relevant data may be stored with the object.
					// After loading but before drawing: keeping the file in the original state is ideal if the same file should be used as a data source for several plotting functions. Alternately the functions should use the same input data format, which they kind of have to anyway. Another option is to just transform the data before it is passed to the drawing, but this requires a lot of redundant transforming, which would slow down the app. The issue of differentiating between the parameters is present anyway.
					// On loading: It is best to just transform the data upon load. The it is accessible for all the plotting functions immediately. The transofrmation should be general.
					
					
					
					// Tags could be identified by checking if all variables have them. If they don't a particular item is not a tag. The rule would therefore be that everything between tags belongs to a particular tag. Only 'x', and 'y' at the end would be needed to complete the rule.
					
					
					// METHOD
					// 1.) Create an array of name property objects. These should include the original name, and its parts split by '_'. Token indexes are allowed to facilitate different lengths of values between individual tokens.
					var properties_ = createPropertyObjects(properties)
					
					// 2.) Now that all the parts are know search for any tokens. A TOKEN is a common property name part. 'tokens' is an array of strings. 
					var userTokens = findUserTokens( properties_ )
					

					// Also look for any expected common tokens that might not have been properly specified, like 'ps':'ss', or 'x','y'. These not need be parts of the variable name, if they are present in all of the properties. If they are not they will be left in the property names.
					// The common tokens need to be handled separately, as they allow more than one option for the position.
					// The common tokens cannot be added into the token array directly in this loop, as it is possible that one of the subsequent elements will have it missing. Also, what happens if the name for some reason includes more than one token of of the expected values? Just add all of them.
					var commonTokens = findCommonTokens( properties_ )
					
						
					// 3.) With the tokens known, find their positions in each of the properties, and make the appropriate token options.
					properties_.forEach(function(p){
					
						handleUserTokens(  p, userTokens  )
						handleCommonTokens(p, commonTokens)
						
						// The tokens have now been handled, now get the remainder of the variable name - this is expected to be the flow property.
						handleFlowPropertyName(p)
						
					}) // forEach
					
					// Change the common tokens into an array of string options.
					commonTokens = commonTokens.map(function(o){return o.name})
					
					// Return the properties as split into the tokens etc., but also which additional options are available to the user, and which are common and handled internally.
					
					// Unique user token values ARE stored here. They only indicate which nests are available in the file. For now only one nest is specified, therefore combinations of different ones are not strictly needed, but it would expand the functionality of the code (for e.g. boundary layer profile plotting, or velocity profiles in general)
					
					
					// IMPORTANT NOTE: If a particular subnest does not branch into exactly all of the possibilities of the other subnests, then the order of selecting the tags becomes very important, as it can hide some of the data from the user!!
					
					// Common tokens are only stored so that the internal functionality might realise how the properties should be assembled when the data is being accessed for plotting
					
					var type = getVariableDeclarationType( commonTokens )
					
					
					removeRedundantPropertyFromObjectArray(properties_, "_parts")
					return {properties: properties_,
						   userOptions: getTokenWithOptions(properties_, userTokens),
						 commonOptions: getTokenWithOptions(properties_, commonTokens),
							varOptions: getFlowVarOptions(properties_, type),
								  type: type
						 }
						 
						 
					// handlePropertyNames HELPER FUNCTIONS:
					
					function createPropertyObjects(properties){
						// 'properties' is an array of strings. The output is an array of objects that will be the backbone of the file's data structure.
					
						return properties.map(function(p){
							return {val: p,
							_parts: p.split("_")}
						})
					
					} // createPropertyObjects
					
					function findUserTokens( properties_ ){
						// Input is the array produced by 'splitPropertyNames'. Output is a filter array of the same class.
						
						// The initial sample of possible tokens are the parts of the first name. Tokens MUST be in all the names, therefore loop through all of them, and retain only the ones that are in the following ones.
						
						var tokens = properties_[0]._parts
						properties_.forEach(function(p){
							tokens = tokens.filter(function(candidate){ 
								return p._parts.includes(candidate)
							}) // forEach
						}) // forEach
						
						// There may be some tokens in there that are comment tokens. For now this is implemented to hande the decimal part of the height identifiers, which are '0%'.
						
						// Should this be more precise to look for percentage signs in the first and last places only?
						tokens = removeCommentTokens(tokens, ["%", "deg"])
						
						return tokens
					
					} // findUserTokens
					
					function removeCommentTokens(tokens, commentIdentifiers){
						// Removes any tokens that include any character in the commentIdentifiers array of characters.
						commentIdentifiers.forEach(function(commentIdentifier){
							// Perform the filter for this identifier.
							tokens = tokens.filter(function(token){
								return !token.split("").includes(commentIdentifier)
							}) // filter
						}) // forEach
						return tokens
					
					} // removeCommentTokens
					
					function findCommonTokens( properties_ ){
						// Input is the array produced by 'splitPropertyNames'. Output is a filter array of the same class.
						
						// Common tokens allow a single line to be specified by several variables. 
						
						// The "ps"/"ss" aplit does not offer any particular advantage so far. 
						// The "x"/"y" split allows for hte lines to be specified explicitly, as opposed to relying on an implicit position variabhle. This is useful when the flow properties ofr a particular height or circumferential position are not calculated at the same positions (e.g. properties calculated on separate grids).
					
						// The common tokens are hardcoded here.
						var commonTokens = [{name: "side", value: ["ps", "PS", "ss", "SS"]},
											{name: "axis", value: ["x" , "X" , "y" , "Y" ]}]
						
						// Search for the common tokens
						properties_.forEach(function(p){
							commonTokens = commonTokens.filter(function(token){
								var containsPossibleValue = false
								token.value.forEach(function(v){
									containsPossibleValue = containsPossibleValue | p._parts.includes(v)
								}) // forEach
								return containsPossibleValue
							}) // forEach
						}) // forEach
						
						// Here the token is returned with the specified array of expected values. This allows the code to handle cases in which the specified common tokens are a mix of lower and upper case options.
						
						return commonTokens
					
					} // findCommonTokens
					
					function getTokenWithOptions(properties_, tokens){
					
						return tokens.map(function(token){
							// Loop over the properties, and assemble all the possible values for this particular token. The options of the properties have to be read through their tokens array at the moment.
							var allVals = properties_.map(function(p){
								// First find the appropriate token.
								return p[token]
							}) // map
							
							return {name: token,
								 options: helpers.unique( allVals ) }
							
						})
					
					} // getUserTokens
					
					function handleUserTokens(p, tokens){
						// For a given property object 'p', find where in the name the user specified tokens are, and which user specified values belong to them. Push the found name value pairs into p.tokens as an object.
					
						// Find the indices of the individual tokens.
						var ind = []
						tokens.forEach(function(token){
							ind.push( p._parts.indexOf(token) )
						})
						
						// Sort the indices - default 'sort' operates on characters. https://stackoverflow.com/questions/1063007/how-to-sort-an-array-of-integers-correctly
						ind.sort(function(a,b){return a-b;});
						
						// Indices are sorted smallest to largest, so now just go through the parts to assemble the tokens and the options.
						ind.forEach(function(ind_){
							// 'i' is the index of a particular token in the parts of the variable, 'j' is the position of 'i' in the index array.
							
							// As we are splicing from the array for easier identification of the variable name later on, the index will have to be found again every time.
							var t = p.val.split("_")[ind_]
							var start = 0
							var n = p._parts.indexOf( t )
							
							// Add teh appropriate properties to the property object.
							p[ t ] = p._parts.splice( start, n ).join("_")
							
							// Splice out the token name
							p._parts.splice( p._parts.indexOf(t), 1 )
						})
					
					
					} // handleUserTokens
					
					function handleCommonTokens(p, tokens){
						// Here the tokens that are found are converted to lower case for consistency.
					
						// Handle the commonly expected tokens.
						tokens.forEach(function(token){
							
							var values = []
							p._parts.forEach(function(v){
								if ( token.value.includes( v ) ){
									values.push( v.toLowerCase() )
								} // if
							}) // forEach
							
							// Splice all the values out of the parts.
							values.forEach(function(v){
								p._parts.splice( p._parts.indexOf(v),1)
							}) // forEach
							
							
							// Here it is allowed that more than one common token value is present in a variable. This shouldn't happen, but it is present anyway.
							p[token.name] =  values.join("_")
						}) // forEach
					
					} // handleCommonTokens
					
					function handleFlowPropertyName(p){
						// Whatever is left of the parts is the variable name.
						p.varName = p._parts.join("_") == "" ? p.axis : p._parts.join("_")
					
					} // getFlowPropertyName
					
					function removeRedundantPropertyFromObjectArray(A, property){
						
						A.forEach(function(O){
							delete O[property]
						})
					
					} // removeRedundantPropertyFromObjectArray
					
					function getVariableDeclarationType( commonTokens ){
						
						return commonTokens.includes("axis")? "explicit" : "implicit"
					
					} // getVariableDeclarationType
					
					
					
					function getFlowVarOptions(properties_, type){
						// 'getFlowVarOptions' sets up which properties this plot can offer to the x and y axes. This can also be used to assign the accessors to the data!
						
						var option = {}
						var varOptions = getTokenWithOptions(properties_, ["varName"])
						varOptions = varOptions[0]
						
						
						
						switch(type){
							case "implicit":
								// Implicit variables can be available on both axes.
								option = {x: varOptions, y: varOptions}
								break;
						
							case "explicit":
								// Explicit variables can be available on only one axes.
								var dummyOption = {
									name: "x",
									options: ["x"]
								}
								option = {x: dummyOption, y: varOptions}
								break;
						
						} // switch
						
						return option
					
					} // getFlowVarOptions
					
				}, // handlePropertyNames
				
				json2line: function json2line(data){
					// json are assumed to have only one series, with several properties possible per series.
					
					
					// The first element in the 'data' array is the first row of the csv file. Data also has a property 'colums', which lists all the column headers.
					var info = importExportFunctionality.importing.helpers.handlePropertyNames( Object.getOwnPropertyNames(data.data[0]) )
					
					
				
					// Keep the data in rows - this is a more natural storage considering that d3.line requests points as separate objects.
					info.vals = data.data
					
					return info
					
				}, // json2line
				
				csv2line: function csv2line(data){
					
					// The first element in the 'data' array is the first row of the csv file. Data also has a property 'colums', which lists all the column headers.
					var info = importExportFunctionality.importing.helpers.handlePropertyNames( data.columns )
					
					
				
					// Keep the data in rows - this is a more natural storage considering that d3.line requests points as separate objects.
					info.vals = data
					
					

					// Implement the accessors, and handle the difference between split properties, and single properties! Note that if the file has any common options (ps/ss. x/y) then this is a split variable file. This should be used as the test!
					
					
					return info
					
				
				} // csv2line
				
				
			} // helpers
			
		}, // loadData
		
		exporting : {
			
			session : {
			
				// USE JSON.stringify()? - in that case properties need to be selected, but the writing can be removed. This is more elegant.
				json: function json() {
					// This function should write a session file.
					// It should write which data is used, plotRows, and plots.
					// Should it also write the filter selections made?

					var sessionJson = '';
					write('{"isSessionObject": "true", ');
					write(' "title": "' + dbsliceData.session.title + '", ');
					write(' "plotRows": [');

					var plotRows = dbsliceData.session.plotRows
					plotRows.forEach(function (plotRow, i) {
						
						var plotRowString = writePlotRow(plotRow);
						write(plotRowString);

						if (i < plotRows.length - 1) {
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
							
						  // Let the plot write it's own entry.
						  s = s + plot.plotFunc.helpers.writeControl(plot)

						  if (i < plotRow.plots.length - 1) {
							s = s + ', ';
						  } // if

						}); // forEach

						s = s + ']';
						s = s + '}';
						return s;
						
						
						
					} // writePlotRow


				  return sessionJson;
				  
				  
				  // HELPERS
				  function writeOptionalVal(s, name, val){
							
					if (val !== undefined) {
					  s = s + ', ';
					  s = s + '"' + name + '": "' + val + '"';
					} // if
					
				  } // writeOptionalVal
				  
				  function accessProperty(o,p){
					  // When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
					  // This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
					  return o==undefined? undefined : o[p]
				  } // accessProperty
				  
				}, // json
				
				makeTextFile: function makeTextFile(text) {
					var data = new Blob([text], {
						type: 'text/plain'
					}); 
					
					var textFile = null;
					// If we are replacing a previously generated file we need to
					// manually revoke the object URL to avoid memory leaks.
					if (textFile !== null) {
						window.URL.revokeObjectURL(textFile);
					} // if

					textFile = window.URL.createObjectURL(data);
					
				  return textFile;
				}, // makeTextFile
				
				
			}, // session
			
		}, // exporting

		
		
		
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
						
						plotProperties.push( metadataPlot.view.xVarOption.val )
						if(metadataPlot.view.yVarOption !== undefined){
							plotProperties.push( metadataPlot.view.yVarOption.val )
						} // if
					}) // forEach
				}) // forEach
				
				
				// Remove any duplicates: 
				plotProperties = helpers.unique( plotProperties )

				
			  return plotProperties
				

				
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
							
						  return incompatibleProperties.includes( plot.view.xVarOption.val )  ||   incompatibleProperties.includes( plot.data.yVarOption.val )
							
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