import {dbsliceDataCreation} from "./dbsliceDataCreation.js";
import {dbsliceData} from "./dbsliceData.js";
import {sessionManager} from "./sessionManager.js";
import * as FILE from "./fileClasses.js";

export var fileManager = {
	
		// CHECK TO SEE IF THE FILE WAS ALREADY LOADED!!
		importing: {
			
			
			// PROMPT SHOULD BE MOVED!!
			prompt: function(requestPromises){
				// Only open the prompt if any of the requested files were metadata files!
				
				Promise.allSettled(requestPromises).then(function(loadresults){
					
					if(loadresults.some(res=>res.value instanceof FILE.metadataFile)){
					
						let allMetadataFiles = fileManager.library.retrieve(FILE.metadataFile)

						// PROMPT THE USER
						if(allMetadataFiles.length > 0){
							// Prompt the user to handle the categorication and merging.
							
							// Make the variable handling
							dbsliceDataCreation.make()
							dbsliceDataCreation.show()
							
						} else {
							// If there is no files the user should be alerted. This should use the reporting to tell the user why not.
							alert("None of the selected files were usable.")
						} // if
						
					} // if
										
				}) // then
				
			}, // prompt
			
			
			dragdropped: function(files){
				// In the beginning only allow the user to load in metadata files.
				
				let requestPromises
				let allMetadataFiles = fileManager.library.retrieve(FILE.metadataFile)
				if(allMetadataFiles.length > 0){
					// Load in as userFiles, mutate to appropriate file type, and then push forward.
					requestPromises = fileManager.importing.batch(FILE.userFile, files)
					
				} else {
					// Load in as metadata.
					requestPromises = fileManager.importing.batch(FILE.metadataFile, files)
				} // if
				
				fileManager.importing.prompt(requestPromises)
				
				
			}, // dragdropped
			
			
			single: function(classref, file){
				
				// Construct the appropriate file object.
				let fileobj = new classref(file)
				
				// Check if this file already exists loaded in.
				let libraryEntry = fileManager.library.retrieve(undefined, fileobj.filename)
				if(libraryEntry){
					fileobj = libraryEntry
				} else {
					// Initiate loading straight away
					fileobj.load()
					
					// After loading if the file has loaded correctly it has some content and can be added to internal storage.
					fileManager.library.store(fileobj)
				} // if
				

				// The files are only stored internally after they are loaded, therefore a reference must be maintained to the file loaders here.
				return fileobj.promise
				
			}, // single
			
			batch: function(classref, files){
				// This is in fact an abstract loader for any set of files given by 'files' that are all of a file class 'classref'.
				
				
				let requestPromises = files.map(function(file){
					return fileManager.importing.single(classref, file)
				})
				
				return requestPromises
				
				
			}, // batch
			
		}, // importing
		
		library: {
			
			update: function(){
				// Actually, just allow the plots to issue orders on hteir own. The library update only collects the files that are not required anymore.
				
				
				
				let filteredTasks = dbsliceData.data.taskDim.top(Infinity)
				
				var requiredFilenames = []
				dbsliceData.session.plotRows.forEach(function(plotRowCtrl){
					plotRowCtrl.plots.forEach(function(plotCtrl){
				  
						// If a sliceId is defined, then the plot requires on-demand data.
						if(plotCtrl.view.sliceId != undefined){
							
							requiredFiles = requiredFiles.concat( 
								filteredTasks.map(function(d){
									return d[ plotCtrl.view.sliceId ]
								}) // map
							) // concat
						} // if
				  
					}) // forEach
				}) // forEach
				
				
				// Remove redundant files of this classref.
				let allRequiredFilenames = requiredFiles.map(d=>d.filename)
				
				let filesForRemoval = dbsliceData.files.filter(function(file){
					return allRequiredFilenames.includes(file.filename)
				}) // filter
				
				filesForRemoval.forEach(function(file){
					let i = dbsliceData.files.indexOf(file)
					dbsliceData.files.splice(i,1)
				})
				
				
				
			}, // update
			
			store: function(fileobj){
				
				
				

				fileobj.promise.then(function(obj_){
					
					if(obj_ instanceof FILE.sessionFile){				
						// Session files should not be stored internally! If the user loads in another session file it should be applied directly, and not in concert with some other session files.
						sessionManager.onSessionFileLoad(obj_)
						
					} else {
						// Other files should be stored if they have any content.
						if(obj_.content){
							dbsliceData.files.push(obj_)
						} // if

					} // if
					
				})
					
				

				
			}, // store
			
			retrieve: function(classref, filename){
				// If filename is defined, then try to return that file. Otherwise return all.
				
				let files
				if(filename){
				
					files = dbsliceData.files.filter(function(file){
						return file.filename == filename
					}) // filter
					files = files[0]
					
				} else {
					
					files = dbsliceData.files.filter(function(file){
						return file instanceof classref
					}) // filter
					
				} // if
				
				return files
				
			}, // retrieve
			
			remove: function(classref, filename){
				
				// First get the reference to all hte files to be removed.
				let filesForRemoval = fileManager.library.retrieve(classref, filename)
				
				// For each of these find it's index, and splice it.
				filesForRemoval.forEach(function(file){
					let i = dbsliceData.files.indexOf(file)
					dbsliceData.files.splice(i,1)
				})
				
			}, // remove
			
			

			
		}, // library
			
		exporting : {
				
			session : {
				
				download: function(){
					
					
					
					// Make a blob from a json description of the session.
					var b = fileManager.exporting.session.makeTextFile( sessionManager.write() )
					
					
					// Download the file.
					var lnk = document.createElement("a")
					lnk.setAttribute("download", "test_session.json")
					lnk.setAttribute("href", b)
					
					var m = document.getElementById("saveSession")
					m.appendChild(lnk)
					lnk.click()
					lnk.remove()
					
				}, // download
				
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

		
	} // fileManager
	