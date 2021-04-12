import {dbsliceData} from "./dbsliceData.js";
import {builder} from "./builder.js";
import {plotRow} from "./plotRow.js";
import {dbsliceDataCreation} from "./dbsliceDataCreation.js";
import {fileManager} from "../core/fileManager.js";

export var sessionManager = {
	
		initialise: function(session){
			
			dbsliceData.session = session
			
			// Add in a reference to the element for ease of use.
			dbsliceData.session.element = d3.select("#" + dbsliceData.session.elementId)
			
			// Build adds the functionality, update updates
			builder.build.sessionHeader()
			builder.update.sessionHeader()
			
			// Build the body too.
			builder.update.sessionBody()
			
		}, // initialise
		
		render: function (){
			var element = d3.select( "#" + dbsliceData.session.elementId );

			// Update and build elements in particular plot rows.
			builder.update.sessionHeader(element)
			
			builder.update.sessionBody()
			

		    // Control all button and menu activity;
			sessionManager.enableDisableAllButtons();			
			
		}, // render
		
		refreshTasksInPlotRows: function (){
			
			// Every file can demand it's own files, therefore we can just update them as we go, and then update the library at the end.
			let filteredTasks = dbsliceData.data.taskDim.top(Infinity)
			
			dbsliceData.session.plotRows.forEach(function(plotRowCtrl){
				plotRowCtrl.plots.forEach(function(plotCtrl){
			  
					if(plotCtrl.view.sliceId){
						// If the sliceId is defined the plot is expecting on demand data.
						
						let files = filteredTasks.map(function(task){
							return {
								url: task[plotCtrl.view.sliceId],
								filename: task[plotCtrl.view.sliceId]
							}
						})
						
						// Import the files
						let requestPromises = fileManager.importing.batch(plotCtrl.fileClass, files)
						
						// Launch a task upon loading completion.
						Promise.allSettled( requestPromises ).then(function(fileobjs){
							plotCtrl.plotFunc.updateData(plotCtrl)
						}) // then
						
					} // if
				
					
				}) // forEach
			}) // forEach
			

		}, // refreshTasksInPlotRows
		
		
		enableDisableAllButtons(){
			
			// This functionality decides which buttons should be enabled.
			var metadata = dbsliceData.data.taskDim.top(Infinity)
			var isDataInFilter = metadata.length !== undefined && metadata.length > 0;
			
			// For the data to be loaded some records should have been assigned to the crossfilter.
			var isDataLoaded = false
			if(dbsliceData.data !== undefined){
				isDataLoaded = dbsliceData.data.cf.size() > 0
			} // if
			
			
			
			
			// GROUP 1: SESSION OPTIONS
			// Button controlling the session options is always available!
			document.getElementById("sessionOptionsButton").disabled = false;
			
			// "Load session" only available after some data has been loaded.
			// Data: Replace, add, remove, Session: save, load
			// These have to have their class changed, and the on/click event suspended!!
			listItemEnableDisable( "saveSession" , true )
			listItemEnableDisable( "metadataMerging" , isDataInFilter )
			
			
			// GROUP 2: ON DEMAND FUNCTIONALITY
			// "Plot Selected Tasks" is on only when there are tasks in the filter, and any 'plotter' plot row has been configured.
			var refreshTasksButton = d3.select("#refreshTasksButton")
			arrayEnableDisable(refreshTasksButton, isDataInFilter)
			
			
			
			
			// GROUP 3: ADDING/REMOVING PLOTS/ROWS
			// "Add plot row" should be available when the data is loaded. Otherwise errors will occur while creating the apropriate menus.
			document.getElementById("addPlotRowButton").disabled = !isDataLoaded;
			
			
			// "Remove plot row" should always be available.
			var removePlotRowButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-danger")
			arrayEnableDisable(removePlotRowButtons, true)
			
			
			// "Add plot" should only be available if the data is loaded.
			var addPlotButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-success");
			arrayEnableDisable(addPlotButtons, isDataInFilter)
							
			// "Remove plot" should always be available.
			var removePlotButtons = d3.selectAll(".plotTitle").selectAll(".btn-danger");
			arrayEnableDisable(removePlotButtons, true)
			
			
			// GROUP 4: Plot interactive controls.
			var plotInteractionButtons = d3.selectAll(".plot").selectAll(".btn")
			arrayEnableDisable(plotInteractionButtons, true)
			
			
			
			function arrayEnableDisable(d3ButtonSelection, conditionToEnable){
				
				if(conditionToEnable){
					// Enable the button
					d3ButtonSelection.each(function(){ this.disabled = false })
				} else {
					// Disable the button
					d3ButtonSelection.each(function(){ this.disabled = true })         
				}; // if					
				
			} // arrayEnableDisable
			
			
			function listItemEnableDisable(elementId, conditionToEnable){
				
				let el = document.getElementById(elementId)
				if(el){
					if(conditionToEnable){
						// Enable the button
						el.classList.remove("disabled")
						el.style.pointerEvents = 'auto'
					} else {
						// Disable the button
						el.classList.add("disabled")
						el.style.pointerEvents = 'none'
					}; // if
				} // if
				
			} // listItemEnableDisable
			
			
		}, // enableDisableAllButtons
		
		
		onSessionFileLoad: function(fileobj){
			
			Object.assign(dbsliceData.merging, fileobj.content.merging)
						
			// The session should be applied and resolved straight away. But only if the session is defined!
			if(fileobj.content.session){
				dbsliceData.session.title = fileobj.content.session.title
				
				// Instantiate the plot rows
				dbsliceData.session.plotRows = fileobj.content.session.plotRows.map(function(ctrl){return new plotRow(ctrl)})
			} // if
			
			
			sessionManager.resolve.ui.dataAndSessionChange()
			
		}, // onSessionFileLoad
		
		resolve: {
			
			ui: {
			
				dataAndSessionChange: function(){
					
					
					// Update the merging.
					dbsliceDataCreation.make()
					
					// Update the UI
					sessionManager.render()
					
				}, // dataAndSessionChange
				
			}, // ui
			
			
		}, // resolve
		
		
		write: function(){
			
			var contentobj = {
				mergingInfo: dbsliceData.merging,
				sessionInfo: {
					title: dbsliceData.session.title,
					plotRows: dbsliceData.session.plotRows.map(function(plotrow){
						return {
							title: plotrow.title,
							type: plotrow.type,
							plots: plotrow.plots.map(prunePlot)
						}
					}) // map
					
				}
			}
			
			
			function prunePlot(plotCtrl){
				// Only a few things need to be retained: yProperty, xProperty and sliceId
				
				let saveCtrl = {
					plottype: plotCtrl.plotFunc.name,
				}
				
				if(plotCtrl.view.xVarOption){
					saveCtrl.xProperty = plotCtrl.view.xVarOption.val
				} // if
				
				if(plotCtrl.view.yVarOption){
					saveCtrl.yProperty = plotCtrl.view.yVarOption.val
				} // if
				
				if(plotCtrl.view.sliceId){
					saveCtrl.sliceId = plotCtrl.view.sliceId
				} // if
				
				return saveCtrl
			} // prunePlot
			
			
			return JSON.stringify( contentobj )

			
			// Write together.
			
		}, // write
		
		
		
	} // sessionManager
	