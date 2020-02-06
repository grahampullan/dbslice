import { refreshTasksInPlotRows } from './refreshTasksInPlotRows.js';

function makeSessionHeader(element, title, subtitle, config) {
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
            .html(title)
            .attr("contenteditable", true);
      
        if (config.plotTasksButton) {
            sessionTitle
              .append("button")
                .attr("class", "btn btn-success float-right")
                .attr("id", "refreshTasksButton")
                .html("Plot Selected Tasks");
        } // if

        if (subtitle !== undefined) {
            sessionTitle
              .append("p")
              .html(subtitle);
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
			.attr("id", "getSession")
		    .html("Load session")
		  
		
			
			
			
          
        sessionTitle
          .append("br")
        sessionTitle
          .append("br")
          
        $("#refreshTasksButton").on("click", function () {
            refreshTasksInPlotRows();
        });
       
    } // makeSessionHeader

export { makeSessionHeader };