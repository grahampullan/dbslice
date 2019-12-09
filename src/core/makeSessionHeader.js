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
			.attr("id", "refreshTasks")
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
		
	  sessionTitle
		.append("button")
		  .attr("class", "btn btn-info float-right")
		  .attr("style", "display:inline")
		  .attr("id", "getData")
		  .html("Add data");
		  
	  sessionTitle
	    .append("button")
		  .attr("class", "btn btn-info float-right")
		  .attr("style", "display:inline")
		  .attr("id", "getLayout")
		  .html("Load layout");
		  
	  sessionTitle
	    .append("br")
	  sessionTitle
	    .append("br")
		  
	  $("#refreshTasks").on("click", function () {
	    refreshTasksInPlotRows();
	  });
	  
	  
} // makeSessionHeader
   

export { makeSessionHeader };