import { refreshTasksInPlotRows } from './refreshTasksInPlotRows.js';
import { importExportFunctionality } from '../core/importExportFunctionality.js';
import { dbsliceData } from '../core/dbsliceData.js';

function makeSessionHeader() {
		
		// Check if there was a previous session header already existing. 
		var element = d3.select("#" + dbsliceData.elementId);
		var sessionHeader = element.select(".sessionHeader");
		if (!sessionHeader.empty()) {
			// Pre-existing session header! Remove any contents. Print a message to the console saying this was done.
			sessionHeader.selectAll("*")
			console.log("Session header cleared!")
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
                .html("Plot Selected Tasks");
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
		  
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
		    .attr("id", "replaceData")
		    .html("Replace data")
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
		    .attr("id", "addData")
		    .html("Add data")
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
		    .attr("id", "removeData")
		    .html("Remove data")
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
			.attr("id", "loadSession")
		    .html("Load session")
		sessionMenu.append("a").attr("class", "dropdown-item").attr("href", "#")
			.attr("id", "saveSession")
			.html("Save session") 
		
			
			
			
          
        sessionTitle
          .append("br")
        sessionTitle
          .append("br")
          
        $("#refreshTasksButton").on("click", function () {
            refreshTasksInPlotRows();
        });
		
		// Solves the previous hack of updating the session file ready for download.
		d3.select("#saveSession").on("click", function(){
			
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
       
    } // makeSessionHeader

export { makeSessionHeader };