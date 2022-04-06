import { refreshTasksInPlotRows } from './refreshTasksInPlotRows.js';
import { downloadCurrentTasks } from './downloadCurrentTasks.js';

function makeSessionHeader( element, title, subtitle, config ) {

	element.append( "div" )
		.attr( "class" , "row sessionHeader" )
		.append( "div" )
			.attr( "class" , "col-md-12 sessionTitle" );

	var titleHtml = "<br/><h1 style='display:inline'>" + title + "</h1>";

	if ( config.plotTasksButton ) {

		titleHtml += "<button class='btn btn-success mr-1 float-right' id='refreshTasks'>Plot Selected Tasks</button>";

	}

	if ( config.saveTasksButton ) {

		titleHtml += "<button class='btn btn-success mr-1 float-right' id='downloadTasks'>Save Selected Tasks</button>";

	}

	titleHtml += "<br/>";
	
	if ( subtitle === undefined ) {

		titleHtml += "<br/>";

	} else {

		titleHtml += "<p>" + subtitle + "</p>";

	}

	element.select( ".sessionTitle" )
		.html( titleHtml )
		.append( "div" )
			.attr( "class" , "filteredTaskCount" );	


	if ( config.plotTasksButton ) {
		document.getElementById("refreshTasks").onclick = function() { refreshTasksInPlotRows() };
	}

	if ( config.downloadCurrentTasks) {
		document.getElementById("downloadTasks").onclick = function() { downloadCurrentTasks() };
	}

}

export { makeSessionHeader };