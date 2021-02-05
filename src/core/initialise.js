function initialise(session) {
		

		// Initialise the crossfilter.
		cfDataManager.cfInit();
		
		// Store the app configuration and anchor.
		dbsliceData.session = session;

		
	  
		// Draw the rest of the app.
		sessionManager.render()
		
		
		// Add the functionality to the buttons in the header.
		builder.makeSessionHeader()
		addMenu.addPlotRowControls.make(d3.select("#addPlotRowButton"))
		
		
		// Dragging and dropping
		let target = document.getElementById("target")
		let merging = document.getElementById("merging-container") 
		
		target.ondrop = dropHandler
		target.ondragover = dragOverHandler
		
		merging.ondrop = dropHandler
		merging.ondragover = dragOverHandler
			
		
		function dropHandler(ev) {
			  

		  // Prevent default behavior (Prevent file from being opened)
		  ev.preventDefault();

		  var files = []
		  if (ev.dataTransfer.items) {
			// Use DataTransferItemList interface to access the file(s)
			
			for (var i = 0; i < ev.dataTransfer.items.length; i++) {
			  // If dropped items aren't files, reject them
			  if (ev.dataTransfer.items[i].kind === 'file') {
				files.push( ev.dataTransfer.items[i].getAsFile() );
			  } // if
			} // for
			
			
			
		  } else {
			// Use DataTransfer interface to access the file(s)
			files = ev.dataTransfer.files
		  } // if
		  
		  
		  fileManager.importing.dragdropped(files)		  
		  
		} // dropHandler

		function dragOverHandler(ev) {
		  // Prevent default behavior (Prevent file from being opened)
		  ev.preventDefault();
		} // dragOverHandler






		// Test loading contour files.
		var A = new onDemandFile({
			url: "./data/comp3stg/task_6/rotor1/ent_area2d_exit_rotor1_task_6.json",
			filename: "./data/comp3stg/task_6/rotor1/ent_area2d_exit_rotor1_task_6.json"
		})
		A.load()
		console.log(A, errors)

    } // initialise
