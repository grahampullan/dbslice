import { variableHandling } from './variableHandling.js'


var inputTesting = {
	
		getTestRow: function getTestRow(metadata){
		
		
			
			let rowInd = Math.floor( Math.random()*metadata.length )
			let row = metadata[rowInd]
			
			// Find all variables to test. Exclude the artificially generated __file__.
			let variablesToTest = Object.getOwnPropertyNames(row).filter(d=> d!="__file__") 
			
			
			return variablesToTest.map(function(varName, colInd){
				 return {
					tag: "metadata",
					parent: row.__file__,
					rowInd: rowInd,
					colInd: colInd,
					colName: varName,
					testVal: row[varName],
					type: typeof(row[varName]),
					category: undefined,
					vals: metadata.map(d=>d[varName])
				}

			})
		
		}, // getTestRow
	
		classifyVariables: function(metadata, storeData){
		
			let vars = inputTesting.getTestRow(metadata)
		
			let promises = []
			vars.forEach(function(varObj){
				// Check this column.
				promises.push( inputTesting.handleVariables(varObj) )
				
			})
			
			// Promises are tests- they cannot be rejected, they can only come
			Promise.all(promises)
			.then(function(variableClassification){
				// Resolve - communicate the results onwards.
				
				inputTesting.displayResults(variableClassification)
				
				// When the classification is finished store the results.
				storeData(variableClassification)
				
			})
		
		}, // classifyVariables
	
		displayResults: function displayResults(variableClassification){
			
			// Maybe make the report in the same div as used for the variable handling? And have it as a two stage?
			
			// Make a report
			inputTesting.report.make();
			
			// Make the variable handling
			variableHandling.make(variableClassification)
			
		}, // displayResults
		
		handleVariables: function handleVariables(varObj){
			// Split the testing as per the variable type received.
			let promise
			switch( varObj.type ){
				case "string":
					// String can be a file too.
					promise = inputTesting.handleFiles(varObj)
					
				  break;
				  
				case "number":
					varObj.category = "Ordinal"
					promise = varObj
					
				  break;
				  
				default:
					inputTesting.error.wrongVarType.instances.push(varObj)
					
					varObj.category = "Unused";
					promise = varObj
			} // switch
				
			return promise
			
		}, // handleVariables
	
		handleFiles: function handleFiles( stringVar ){
	
			let promise
			let extension = stringVar.testVal.split(".").pop();
			switch(extension){
				case "json":
					promise = inputTesting.test.json(stringVar)
				  break;
				case "csv":
					promise = inputTesting.test.csv(stringVar)
				  break;
				default:
					// Unsupported extension.
					promise = inputTesting.test.dummy(stringVar)
			} // switch
			
			return promise
		
		}, // handleString
	
		// MOVE TO HELPERS
		getConvertedValues: function getConvertedValues(metadata){
		
			data = []
			metadata.forEach(function(d){
				data.push( inputTesting.convertNumbers(d) )
			})

					
			return data
			
		}, // getConvertedValues
		
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
		
		unique: function unique(d){		
			// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
			function onlyUnique(value, index, self) { 
				return self.indexOf(value) === index;
			} // unique
			
			return d.filter( onlyUnique )
		
		}, // unique
		
	
		// REPORT
		report: {
			
			show: function show(){
				
					let fullscreenContainer = d3.select("div.report-container")
				
					fullscreenContainer.style("display", "")
				
				}, // show
				
			hide: function hide(){
			
					let fullscreenContainer = d3.select("div.report-container")
				
					// Hide the container. Bring up the variable handling.
					fullscreenContainer.style("display", "none")
					
					variableHandling.show()
			
			}, // hide
		
			make: function make(){
				
				// Instead of opening this in a separate window draw it into a dedicated container.
				
				let parent = d3.select("div.report-container")
				parent.selectAll("*").remove()
				
				inputTesting.metadata.report.make(parent)
				
				let menus = parent.node().querySelectorAll(".accordion")
				
				inputTesting.report.addFunctionality(menus)
				
			}, // make
		
			makeMenu: function makeMenu(parent, ctrl){
				let r = inputTesting.report
	
				// Make the overhead menu item.
				let content = r.makeMenuItemBackbone(parent, ctrl)
				
				// For each particular error type make a dedicated submenu.
				ctrl.errorTypes.forEach(function(errorType){
					r.makeSubMenu(content, errorType)
				})
			
				// The report items should open. - This is done after it is printed to the new window. As it's printe as a string the new window creates new elements, without the functionality attached.
				// r.addFunctionality(parent.node().querySelectorAll(".accordion"))
				
				
			
			}, // makeMenu
				
			makeSubMenu: function makeSubMenu(parent, ctrl){
				let r = inputTesting.report

				let content = r.makeMenuItemBackbone(parent, ctrl)
				
				content
				  .append("p")
					.attr("class", "description")
					.html(ctrl.description)
				content
				  .append("div")
					.attr("class", "panel-content")
				  .append("ul")
				  .selectAll("li")
				  .data( ctrl.errors )
				  .enter()
				  .append("li")
					.html(ctrl.printout)  
			
			}, // makeSubMenu
			
			makeMenuItemBackbone: function makeMenuItemBackbone(parent, ctrl){
			
				let button = parent
				  .append("button")
					.attr("class", "accordion")
					.style("outline", "none")
					
				if(ctrl.titleEl != undefined){
					button = button.append(ctrl.titleEl)
				}
				
				button
				  .append("strong")
					.html(ctrl.title)
				button
				  .append("span")
					.attr("class", "badge badge-pill badge-info")
					.style("float", "right")
					.html(ctrl.nErrors)
					
				let content = parent
				  .append("div")
					.attr("class", "panel")
			
				return content
			
			}, // makeMenuItemBackbone
				
			addFunctionality: function addFunctionality(menus){
			
				for (let i = 0; i < menus.length; i++) {
				  menus[i].addEventListener("click", function() {
					this.classList.toggle("active");
					var panel = this.nextElementSibling;
					if (panel.style.display === "block") {
					  panel.style.display = "none";
					} else {
					  panel.style.display = "block";
					}
				  });
				} // for
			
			
			}, // addFunctionality
			
		}, // report
		
		
		// WHEN COMBINING WITH IMPORTEXPORTFUNCTIONALITY Combine with metadata to keep all relevant functionality together.
		metadata: {
		
			report: {

				make: function make(parent){
				
				
					// Have the fullscreen container in index.html
					
					let menuContainer = parent
					  .append("div")
						.attr("class", "card card-menu")
						
					menuContainer
					  .append("div")
						.attr("class", "card-header")
					  .append("h1")
						.html("Report:")

					// Body
					
					// Collect the error data.
					let allFilesWithErrors = inputTesting.metadata.report.generate()
					
					let varCategories = menuContainer
					  .append("div")
						.attr("class", "card-body")
						.style("overflow-y", "auto")
						.style("overflow-x", "auto")
					  .selectAll("div")
					  .data(allFilesWithErrors)
					  .enter()
					    .append("div")
						.each(function(d){
							inputTesting.report.makeMenu(d3.select(this), d)
						})
					  
					// Footer
					menuContainer
					  .append("div")
						.attr("class", "card-footer")
					  .append("button")
						.attr("class", "btn btn-success")
						.html("Understood")
						.on("click", inputTesting.report.hide)	
				
				
				}, // make
				
				message: function message(d){
					return d.colName + " (" + d.rowInd + ", " +d.colInd + "): " + d.testVal
				}, // message
			
				generate: function generate(){
					// Generate the appropriate data to draw the error report. For metadata the report is structured per metadata file type.
					let error = inputTesting.error
					let errorTypes = Object.getOwnPropertyNames(error)
				
				
					// Metadata files have the tag 'metadata' and a property 'parent', which denotes the particular file. Collect all unique files with errors.
					let filenames = []
					errorTypes.forEach(function(errorName){
						error[errorName].instances.forEach(function(varObj){
							if(varObj.tag == "metadata"){
								filenames.push(varObj.parent)
							} // if
						})
					})
					filenames = inputTesting.unique(filenames)
					
					
					// Create the reports for all the files.
					return filenames.map(function(filename){
					
						let fileReport = {
							title: filename,
							titleEl: "h2",
							nErrors: undefined,
							errorTypes: []
						}
						
						errorTypes.forEach(function(errorName){
						
							// Get all the errors of a particular type for this file.
							var fileErrors = error[errorName].instances.filter(function(varObj){
								return varObj.parent == filename
							})
							
							// Generate the error report object
							if(fileErrors.length > 0){
								fileReport.errorTypes.push(
									new error[errorName].report(fileErrors)
								)
							} // if
						
						})
						
						// Sum up hte number of all errors.
						fileReport.nErrors = fileReport.errorTypes.reduce(function(sum, errorType){return sum + errorType.errors.length},0)
						
						return fileReport
					})
					
				
				}, // generate
				
			}, // 
		
			
		}, // metadata
	
		// All the tests.
		test: {
	
			// File formats
			json: function json(varObj){
			
				return new Promise(function(resolve, reject){

					d3.json(varObj.testVal).then(function(content){
						// json files can be lines or contours.
						let test = inputTesting.test
						
						let isContour = test.contour.json(content)
						let isLine = test.line.json(content)
						
						
						// The contents are not in expected form - alert the user.
						if(isContour){
							varObj.category = "Contour"
							varObj.type = "file-contour"
						} else if(isLine){
							varObj.category = "Line"
							varObj.type = "file-line"
						} else {
							// Some other format. Don't allow the file to be loaded in by marking the column as categorical.
							varObj.category = "Categorical"
							
							inputTesting.error.unsupportedFileStructure.instances.push(varObj)
						}
						
						resolve(varObj)
						
					}).catch(function(){
						varObj.category = "Categorical"
						
						inputTesting.error.fileNotFound.instances.push(varObj)
						
						resolve(varObj)
					}) // then
					
				}) // Promise
			
			}, // json
			
			csv: function csv(varObj){
			
				return new Promise(function(resolve, reject){

					// This promise CAN fail - e.g. no file.
					d3.csv(varObj.testVal).then(function(content){
						let test = inputTesting.test
						// csv are always loaded in as strings. Need to convert what can be converted before testing.
						let content_ = inputTesting.getConvertedValues(content)
						
						// Csv could be line.
						let isLine = test.line.csv(content_)
						
						
						// The contents are not in expected form - alert the user.
						if(isLine){
							varObj.category = "Line"
							varObj.type = "file-line"
						} else {
							varObj.category = "Categorical"
							
							inputTesting.error.unsupportedFileStructure.instances.push(varObj)
							
							
							
						}
						
						resolve(varObj)
						
					}).catch(function(){
						varObj.category = "Categorical"
						
						inputTesting.error.fileNotFound.instances.push(varObj)
							
						resolve(varObj)
					}) // then
					
				}) // Promise
			
			}, // csv
			
			dummy: function dummy(varObj){
				// All real categorical variables pass through here, alongside to any with extensions.
			
				return new Promise(function(resolve, reject){

					varObj.category = "Categorical"
					
					// Add a report if there is an extension.
					let extension = varObj.testVal.split(".").pop()
					if(extension != varObj.testVal){
						inputTesting.error.unsupportedFileExtension.instances.push(varObj)			
					} // if
					
					
					
					// Directly pass the category to resolve.
					resolve(varObj)
					
				}) // Promise
			
			}, // dummy
			
			// Data formats
			contour: {
			
				json: function json(content){
				
					let isContour = false
				
					try {
				
						if(content.surfaces != undefined){
							// surfaces must have an object with properties y, x, and v, and size
							let s = content.surfaces
							let hasRequiredProperties = 
								Array.isArray(s.x) &&
								Array.isArray(s.y) &&
								Array.isArray(s.v) &&
								Array.isArray(s.size);
							if(hasRequiredProperties){
								isContour = true
							} // if
						} // if
						return isContour
				
					} catch (e){
						return isContour
					} // try
				
				}, // json
			
			}, // contour
			
			line: {
			
				json: function json(content){
				
					// Check if 'content.data' is an array containing only numbers in a random row.
					return inputTesting.test.helpers.testArray(content.data)
				
				}, // json
				
				csv: function csv(content){
				
					// Check if 'content' is an array containing only numbers in a random row.
					return inputTesting.test.helpers.testArray(content)
				
				}, // csv
			
			}, // line
				
			// Helpers
			helpers: {
			
				testArray: function testArray(expectedArray){
				
					let isArray = false
					
					try { 
					
						if( Array.isArray(expectedArray) ){
							// Pick a random row and test it. It can include only numbers.
							let randomEl = expectedArray[Math.floor(Math.random()*(expectedArray.length-1))]
							
							
							let allPropertiesAreNumber = inputTesting.test.helpers.areAllPropertiesNumeric(randomEl)
							
							if(allPropertiesAreNumber){
								isArray = true
							} // if
						} // if
						return isArray
						
					} catch (e){
						return isArray
					} // try
				
				}, // testArray
				
				areAllPropertiesNumeric: function areAllPropertiesNumeric(singleEl){
				
					let properties = Object.getOwnPropertyNames(singleEl)
							
					let areAllNumeric = properties.reduce(function(isNumber, property){
						return isNumber && typeof(singleEl[property]) == "number"
					}, true)
					
					return areAllNumeric
				
				}, // areAllPropertiesNumeric
			
			}
			
		}, // test
	
		// Maybe make the errors for each file separately?
		error: {
		
			// UNEXPECTED METADATA DATA TYPE
			wrongVarType: {
				report: class wrongVarTypeReport {
					constructor(items){
						this.title = "Metadata variables: unsupported type";
						this.description = "I only know how to support strings and numbers. The following variables have therefore been removed from the session.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // wrongVarTypeReport
				
				
				instances: []
			}, // wrongVarType
		
		
		// ON DEMAND FILES:
		
			// FILE NOT FOUND
			fileNotFound: {
				report: class fileNotFoundReport {
					constructor(items){
						this.title = "On-demand variables: Missing files";
						this.description = "I thought the following were files that I am able to load. However, I could not find them. The columns containing the filenames are available as categorical variables.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // fileNotFoundReport

			
				instances: []
			}, // missingFile
		
		
			// UNSUPPORTED FILE EXTENSION
			unsupportedFileExtension: {
			
				report: class fileNotFoundReport {
					constructor(items){
						this.title = "On-demand variables: Unsupported file extensions";
						this.description = "I thought the following are files that I am expected to load. However, Aljaz didn't teach me how to load anything but .csv and .json files with particular formats. Instead the columns containing the filenames are available as categorical variables.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // fileNotFoundReport
			
				instances: []
			}, // unsupportedFileExtension
		
			
			// UNSUPPORTED FILE STRUCTURE
			unsupportedFileStructure: {
				report: class fileNotFoundReport {
					constructor(items){
						this.title = "On-demand variables: Unexpected data structure";
						this.description = "I loaded the following files, however, I wasn't taught how to handle their particular formats. Instead the columns containing the filenames are available as categorical variables.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // fileNotFoundReport
				
			
				instances: []		
			}, // wrongFileStructure
		
		} // errors
	
	} // inputTesting
	
export { inputTesting };
  