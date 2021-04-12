import {helpers} from "./helpers.js"
import {categoryInfo} from "./categoryInfo.js"
import {dbsliceDataCreation} from "./dbsliceDataCreation.js"
import {fileManager} from "./fileManager.js"

export var errors = {
		/* ERRORS SHOULD (!!!) BE LOGGED IN AN ERROR OBJECT TO ALLOW THE FAULTY FILES TO BE RELEASED FROM MEMORY!!

		Errors are loged into a single array, as it is easier to have all the error sorting in the errors object, rather than scattered throughout the loaders.

		Maybe split of the error handling into a separate module?? A sort of reporting module? Add the report generation to it here!

		*/
		
		log: [], // log
		
		report: {
			
			generate: function(){
			
				// Create a section for each of the files. On-demand files should be grouped by the metadata file that asks for it. 
				
				
				// Group all errors by their requester.
				let report = errors.log.reduce(function(acc, er){
					if(acc[er.requester]){
						acc[er.requester].push(er)
					} else {
						acc[er.requester] = [er]
					} // if
					return acc
				},{})
				
				// Errors with user requested files (on-demand files loaded by the user through the UI) should just be reported as individual items.
				
				// On-demand files requested indirectly (from metadata) can fail only if the metadata was successfully loaded beforehand. Therefore if the metadata load fails, then the on-demand files will not be loaded at all. Therefore the report as it stands is sufficient! Submenu functionality is not needed!
				
				// This report will be bound to the DOM, and as each attribute in report is supposed to have a corresponding DOM element, the report should be an array!!
				let reportArray = Object.getOwnPropertyNames(report).map(function(name){
					return {title: name, content: report[name]}
				})
				
				
				return reportArray
				
			}, // generate
			
			// Outside INTERACTIVITY
			show: function show(){
				
				let fullscreenContainer = d3.select("#report-container")
			
				fullscreenContainer.style("display", "")
			
			}, // show
				
			hide: function hide(){
			
					let fullscreenContainer = d3.select("#report-container")
				
					// Hide the container. Bring up the variable handling.
					fullscreenContainer.style("display", "none")
			
			}, // hide
			
			// BUILDER
			builder: {
				
				make: function make(){
				
					// Clear the parent.
					let parent = d3.select("#report-container")
					parent.selectAll("*").remove()
					
					// Collect the error data. The error report should be an array!!
					let errorReport = errors.report.generate()
					
					// Build the DOM
					errors.report.builder.build.menu(parent, errorReport)
				
				
					// Make it interactive!
					let menus = parent.node().querySelectorAll(".accordion")
					errors.report.builder.addFunctionality(menus)
				
				}, // make
				
				
				build: {
					
					menu: function menu(parent, report){
						
						
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
						let varCategories = menuContainer
						  .append("div")
							.attr("class", "card-body")
							.style("overflow-y", "auto")
							.style("overflow-x", "auto")
						  .selectAll("div")
						  .data( report )
						  .enter()
							.append("div")
							.each(function(d){
								errors.report.builder.build.submenu(d3.select(this), d)
							})
						  
						// Footer
						menuContainer
						  .append("div")
							.attr("class", "card-footer")
						  .append("button")
							.attr("class", "btn btn-success")
							.html("Understood")
							.on("click", errors.report.hide)	
						
						
						
					}, // menu
						
					submenu: function submenu(parent, itemReport){
						// Builds the whole menu item, which will be an accordion menu.
						let button = parent
						  .append("button")
							.attr("class", "accordion")
							.style("outline", "none")
						
						button
						  .append("strong")
							.html(itemReport.title)
						button
						  .append("span")
							.attr("class", "badge badge-pill badge-info")
							.style("float", "right")
							.html(itemReport.content.length)
							
						let content = parent
						  .append("div")
							.attr("class", "panel")
						  .append("ul")
							
						content.selectAll("li")
						  .data(itemReport.content)
						  .enter()
						  .append("li")
							.html(errors.report.builder.build.item)
							
						// url requester interpreter error
					
						return content
					
					}, // submenu
					
					item: function(item){
						// No need to report the requestor - this is communicated b the menu structure!
						// When classifying csv variables onDemandData is used for probable files. Otherwise the classifier restricts the file types!
						
						return `<b>${item.url}</b> interpreted as <b>${item.interpreter}</b> produced <b>${item.report.message.fontcolor("red")}</b>`
						
					}, // item
					
				}, // build
			
				
				addFunctionality: function addFunctionality(menus){
					// Opening the menus.
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
				
				
			}, // builder
			
		}, // report
	} // errors

export class dbsliceFile {
		constructor(file, requester){
			
			// How to load if file is an actual File object.
			if(file instanceof File){
				file = {
					url: URL.createObjectURL(file),
					filename: file.name,
				}
			} // if
			
			this.url = file.url
			this.filename = file.filename
			this.extension = file.filename.split(".").pop()
			this.promise = undefined
			
			// Also log the requestor. If this was passed in then use the passed in value, otherwise the requestor is the user.
			this.requester = requester ? requester : "User"
			
		} // constructor
		
		load(){
			// Collect the data and perform input testing.
			let obj = this
			
			// Based on the url decide how to load the file.
			let loader
			switch(this.extension){
				
				case "csv":
					loader = function(url){ return d3.csv(url) }
					break;
					
				case "json":
					loader = function(url){ return d3.json(url) }
					break;
					
				default:
					// Return a rejected promise as the file extension is wrong.
					
					loader = function(){
						return Promise.reject(new Error("LoaderError: Unsupported Extension"))
					}
					break;
			}; // switch
			
			
			// Wrap in a larger promise that allows the handling of exceptions.
			
			let loadPromise = new Promise( (resolve, reject)=>{
								
				
				// If the URL points to a non-existing file the d3 loader will reject the promise and throw an error, but still proceed down the resolve branch!
				
				loader(obj.url)
				  .then(
					function(content){
						// Since d3 insists on running the resolve branch even though it doesn't find the file, handle missing contents here.
						
						// csv files are always read as strings - convert numbers to numbers. Should be done here. If it's done in a preceeding promise then the error is lost.
						
						obj.content = content
						resolve(obj)
						
					},
					function(e){
						// 'e' is an error triggered during loading.
						
						// The two errors that can enter here are file missing, and a problem reading the file.
						
						// This routes any errors that d3 might have into hte new promise.
						reject(e)
					})

				
			})
			.then(this.format)
			.then(this.onload)
			.catch(function(e){
				// This catches all the rejects. 'e' is the field into which the error can be logged.
				delete obj.content
				errors.log.push({
					url: obj.url, 
					interpreter: obj.constructor.name, 
					report: e,
					requester: obj.requester
				})
				
				return obj
			})
			
			this.promise = loadPromise
			
		} // load
		
		onload(obj){
		  return obj
		} // onload
	  
		format(obj){
		  return obj
		} // format
		
		static test = {
			
			structure: function (fileClass, content){
				// This an abstract test director. When a file is loaded the file classes do not know exactly how to handle to contents. This test director tries different implemented approaches to reformat the data, and stops when a suitable approach is found. In the future this may be extended to the point where the test involves performing a dummy plotting operation, as the plotting is the last operation to be performed on the file data.
				
				let content_
			
				// No differentiating between the structure or the content failing - the file classes are trying several different structures.
			
				// Try to use all different file structures possible.
				Object.getOwnPropertyNames( fileClass.structure ).every(function(name){
					try {
						content_ = fileClass.structure[name]( content )
						
						// Return false breaks the loop. This return is reached only if the test was successfully performed and passed.
						return content_ ? false : true
					} catch (e){
						// Keep looping
						content_ = undefined
						return true
					} // try
					
				}) // forEach
				
				if(content_){
					// Restructuring succeeded.
					return content_
				} else {
					throw( new Error("InvalidFile: Unsupported data structure"))
				} // if
				
			}, // structure
			
		} // test
		
		// Maybe move these to helpers??
		static testrow(array){
		  
		  if(array.length > 0){
			  let i = Math.floor( Math.random()*array.length )
			  return {
				  i: i,
				row: array[i]
			  } // return
		  } else {
			  throw( new Error( "InvalidInput: Array without entries" ))
		  } // if
			  
		} // testrow
		
		static convertNumbers(array){
			
			return array.map(function(row){
				
				var r = {};
				for (var k in row) {
					r[k] = +row[k];
					if (isNaN(r[k])) {
						r[k] = row[k];
					} // if
				} // for
			  return r;
				
			})
			
			
		} // convertNumbers
		
	} // dbsliceFile

	// Declare file types here.
export class metadataFile extends dbsliceFile {
	  
		onload(obj){
			// This executes in a promise chain, therefore the overhead promise will wait until thiss is fully executed.
			
			// Check if suitable categories have already been declared.
			let classificationPromise
			if(!obj.content.categories){
				// Launch the variable classification.
				classificationPromise = obj.classify.all(obj)
			} else { 
				classificationPromise = Promise.resolve().then(d=>{return obj}); 
			
			}// if 
			
			// To ensure that the classification is included into the loading promise chain a promise must be returned here. This promise MUST return obj. 'classify.all' returns a promise, which returns the object with the classified variables.
			return classificationPromise
			
		} // onload
	  
	  
		format(obj){
			
			// Restructure the data into an expected format
			obj.content = dbsliceFile.test.structure(metadataFile, obj.content)
			
			return obj
			
			
		} // format
	  

	  
	  
		static structure = {
		  
		  csv2metadataFile: function(content){
			  
			  let content_
			  
			  // Data values need to be converted to numbers. Convert the 'variables' into objects?
			  content_ = {
				  variables: content.columns.map(function(d){
					  return {name: d, 
						  category: undefined,
							  type: undefined}
				  }),
				  data: dbsliceFile.convertNumbers( content ),
			  }
			  
			  
			  metadataFile.test.content(content_)
			  
			  delete content_.data.columns
			  
			  return content_
		  }, // array
		  
		  json2metadataFile: function(content){
			  
			  let content_
			  
			  
			  content_ = {
				  variables: Object.getOwnPropertyNames(dbsliceFile.testrow(content.data).row).map(function(d){
					  return {name: d, 
						  category: undefined,
							  type: undefined}
				  }),
				  data: content.data,
			  }
				  
			  // Check if declared variables contain all variables in the data.
			  let allVariablesDeclared = helpers.arrayEqual(
					metadataFile.cat2var(content.header).map(d=>d.name),
					content_.variables.map(d=>d.name)
			  )
			  
			  // All variables are declared, but have they been declared in the right categories??
			  
			  if(allVariablesDeclared){
				  // All variables have been declared. The categories can be assigned as they are.
				  content_.variables = metadataFile.cat2var(content.header)
				  
			  } // if
			  
			  metadataFile.test.content(content_)
			  
			  return content_
			  
		  }, // object
		  
		} // structure
	  
	  
	  // The testing suite for this file type.
	  static test = {
	  
		content: function(content){
			
			// Columns require a taskId property.
			// Declared categories must contain all variables.
			// All rows must be the same lenght
			// There must be some rows.
			// Data must be iterable
			
			
			// Check if the data is an array (has function length)
			let isThereAnyData = Array.isArray(content.data) 
							  && content.data.length > 0
			

			// Test to make sure all rows have the same number of columns.
			let areRowsConsistent = true
			let testrow = dbsliceFile.testrow(content.data).row
			content.data.forEach(function(row){
				areRowsConsistent && helpers.arrayEqual(
					Object.getOwnPropertyNames(testrow),
					Object.getOwnPropertyNames(row)
				)
			}) // forEach
			
			return isThereAnyData && areRowsConsistent
			
			
			
			
		}, // content
	  
	  } // test
	  
	  // Methods required for variable classification
	  classify = {
		  
		all: function(obj){
			// This already executes in a promise chain, therefore it's not needed to update the obj.promise. The promises created here will be resolved before the overhead promise resolves further.
			
			// Create all the testing promises.
			let testPromises = obj.content.variables.map(function(variable){
				// Check this column. Variable is now an object!
				return obj.classify.variable(obj, variable)
			})
			
			// Return the final promise.
			return Promise.all(testPromises)
				.then(function(variableClassification){
					// The promises update the variable classification into the file object directly.
					
					// obj.content.categories = variableClassification
					return obj
				})
				
			
			
			
			  
		  }, // all
		  
		variable: function(obj, variable){
			  
			// Retrieve an actual value already.
			let testrow = dbsliceFile.testrow(obj.content.data)
			let testval = testrow.row[variable.name]
			
		  
			// Split the testing as per the variable type received.
			let promise
			switch( typeof(testval) ){
				case "string":
					// String can be a file too.
					variable.type = "string"
					promise = obj.classify.string(obj, variable, testval)
					
				  break;
				  
				case "number":
					variable.category = "ordinal"
					variable.type = "number"
					promise = variable
					
				  break;
				  
				default:
					variable.category = "Unused"
					variable.type = undefined
					promise = variable
					
			} // switch
				
			return promise
		  
		}, // variable
	  
		string: function(obj, variable, testval){
			// If the string is a file, load it in to identify it's structure. It's not important which extension the file has, but what is it's internal structure.
			
			// 'obj' is needed to construct an on-load response, 'variable' and 'testval' to have the name value pair.  
			
			let promise
			
			// Create a new onDemandFile to load in it's contents.
			
			
			switch( testval.split(".").pop() ){
				case "json":
				case "csv":
					// Try to classify the testval as a file. The requester is the metadata for which the variables are being classified.
					let testFile = new onDemandFile({url: testval, filename: testval}, obj.filename)
					
					promise = obj.classify.file(variable, testFile)
					
				  break;
				default:
					// Unsupported extension.
					variable.category = "categorical"
					promise = variable
			} // switch
			
			
			return promise
		  
		}, // string
		
		file: function(variable, testFile){
			// Make a new generic on-demand file, and return a promise that will return the file type.
			
			testFile.load()
			
			// What can go wrong:
			// file is not found
			// file has wrong content
			
			// Below 'obj' represents 'testFile'.
			return Promise.all([testFile.promise]).then(function(obj){
				
				// It's possible that hte file was found and loaded correctly. In that case 'obj.content.format' will contain the name of the file type. Otherwise this field will not be accessible.
				try {
					// Category is the categorisation that will actually be used, and type cannot be changed.
					variable.category = obj[0].content.format
					variable.type = obj[0].content.format
					return variable
					
				} catch {
					// If the loading failed for whatever reason the variable is retained as a categorical.
					variable.category = "categorical"
					return variable
					
				} // try
			})
			
			
		}, // file
	  
		  
	  } // classify
	  

	  
	  // Where is this used??
	  static cat2var(categories){
		  // If categories are given, just report the categorisation. But do check to make sure all of the variables are in the categories!! What to do with label and taskId??
		  
		  let variables = []
		  let declaredVariables
		  
		  Object.getOwnPropertyNames(categories)
			.forEach(function(category){
			  if(categoryInfo.supportedCategories.includes(category)){
				  declaredVariables = categories[category].map(
					function(d){
						return {name: d, 
							category: category,
								type: categoryInfo.cat2type[category]}
					})
					
				  variables = variables.concat(declaredVariables)  
			  } // if
			  
			})
		  
		  // Check that all hte variables are declared!
		  
		  return variables
		  
	  } // category2variable
	  
	  

	  
	  
	} // metadataFile

	// For a general unknown on-demand file
export class onDemandFile extends dbsliceFile {
		
		onload(obj){
			
			// During the data formatting the format of the file is determined already. Here just report it onwards.
			return obj
			
		} // onload
		
		format(obj){
			// Here try all different ways to format the data. If the formatting succeeds, then check if the contents are fine.
			
			let availableFileClasses = [line2dFile, contour2dFile]
			
			// Here just try to fit the data into all hte supported data formats, and see what works.
			
			var format
			availableFileClasses.every(function(fileClass){
				try {
					// The structure test will throw an error if the content cannot be handled correctly.
					dbsliceFile.test.structure(fileClass, obj.content)
					
					// This file class can handle the data.
					format = fileClass.name
				} catch {
					return true
				} // if
			})
				
				
			// Output the object, but add it's format to the name.
			if( format ){
				obj.content.format = format
				return obj
			} else {
				throw( new Error( "InvalidFile: Unsupported data structure" ))
			} // if
				
			
		} // format
		
	  
		static test = {
			
			content: function(){
				// Any content that can be loaded and passes through the format testing is a valid on-demand file.
				return true
			}, // content
			
		} // test
	  
	} // onDemandFile

	// Established on-demand files
export class line2dFile extends onDemandFile {
		
		// Can a method be both static and 
		
		format(obj){
			
			let content = dbsliceFile.test.structure(line2dFile, obj.content)

			// Rename the variables to remove leading and trailing blanks.			
			obj.content = line2dFile.rename(content)
			
			return obj

		} // format
		
		
		// Structure should be testable outside as well, as it will have to be called bt onDemandDataFile when its trying to classify the files.
		static structure = {
			
			csv2lineFile: function(content){
				
				if(Array.isArray(content)){
					
					let content_ = {
						variables: content.columns,
						data: dbsliceFile.convertNumbers( content )
					}
					
					// Test the new contents.
					line2dFile.test.content(content_)
					
					// Structure test succeeded. Delete the columns that accompany the array object.
					delete content_.data.columns
					
					return content_
				} else {
					return undefined
				} // if
				
			}, // array
			
			json2lineFile: function(content){
				
				if(Array.isArray(content.data)){
					
					
					let content_ = {
						variables: Object.getOwnPropertyNames(content.data[0]),
						data: content.data
					}
					
					// Test the new contents.
					line2dFile.test.content(content_)
					
					return content_
					
				} else {
					return undefined
				} // if
				
			}, // object
			
		} // structure
		
		// Also needed by onDemandDataFile
		static test = {
			
			content: function(content){
				
				if(content.variables.length < 2){
					throw( new Error("InvalidFile: No variable pair detected" ))
				} // if
				
				
				// All values MUST be numeric!
				let testrow = dbsliceFile.testrow(content.data)
				let areAllContentsNumeric = Object.getOwnPropertyNames(testrow.row).every(function(varName){
					let value = testrow.row[varName]
					return typeof(value) === 'number' && isFinite(value)
				})
				if(!areAllContentsNumeric){
					// There are non-numeric values in the data.
					throw( new Error("InvalidFile: Some variables include non-numeric values." ))
					
				} // if
				
				
				return true
			}, // content
			
		} // test
		
		
		static rename(content){
			// What happens if two names are the same after blanks have been trimmed? Retain the data, but add a modifier to the end.
			
			let renamemap = content.variables.reduce(function(acc, oldname){
				
				let newname = oldname.trim()
				
				if(oldname != newname){
					// Trimming changed something.
					let allnames = Object.getOwnPropertyNames(acc)
				
					let i = 0
					while(allnames.includes(newname)){
						newname += "_"
						
						// Safety break
						i += 1
						if(i > 10){break} // if
					} // while
					
					acc[oldname] = newname	
					
				} // if
				
				return acc
			}, {}) // reduce
			
			
			// Rename the whole content.data array.
			let namestoreplace = Object.getOwnPropertyNames(renamemap)
			
			content.data.forEach(function(row){
				namestoreplace.forEach(function(oldname){
					let newname = renamemap[oldname]
					row[newname] = row[oldname]
					delete row[oldname]
				})
			})
			
			content.variables = Object.getOwnPropertyNames(content.data[0])
			
			return content
			
			
		} // rename
		
	} // line2dFile

export class contour2dFile extends onDemandFile {
		
		
		format(obj){
			
			obj.content = dbsliceFile.test.structure(contour2dFile, obj.content)
			return obj
			
		} // format
		
		static structure = {
			// This can now more easily handle different ways of specifying contours. Also convenient to implement the data structure conversion here, e.g. from points to triangles.
			
			json2contour2dFile: function(content){
				
				// Not supposed to be an array! It should contain a single surface. If content.surfaces IS an array, then just select the first one.
				let surface = Array.isArray(content.surfaces) ? content.surfaces[0] : content.surfaces
				
				// In the content I expect an array called `y', `x', `v' (or others), and `size'. The first three must all be the same length, and the last one must have 2 numbers.
				
				let L = (surface.x.length == surface.y.length) && (surface.x.length > 3) ? surface.x.length : undefined
				
					
				// Find all possible variables. The variables are deemed available if they are the same length as the x and y arrays. Also, they must contain only numeric values.
				let compulsory = ["x", "y", "size"]
				let variables = Object.getOwnPropertyNames(surface).filter(function(d){
					
					let L_
					if(!compulsory.includes(d)){
						// This is a possible user variable. It fits if it is an array of the same length as the geometrical parameters, and if it has numeric values.
						let vals = surface[d]
						
						
						
						L_ = Array.isArray( vals ) && !vals.some(isNaN) ? vals.length : undefined
					} else {
						L_ = undefined
					} // if
					
					// The particular variable has to be an array of exactly the same length as `x' and `y'.
					
					return L_ == L
				})
				
				
				// Variables must have at least one option.
				let content_
				if(variables.length > 0){
					content_ = {
						variables: variables,
						surface: surface
					}
				} else {
					throw(new Error("InvalidFile: Unsupported data structure")) 
				} // if
			
				// Hard-coded expected contents
				return content_
					
						
			}, // object
			
		} // structure
		
	} // contour2dFile



	// Support file types - data mergers, sessions, etc.
	// configFile is used to classify user input files. The format has been changed to retain the transformed content.
export class userFile extends dbsliceFile {
		
		onload(obj){
			
			// Mutate onload.
			var mutatedobj
			switch(obj.content.format){
				case "metadataFile":
					// Not easy to mutate, as the format of the content may not be correct.
					mutatedobj = new metadataFile(obj)
					
					mutatedobj.content = obj.content
					mutatedobj.promise = obj.promise
					
					// Also need to classify...
					mutatedobj = mutatedobj.classify.all(mutatedobj)
					
				  break;
				case "sessionFile":
					// Return the contents as they are.
					mutatedobj = new sessionFile(obj)
					
					mutatedobj.content = obj.content
					mutatedobj.promise = obj.promise
					
				  break;
			  } // switch
			
			return mutatedobj
			
		} // onload
		
		format(obj){
			// Here try all different ways to format the data. If the formatting succeeds, then check if the contents are fine.
			
			// SHOULD ALSO ACCEPT SESSION FILES.
			
			let availableFileClasses = [metadataFile, sessionFile]
			
			// Here just try to fit the data into all hte supported data formats, and see what works.
			
			var content_
			availableFileClasses.every(function(fileClass){
				try {
					// The structure test will throw an error if the content cannot be handled correctly.
					content_ = dbsliceFile.test.structure(fileClass, obj.content)
					
					// This file class can handle the data.
					content_.format = fileClass.name
				} catch {
					return true
				} // if
			})
				
				
			// Output the object, but add it's format to the name.
			if( content_.format ){
				obj.content = content_
				return obj
			} else {
				throw( new Error( "InvalidFile: Unsupported data structure" ))
			} // if
				
			
		} // format
		
	  
		static test = {
			
			content: function(){
				// Any content that can be loaded and passes through the format testing is a valid on-demand file.
				return true
			}, // content
			
		} // test
		
		mutateToMetadata(obj){
			
			let mutatedobj = new metadataFile(obj)
			
			
			// Refactor the 
			
		} // mutateToMetadata
	  
	} // userFile

	// This one is capable of loading in just about anything, but it's also not getting stored internally.
export class sessionFile extends userFile {
		
		
		format(obj){
			
			obj.content = dbsliceFile.test.structure(sessionFile, obj.content)
			return obj
			
		} // format
		
		static structure = {
			// This can now more easily handle different ways of specifying contours. Also convenient to implement the data structure conversion here, e.g. from points to triangles.
			
			json2sessionFile: function(content){
				
				// Has to be an object, whose entries are valid categories. The entries of the categories are considered the variables after teh merge. Each of them must have the same exact properties (file names), the names must include all the already loaded files, and all the file variables must be present in those files. 
				
				
				
				// Expect two parts to hte file: the merging and session info.
				
				// What happens when there is no sessionInfo, or nop merging info? Shouldn't it just throw an error??
				
				// Prune away anything that is not in line with the expected structure. Using map creates an array, but it should instead remain an object!!
				let mergingInfo = categoryInfo.supportedCategories.reduce(function(dict, category){
					dict[category] = content.mergingInfo[category]
					return dict
				}, {}) // map
				
				
				// There are some attributes that the sessionInfo section must have:
				// title, plotRows.
				let sessionInfo = content.sessionInfo
				if( !helpers.arrayIncludesAll( Object.getOwnPropertyNames(sessionInfo), ["title", "plotRows"] ) ){
					throw( new Error("InvalidFile: Session title or rows not specified."))
				} // if
				
				
				
				return {
					merging: mergingInfo,
					session: sessionInfo
				}
			}, // object
			
		} // structure
			
		static test = {
			
			content: function(content){
				
				// The philosophy here is that if it can be applied it is valid.
				
				
				// Try to use it and see if it'll be fine.
				let fileobjs = dbsliceDataCreation.makeInternalData(fileManager.library.retrieve(metadataFile))
				
				fileobjs = dbsliceDataCreation.sortByLoadedMergingInfo(fileobjs, content)
				
				// No need to check if all the loaded files were declared for - just use the merge to do what is possible.
				
				// Maybe the same applies to variables too? Just use what you can?
				
				// Maybe I don't even need to find common file names??
				
				
				// If there's no metadata files loaded then assume they're metadata files.
				
				
				
				// At least some of the 
				return true
				
			}, // content
			
		} // test
		
	} // sessionFile

