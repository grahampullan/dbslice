import { refreshTasksInPlotRows } from './refreshTasksInPlotRows.js';
import { importExportFunctionality } from '../core/importExportFunctionality.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { addMenu } from '../core/addMenu.js';
import { plotHelpers } from '../core/plotHelpers.js';
import { positioning } from '../core/positioning.js';



var builder = {
		

		
		makeSessionHeader: function makeSessionHeader() {
		
			// Check if there was a previous session header already existing. 
			var element = d3.select("#" + dbsliceData.elementId);
			var sessionHeader = element.select(".sessionHeader");
			if (!sessionHeader.empty()) {
				// Pre-existing session header! Remove any contents. Print a message to the console saying this was done.
				sessionHeader.selectAll("*")
			} // if
			
			var sessionTitle = element
			  .append("div")
				.attr("class", "row sessionHeader")
			  .append("div")
				.attr("class", "col-md-12 sessionTitle");
		 
			sessionTitle
			  .append("br");
			
			sessionTitle
			  .append("h1")
				.attr("style", "display:inline")
				.attr("spellcheck", "false")
				.html(dbsliceData.session.title)
				.attr("contenteditable", true);
		  
			if (dbsliceData.session.plotTasksButton) {
				sessionTitle
				  .append("button")
					.attr("class", "btn btn-success float-right")
					.attr("id", "refreshTasksButton")
					.html("Plot Selected Tasks")
					.on("click", function () {
						cfDataManagement.refreshTasksInPlotRows();
					});
			} // if

			if (dbsliceData.session.subtitle !== undefined) {
				sessionTitle
				  .append("p")
				  .html(dbsliceData.session.subtitle);
			} // if
		  
			sessionTitle
			  .append("br")
			sessionTitle
			  .append("br");

			sessionTitle
			  .append("div")
				.attr("class", "filteredTaskCount")
			  .append("p")
				.attr("style", "display:inline");
			
			// CREATE THE MENU WITH SESSION OPTIONS
			var sessionGroup = sessionTitle
			  .append("div")
				.attr("class", "btn-group float-right")
				.attr("style", "display:inline")
				
			sessionGroup
			  .append("button")
				.attr("id", "sessionOptions")
				.attr("type", "button")
				.attr("class", "btn btn-info dropdown-toggle")
				.attr("data-toggle", "dropdown")
				.attr("aria-haspopup", true)
				.attr("aria-expanded", false)
				.html("Session options")
				
			var sessionMenu = sessionGroup
			  .append("div")
				.attr("class", "dropdown-menu")
			  
			  
			var dataReplace = createFileInputElement( importExportFunctionality.importing.metadata, "replace")
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "replaceData")
				.html("Replace data")
				.on("click", function(){dataReplace.click()})
				
			var dataInput = createFileInputElement( importExportFunctionality.importing.metadata, "add")
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "addData")
				.html("Add data")
				.on("click", function(){dataInput.click()})
				
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "removeData")
				.html("Remove data")
			addMenu.removeDataControls.make("removeData")
				
			var sessionInput = createFileInputElement( importExportFunctionality.importing.session )
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "loadSession")
				.html("Load session")
			    .on("click", function(){sessionInput.click()})
			
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "saveSession")
				.html("Save session").on("click", function(){
				
					// Get the string to save
					var s = importExportFunctionality.exporting.session.json()
					
					// Make the blob
					var b = importExportFunctionality.exporting.session.makeTextFile(s)
					
					
					// Download the file.
					var lnk = document.createElement("a")
					lnk.setAttribute("download", "test_session.json")
					lnk.setAttribute("href", b)
					
					var m = d3.select( document.getElementById("sessionOptions").parentElement ).select(".dropdown-menu").node()
					m.appendChild(lnk)
					lnk.click()	
				})
			
				
				
				
			  
			sessionTitle
			  .append("br")
			sessionTitle
			  .append("br")
			  

		  

			// HELPER FUNCTIONS:
			function createFileInputElement(loadFunction, dataAction){
				
				
				
				
				// This button is already created. Just add the functionaity.
				var dataInput = document.createElement('input');
				dataInput.type = 'file';

				// When the file was selected include it in dbslice. Rerender is done in the loading function, as the asynchronous operation can execute rendering before the data is loaded otherwise.
				dataInput.onchange = function(e){
					// BE CAREFULT HERE: file.name IS JUST THE local name without any path!
					var file = e.target.files[0]; 
					// importExportFunctionality.importing.handler(file);
					loadFunction(file, dataAction)
				}; // onchange
				
			  return dataInput
				
			} // createGetDataFunctionality
		   
		}, // makeSessionHeader
		
		updateSessionHeader: function updateSessionHeader(element){
			
			var metadata = dbsliceData.data.taskDim.top(Infinity)
			if (metadata !== undefined) {
				element.select(".filteredTaskCount").select("p")
				  .html("Number of Tasks in Filter = " + metadata.length);
			} else {
				element.select(".filteredTaskCount").select("p")
				  .html("<p> Number of Tasks in Filter = All </p>");
			}; // if
			
		}, // updateSessionHeader
		
		makePlotRowContainers: function makePlotRowContainers(plotRows){
			// This creates all the new plot rows.
			
			var width = d3.select( "#" + dbsliceData.elementId ).node().offsetWidth - 45
			
			// HANDLE ENTERING PLOT ROWS!
			var newPlotRows = plotRows.enter()
			  .append("div")
				.attr("class", "card bg-light plotRow")
				.style("margin-bottom","20px")
				.style("width", width + "px")
				.attr("plot-row-index", function (d, i) {return i;})
				.each(function(d){
					d.element = this
				})
			
			return newPlotRows
		}, // makePlotRowContainers
		
		makePlotRowHeaders: function makePlotRowHeaders(newPlotRows){
			
			var newPlotRowsHeader = newPlotRows
			  .append("div")
				.attr("class", "card-header plotRowTitle")
				.attr("type", function (d){return d.type});
				
			// Text
			newPlotRowsHeader
			  .append("h3")
				.attr("style","display:inline")
				.html( function(data){return data.title} )
				.attr("spellcheck", "false")
				.attr("contenteditable", true)
				.each(function(){
				  // Store the typed in text in the central object.
				  this.addEventListener("input", function() {
					  var newTitle = this.innerText
					  d3.select(this).each(function(plotRow){ plotRow.title = newTitle })
				  }, false);
			  }) // each
			  
			// Buttons
			newPlotRowsHeader.each(function(plotRowCtrl){
				addMenu.addPlotControls.make( this, plotRowCtrl );
				addMenu.removePlotRowControls.make( this, plotRowCtrl );
			}); // each
			
			
		}, // makePlotRowHeaders
		
		makePlotRowBodies: function makePlotRowBodies(newPlotRows){
			
			var newPlotRowsBody = newPlotRows
			  .append("div")
				.attr("class", "row no-gutters plotRowBody")
				.attr("plot-row-index", function (d, i){return i;})
				.attr("type", function (d){return d.type});
			return newPlotRowsBody
			
		}, // makePlotRowBodies
		
		makeUpdatePlotRowPlots: function makeUpdatePlotRowPlots(plotRows){
			
			var plots = plotRows
			  .selectAll(".plotRowBody")
			  .selectAll(".plot")
			  .data(function (d){return d.plots;})
			  
			// Create any new plots
			plots
			    .enter()
			    .each(plotHelpers.setupPlot.general.makeNewPlot);
			
			// Update any new plots
			plots
			  .each(function(plotCtrl){
				  plotCtrl.view.transitions = plotCtrl.plotFunc.helpers.transitions.animated()
				  plotCtrl.plotFunc.update(plotCtrl)
			  });
			  
			  
			// Adjust the plot row height
            plotRows
			  .selectAll(".plotRowBody")
              .each(function(){
                  builder.refreshPlotRowHeight( d3.select(this) )
              })
			
		}, // makeUpdatePlotRowPlots
		
		makeAddPlotRowButton: function makeAddPlotRowButton(){
			
			addMenu.addPlotRowControls.make(dbsliceData.elementId, "addPlotRowButton")
			
		}, // makeAddPlotRowButton
		
		refreshPlotRowHeight: function refreshPlotRowHeight(plotRowBody){
            
            var plotRowHeight = positioning.helpers.findContainerSize(plotRowBody, ".plotWrapper")
            
            // Adjust the actual height.
            if(plotRowHeight != plotRowBody.node().offsetHeight){
                plotRowBody.style("height", plotRowHeight + "px")
            }
            
        }, // refreshPlotRowHeight
        
		refreshPlotRowWidth: function refreshPlotRowWidth(plotRowBody){
            
            // Adjust all plots to the new grid.
            
			let dy = positioning.dy(plotRowBody)
			let dx = positioning.dx(plotRowBody)
			
            plotRowBody.selectAll(".plotWrapper")
			  .style("left"  , d=> d.format.parent.offsetLeft+d.format.position.ix*dx+"px")
			  .style("top"   , d=> d.format.parent.offsetTop +d.format.position.iy*dy + "px")
              .style("width" , d=> d.format.position.iw*dx + "px")
              .style("height", d=> d.format.position.ih*dy + "px")
            
        } // refreshPlotRowWidth
		
		
	} // builder
				

export { builder };